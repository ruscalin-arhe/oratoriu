import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { projectId, name } = await req.json();
    if (!projectId || !name?.trim()) {
      return NextResponse.json({ error: "Proiect și activitate obligatorii" }, { status: 400 });
    }
    const last = await prisma.task.aggregate({ where: { projectId }, _max: { sortOrder: true } });
    const task = await prisma.task.create({
      data: {
        projectId,
        name: name.trim(),
        active: true,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json(task);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
