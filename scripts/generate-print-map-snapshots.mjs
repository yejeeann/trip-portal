import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceUrl = process.env.PRINT_MAP_SOURCE_URL ?? "http://localhost:3013/print?mapSnapshotSource=1";
const outputDir = path.join(root, "public", "print-maps");
const manifestPath = path.join(root, "data", "generated", "print-map-snapshots.json");
const tempDir = path.join(root, ".edge-tmp", "print-map-snapshots");
const browserProfileDir = path.join(root, ".edge-tmp", "print-map-browser-profile");

const browserCandidates = [
  process.env.PRINT_MAP_BROWSER,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
].filter(Boolean);

const scopeDimensions = {
  overview: { width: 1440, height: 660 },
  atlas: { width: 1200, height: 741 },
  dailyWide: { width: 1440, height: 679 },
  daily: { width: 1000, height: 758 }
};

function findBrowser() {
  const browser = browserCandidates.find((candidate) => existsSync(candidate));
  if (!browser) {
    throw new Error("Headless browser not found. Set PRINT_MAP_BROWSER to a Chrome or Edge executable.");
  }
  return browser;
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMapBlocks(html) {
  const pattern = /<div class="print-tile-map[^"]*" data-print-map-key="([^"]+)" data-print-map-scope="([^"]+)">([\s\S]*?)<\/div>/g;
  const maps = new Map();
  let match;

  while ((match = pattern.exec(html))) {
    const key = decodeHtml(match[1]);
    const scope = decodeHtml(match[2]);
    const block = decodeHtml(match[0]);

    if (!maps.has(key)) {
      maps.set(key, { key, scope, block });
    }
  }

  return Array.from(maps.values());
}

function renderHtml({ block, scope }) {
  const { width, height } = scopeDimensions[scope] ?? scopeDimensions.daily;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --guide-soft: #efe7da;
      --guide-theme: #1A434E;
      --guide-accent: #4F928B;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: ${width}px;
      height: ${height}px;
      margin: 0;
      overflow: hidden;
      background: #efe7da;
    }

    .snapshot-frame {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: var(--guide-soft);
    }

    .print-tile-map {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: 0;
      background: var(--guide-soft);
    }

    .print-tile-map img {
      position: absolute;
      display: block;
      max-width: none;
      object-fit: fill;
    }

    .print-tile-route {
      position: absolute;
      inset: 0;
      z-index: 2;
      width: 100%;
      height: 100%;
    }

    .print-tile-route polyline {
      stroke: var(--guide-theme);
      stroke-width: 1.45;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 3 2;
      opacity: 0.92;
      vector-effect: non-scaling-stroke;
    }

    .print-tile-map-overview .print-tile-route polyline {
      stroke: #4F928B;
      stroke-width: 1.15;
      stroke-dasharray: 5 10;
      opacity: 0.86;
    }

    .print-tile-pin {
      position: absolute;
      z-index: 3;
      display: inline-flex;
      width: 15px;
      height: 15px;
      transform: translate(-50%, -50%);
      align-items: center;
      justify-content: center;
      border: 1.4px solid #ffffff;
      border-radius: 999px;
      background: var(--guide-accent);
      box-shadow: 0 2px 6px rgba(26, 67, 78, 0.26);
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 7.5px;
      font-weight: 900;
      line-height: 1;
    }

    .print-tile-map-overview .print-tile-pin,
    .print-tile-map-atlas .print-tile-pin {
      width: 13px;
      height: 13px;
      font-size: 6.6px;
    }

    .print-tile-pin-stay {
      border-color: var(--guide-theme);
      border-radius: 5px;
      background: #fffaf2;
      color: var(--guide-theme);
      font-size: 8px;
    }

    .map-attribution {
      position: absolute;
      right: 4px;
      bottom: 3px;
      z-index: 6;
      border-radius: 999px;
      background: rgba(255, 252, 246, 0.78);
      padding: 2px 5px;
      color: rgba(50, 50, 45, 0.72);
      font-family: Arial, sans-serif;
      font-size: 6px;
      font-weight: 700;
      line-height: 1;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="snapshot-frame">
    ${block}
    <div class="map-attribution">© OpenStreetMap contributors © CARTO</div>
  </div>
  <script>
    const done = () => document.body.setAttribute("data-ready", "1");
    const images = Array.from(document.images);
    Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })).then(() => setTimeout(done, 650));
    setTimeout(done, 7000);
  </script>
</body>
</html>`;
}

async function main() {
  const browser = findBrowser();
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to load print source: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const maps = extractMapBlocks(html);
  if (!maps.length) {
    throw new Error("No print maps found. Make sure the dev server is running and mapSnapshotSource=1 is enabled.");
  }

  await rm(outputDir, { recursive: true, force: true });
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  await mkdir(browserProfileDir, { recursive: true });

  const generated = [];

  for (const map of maps) {
    const dimensions = scopeDimensions[map.scope] ?? scopeDimensions.daily;
    const htmlPath = path.join(tempDir, `${map.key}.html`);
    const outputPath = path.join(outputDir, `${map.key}.png`);
    await writeFile(htmlPath, renderHtml(map), "utf8");

    const result = spawnSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      `--user-data-dir=${browserProfileDir}`,
      `--window-size=${dimensions.width},${dimensions.height}`,
      "--virtual-time-budget=9000",
      `--screenshot=${outputPath}`,
      `file:///${htmlPath.replace(/\\/g, "/")}`
    ], {
      cwd: root,
      encoding: "utf8"
    });

    if (result.status !== 0 || !existsSync(outputPath)) {
      throw new Error(`Failed to render ${map.key}: ${result.stderr || result.stdout}`);
    }

    generated.push(map.key);
    console.log(`generated ${map.key}.png (${map.scope})`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceUrl,
    count: generated.length,
    maps: generated.sort()
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ count: generated.length, outputDir: path.relative(root, outputDir), manifest: path.relative(root, manifestPath) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
