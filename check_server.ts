
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function check() {
  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET"
  });

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    const count = await prisma.plate.count();
    console.log("Plates count:", count);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  } finally {
    await prisma.$disconnect();
  }

  const distPath = path.join(__dirname, "dist");
  const indexPath = path.join(distPath, "index.html");
  console.log("Checking dist path:", distPath);
  console.log("Dist exists:", fs.existsSync(distPath));
  console.log("Index exists:", fs.existsSync(indexPath));
}

check();
