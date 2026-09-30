import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    include: {
      client: true,
      members: { include: { user: true } },
      tasks: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  try {
    await currentUser();
    const { name, clientId, userIds } = await req.json();
    const trimmed = String(name || "").trim() || "—";
    if (!clientId) {
      return NextResponse.json({ error: "Client obligatoriu" }, { status: 400 });
    }
    const existing = await prisma.project.findFirst({
      where: { clientId, status: "ACTIVE", name: { equals: trimmed, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: "Proiectul există deja la acest client.", project: existing }, { status: 409 });
    }
    const project = await prisma.project.create({
      data: {
        name: trimmed,
        clientId,
        members: { create: (userIds ?? []).map((userId: string) => ({ userId })) },
      },
    });
    return NextResponse.json(project);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
