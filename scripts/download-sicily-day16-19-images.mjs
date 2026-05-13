import { mkdir, stat, writeFile } from "node:fs/promises";

const outputDir = "public/travel-photos/sicily-day16-19";
const sourceOutput = "data/generated/sicily-day16-19-image-sources.json";

const images = [
  { fileName: "tropea-old-town.jpg", query: ["Tropea Corso Vittorio Emanuele", "Tropea old town Calabria"], force: true },
  { fileName: "santa-maria-dell-isola-tropea.jpg", query: ["Santa Maria dell'Isola Tropea", "Sanctuary of Santa Maria dell'Isola Tropea"] },
  { fileName: "chiesa-piedigrotta-pizzo.jpg", query: ["Chiesa di Piedigrotta Pizzo Calabria", "Piedigrotta Pizzo Calabria"] },
  { fileName: "castello-murat-pizzo.jpg", query: ["Pizzo Calabria Castello Murat"], force: true },
  { fileName: "pompeii-archaeological-park.jpg", query: ["Pompeii ruins panorama", "Pompeii Archaeological Park"] },
  { fileName: "forum-of-pompeii.jpg", query: ["Forum Pompeii view", "Foro di Pompei"], force: true },
  { fileName: "villa-of-the-mysteries.jpg", query: ["Villa of the Mysteries Pompeii", "Villa dei Misteri Pompeii"] },
  { fileName: "amphitheatre-of-pompeii.jpg", query: ["Amphitheatre Pompeii exterior", "Pompeii amphitheatre exterior"], force: true }
];

async function findImage(query) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "12");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "1600");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, {
      headers: { "User-Agent": "trip-portal-static-image-builder/1.0" },
      signal: AbortSignal.timeout(20000)
    });
    if (response.ok) break;
    if (response.status !== 429 || attempt === 3) throw new Error(`Commons search failed ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 8000 * (attempt + 1)));
  }

  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});
  const candidate = pages.find((page) => {
    const imageInfo = page.imageinfo?.[0];
    return imageInfo?.thumburl && ["image/jpeg", "image/png", "image/webp"].includes(imageInfo.mime);
  });

  if (!candidate) throw new Error(`No raster image found for ${query}`);
  return {
    title: candidate.title,
    url: candidate.imageinfo[0].thumburl,
    originalUrl: candidate.imageinfo[0].url,
    mime: candidate.imageinfo[0].mime,
    artist: candidate.imageinfo[0].extmetadata?.Artist?.value,
    license: candidate.imageinfo[0].extmetadata?.LicenseShortName?.value,
    credit: candidate.imageinfo[0].extmetadata?.Credit?.value
  };
}

async function downloadImage(imageUrl, filePath) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "trip-portal-static-image-builder/1.0" },
      signal: AbortSignal.timeout(30000)
    });
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 20000) throw new Error(`Image is unexpectedly small: ${buffer.length} bytes`);
      await writeFile(filePath, buffer);
      return buffer.length;
    }

    if (response.status !== 429 || attempt === 3) {
      throw new Error(`Image download failed ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 8000 * (attempt + 1)));
  }

  throw new Error("Image download failed");
}

await mkdir(outputDir, { recursive: true });
await mkdir("data/generated", { recursive: true });

const sources = [];
for (const image of images) {
  const queries = Array.isArray(image.query) ? image.query : [image.query];
  let source;
  let lastError;
  for (const query of queries) {
    try {
      source = await findImage(query);
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!source) throw lastError;

  const filePath = `${outputDir}/${image.fileName}`;
  let length;
  try {
    const existing = await stat(filePath);
    length = !image.force && existing.size > 20000 ? existing.size : await downloadImage(source.url, filePath);
  } catch {
    length = await downloadImage(source.url, filePath);
  }

  sources.push({ ...image, ...source, path: `/travel-photos/sicily-day16-19/${image.fileName}`, length });
  await new Promise((resolve) => setTimeout(resolve, 4000));
}

await writeFile(sourceOutput, JSON.stringify({ generatedAt: new Date().toISOString(), sources }, null, 2));

console.log(JSON.stringify({ images: sources.length, outputDir, sourceOutput }, null, 2));
