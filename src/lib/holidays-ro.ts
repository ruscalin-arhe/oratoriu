export const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Anul Nou",
  "2026-01-02": "Anul Nou",
  "2026-01-06": "Boboteaza",
  "2026-01-07": "Sfantul Ioan",
  "2026-01-24": "Unirea Principatelor",
  "2026-04-12": "Paste",
  "2026-04-13": "Paste",
  "2026-05-01": "Ziua Muncii",
  "2026-05-31": "Rusalii",
  "2026-06-01": "Rusalii / Copilului",
  "2026-08-15": "Adormirea Maicii Domnului",
  "2026-11-30": "Sfantul Andrei",
  "2026-12-01": "Ziua Nationala",
  "2026-12-25": "Craciun",
  "2026-12-26": "Craciun",
};

export function holidayName(isoDate: string) {
  return HOLIDAYS_2026[isoDate] ?? null;
}
