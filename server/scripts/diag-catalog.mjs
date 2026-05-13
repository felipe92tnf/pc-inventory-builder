import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const catalogCount = await prisma.partCatalog.count();
  const partCount = await prisma.part.count();
  console.log("[diag] Prisma model: PartCatalog -> table mapped by Prisma schema");
  console.log("[diag] PartCatalog rows:", catalogCount);
  console.log("[diag] Part (inventory) rows:", partCount);

  const sample = await prisma.partCatalog.findMany({
    take: 10,
    orderBy: { updatedAt: "desc" }
  });
  console.log("[diag] Latest PartCatalog entries:", JSON.stringify(sample, null, 2));

  const ryzen = await prisma.partCatalog.findMany({
    where: {
      OR: [{ name: { contains: "Ryzen", mode: "insensitive" } }]
    }
  });
  console.log("[diag] Search 'Ryzen' (insensitive) matches:", ryzen.length);
} catch (e) {
  console.error("[diag] ERROR — table missing or DB unreachable:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
