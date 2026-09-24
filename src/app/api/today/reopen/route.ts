import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { todayIso, toWorkDate } from "@/lib/timezone";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const iso = new URL(req.url).searchParams.get("date") || todayIso();
    const workDate = toWorkDate(iso);

    await prisma.$transaction([
      prisma.timeEntry.updateMany({
        where: { userId: user.id, workDate },
        data: { status: "DRAFT" },
      }),
      prisma.dayReport.updateMany({
        where: { userId: user.id, workDate },
        data: { status: "DRAFT", submittedAt: null },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
