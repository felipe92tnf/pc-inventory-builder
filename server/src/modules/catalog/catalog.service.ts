import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { createCatalogPartSchema } from "./catalog.validators.js";

export async function listCatalog(query?: string | null) {
  const totalRows = await prisma.partCatalog.count();
  console.log(
    "[SecondByte catalog] prisma.partCatalog.count()=%d (model PartCatalog -> tabla \"PartCatalog\")",
    totalRows
  );

  const q = query?.trim();
  if (!q) {
    return prisma.partCatalog.findMany({ orderBy: { name: "asc" } });
  }

  return prisma.partCatalog.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } }
      ]
    },
    orderBy: { name: "asc" },
    take: 200
  });
}

export async function createCatalogPart(payload: unknown) {
  const data = createCatalogPartSchema.parse(payload);

  const nameNorm = data.name.trim();
  const brandNorm = (data.brand ?? "").trim();
  const modelNorm = (data.model ?? "").trim();

  if (data.sku != null && data.sku !== "") {
    const skuTaken = await prisma.partCatalog.findFirst({
      where: { sku: data.sku }
    });
    if (skuTaken) {
      throw new Error("CATALOG_SKU_EXISTS");
    }
  }

  const duplicateTriple = await prisma.partCatalog.findFirst({
    where: {
      AND: [
        { name: { equals: nameNorm, mode: "insensitive" } },
        { brand: { equals: brandNorm, mode: "insensitive" } },
        { model: { equals: modelNorm, mode: "insensitive" } }
      ]
    }
  });
  if (duplicateTriple) {
    throw new Error("CATALOG_DUPLICATE_TRIPLE");
  }

  const createData: Prisma.PartCatalogCreateInput = {
    name: nameNorm,
    category: data.category,
    brand: brandNorm,
    model: modelNorm,
    defaultCostPrice: data.defaultCostPrice,
    defaultSalePrice: data.defaultSalePrice,
    notes: data.notes ?? null
  };

  if (data.sku != null && data.sku !== "") {
    createData.sku = data.sku;
  }

  try {
    const row = await prisma.partCatalog.create({ data: createData });
    const total = await prisma.partCatalog.count();
    console.log("[SecondByte catalog] insert OK en tabla PartCatalog; filas totales=%d", total);
    return row;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("CATALOG_SKU_EXISTS");
    }
    throw e;
  }
}
