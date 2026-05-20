import PrintLayout from "@/components/PrintLayout";
import "@/components/print.css";
import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { staticPrintGuideDesign } from "@/lib/print-guide-design";
import { PrintButton } from "@/components/print-button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sicily & Malta Travel Guide · May 2026",
  description: "A publication-ready PDF travel guide for Sicily and Malta in May 2026."
};

export default function PrintPage({ searchParams }: { searchParams?: { mapSnapshotSource?: string } }) {
  const preferMapSnapshots = searchParams?.mapSnapshotSource !== "1";

  return (
    <>
      <div className="no-print sticky top-0 z-50 border-b border-[#dfd2c2] bg-[#f7f1e8]/95 px-4 py-3 shadow-[0_10px_26px_rgba(55,42,32,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#dfd2c2] bg-transparent px-4 text-[12px] font-extrabold text-[#5f5549] transition hover:border-[#c99a68] hover:bg-white/72 hover:text-[#1A434E] focus:outline-none focus:ring-2 focus:ring-[#d4a373]/35"
          >
            앱으로 돌아가기
          </Link>
          <PrintButton />
        </div>
      </div>
      <PrintLayout
        payload={fallbackTravelPayload}
        printDesign={staticPrintGuideDesign}
        preferMapSnapshots={preferMapSnapshots}
      />
    </>
  );
}
