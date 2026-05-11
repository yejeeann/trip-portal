import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { TripOverview } from "@/components/trip-overview";
import { notFound } from "next/navigation";

type Props = {
  params: { tripId: string };
};

export default async function TripOverviewPage({ params }: Props) {
  const tripId = decodeURIComponent(params.tripId);

  const payload = fallbackTravelPayload;

  if (!payload || !payload.trips) {
    notFound();
  }

  const trip = payload.trips.find((t) => t.id === tripId);

  if (!trip) {
    notFound();
  }

  return <TripOverview trip={trip} uiConfig={payload.uiConfig} />;
}

export async function generateStaticParams() {
  const payload = fallbackTravelPayload;
  return (payload?.trips ?? []).map((trip) => ({ tripId: trip.id }));
}
