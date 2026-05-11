import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MCP_BASE_URL = process.env.TRAVEL_MCP_BASE_URL || "https://travelmcp.yejeelee.synology.me";
const MCP_SSE_URL = process.env.TRAVEL_MCP_SSE_URL || `${MCP_BASE_URL}/sse`;
const MCP_PROTOCOL_VERSION = "2024-11-05";
const MCP_TIMEOUT_MS = Number(process.env.MCP_ENRICH_TIMEOUT_MS || 90_000);

const attractions = [
  { city: "Verona", name: "Arena di Verona" },
  { city: "Verona", name: "Piazza Bra" },
  { city: "Verona", name: "Juliet House" },
  { city: "Sirmione", name: "Scaligero Castle Sirmione" },
  { city: "Sirmione", name: "Grotte di Catullo" },
  { city: "Sirmione", name: "Lake Garda promenade" },
  { city: "Milano", name: "Duomo di Milano" },
  { city: "Milano", name: "Galleria Vittorio Emanuele II" },
  { city: "Milano", name: "Piazza della Scala" }
];

const curatedFallback = {
  "Arena di Verona": "베로나 중심부의 고대 로마 원형극장입니다. 차량 이동일에는 내부 관람보다 외관과 Piazza Bra를 함께 짧게 보는 구성이 효율적입니다.",
  "Piazza Bra": "Arena di Verona 앞의 넓은 광장입니다. 베로나 구시가지의 분위기를 빠르게 파악하고 잠시 쉬어가기 좋습니다.",
  "Juliet House": "로미오와 줄리엣의 도시 이미지를 상징하는 베로나의 대표 포토 스팟입니다. 혼잡하므로 짧게 둘러보는 편이 좋습니다.",
  "Scaligero Castle Sirmione": "시르미오네 구시가지 입구에 있는 수상 요새입니다. 성곽과 가르다 호수 풍경이 함께 보여 짧은 정차에 적합합니다.",
  "Grotte di Catullo": "시르미오네 반도 끝에 남은 로마 시대 빌라 유적입니다. 시간이 있으면 호수 전망과 함께 산책하기 좋습니다.",
  "Lake Garda promenade": "가르다 호수를 따라 걷는 수변 산책 구간입니다. 시르미오네 정차를 가볍게 마무리하기 좋습니다.",
  "Duomo di Milano": "밀라노를 대표하는 고딕 대성당입니다. 긴 이동일에는 광장과 외관 중심으로 압축해서 보는 구성이 좋습니다.",
  "Galleria Vittorio Emanuele II": "두오모 옆의 역사적인 유리 돔 아케이드입니다. 밀라노의 도시미를 짧게 체감하기 좋습니다.",
  "Piazza della Scala": "라 스칼라 극장 앞 광장입니다. 두오모 주변 산책을 조용하게 마무리하는 지점으로 적합합니다."
};

function findSseBoundary(buffer) {
  const crlfIndex = buffer.indexOf("\r\n\r\n");
  const lfIndex = buffer.indexOf("\n\n");

  if (crlfIndex === -1 && lfIndex === -1) return null;
  if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) return { index: crlfIndex, length: 4 };

  return { index: lfIndex, length: 2 };
}

function parseSse(raw) {
  const lines = raw.split(/\r?\n/);
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart())
    .join("\n");

  return data ? JSON.parse(data) : null;
}

async function readSseMessage(reader, timeoutMs = MCP_TIMEOUT_MS) {
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await Promise.race([
      reader.read(),
      new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 1000))
    ]);

    if (result.timeout) continue;
    if (result.done) throw new Error("MCP SSE connection closed.");

    buffer += decoder.decode(result.value, { stream: true });
    const boundary = findSseBoundary(buffer);

    if (boundary) {
      const raw = buffer.slice(0, boundary.index);
      return parseSse(raw);
    }
  }

  throw new Error("MCP response timed out.");
}

async function postMcp(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`MCP POST failed: HTTP ${response.status}`);
  }
}

function extractText(response) {
  const structured = response?.result?.structuredContent;
  if (structured && typeof structured === "object" && typeof structured.result === "string") return structured.result;

  const item = response?.result?.content?.find((content) => typeof content.text === "string");
  return item?.text || "";
}

async function callMcpTool(name, args) {
  const sseResponse = await fetch(MCP_SSE_URL, { headers: { Accept: "text/event-stream" } });
  if (!sseResponse.ok || !sseResponse.body) throw new Error(`MCP SSE failed: HTTP ${sseResponse.status}`);

  const reader = sseResponse.body.getReader();
  const endpointMessage = await readSseMessage(reader, 15_000);
  const messagesUrl = new URL(endpointMessage.data, `${MCP_BASE_URL}/`).toString();

  await postMcp(messagesUrl, {
    jsonrpc: "2.0",
    id: "init",
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "trip-portal-enricher", version: "1.0.0" }
    }
  });
  await readSseMessage(reader, 15_000);
  await postMcp(messagesUrl, { jsonrpc: "2.0", method: "notifications/initialized" });
  await postMcp(messagesUrl, {
    jsonrpc: "2.0",
    id: "call",
    method: "tools/call",
    params: { name, arguments: args }
  });

  const result = await readSseMessage(reader, MCP_TIMEOUT_MS);
  await reader.cancel().catch(() => undefined);
  return extractText(result);
}

async function fetchWikipediaSummary(name) {
  const query = encodeURIComponent(name);
  const search = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${query}&limit=1`, {
    headers: { "User-Agent": "trip-portal-dev-enricher/1.0" }
  });

  if (!search.ok) throw new Error(`Wikipedia search failed: HTTP ${search.status}`);
  const searchJson = await search.json();
  const title = searchJson?.pages?.[0]?.title;
  if (!title) throw new Error("Wikipedia page not found.");

  const summary = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    headers: { "User-Agent": "trip-portal-dev-enricher/1.0" }
  });

  if (!summary.ok) throw new Error(`Wikipedia summary failed: HTTP ${summary.status}`);
  const summaryJson = await summary.json();
  return summaryJson.extract || "";
}

async function enrichAttraction(attraction) {
  try {
    const text = await callMcpTool("get_attraction_wiki", { attraction_name: attraction.name });
    if (text && text.trim().length > 80) {
      return { ...attraction, source: "my-travel-mcp", detailDescription: text.trim() };
    }

    throw new Error("MCP response was empty or too short.");
  } catch (mcpError) {
    try {
      const text = await fetchWikipediaSummary(attraction.name);
      if (text && text.trim().length > 80) {
        return {
          ...attraction,
          source: "wikipedia-summary",
          detailDescription: text.trim(),
          mcpError: String(mcpError instanceof Error ? mcpError.message : mcpError)
        };
      }

      throw new Error("Wikipedia response was empty or too short.");
    } catch (fallbackError) {
      return {
        ...attraction,
        source: "curated-fallback",
        detailDescription: curatedFallback[attraction.name] || `${attraction.name}의 상세 설명은 보강 대기 중입니다.`,
        mcpError: String(mcpError instanceof Error ? mcpError.message : mcpError),
        fallbackError: String(fallbackError instanceof Error ? fallbackError.message : fallbackError)
      };
    }
  }
}

const results = [];

for (const attraction of attractions) {
  console.log(`Enriching ${attraction.name}...`);
  results.push(await enrichAttraction(attraction));
}

const outputPath = path.join(process.cwd(), "data", "generated", "attraction-details.json");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
