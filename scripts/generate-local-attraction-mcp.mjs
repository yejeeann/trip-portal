import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TRAVEL_MCP_BASE_URL || "http://localhost:8000";
const decoder = new TextDecoder();

async function readEvent(reader, timeoutMs = 120000) {
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

  if (!response.ok) throw new Error(await response.text());
}

async function callTool(name, args) {
  const response = await fetch(`${base}/sse`, {
    headers: { Accept: "text/event-stream" }
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
      clientInfo: { name: "trip-portal-attraction-generator", version: "1.0.0" }
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

const attractions = [
  "Valletta",
  "Valley of the Temples",
  "Temple of Concordia Agrigento",
  "Erice Sicily",
  "Scopello Sicily",
  "Palermo Cathedral",
  "Quattro Canti Palermo",
  "Mercato Ballaro",
  "Cattedrale di Monreale"
];

const results = [];

for (const attractionName of attractions) {
  try {
    const response = await callTool("get_attraction_wiki", { attraction_name: attractionName });
    results.push({ attractionName, response });
  } catch (error) {
    results.push({ attractionName, error: error.message });
  }
}

await mkdir("data/generated", { recursive: true });
await writeFile(
  "data/generated/local-attraction-mcp.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
);

console.log(JSON.stringify({ count: results.length, output: "data/generated/local-attraction-mcp.json" }, null, 2));
