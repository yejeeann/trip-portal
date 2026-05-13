import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TRAVEL_MCP_BASE_URL || "http://localhost:8000";
const decoder = new TextDecoder();

async function readEvent(reader, timeoutMs = 30000) {
  let buffer = "";
  const end = Date.now() + timeoutMs;

  while (Date.now() < end) {
    const result = await Promise.race([
      reader.read(),
      new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 1000))
    ]);

    if (result.timeout) continue;
    if (result.done) throw new Error(`MCP stream closed: ${buffer}`);

    buffer += decoder.decode(result.value, { stream: true });
    const match = buffer.match(/\r?\n\r?\n/);
    if (!match) continue;

    const raw = buffer.slice(0, match.index);
    const data = raw
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    return JSON.parse(data);
  }

  throw new Error("Timed out waiting for MCP response");
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) throw new Error(await response.text());
}

async function callTool(name, args) {
  const response = await fetch(`${base}/sse`, {
    headers: { Accept: "text/event-stream" },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok || !response.body) throw new Error(`Failed to open MCP SSE: ${response.status}`);

  const reader = response.body.getReader();
  let first = "";
  while (true) {
    const next = await reader.read();
    if (next.done) throw new Error("MCP SSE closed before endpoint");
    first += decoder.decode(next.value, { stream: true });
    if (first.match(/\r?\n\r?\n/)) break;
  }

  const endpoint = first
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"))
    ?.slice(5)
    .trim();

  if (!endpoint) throw new Error("MCP endpoint missing");
  const url = new URL(endpoint, `${base}/`).toString();

  await postJson(url, {
    jsonrpc: "2.0",
    id: "init",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "trip-portal-sicily-day7-9-generator", version: "1.0.0" }
    }
  });
  await readEvent(reader);

  await postJson(url, { jsonrpc: "2.0", method: "notifications/initialized" });
  await postJson(url, {
    jsonrpc: "2.0",
    id: "call",
    method: "tools/call",
    params: { name, arguments: args }
  });

  const output = await readEvent(reader);
  await reader.cancel().catch(() => {});
  return output;
}

const routeJobs = [
  {
    day: 7,
    date: "2026-05-27",
    transportMode: "flight + taxi + walk",
    city: "Malta / Valletta / Three Cities",
    stops: [
      "Catania Fontanarossa Airport",
      "Malta International Airport",
      "Gzira",
      "Valletta",
      "Upper Barrakka Gardens",
      "St John's Co-Cathedral",
      "Birgu",
      "Bormla Cospicua",
      "Senglea"
    ]
  },
  {
    day: 8,
    date: "2026-05-28",
    transportMode: "taxi + ferry + boat",
    city: "Gozo / Comino",
    stops: [
      "Gzira",
      "Cirkewwa Ferry Terminal",
      "Mgarr Harbour Gozo",
      "Cittadella Victoria Gozo",
      "Gozo Island",
      "Ggantija Archaeological Park",
      "Blue Lagoon Comino",
      "Gzira"
    ]
  },
  {
    day: 9,
    date: "2026-05-29",
    transportMode: "taxi + walk + flight",
    city: "Blue Grotto / Marsaxlokk / Mdina / Mosta / Catania",
    stops: [
      "Gzira",
      "Blue Grotto Malta",
      "Marsaxlokk",
      "Mdina",
      "Mosta Rotunda",
      "Malta International Airport",
      "Catania Fontanarossa Airport",
      "Contrada San Calogero Costa Saracena Castelluccio"
    ]
  }
];

const attractions = [
  "Valletta",
  "Upper Barrakka Gardens",
  "St John's Co-Cathedral Valletta",
  "Birgu Vittoriosa",
  "Bormla Cospicua",
  "Senglea",
  "Gozo Island",
  "Cittadella Victoria Gozo",
  "Ggantija Archaeological Park",
  "Blue Lagoon Comino",
  "Blue Grotto Malta",
  "Marsaxlokk",
  "Mdina Malta",
  "Mosta Rotunda"
];

const routeResults = [];
for (const job of routeJobs) {
  const [optimizedRoute, mapLinks] = await Promise.allSettled([
    callTool("optimize_daily_route", { locations: job.stops }),
    callTool("generate_map_links", { route: job.stops })
  ]);

  routeResults.push({
    ...job,
    optimizedRoute: optimizedRoute.status === "fulfilled" ? optimizedRoute.value : { error: optimizedRoute.reason.message },
    mapLinks: mapLinks.status === "fulfilled" ? mapLinks.value : { error: mapLinks.reason.message }
  });
}

const attractionResults = [];
for (const attractionName of attractions) {
  try {
    const response = await callTool("get_attraction_wiki", { attraction_name: attractionName });
    attractionResults.push({ attractionName, response });
  } catch (error) {
    attractionResults.push({ attractionName, error: error.message });
  }
}

await mkdir("data/generated", { recursive: true });
await writeFile(
  "data/generated/sicily-day7-9-mcp.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), routeResults, attractionResults }, null, 2)
);

console.log(JSON.stringify({ routes: routeResults.length, attractions: attractionResults.length, output: "data/generated/sicily-day7-9-mcp.json" }, null, 2));
