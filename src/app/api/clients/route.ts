import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ACTIVITIES = ["Training", "Organizare", "Project management"];

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nume lipsă" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        projects: {
          create: {
            name: "—",
            status: "ACTIVE",
            tasks: {
              create: DEFAULT_ACTIVITIES.map((name) => ({ name, active: true })),
            },
          },
        },
      },
      include: { projects: true },
    });
    return NextResponse.json(client);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
