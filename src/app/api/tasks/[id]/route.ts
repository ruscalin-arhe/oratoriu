import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";

export async function PATCH() {
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await currentUser();
    const { id } = await params;
    const hours = await prisma.timeEntry.count({ where: { taskId: id } });
    if (hours > 0) {
      return NextResponse.json({ error: "Are ore pontate. Nu se șterge." }, { status: 400 });
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
