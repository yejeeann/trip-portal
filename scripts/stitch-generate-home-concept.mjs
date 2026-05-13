import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("../.vscode/mcp.json", "utf8")).servers.stitch;

async function callTool(name, args, id = name) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Goog-Api-Key": config.headers["X-Goog-Api-Key"]
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: args }
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return JSON.parse(text);
}

const projectId = process.argv[2] ?? "12673752067805117286";

const prompt = `
Design one high-fidelity MOBILE home screen for a real travel itinerary app called The Limestone Editorial.

Trip: Sicily & Malta, 19 days, May 21-Jun 8 2026.

Style goal:
- Airbnb warmth
- Wanderlog practicality, but less rigid
- Monocle / Conde Nast Traveler editorial taste

Visual system:
- warm limestone paper background
- Mediterranean teal #00535B
- brass #7B5D1D
- soft terracotta accents
- elegant serif display headline plus Manrope-like clean sans labels

Screen should be concise, not dashboard-like.

Layout:
- top minimal app bar
- immersive Mediterranean photo hero with title "Sicily & Malta" and status "Upcoming"
- compact Today card: "Day 17 · Amalfi / Pompeii"
- route: Calvanico -> Salerno ferry -> Amalfi -> Pompeii -> Rome
- two buttons inside Today card: Daily and Map
- four small quick action tiles: Daily, Map, Guidebook, Stays
- bottom editorial image strip with 3 destinations: Ortigia, Valletta, Agrigento

Do not create marketing landing page copy.
Do not include long paragraphs.
Avoid purple gradients, corporate dashboard stats, nested cards, excessive chips.
Use tasteful 8px corners, strong whitespace, small icons, real travel app feel.
`;

const result = await callTool(
  "generate_screen_from_text",
  {
    projectId,
    deviceType: "MOBILE",
    modelId: "GEMINI_3_1_PRO",
    prompt
  },
  "generate-home-concept"
);

console.log(JSON.stringify(result, null, 2));
