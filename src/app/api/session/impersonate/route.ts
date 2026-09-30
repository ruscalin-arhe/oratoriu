import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { userId } = await req.json();
    const target = await prisma.user.findUnique({ where: { id: String(userId || "") } });
    if (!target || !target.active) {
      return NextResponse.json({ error: "Angajat inexistent" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true, name: target.name });
    res.cookies.set("oratoriu_as", target.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    const res = NextResponse.json({ ok: true });
    res.cookies.set("oratoriu_as", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
