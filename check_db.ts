import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.mukafahaPlate.count();
  console.log("Mukafaha Plate count:", count);
  process.exit(0);
}
main();
