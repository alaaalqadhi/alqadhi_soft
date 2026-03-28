import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.plate.count();
  console.log("Plate count:", count);
  process.exit(0);
}
main();
