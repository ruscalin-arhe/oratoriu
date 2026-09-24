import { holidayName } from "./holidays-ro";

export function isWeekend(isoDate: string) {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

export function expectedMinutes(
  isoDate: string,
  dailyHours: number,
  timeOffHours = 0,
) {
  if (isWeekend(isoDate) || holidayName(isoDate)) return 0;
  return Math.max(0, dailyHours * 60 - timeOffHours * 60);
}

export function idleMinutes(expected: number, worked: number) {
  return Math.max(0, expected - worked);
}
