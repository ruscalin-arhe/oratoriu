import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { toWorkDate } from "@/lib/timezone";
import { holidayName } from "@/lib/holidays-ro";
import { isWeekend } from "@/lib/capacity";
import { addDays, format } from "date-fns";

function eachIso(from: string, to: string) {
  const out: string[] = [];
  let d = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (d > end) return out;
  while (d <= end) {
    out.push(format(d, "yyyy-MM-dd"));
    d = addDays(d, 1);
  }
  return out;
}

export async function GET() {
  try {
    const user = await currentUser();
    const rows = await prisma.timeOff.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 90,
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        date: format(r.date, "yyyy-MM-dd"),
        hours: Number(r.hours),
        type: r.type,
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const body = await req.json();
    const from = String(body.from || body.date || "");
    const to = String(body.to || body.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ error: "Interval invalid" }, { status: 400 });
    }
    if (from > to) {
      return NextResponse.json({ error: "Data de încheiere e înainte de început" }, { status: 400 });
    }

    const hours = Math.min(8, Math.max(0.5, Number(body.hours || 8)));
    const type = String(body.type || "concediu");
    const days = eachIso(from, to);
    const skipped: string[] = [];
    const kept: string[] = [];

    for (const iso of days) {
      if (isWeekend(iso) || holidayName(iso)) {
        skipped.push(iso);
        continue;
      }
      kept.push(iso);
    }
    if (!kept.length) {
      return NextResponse.json(
        { error: "În interval nu e nicio zi lucrătoare" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      kept.map((iso) =>
        prisma.timeOff.create({
          data: { userId: user.id, date: toWorkDate(iso), hours, type },
        }),
      ),
    );

    return NextResponse.json({ ok: true, saved: kept.length, skipped: skipped.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Lipsește id" }, { status: 400 });
    await prisma.timeOff.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
