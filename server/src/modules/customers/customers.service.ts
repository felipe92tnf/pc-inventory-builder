import { prisma } from "../../db/prisma.js";
import { buildCustomerLookupKey, matchesCustomerRow } from "./customers.lookup.js";
import { backfillCustomersFromLegacy, resolveCustomerFields } from "./customers.resolve.js";

function normNotes(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}

let backfillDone = false;

async function ensureBackfill() {
  if (backfillDone) return;
  await backfillCustomersFromLegacy();
  backfillDone = true;
}

export async function listCustomers(query?: string) {
  await ensureBackfill();

  const q = query?.trim().toLowerCase() ?? "";
  const rows = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500
  });

  const filtered = q
    ? rows.filter((c) => {
        const phoneDigits = c.phone.replace(/\D/g, "");
        const qDigits = q.replace(/\D/g, "");
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (qDigits.length > 0 && phoneDigits.includes(qDigits))
        );
      })
    : rows;

  const ids = filtered.map((c) => c.id);
  if (ids.length === 0) return [];

  const [quoteCounts, serviceCounts, buildCounts, saleSums] = await Promise.all([
    prisma.quote.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids } },
      _count: { _all: true }
    }),
    prisma.service.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids } },
      _count: { _all: true }
    }),
    prisma.build.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids } },
      _count: { _all: true }
    }),
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids }, NOT: { status: "REVERTED" } },
      _count: { _all: true },
      _sum: { finalSalePrice: true }
    })
  ]);

  const quoteMap = new Map(quoteCounts.map((r) => [r.customerId, r._count._all]));
  const serviceMap = new Map(serviceCounts.map((r) => [r.customerId, r._count._all]));
  const buildMap = new Map(buildCounts.map((r) => [r.customerId, r._count._all]));
  const saleMap = new Map(
    saleSums.map((r) => [
      r.customerId,
      { count: r._count._all, total: Number(r._sum.finalSalePrice ?? 0) }
    ])
  );

  return filtered.map((c) => {
    const qc = quoteMap.get(c.id) ?? 0;
    const sc = serviceMap.get(c.id) ?? 0;
    const bc = buildMap.get(c.id) ?? 0;
    const sale = saleMap.get(c.id) ?? { count: 0, total: 0 };
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      workCount: qc + sc + bc + sale.count,
      totalSpent: sale.total
    };
  });
}

export async function searchCustomers(query: string, limit = 12) {
  await ensureBackfill();
  const all = await listCustomers(query);
  return all.slice(0, limit);
}

export async function getCustomerById(id: string) {
  await ensureBackfill();
  const row = await prisma.customer.findUnique({ where: { id } });
  if (!row) return null;

  const [quotes, services, builds, sales] = await Promise.all([
    prisma.quote.findMany({
      where: { customerId: id },
      select: {
        id: true,
        quoteNumber: true,
        title: true,
        status: true,
        total: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    prisma.service.findMany({
      where: { customerId: id },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        salePrice: true,
        profit: true,
        serviceDate: true
      },
      orderBy: { serviceDate: "desc" },
      take: 200
    }),
    prisma.build.findMany({
      where: { customerId: id },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        sales: {
          where: { NOT: { status: "REVERTED" } },
          orderBy: { soldAt: "desc" },
          take: 1,
          select: { finalSalePrice: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    prisma.sale.findMany({
      where: { customerId: id },
      select: {
        id: true,
        status: true,
        soldAt: true,
        finalSalePrice: true,
        profit: true,
        build: { select: { name: true } }
      },
      orderBy: { soldAt: "desc" },
      take: 200
    })
  ]);

  const serviceRevenue = services.reduce((a, s) => a + Number(s.salePrice), 0);
  const saleRevenue = sales
    .filter((s) => s.status !== "REVERTED")
    .reduce((a, s) => a + Number(s.finalSalePrice), 0);

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    lookupKey: row.lookupKey,
    createdAt: row.createdAt.toISOString(),
    workCount: quotes.length + services.length + builds.length + sales.length,
    totalSpent: serviceRevenue + saleRevenue,
    quotes: quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      title: q.title,
      status: q.status,
      total: Number(q.total),
      createdAt: q.createdAt.toISOString()
    })),
    services: services.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      salePrice: Number(s.salePrice),
      profit: Number(s.profit),
      serviceDate: s.serviceDate.toISOString()
    })),
    builds: builds.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      salePrice: b.sales[0] ? Number(b.sales[0].finalSalePrice) : null
    })),
    sales: sales.map((s) => ({
      id: s.id,
      status: s.status,
      soldAt: s.soldAt.toISOString(),
      finalSalePrice: Number(s.finalSalePrice),
      profit: Number(s.profit),
      buildName: s.build.name
    }))
  };
}

export async function createCustomer(payload: {
  name: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
}) {
  const resolved = await resolveCustomerFields({
    customerName: payload.name,
    customerPhone: payload.phone ?? "",
    customerEmail: payload.email
  });
  if (!resolved.customerId) {
    throw new Error("CUSTOMER_INVALID");
  }

  const notes = normNotes(payload.notes);
  if (notes !== null) {
    await prisma.customer.update({
      where: { id: resolved.customerId },
      data: { notes }
    });
  }

  return getCustomerById(resolved.customerId);
}

export async function patchCustomer(
  id: string,
  payload: { name?: string; phone?: string; email?: string | null; notes?: string | null }
) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return null;

  const name = payload.name?.trim() ?? existing.name;
  const phone = payload.phone !== undefined ? payload.phone.trim() : existing.phone;
  const lookupKey = buildCustomerLookupKey(name, phone);

  const conflict = await prisma.customer.findFirst({
    where: { lookupKey, NOT: { id } }
  });
  if (conflict) {
    throw new Error("CUSTOMER_LOOKUP_CONFLICT");
  }

  let email = existing.email;
  if (payload.email !== undefined) {
    const t = payload.email?.trim() ?? "";
    email = t === "" ? null : t;
  }

  let notes = existing.notes;
  if (payload.notes !== undefined) {
    notes = normNotes(payload.notes);
  }

  await prisma.customer.update({
    where: { id },
    data: { name, phone, lookupKey, email, notes }
  });

  return getCustomerById(id);
}

export async function getCustomerOverview(name: string, phone: string) {
  await ensureBackfill();

  const nameTrim = name.trim();
  const phoneTrim = phone.trim();
  const lookupKey = buildCustomerLookupKey(nameTrim, phoneTrim);

  const customer = await prisma.customer.findUnique({ where: { lookupKey } });
  if (customer) {
    const detail = await getCustomerById(customer.id);
    if (detail) {
      return {
        customerId: detail.id,
        lookupKey: detail.lookupKey,
        displayName: detail.name,
        displayPhone: detail.phone,
        displayEmail: detail.email,
        notes: detail.notes,
        quotes: detail.quotes,
        services: detail.services,
        builds: detail.builds,
        sales: detail.sales
      };
    }
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { lookupKey },
    select: { notes: true }
  });

  const [quoteRows, serviceRows, saleRows, buildRows] = await Promise.all([
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
    }),
    prisma.build.findMany({
      where: { customerName: { equals: nameTrim, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        customerName: true,
        customerPhone: true,
        sales: {
          where: { NOT: { status: "REVERTED" } },
          orderBy: { soldAt: "desc" },
          take: 1,
          select: { finalSalePrice: true }
        }
      },
      orderBy: { createdAt: "desc" },
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

  const builds = buildRows
    .filter((b) => matchesCustomerRow(b.customerName ?? "", b.customerPhone, nameTrim, phoneTrim))
    .map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      salePrice: b.sales[0] ? Number(b.sales[0].finalSalePrice) : null
    }));

  return {
    customerId: null as string | null,
    lookupKey,
    displayName: nameTrim,
    displayPhone: phoneTrim,
    displayEmail: null as string | null,
    notes: profile?.notes ?? null,
    quotes,
    services,
    builds,
    sales
  };
}

export async function patchCustomerNotes(name: string, phone: string, notes: string | null | undefined) {
  const nameTrim = name.trim();
  const phoneTrim = phone.trim();
  const lookupKey = buildCustomerLookupKey(nameTrim, phoneTrim);
  const n = normNotes(notes ?? undefined);

  await ensureBackfill();

  const customer = await prisma.customer.findUnique({ where: { lookupKey } });
  if (customer) {
    const row = await prisma.customer.update({
      where: { id: customer.id },
      data: { notes: n },
      select: { id: true, lookupKey: true, notes: true, updatedAt: true }
    });
    return {
      customerId: row.id,
      lookupKey: row.lookupKey,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString()
    };
  }

  const row = await prisma.customerProfile.upsert({
    where: { lookupKey },
    create: { lookupKey, notes: n },
    update: { notes: n },
    select: { lookupKey: true, notes: true, updatedAt: true }
  });

  return {
    customerId: null as string | null,
    lookupKey: row.lookupKey,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString()
  };
}
