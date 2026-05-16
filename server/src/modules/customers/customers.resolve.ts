import type { Customer } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { buildCustomerLookupKey } from "./customers.lookup.js";

export type ResolvedCustomerFields = {
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
};

function normEmail(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}

export function customerFieldsFromRow(row: Customer): ResolvedCustomerFields {
  return {
    customerId: row.id,
    customerName: row.name,
    customerPhone: row.phone || null,
    customerEmail: row.email
  };
}

/** Busca por id o crea/actualiza por nombre+telefono. */
export async function resolveCustomerFields(input: {
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
}): Promise<ResolvedCustomerFields> {
  const nameTrim = input.customerName.trim();
  if (!nameTrim) {
    return {
      customerId: null,
      customerName: "",
      customerPhone: null,
      customerEmail: null
    };
  }

  const phoneTrim = (input.customerPhone ?? "").trim();
  const email = normEmail(input.customerEmail);

  if (input.customerId) {
    const existing = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (existing) {
      const lookupKey = buildCustomerLookupKey(nameTrim, phoneTrim);
      const needsUpdate =
        existing.name !== nameTrim ||
        existing.phone !== phoneTrim ||
        (email !== null && existing.email !== email) ||
        existing.lookupKey !== lookupKey;

      const row = needsUpdate
        ? await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: nameTrim,
              phone: phoneTrim,
              lookupKey,
              ...(email !== null ? { email } : {})
            }
          })
        : existing;

      return customerFieldsFromRow(row);
    }
  }

  const lookupKey = buildCustomerLookupKey(nameTrim, phoneTrim);
  const row = await prisma.customer.upsert({
    where: { lookupKey },
    create: { name: nameTrim, phone: phoneTrim, email, lookupKey },
    update: {
      name: nameTrim,
      phone: phoneTrim,
      ...(email !== null ? { email } : {})
    }
  });

  return customerFieldsFromRow(row);
}

/** Campos Prisma listos para guardar en Quote/Build/Service/Sale. */
export async function customerDataForEntity(input: {
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
}): Promise<{
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
}> {
  const name = (input.customerName ?? "").trim();
  if (!name) {
    return {
      customerId: null,
      customerName: "",
      customerPhone: null,
      customerEmail: null
    };
  }

  const resolved = await resolveCustomerFields({
    customerId: input.customerId,
    customerName: name,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail
  });

  return {
    customerId: resolved.customerId,
    customerName: resolved.customerName,
    customerPhone: resolved.customerPhone,
    customerEmail: resolved.customerEmail
  };
}

/** Importa clientes desde registros existentes (una sola vez si la tabla esta vacia). */
export async function backfillCustomersFromLegacy(): Promise<void> {
  const count = await prisma.customer.count();
  if (count > 0) return;

  type Source = { name: string; phone: string; email: string | null };
  const map = new Map<string, Source>();

  const add = (name: string | null | undefined, phone: string | null | undefined, email?: string | null) => {
    const n = (name ?? "").trim();
    if (!n) return;
    const p = (phone ?? "").trim();
    const key = buildCustomerLookupKey(n, p);
    const prev = map.get(key);
    const em = normEmail(email);
    if (!prev) {
      map.set(key, { name: n, phone: p, email: em });
      return;
    }
    if (!prev.email && em) prev.email = em;
  };

  const [quotes, services, builds, sales, profiles] = await Promise.all([
    prisma.quote.findMany({ select: { customerName: true, customerPhone: true, customerEmail: true } }),
    prisma.service.findMany({ select: { customerName: true, customerPhone: true, customerEmail: true } }),
    prisma.build.findMany({ select: { customerName: true, customerPhone: true, customerEmail: true } }),
    prisma.sale.findMany({ select: { customerName: true, customerPhone: true, customerEmail: true } }),
    prisma.customerProfile.findMany({ select: { lookupKey: true, notes: true } })
  ]);

  for (const r of quotes) add(r.customerName, r.customerPhone, r.customerEmail);
  for (const r of services) add(r.customerName, r.customerPhone, r.customerEmail);
  for (const r of builds) add(r.customerName, r.customerPhone, r.customerEmail);
  for (const r of sales) add(r.customerName, r.customerPhone, r.customerEmail);

  const profileNotes = new Map(profiles.map((p) => [p.lookupKey, p.notes]));

  for (const [lookupKey, src] of map) {
    await prisma.customer.create({
      data: {
        name: src.name,
        phone: src.phone,
        email: src.email,
        lookupKey,
        notes: profileNotes.get(lookupKey) ?? null
      }
    });
  }

  const customers = await prisma.customer.findMany({ select: { id: true, lookupKey: true } });
  const byKey = new Map(customers.map((c) => [c.lookupKey, c.id]));

  const linkBatch = async (
    table: "quote" | "service" | "build" | "sale",
    rows: { id: string; customerName: string; customerPhone: string | null }[]
  ) => {
    for (const row of rows) {
      const key = buildCustomerLookupKey(row.customerName, row.customerPhone);
      const customerId = byKey.get(key);
      if (!customerId) continue;
      if (table === "quote") {
        await prisma.quote.update({ where: { id: row.id }, data: { customerId } });
      } else if (table === "service") {
        await prisma.service.update({ where: { id: row.id }, data: { customerId } });
      } else if (table === "build") {
        await prisma.build.update({ where: { id: row.id }, data: { customerId } });
      } else {
        await prisma.sale.update({ where: { id: row.id }, data: { customerId } });
      }
    }
  };

  const [quoteRows, serviceRows, buildRows, saleRows] = await Promise.all([
    prisma.quote.findMany({ select: { id: true, customerName: true, customerPhone: true } }),
    prisma.service.findMany({ select: { id: true, customerName: true, customerPhone: true } }),
    prisma.build.findMany({
      select: { id: true, customerName: true, customerPhone: true },
      where: { customerName: { not: null } }
    }),
    prisma.sale.findMany({ select: { id: true, customerName: true, customerPhone: true } })
  ]);

  await linkBatch(
    "quote",
    quoteRows.map((r) => ({ id: r.id, customerName: r.customerName, customerPhone: r.customerPhone }))
  );
  await linkBatch(
    "service",
    serviceRows.map((r) => ({ id: r.id, customerName: r.customerName, customerPhone: r.customerPhone }))
  );
  await linkBatch(
    "build",
    buildRows
      .filter((r) => r.customerName)
      .map((r) => ({
        id: r.id,
        customerName: r.customerName!,
        customerPhone: r.customerPhone
      }))
  );
  await linkBatch(
    "sale",
    saleRows.map((r) => ({ id: r.id, customerName: r.customerName, customerPhone: r.customerPhone }))
  );
}
