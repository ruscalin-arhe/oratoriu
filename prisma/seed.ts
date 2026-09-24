import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEV_USER_EMAIL;
  if (!email) throw new Error("DEV_USER_EMAIL lipseste");

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Admin", role: "ADMIN", active: true },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      expectedDailyHours: 8,
      reminderTime: "17:30",
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client" },
    update: {},
    create: { id: "seed-client", name: "Intern", active: true },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project" },
    update: {},
    create: {
      id: "seed-project",
      name: "Administrativ",
      clientId: client.id,
      status: "ACTIVE",
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    update: {},
    create: { projectId: project.id, userId: user.id },
  });

  console.log("Seed OK:", user.email);
}

main().finally(() => prisma.$disconnect());
