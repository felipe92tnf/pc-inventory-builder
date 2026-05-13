import { prisma } from "../../db/prisma.js";
import { buildCustomerLookupKey, matchesCustomerRow } from "./customers.lookup.js";

function normNotes(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}

export async function getCustomerOverview(name: string, phone: string) {
  const nameTrim = name.trim();
  const phoneTrim = phone.trim();
  const lookupKey = buildCustomerLookupKey(nameTrim, phoneTrim);

  const profile = await prisma.customerProfile.findUnique({
    where: { lookupKey },
    select: { notes: true }
  });

  const [quoteRows, serviceRows, saleRows] = await Promise.all([
    prisma.quote.findMany({
      where: { customerName: { equals: nameTrim, mode: "insensitive" } },
      select: {
        id: true,
        quoteNumber: true,
        title: true,
        status: true,
        total: true,
        createdAt: true,
        customerName: true,
        customerPhone: true
      },
      orderBy: { createdAt: "desc" },
      take: 500
    }),
    prisma.service.findMany({
      where: { customerName: { equals: nameTrim, mode: "insensitive" } },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        salePrice: true,
        profit: true,
        serviceDate: true,
        customerName: true,
        customerPhone: true
      },
      orderBy: { serviceDate: "desc" },
      take: 500
    }),
    prisma.sale.findMany({
      where: { customerName: { equals: nameTrim, mode: "insensitive" } },
      select: {
        id: true,
        soldAt: true,
        finalSalePrice: true,
        profit: true,
        customerName: true,
        customerPhone: true,
        build: { select: { name: true } }
      },
      orderBy: { soldAt: "desc" },
      take: 500
    })
  ]);

  const quotes = quoteRows
    .filter((q) => matchesCustomerRow(q.customerName, q.customerPhone, nameTrim, phoneTrim))
    .map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      title: q.title,
      status: q.status,
      total: Number(q.total),
      createdAt: q.createdAt.toISOString()
    }));

  const services = serviceRows
    .filter((s) => matchesCustomerRow(s.customerName, s.customerPhone, nameTrim, phoneTrim))
    .map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      salePrice: Number(s.salePrice),
      profit: Number(s.profit),
      serviceDate: s.serviceDate.toISOString()
    }));

  const sales = saleRows
    .filter((s) => matchesCustomerRow(s.customerName, s.customerPhone, nameTrim, phoneTrim))
    .map((s) => ({
      id: s.id,
      soldAt: s.soldAt.toISOString(),
      finalSalePrice: Number(s.finalSalePrice),
      profit: Number(s.profit),
      buildName: s.build.name
    }));

  return {
    lookupKey,
    displayName: nameTrim,
    displayPhone: phoneTrim,
    notes: profile?.notes ?? null,
    quotes,
    services,
    sales
  };
}

export async function patchCustomerNotes(name: string, phone: string, notes: string | null | undefined) {
  const nameTrim = name.trim();
  const phoneTrim = phone.trim();
  const lookupKey = buildCustomerLookupKey(nameTrim, phoneTrim);
  const n = normNotes(notes ?? undefined);

  return prisma.customerProfile.upsert({
    where: { lookupKey },
    create: { lookupKey, notes: n },
    update: { notes: n },
    select: { lookupKey: true, notes: true, updatedAt: true }
  });
}
