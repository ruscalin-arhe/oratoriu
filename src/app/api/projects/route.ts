import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    include: { client: true, members: { include: { user: true } }, tasks: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const { name, clientId, userIds } = await req.json();
  if (!name?.trim() || !clientId) {
    return NextResponse.json({ error: "Nume și client obligatorii" }, { status: 400 });
  }
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      clientId,
      members: {
        create: (userIds ?? []).map((userId: string) => ({ userId })),
      },
    },
  });
  return NextResponse.json(project);
}
