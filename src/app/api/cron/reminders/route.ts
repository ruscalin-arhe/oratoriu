import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { todayIso, toWorkDate } from "@/lib/timezone";
import { holidayName } from "@/lib/holidays-ro";
import { isWeekend } from "@/lib/capacity";
import { formatInTimeZone } from "date-fns-tz";
import { TZ } from "@/lib/timezone";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const iso = todayIso();
  if (isWeekend(iso) || holidayName(iso)) {
    return NextResponse.json({ skipped: "nerulucratoare", date: iso });
  }

  const nowHm = formatInTimeZone(new Date(), TZ, "HH:mm");
  const workDate = toWorkDate(iso);
  const users = await prisma.user.findMany({
    where: { active: true, notifyEmail: true },
  });

  const sent: string[] = [];
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;

  for (const user of users) {
    if (nowHm < user.reminderTime) continue;

    const report = await prisma.dayReport.upsert({
      where: { userId_workDate: { userId: user.id, workDate } },
      update: {},
      create: { userId: user.id, workDate, status: "MISSING" },
    });
    if (report.status === "SUBMITTED") continue;
    if (report.reminderCount >= 2) continue;

    const subject =
      report.reminderCount === 0
        ? `Pontajul de azi nu e trimis (${iso})`
        : `Pontaj restant — ${iso}`;

    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Oratoriu <onboarding@resend.dev>",
        to: user.email,
        subject,
        html: `<p>Salut ${user.name},</p>
<p>Pontajul pentru <b>${iso}</b> nu e trimis.</p>
<p><a href="${process.env.APP_URL ?? "http://localhost:3000"}/today">Completează pontajul</a></p>`,
      });
    }

    await prisma.dayReport.update({
      where: { id: report.id },
      data: { lastRemindedAt: new Date(), reminderCount: { increment: 1 } },
    });
    sent.push(user.email);
  }

  return NextResponse.json({ date: iso, sent, emailed: Boolean(resend) });
}
