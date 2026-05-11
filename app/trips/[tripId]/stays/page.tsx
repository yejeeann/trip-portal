import { notFound } from "next/navigation";
import { TripStays } from "@/components/trip-stays";
import { fallbackTravelPayload } from "@/lib/fallback-travel";

type Props = {
  params: { tripId: string };
};

export default async function TripStaysPage({ params }: Props) {
  const tripId = decodeURIComponent(params.tripId);
  const payload = fallbackTravelPayload;
  const trip = payload.trips?.find((item) => item.id === tripId);

  if (!trip) {
    notFound();
  }

  return <TripStays trip={trip} uiConfig={payload.uiConfig} />;
}

export async function generateStaticParams() {
  const payload = fallbackTravelPayload;
  return (payload.trips ?? []).map((trip) => ({ tripId: trip.id }));
}
