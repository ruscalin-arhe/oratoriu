import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { name, active } = await req.json();

  const data: { name?: string; active?: boolean } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof active === "boolean") data.active = active;

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nimic de actualizat" }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const count = await prisma.project.count({ where: { clientId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Clientul are ${count} proiecte. Șterge sau mută proiectele întâi.` },
      { status: 400 },
    );
  }
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
