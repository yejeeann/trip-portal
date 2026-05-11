import { NextResponse } from "next/server";
import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { fetchTravelPayloadFromStitch } from "@/lib/stitch-mcp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stitchPayload = await fetchTravelPayloadFromStitch();
    return NextResponse.json(stitchPayload ?? fallbackTravelPayload);
  } catch {
    return NextResponse.json(fallbackTravelPayload);
  }
}
