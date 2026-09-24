import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { hashPassword } from "@/lib/password";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await currentUser();
    if (me.role !== "ADMIN") {
      return NextResponse.json({ error: "Doar adminul schimbă datele." }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, password, costRate, billRate } = body ?? {};
    const data: any = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof email === "string" && email.trim()) data.email = email.trim().toLowerCase();
    if (role === "ADMIN" || role === "EMPLOYEE") data.role = role;
    if (costRate !== undefined && costRate !== "") data.costRate = Number(costRate);
    if (billRate !== undefined && billRate !== "") data.billRate = Number(billRate);
    if (typeof password === "string") {
      if (password.trim().length < 6) {
        return NextResponse.json({ error: "Parola minim 6 caractere." }, { status: 400 });
      }
      data.passwordHash = hashPassword(password.trim());
    }
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "Nimic de actualizat" }, { status: 400 });
    }
    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      costRate: user.costRate,
      billRate: user.billRate,
      hasPassword: Boolean(user.passwordHash),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await currentUser();
    if (me.role !== "ADMIN") return NextResponse.json({ error: "Doar adminul șterge." }, { status: 403 });
    const { id } = await params;
    if (me.id === id) return NextResponse.json({ error: "Nu poți să te ștergi pe tine." }, { status: 400 });
    const entries = await prisma.timeEntry.count({ where: { userId: id } });
    if (entries > 0) return NextResponse.json({ error: "Are ore pontate." }, { status: 400 });
    await prisma.projectMember.deleteMany({ where: { userId: id } });
    await prisma.dayReport.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
