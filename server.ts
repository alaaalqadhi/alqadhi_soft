import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs";

dotenv.config();

console.log("Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  PORT: process.env.PORT
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function createServer() {
  try {
    const app = express();
    
    app.use(cors());
    app.use(express.json());

    // Check database connection on startup
    try {
      await prisma.$connect();
      console.log("✅ Database connected successfully");
    } catch (err) {
      console.error("❌ Database connection failed:", err);
    }

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

    // API Routes
    app.get("/api/db-status", async (req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "connected", database: "PostgreSQL" });
      } catch (err) {
        res.status(500).json({ status: "error", message: String(err) });
      }
    });

    app.get("/api/plates", async (req, res) => {
      try {
        const plates = await prisma.plate.findMany({
          orderBy: {
            entryDate: 'desc'
          }
        });
        res.setHeader('Cache-Control', 'no-store');
        res.json(plates);
      } catch (err) {
        console.error("Error fetching plates:", err);
        res.status(500).json({ error: "Failed to fetch plates", details: String(err) });
      }
    });

    app.post("/api/plates", async (req, res) => {
      const p = req.body;
      try {
        const data = {
          plateNumber: String(p.plateNumber || ''),
          category: String(p.category || ''),
          plateType: String(p.plateType || ''),
          quantity: String(p.quantity || '1'),
          reportNumber: String(p.reportNumber || ''),
          seizureDate: String(p.seizureDate || ''),
          trafficSupplyDate: String(p.trafficSupplyDate || ''),
          vehicleModel: String(p.vehicleModel || ''),
          supplyingEntity: String(p.supplyingEntity || ''),
          seizedItems: String(p.seizedItems || ''),
          actionsTaken: String(p.actionsTaken || ''),
          entryDate: String(p.entryDate || new Date().toISOString()),
          status: String(p.status || 'COMPLETED'),
          notes: String(p.notes || '')
        };

        await prisma.plate.upsert({
          where: { id: p.id },
          update: data,
          create: {
            id: p.id,
            ...data
          }
        });
        res.json({ success: true, message: "تم الحفظ" });
      } catch (err) {
        console.error("Error saving plate:", err);
        res.status(500).json({ error: "Failed to save plate" });
      }
    });

    app.delete("/api/plates/:id", async (req, res) => {
      try {
        await prisma.plate.delete({
          where: { id: req.params.id }
        });
        res.json({ success: true, message: "تم الحذف" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete plate" });
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(__dirname, "dist");
      app.use(express.static(distPath));
      // Handle SPA routing in production - Express v5 uses *all for catch-all
      app.get("*all", (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        const indexPath = path.join(distPath, "index.html");
        
        // Check if index.html exists to avoid 500 error
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Application not built. Please run 'npm run build' first.");
        }
      });
    }

    return app;
  } catch (err) {
    console.error("Error in createServer:", err);
    throw err;
  }
}

  const appPromise = createServer();
  
  appPromise.catch(err => {
    console.error("CRITICAL: Failed to create server:", err);
  });

  // For local development
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    appPromise.then(app => {
      const PORT = 3000;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }).catch(err => {
      console.error("Failed to start server listener:", err);
    });
  }

  export default async (req: any, res: any) => {
    try {
      const app = await appPromise;
      return app(req, res);
    } catch (err) {
      console.error("Vercel handler error:", err);
      res.status(500).send("Internal Server Error: Server failed to initialize.");
    }
  };
