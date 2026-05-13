import PrintLayout from "@/components/PrintLayout";
import "@/components/print.css";
import { fetchTravelPayloadFromStitch } from "@/lib/stitch-mcp";
import { fallbackTravelPayload } from "@/lib/fallback-travel";
import { PrintButton } from "@/components/print-button";

// 이 페이지는 서버 컴포넌트로 유지하되, PrintLayout은 클라이언트 컴포넌트가 됩니다.
export default async function PrintPage() {
  // 이미 연결된 Stitch MCP에서 디자인 테마가 포함된 payload를 가져옵니다.
  const payload = (await fetchTravelPayloadFromStitch()) ?? fallbackTravelPayload;

  return (
    <>
      <div className="p-4 bg-gray-800 text-white text-center no-print">
        <p>인쇄 미리보기 페이지입니다. 브라우저의 인쇄 기능을 사용하여 PDF로 저장하세요. (Ctrl+P 또는 Cmd+P)</p>
        <PrintButton />
      </div>
      <PrintLayout payload={payload} />
    </>
  );
}