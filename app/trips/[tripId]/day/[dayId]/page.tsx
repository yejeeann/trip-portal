import { DailyDetail } from "@/components/daily-detail";
import { fallbackTravelPayload } from "@/lib/fallback-travel";

type Props = {
  params: { tripId: string; dayId: string };
};

export default async function DailyPage({ params }: Props) {
  const tripId = decodeURIComponent(params.tripId);
  const dayId = decodeURIComponent(params.dayId);

  const payload = fallbackTravelPayload;
  const trip = payload?.trips?.find((t) => t.id === tripId);

  if (!trip) {
    return <div>일정을 찾을 수 없습니다.</div>;
  }

  return <DailyDetail tripId={tripId} dayId={dayId} />;
}

export async function generateStaticParams() {
  const payload = fallbackTravelPayload;
  const params: { tripId: string; dayId: string }[] = [];

  for (const trip of payload?.trips ?? []) {
    for (const day of trip.itinerary) {
      params.push({ tripId: trip.id, dayId: String(day.day) });
    }
  }

  return params;
}
