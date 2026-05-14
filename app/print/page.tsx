import PrintLayout from "@/components/PrintLayout";
import "@/components/print.css";
import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { staticPrintGuideDesign } from "@/lib/print-guide-design";
import { PrintButton } from "@/components/print-button";

export default function PrintPage() {
  return (
    <>
      <div className="no-print sticky top-0 z-50 border-b border-white/10 bg-[#1A434E] px-4 py-3 text-white shadow-[0_10px_30px_rgba(26,67,78,0.18)]">
        <p className="mx-auto mb-2 max-w-3xl text-center text-xs font-semibold text-white/80">
          PDF 저장 창이 열리면 대상에서 PDF 저장을 선택하세요. 기본 파일명은 sicily-malta-rome-travel-guidebook으로 설정됩니다.
        </p>
        <div className="flex justify-center">
          <PrintButton />
        </div>
      </div>
      <PrintLayout payload={fallbackTravelPayload} printDesign={staticPrintGuideDesign} />
    </>
  );
}
