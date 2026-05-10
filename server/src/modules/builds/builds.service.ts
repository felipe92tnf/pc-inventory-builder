import { BuildStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import {
  addBuildItemSchema,
  createBuildSchema,
  updateBuildItemSchema,
  updateBuildSchema
} from "./builds.validators.js";

function totalsFromItems(items: Array<{ quantity: number; part: { costPrice: unknown; salePrice: unknown } }>) {
  const totalCost = items.reduce((sum, item) => sum + Number(item.part.costPrice) * item.quantity, 0);
  const computedSaleTotal = items.reduce((sum, item) => sum + Number(item.part.salePrice) * item.quantity, 0);
  return { totalCost, computedSaleTotal };
}

export function finalizePricing(
  items: Array<{ quantity: number; part: { costPrice: unknown; salePrice: unknown } }>,
  saleTotalOverride: unknown
) {
  const { totalCost, computedSaleTotal } = totalsFromItems(items);
  const totalSale =
    saleTotalOverride !== undefined && saleTotalOverride !== null ? Number(saleTotalOverride) : computedSaleTotal;
  const profit = totalSale - totalCost;
  return { totalCost, computedSaleTotal, totalSale, profit };
}

export async function listBuilds() {
  const builds = await prisma.build.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { part: true } } }
  });

  return builds.map((build) => {
    const items = build.items ?? [];
    const pricing = finalizePricing(items, build.saleTotalOverride);
    return {
      ...build,
      items,
      ...pricing
    };
  });
}

export async function getBuild(id: string) {
  const build = await prisma.build.findUnique({
    where: { id },
    include: { items: { include: { part: true } } }
  });

  if (!build) {
    return null;
  }

  const items = build.items ?? [];

  if (items.length === 0) {
    const pricing = finalizePricing(items, build.saleTotalOverride);
    return {
      ...build,
      items,
      ...pricing
    };
  }

  const pricing = finalizePricing(items, build.saleTotalOverride);

  return {
    ...build,
    items,
    ...pricing
  };
}

export async function createBuild(payload: unknown) {
  const data = createBuildSchema.parse(payload);
  return prisma.build.create({ data });
}

export async function updateBuild(id: string, payload: unknown) {
  const data = updateBuildSchema.parse(payload);

  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (existing.status === BuildStatus.SOLD) {
    throw new Error("BUILD_IS_SOLD");
  }

  return prisma.build.update({ where: { id }, data });
}

export async function deleteBuild(id: string) {
  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("BUILD_NOT_FOUND");
  }

  return prisma.build.delete({ where: { id } });
}

export async function addBuildItem(buildId: string, payload: unknown) {
  const data = addBuildItemSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  const existing = await prisma.buildPartItem.findUnique({
    where: { buildId_partId: { buildId, partId: data.partId } }
  });

  if (existing) {
    return prisma.buildPartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + data.quantity }
    });
  }

  return prisma.buildPartItem.create({
    data: {
      buildId,
      partId: data.partId,
      quantity: data.quantity
    }
  });
}

export async function updateBuildItem(buildId: string, itemId: string, payload: unknown) {
  const data = updateBuildItemSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  return prisma.buildPartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity }
  });
}

export async function deleteBuildItem(buildId: string, itemId: string) {
  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  return prisma.buildPartItem.delete({ where: { id: itemId } });
}

export async function confirmBuild(buildId: string) {
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: { include: { part: true } } }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_DRAFT");
  }
  if (build.items.length === 0) {
    throw new Error("BUILD_EMPTY");
  }

  const insufficient = build.items.find((item) => item.part.stock < item.quantity);
  if (insufficient) {
    throw new Error(`INSUFFICIENT_STOCK:${insufficient.part.name}`);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of build.items) {
      await tx.part.update({
        where: { id: item.partId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    await tx.build.update({
      where: { id: buildId },
      data: { status: BuildStatus.CONFIRMED, confirmedAt: new Date() }
    });
  });

  return getBuild(buildId);
}

export async function revertBuildToDraft(buildId: string) {
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: true }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status === BuildStatus.SOLD) {
    throw new Error("BUILD_IS_SOLD");
  }
  if (build.status !== BuildStatus.CONFIRMED) {
    throw new Error("BUILD_NOT_CONFIRMED");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of build.items) {
      await tx.part.update({
        where: { id: item.partId },
        data: { stock: { increment: item.quantity } }
      });
    }

    await tx.build.update({
      where: { id: buildId },
      data: { status: BuildStatus.DRAFT, confirmedAt: null }
    });
  });

  return getBuild(buildId);
}
