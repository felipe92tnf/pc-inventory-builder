import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    const table = (error.meta as { table?: string } | undefined)?.table;
    res.status(503).json({
      message:
        "La base de datos no esta al dia con el codigo (falta una tabla). En la carpeta server ejecuta: npx prisma migrate deploy && npx prisma generate, y reinicia el servidor.",
      code: error.code,
      table: table ?? null
    });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
}
