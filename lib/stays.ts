import type { DailyGuide, DailyGuideAccommodation } from "./swiss-guide-data";

export type StaySummary = DailyGuideAccommodation & {
  id: string;
  days: number[];
  dates: string[];
};

export function collectStays(guides: Pick<DailyGuide, "day" | "date" | "accommodation">[]): StaySummary[] {
  const stayMap = new Map<string, StaySummary>();

  guides.forEach((guide) => {
    if (!guide.accommodation) return;

    const key = [
      guide.accommodation.address,
      guide.accommodation.checkIn ?? "",
      guide.accommodation.checkOut ?? ""
    ].join("|");

    const current = stayMap.get(key);
    if (current) {
      current.days.push(guide.day);
      current.dates.push(guide.date);
      return;
    }

    stayMap.set(key, {
      ...guide.accommodation,
      id: slugifyStayKey(key),
      days: [guide.day],
      dates: [guide.date]
    });
  });

  return Array.from(stayMap.values()).map((stay) => ({
    ...stay,
    days: Array.from(new Set(stay.days)).sort((a, b) => a - b),
    dates: Array.from(new Set(stay.dates)).sort()
  }));
}

export function formatStayDays(days: number[]) {
  if (days.length === 0) return "Day TBD";
  if (days.length === 1) return `Day ${days[0]}`;

  const sorted = [...days].sort((a, b) => a - b);
  const isSequential = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);

  return isSequential ? `Day ${sorted[0]}-${sorted[sorted.length - 1]}` : sorted.map((day) => `Day ${day}`).join(", ");
}

function slugifyStayKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
