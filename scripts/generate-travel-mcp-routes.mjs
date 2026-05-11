import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TRAVEL_MCP_BASE_URL || "http://localhost:8000";
const decoder = new TextDecoder();

async function readEvent(reader, timeoutMs = 90000) {
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
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function callTool(name, args) {
  const response = await fetch(`${base}/sse`, {
    headers: { Accept: "text/event-stream" }
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to open MCP SSE: ${response.status}`);
  }

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
      clientInfo: { name: "trip-portal-data-generator", version: "1.0.0" }
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

const sicilyRouteJobs = [
  {
    day: 10,
    date: "2026-05-30",
    transportMode: "rental-car",
    city: "Realmonte / Agrigento",
    stops: ["Realmonte", "Valley of the Temples", "Temple of Concordia, Agrigento"]
  },
  {
    day: 12,
    date: "2026-06-01",
    transportMode: "rental-car",
    city: "Western Sicily",
    stops: ["Contrada Piano Milano", "Trapani", "Erice"]
  },
  {
    day: 13,
    date: "2026-06-02",
    transportMode: "rental-car",
    city: "Western Sicily",
    stops: ["Trapani", "Erice", "Scopello"]
  },
  {
    day: 14,
    date: "2026-06-03",
    transportMode: "rental-car",
    city: "Palermo / Monreale",
    stops: ["Palermo", "Monreale"]
  },
  {
    day: 7,
    date: "2026-05-27",
    transportMode: "taxi",
    city: "Malta / Valletta",
    stops: ["Malta International Airport", "Valletta", "Birgu", "Senglea"]
  },
  {
    day: 8,
    date: "2026-05-28",
    transportMode: "taxi",
    city: "Gozo / Comino",
    stops: ["Gozo", "Citadel", "Ggantija Archaeological Park", "Blue Lagoon"]
  }
];

const results = [];

for (const job of sicilyRouteJobs) {
  const stops = job.stops.map((name) => ({ name }));
  const [optimizedRoute, mapLinks] = await Promise.allSettled([
    callTool("optimize_daily_route", { locations: job.stops }),
    callTool("generate_map_links", { route: job.stops })
  ]);

  results.push({
    ...job,
    optimizedRoute: optimizedRoute.status === "fulfilled" ? optimizedRoute.value : { error: optimizedRoute.reason.message },
    mapLinks: mapLinks.status === "fulfilled" ? mapLinks.value : { error: mapLinks.reason.message }
  });
}

await mkdir("data/generated", { recursive: true });
await writeFile("data/generated/sicily-route-mcp.json", JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

console.log(JSON.stringify({ count: results.length, output: "data/generated/sicily-route-mcp.json" }, null, 2));
