import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      expectedDailyHours: u.expectedDailyHours,
      hasPassword: Boolean(u.passwordHash),
      costRate: u.costRate,
      billRate: u.billRate,
    })),
  );
}

export async function POST(req: Request) {
  const { name, email, role, expectedDailyHours, password } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nume și email obligatorii" }, { status: 400 });
  }
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
      expectedDailyHours: Number(expectedDailyHours || 8),
      passwordHash:
        typeof password === "string" && password.trim().length >= 6
          ? hashPassword(password.trim())
          : undefined,
    },
  });
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    costRate: user.costRate,
    billRate: user.billRate,
  });
}
