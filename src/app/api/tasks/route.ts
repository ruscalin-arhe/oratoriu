import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { projectId, name } = await req.json();
    if (!projectId || !name?.trim()) {
      return NextResponse.json({ error: "Proiect și activitate obligatorii" }, { status: 400 });
    }
    const task = await prisma.task.create({
      data: { projectId, name: name.trim(), active: true },
    });
    return NextResponse.json(task);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
