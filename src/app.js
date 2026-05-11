import { trips } from "./data.js";

const el = {
  q: document.getElementById("q"),
  city: document.getElementById("city"),
  year: document.getElementById("year"),
  reset: document.getElementById("reset"),
  upcomingGrid: document.getElementById("upcomingGrid"),
  archiveGrid: document.getElementById("archiveGrid"),
  upcomingCount: document.getElementById("upcomingCount"),
  archiveCount: document.getElementById("archiveCount"),
};

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
}

function buildSelect(selectEl, items, placeholder) {
  selectEl.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  selectEl.appendChild(ph);

  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = String(item);
    opt.textContent = String(item);
    selectEl.appendChild(opt);
  }
}

function imgFromSeed(seed) {
  // Deterministic, zero-dependency thumbnails.
  // If you later add your own images, replace this with file URLs.
  const url = new URL("https://picsum.photos/seed/x/1200/800");
  url.pathname = `/seed/${encodeURIComponent(seed)}/1200/800`;
  return url.toString();
}

function cardHtml(trip, { emphasize = false } = {}) {
  const archive = trip.status === "archive";
  const klass = ["card", archive ? "card--archive" : "card--upcoming"]
    .concat(emphasize ? [] : ["card--secondary"])
    .join(" ");

  const mediaUrl = imgFromSeed(trip.hero?.seed ?? trip.id);
  const cities = trip.cities?.length ? trip.cities.join(" · ") : "";

  return `
    <article class="${klass}" role="listitem" tabindex="0" aria-label="${escapeHtml(
      trip.title
    )}">
      <div class="card__media" style="--img:url('${mediaUrl}')" aria-hidden="true"></div>
      <div class="card__content">
        <div class="badgeRow">
          <div class="badge" aria-label="${
            archive ? "Archive trip" : "Upcoming trip"
          }">
            <span class="badge__dot" aria-hidden="true"></span>
            ${archive ? "ARCHIVE" : "UPCOMING"}
          </div>
          <div class="badge badge--year" aria-label="Year">${trip.year}</div>
        </div>

        <h3 class="card__title">${escapeHtml(trip.title)}</h3>
        <div class="meta" aria-label="Trip meta">
          <div class="meta__item">
            <span class="meta__pip" aria-hidden="true"></span>
            ${escapeHtml(trip.dateRange ?? "")}
          </div>
          <div class="meta__item">
            <span class="meta__pip" aria-hidden="true"></span>
            ${escapeHtml(cities)}
          </div>
        </div>

        <div class="hoverKeywords" aria-hidden="true">
          <div class="hoverKeywords__inner">
            ${(trip.keywords ?? []).map((k) => `<span class="kw">${escapeHtml(k)}</span>`).join("")}
          </div>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilters() {
  const q = (el.q.value ?? "").trim().toLowerCase();
  const city = el.city.value ?? "";
  const year = el.year.value ? Number(el.year.value) : null;
  return { q, city, year };
}

function matches(trip, { q, city, year }) {
  if (year != null && trip.year !== year) return false;
  if (city && !(trip.cities ?? []).includes(city)) return false;

  if (q) {
    const hay = [
      trip.title,
      trip.dateRange,
      ...(trip.cities ?? []),
      ...(trip.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

function render() {
  const filters = getFilters();
  const visible = trips.filter((t) => matches(t, filters));

  const upcoming = visible.filter((t) => t.status === "upcoming");
  const archive = visible.filter((t) => t.status === "archive");

  if (el.upcomingCount) el.upcomingCount.textContent = `${upcoming.length} trip(s)`;
  if (el.archiveCount) el.archiveCount.textContent = `${archive.length} trip(s)`;

  el.upcomingGrid.innerHTML = upcoming.length
    ? upcoming
        .map((t, idx) => cardHtml(t, { emphasize: idx === 0 }))
        .join("")
    : `<div class="empty">No upcoming trips match your filters.</div>`;

  el.archiveGrid.innerHTML = archive.length
    ? archive.map((t) => cardHtml(t)).join("")
    : `<div class="empty">No archive trips match your filters.</div>`;
}

function init() {
  const allCities = uniqueSorted(trips.flatMap((t) => t.cities ?? []));
  const years = uniqueSorted(trips.map((t) => t.year)).sort((a, b) => b - a);

  buildSelect(el.city, allCities, "All cities");
  buildSelect(el.year, years, "All years");

  el.q.addEventListener("input", render);
  el.city.addEventListener("change", render);
  el.year.addEventListener("change", render);
  el.reset.addEventListener("click", () => {
    el.q.value = "";
    el.city.value = "";
    el.year.value = "";
    render();
  });

  render();
}

init();

