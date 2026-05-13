import PrintLayout from "@/components/PrintLayout";
import "@/components/print.css";
import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { staticPrintGuideDesign } from "@/lib/print-guide-design";
import { PrintButton } from "@/components/print-button";

export default function PrintPage() {
  return (
    <>
      <div className="no-print bg-[#1A434E] p-4 text-center text-white">
        <p>
          여행 데이터: 정적 가이드 / 디자인: 메인 홈과 통일된 Mediterranean Travel Guide 테마.
          브라우저 인쇄 기능으로 PDF 저장하세요. (Ctrl+P 또는 Cmd+P)
        </p>
        <PrintButton />
      </div>
      <PrintLayout payload={fallbackTravelPayload} printDesign={staticPrintGuideDesign} />
    </>
  );
}
