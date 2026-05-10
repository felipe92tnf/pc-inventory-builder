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
