# Trip Portal Next.js App

This folder now contains a Next.js 14 App Router implementation alongside the original static `index.html`.

## Run

```bash
npm install
npm run dev
```

## Stitch MCP

Server-side Stitch MCP configuration is read from environment variables:

```bash
STITCH_MCP_URL=https://stitch.googleapis.com/mcp
STITCH_MCP_API_KEY=your-key
STITCH_TRAVEL_TOOL=travel_context
```

The browser calls `/api/travel`; the API route calls Stitch MCP on the server and falls back to curated local itinerary data when MCP travel context is unavailable.
