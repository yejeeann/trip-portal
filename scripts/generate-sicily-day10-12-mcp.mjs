import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TRAVEL_MCP_BASE_URL || "http://localhost:8000";
const decoder = new TextDecoder();

async function readEvent(reader, timeoutMs = 12000) {
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
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) throw new Error(await response.text());
}

async function callTool(name, args) {
  const response = await fetch(`${base}/sse`, {
    headers: { Accept: "text/event-stream" },
    signal: AbortSignal.timeout(12000)
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
      clientInfo: { name: "trip-portal-sicily-day10-12-generator", version: "1.0.0" }
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
    day: 10,
    date: "2026-05-30",
    transportMode: "rental car",
    city: "San Calogero / Realmonte / Agrigento",
    stops: [
      "Contrada San Calogero Costa Saracena Castelluccio",
      "Realmonte Sicily",
      "Valley of the Temples Agrigento",
      "Temple of Concordia Agrigento",
      "Temple of Heracles Agrigento",
      "Realmonte Sicily"
    ]
  },
  {
    day: 11,
    date: "2026-05-31",
    transportMode: "rental car",
    city: "Realmonte / Scala dei Turchi / Agrigento",
    stops: [
      "Realmonte Sicily",
      "Scala dei Turchi Realmonte",
      "Via Atenea Agrigento",
      "Santa Maria dei Greci Agrigento",
      "Realmonte Sicily"
    ]
  },
  {
    day: 12,
    date: "2026-06-01",
    transportMode: "rental car",
    city: "Realmonte / Trapani / Erice / Balestrate",
    stops: [
      "Realmonte Sicily",
      "Trapani Old Town",
      "Torre di Ligny Trapani",
      "Erice Sicily",
      "Church of San Giuliano Erice",
      "Contrada Piano Milano Balestrate"
    ]
  }
];

const attractions = [
  "Realmonte Sicily",
  "Valley of the Temples Agrigento",
  "Temple of Concordia Agrigento",
  "Temple of Heracles Agrigento",
  "Scala dei Turchi Realmonte",
  "Via Atenea Agrigento",
  "Santa Maria dei Greci Agrigento",
  "Trapani Old Town",
  "Torre di Ligny Trapani",
  "Erice Sicily",
  "Church of San Giuliano Erice",
  "Giardini del Balio Erice"
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
  "data/generated/sicily-day10-12-mcp.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), routeResults, attractionResults }, null, 2)
);

console.log(JSON.stringify({ routes: routeResults.length, attractions: attractionResults.length, output: "data/generated/sicily-day10-12-mcp.json" }, null, 2));
