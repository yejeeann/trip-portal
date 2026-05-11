import { PlaceDetail } from "@/components/place-detail";

export default function PlacePage({
  params
}: {
  params: { tripId: string; placeId: string };
}) {
  return <PlaceDetail tripId={params.tripId} placeId={params.placeId} />;
}
