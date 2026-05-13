import { PrismaClient, PartCategory, PartCondition } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.part.createMany({
    data: [
      {
        name: "Ryzen 5 5600",
        category: PartCategory.CPU,
        condition: PartCondition.USED,
        costPrice: 80,
        salePrice: 110,
        stock: 3,
        notes: "Con caja original"
      },
      {
        name: "RTX 3060 12GB",
        category: PartCategory.GPU,
        condition: PartCondition.USED,
        costPrice: 190,
        salePrice: 240,
        stock: 2,
        notes: "Limpia y testeada"
      }
    ]
  });

  await prisma.extraTemplate.createMany({
    data: [
      {
        name: "Instalacion Windows 11",
        description: "Instalacion limpia con drivers basicos",
        defaultCostPrice: 5,
        defaultSalePrice: 35,
        category: "Sistema",
        active: true
      },
      {
        name: "Sistema operativo Windows 10 Pro",
        description: "Licencia / instalacion segun acuerdo con cliente",
        defaultCostPrice: 40,
        defaultSalePrice: 120,
        category: "Sistema",
        active: true
      },
      {
        name: "Instalacion drivers y actualizaciones",
        description: "Drivers oficiales + Windows Update",
        defaultCostPrice: 3,
        defaultSalePrice: 25,
        category: "Servicio",
        active: true
      },
      {
        name: "Pack software basico",
        description: "Navegador, reproductor, utilidades acordadas",
        defaultCostPrice: 2,
        defaultSalePrice: 20,
        category: "Software",
        active: true
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
