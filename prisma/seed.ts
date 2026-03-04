import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    throw new Error("AGENCY_ID must be set in .env.local before running seed");
  }
  const agency = await prisma.agency.upsert({
    where: { slug: "metria-agencia" },
    create: {
      id: agencyId,
      name: "Metria Agência",
      slug: "metria-agencia",
    },
    update: {},
  });

  const hashedPassword = await hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@metria.com" },
    create: {
      email: "admin@metria.com",
      name: "Admin Metria",
      password: hashedPassword,
      role: "ADMIN",
      agencyId: agency.id,
    },
    update: {},
  });

  console.log("Seed completed: Agency", agency.id, ", User");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
