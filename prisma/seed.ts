import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const agency = await prisma.agency.upsert({
    where: { slug: "metria-agencia" },
    create: {
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

  await prisma.client.upsert({
    where: {
      agencyId_slug: { agencyId: agency.id, slug: "cliente-teste-1" },
    },
    create: {
      name: "Cliente Teste 1",
      slug: "cliente-teste-1",
      active: true,
      email: "contato@cliente1.com",
      phone: "+5511999999999",
      agencyId: agency.id,
      integrations: {},
      reportConfig: {},
    },
    update: {},
  });

  await prisma.client.upsert({
    where: {
      agencyId_slug: { agencyId: agency.id, slug: "cliente-teste-2" },
    },
    create: {
      name: "Cliente Teste 2",
      slug: "cliente-teste-2",
      active: true,
      email: "contato@cliente2.com",
      agencyId: agency.id,
      integrations: {},
      reportConfig: {},
    },
    update: {},
  });

  console.log("Seed completed: Agency, User, 2 Clients");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
