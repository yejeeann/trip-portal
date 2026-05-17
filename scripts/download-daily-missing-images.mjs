import { mkdir, stat, writeFile } from "node:fs/promises";

const output = "data/generated/daily-missing-image-sources.json";

const jobs = [
  { dir: "rome", fileName: "incheon-international-airport.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Incheon%20International%20Airport%20Air%20Traffic%20Control%20tower%20and%20terminal%202.jpg?width=1600" },
  { dir: "rome", fileName: "helsinki-airport.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki%20Airport%20international%20zone%20in%20the%20morning.jpg?width=1600" },
  { dir: "rome", fileName: "fiumicino-airport.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/FCO%20terminal%201%20interior%20view.jpg?width=1600" },
  { dir: "rome", fileName: "colosseum.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Colosseum%20in%20Rome%2C%20Italy.jpg?width=1600" },
  { dir: "rome", fileName: "roman-forum.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Roman%20Forum%2C%20Rome.jpg?width=1600" },
  { dir: "rome", fileName: "piazza-venezia.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Altare%20Della%20Patria%20%2853243044838%29.jpg?width=1600" },
  { dir: "rome", fileName: "pantheon.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Pantheon%20rome%20italy.jpg?width=1600" },
  { dir: "rome", fileName: "piazza-navona.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Piazza%20Navona%20-%20Rome%202015.jpg?width=1600" },
  { dir: "rome", fileName: "trevi-fountain.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Trevi%20Fountain%2C%20Rome%20Italy.JPG?width=1600" },
  { dir: "rome", fileName: "spanish-steps.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Spanish%20Steps%2C%20Rome.JPG?width=1600" },
  { dir: "rome", fileName: "monti-district.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Rue%20du%20rione%20Monti%20%C3%A0%20Rome.JPG?width=1600" },
  { dir: "rome", fileName: "roma-termini.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Main%20entrance%20hall%20at%20Roma%20Termini%20Railway%20Station%20in%20Rome%2C%20Italy.jpg?width=1600" },
  { dir: "sicily-day10-12", fileName: "agrigento-overview.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Agrigento%20Valley%20of%20the%20Temples%20Temple%20of%20Concordia.jpg?width=1600" },
  { dir: "sicily-day13-15", fileName: "palermo-overview.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Palermo%20Cathedral%20BW%202012-10-09%2011-24-16.jpg?width=1600" },
  { dir: "sicily-day13-15", fileName: "western-sicily-overview.jpg", directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Erice%20Sicily%20panorama.jpg?width=1600" },
  { dir: "sicily-day3-6", fileName: "aci-trezza-harbour.jpg", query: ["File:Aci Trezza Harbour", "Aci Trezza harbour"] },
  { dir: "sicily-day3-6", fileName: "aci-trezza-lungomare.jpg", query: ["Aci Trezza lungomare", "Aci Trezza coast"] },
  { dir: "sicily-day3-6", fileName: "aci-trezza-faraglioni.jpg", query: ["File:Faraglioni di Aci Trezza", "Faraglioni Aci Trezza"] },
  { dir: "sicily-day3-6", fileName: "riviera-dei-ciclopi.jpg", query: ["File:Ciclopi.JPG", "Riviera dei Ciclopi"] },
  { dir: "sicily-day5", fileName: "roman-amphitheatre-syracuse.jpg", query: ["Roman amphitheatre Syracuse", "File:Roman amphitheater Syracuse"] },
  { dir: "sicily-day5", fileName: "temple-of-apollo-ortigia.jpg", query: ["Temple of Apollo Syracuse Ortigia", "File:Temple of Apollo Syracuse"] },
  { dir: "sicily-day5", fileName: "mercato-ortigia.jpg", query: ["Ortigia market Syracuse", "Market in Ortigia Syracuse"] },
  { dir: "sicily-day5", fileName: "bagno-ebraico-syracuse.jpg", query: ["Mikveh Syracuse Sicily", "Bagno Ebraico Syracuse"] },
  { dir: "sicily-day5", fileName: "lungomare-alfeo-ortigia.jpg", query: ["Lungomare Alfeo Ortigia", "Ortigia lungomare alfeo"] },
  { dir: "sicily-day5", fileName: "palazzo-nicolaci.jpg", query: ["Via Nicolaci Noto", "Palazzo Nicolaci Noto"] },
  { dir: "sicily-day6", fileName: "duomo-san-giorgio-ragusa.jpg", query: ["Duomo San Giorgio Ragusa Ibla", "San Giorgio Ragusa Ibla"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Duomo%20San%20Giorgio%20Ragusa%20Ibla.jpg?width=1600" },
  { dir: "sicily-day6", fileName: "chiesa-san-pietro-modica.jpg", query: ["Chiesa San Pietro Modica", "San Pietro Modica"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/San%20Pietro%20%28Modica%29%2008%2012%202019%2030.jpg?width=1600" },
  { dir: "sicily-day6", fileName: "antica-dolceria-bonajuto.jpg", query: ["Antica Dolceria Bonajuto Modica", "Modica Bonajuto"] },
  { dir: "sicily-day7-9", fileName: "st-georges-basilica-gozo.jpg", query: ["St George's Basilica Victoria Gozo", "St George Basilica Gozo"] },
  { dir: "sicily-day7-9", fileName: "tal-mixta-cave.jpg", query: ["Tal Mixta Cave Gozo", "View over Ramla Bay from Tal Mixta"] },
  { dir: "sicily-day7-9", fileName: "ta-pinu-basilica-gozo.jpg", query: ["Ta Pinu Basilica Gozo", "Basilica Ta Pinu Gozo"] },
  { dir: "sicily-day7-9", fileName: "dwejra-bay-gozo.jpg", query: ["Dwejra Bay Gozo", "Dwejra Gozo"] },
  { dir: "sicily-day7-9", fileName: "dingli-cliffs.jpg", query: ["Dingli Cliffs Malta", "View of Dingli Cliffs"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/View%20of%20Dingli%20Cliffs.jpg?width=1600" },
  { dir: "sicily-day10-12", fileName: "temple-of-olympian-zeus-agrigento.jpg", query: ["Temple of Olympian Zeus Agrigento", "Zeus temple Agrigento"] },
  { dir: "sicily-day10-12", fileName: "temple-of-castor-pollux-agrigento.jpg", query: ["Temple of Castor and Pollux Agrigento", "Dioscuri temple Agrigento"] },
  { dir: "sicily-day10-12", fileName: "giardino-kolymbethra.jpg", query: ["Giardino della Kolymbethra Agrigento", "Kolymbethra Agrigento"] },
  { dir: "sicily-day10-12", fileName: "cattedrale-san-gerlando.jpg", query: ["Cattedrale San Gerlando Agrigento", "Cathedral San Gerlando Agrigento"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Agrigento%20-%20Cattedrale%20di%20San%20Gerlando%20-%202023-09-01%2016-56-45%20004.JPG?width=1600" },
  { dir: "sicily-day10-12", fileName: "saline-trapani.jpg", query: ["Saline di Trapani e Paceco", "Trapani salt pans windmill"] },
  { dir: "sicily-day10-12", fileName: "museo-del-sale-trapani.jpg", query: ["Museo del Sale Nubia Trapani", "Saline di Trapani Museo del Sale"] },
  { dir: "sicily-day13-15", fileName: "monastero-santa-caterina-palermo.jpg", query: ["Monastero Santa Caterina Palermo", "Santa Caterina Palermo monastery"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Monastero%20di%20Santa%20Caterina%2C%20palermo.jpg?width=1600" },
  { dir: "sicily-day13-15", fileName: "teatro-massimo-palermo.jpg", query: ["Teatro Massimo Palermo", "File:Teatro Massimo Palermo"] },
  { dir: "sicily-day13-15", fileName: "lavatoio-medievale-cefalu.jpg", query: ["Lavatoio medievale Cefalu", "Medieval Lavatoio Cefalu"] },
  { dir: "sicily-day13-15", fileName: "cefalu-beach.jpg", query: ["Cefalu beach Sicily", "Cefalu beach La Rocca"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Cefalu_beach_1999.jpg?width=1600" },
  { dir: "sicily-day13-15", fileName: "marina-grande-scilla.jpg", query: ["Marina Grande Scilla", "Scilla Marina Grande beach"] },
  { dir: "sicily-day16-19", fileName: "tartufo-di-pizzo.jpg", query: ["Tartufo di Pizzo", "Pizzo tartufo gelato"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Tartufo%20di%20Pizzo.jpg?width=1600" },
  { dir: "sicily-day16-19", fileName: "amalfi-piazza-duomo.jpg", query: ["Piazza Duomo Amalfi Cathedral", "Amalfi Piazza del Duomo"] },
  { dir: "sicily-day16-19", fileName: "amalfi-cathedral.jpg", query: ["Amalfi Cathedral", "Duomo di Amalfi"] },
  { dir: "sicily-day16-19", fileName: "amalfi-lemons.jpg", query: ["Amalfi lemons", "Lemons in Amalfi"], directUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Lemon%20orchard%20Amalfi.jpg?width=1600" },
  { dir: "sicily-day16-19", fileName: "house-of-the-faun-pompeii.jpg", query: ["House of the Faun Pompeii", "Casa del Fauno Pompeii"] },
  { dir: "sicily-day16-19", fileName: "lupanar-pompeii.jpg", query: ["Lupanar Pompeii", "Pompeii Lupanar"] }
];

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, label) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`${label} failed ${response.status}`);
      if (response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }

    await wait(10_000 * (attempt + 1));
  }

  throw lastError;
}

async function commonsSearch(query) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "10");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "1600");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const response = await fetchWithRetry(url, {
    headers: { "User-Agent": "trip-portal-daily-static-assets/1.0" },
    signal: AbortSignal.timeout(25_000)
  }, "Commons search");

  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});
  const page = pages.find((item) => {
    const info = item.imageinfo?.[0];
    return info?.thumburl && ["image/jpeg", "image/png", "image/webp"].includes(info.mime);
  });

  if (!page) throw new Error(`No usable image for ${query}`);
  const info = page.imageinfo[0];
  return {
    title: page.title,
    url: info.thumburl,
    originalUrl: info.url,
    mime: info.mime,
    artist: info.extmetadata?.Artist?.value,
    license: info.extmetadata?.LicenseShortName?.value,
    credit: info.extmetadata?.Credit?.value
  };
}

async function download(url, filePath) {
  const response = await fetchWithRetry(url, {
    headers: { "User-Agent": "trip-portal-daily-static-assets/1.0" },
    signal: AbortSignal.timeout(35_000)
  }, "Download");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 20_000) throw new Error(`Downloaded image too small: ${buffer.length}`);
  await writeFile(filePath, buffer);
  return buffer.length;
}

async function runJob(job) {
  const folder = `public/travel-photos/${job.dir}`;
  const filePath = `${folder}/${job.fileName}`;
  try {
    const existing = await stat(filePath);
    if (existing.size > 20_000) {
      return {
        ...job,
        path: `/travel-photos/${job.dir}/${job.fileName}`,
        length: existing.size,
        reused: true
      };
    }
  } catch {
    // Missing or too small files are regenerated below.
  }

  await mkdir(folder, { recursive: true });
  if (job.directUrl) {
    const length = await download(job.directUrl, filePath);
    return {
      ...job,
      path: `/travel-photos/${job.dir}/${job.fileName}`,
      length,
      direct: true
    };
  }

  const queries = Array.isArray(job.query) ? job.query : [job.query];
  let source;
  let lastError;
  for (const query of queries) {
    try {
      source = await commonsSearch(query);
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!source) throw lastError;

  const length = await download(source.url, filePath);

  return {
    ...job,
    ...source,
    path: `/travel-photos/${job.dir}/${job.fileName}`,
    length
  };
}

await mkdir("data/generated", { recursive: true });

const sources = [];
const failures = [];
for (const job of jobs) {
  try {
    sources.push(await runJob(job));
  } catch (error) {
    failures.push({ ...job, error: String(error instanceof Error ? error.message : error) });
  }
  await wait(5000);
}

await writeFile(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), sources, failures }, null, 2)}\n`);
console.log(JSON.stringify({ images: sources.length, failures: failures.length, output }, null, 2));
