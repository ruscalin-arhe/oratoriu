import { formatInTimeZone } from "date-fns-tz";

export const TZ = "Europe/Bucharest";

export function todayIso(date = new Date()) {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd");
}

export function toWorkDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
