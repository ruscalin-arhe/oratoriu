import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function GET() {
  const email = (await cookies()).get("oratoriu_email")?.value || "";
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  return NextResponse.json({
    user: user
      ? { id: user.id, name: user.name, email: user.email, role: user.role }
      : null,
  });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({
    where: { email: String(email || "").trim().toLowerCase() },
  });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Email sau parolă greșite" }, { status: 400 });
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "Cont fără parolă. Cere adminului să-ți seteze una." },
      { status: 400 },
    );
  }
  if (!verifyPassword(String(password || ""), user.passwordHash)) {
    return NextResponse.json({ error: "Email sau parolă greșite" }, { status: 400 });
  }

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  res.cookies.set("oratoriu_email", user.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("oratoriu_email", "", { path: "/", maxAge: 0 });
  return res;
}
