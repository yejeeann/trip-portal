"use server";

const MCP_BASE_URL = process.env.TRAVEL_MCP_BASE_URL || "https://travelmcp.yejeelee.synology.me";
const MCP_SSE_URL = process.env.TRAVEL_MCP_SSE_URL || `${MCP_BASE_URL}/sse`;
const MCP_PROTOCOL_VERSION = "2024-11-05";
const MCP_TIMEOUT_MS = 45_000;

type McpContentItem = {
  type?: string;
  text?: string;
};

type McpJsonRpcResponse = {
  id?: string;
  error?: {
    message?: string;
    code?: number;
    data?: unknown;
  };
  result?: {
    content?: McpContentItem[];
    structuredContent?: unknown;
    isError?: boolean;
  };
};

type McpActionResult = {
  data?: unknown;
  error?: string;
};

type SseMessage = {
  event: string;
  data: string;
};

function findSseBoundary(buffer: string) {
  const crlfIndex = buffer.indexOf("\r\n\r\n");
  const lfIndex = buffer.indexOf("\n\n");

  if (crlfIndex === -1 && lfIndex === -1) return null;
  if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) {
    return { index: crlfIndex, length: 4 };
  }

  return { index: lfIndex, length: 2 };
}

function parseSseMessage(rawMessage: string): SseMessage | null {
  const lines = rawMessage.split(/\r?\n/);
  const dataLines: string[] = [];
  let event = "message";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (!dataLines.length) return null;
  return { event, data: dataLines.join("\n") };
}

function createSseReader(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return {
    async nextMessage(): Promise<SseMessage> {
      while (true) {
        const boundary = findSseBoundary(buffer);

        if (boundary) {
          const rawMessage = buffer.slice(0, boundary.index);
          buffer = buffer.slice(boundary.index + boundary.length);
          const message = parseSseMessage(rawMessage);
          if (message) return message;
          continue;
        }

        const { done, value } = await reader.read();
        if (done) {
          const message = parseSseMessage(buffer);
          if (message) return message;
          throw new Error("MCP SSE connection closed before a response was received.");
        }

        buffer += decoder.decode(value, { stream: true });
      }
    },
    close() {
      return reader.cancel().catch(() => undefined);
    }
  };
}

function resolveMcpUrl(urlOrPath: string) {
  return new URL(urlOrPath, `${MCP_BASE_URL}/`).toString();
}

async function postMcpMessage(
  messagesUrl: string,
  method: string,
  params: Record<string, unknown> | null,
  id: string | null,
  signal: AbortSignal
) {
  const payload: Record<string, unknown> = {
    jsonrpc: "2.0",
    method
  };

  if (id) payload.id = id;
  if (params) payload.params = params;

  const response = await fetch(messagesUrl, {
    method: "POST",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`MCP message POST failed: HTTP ${response.status}`);
  }
}

async function readJsonRpcResponse(
  sseReader: ReturnType<typeof createSseReader>,
  expectedId: string
): Promise<McpJsonRpcResponse> {
  while (true) {
    const message = await sseReader.nextMessage();

    if (message.event !== "message") continue;

    try {
      const parsed = JSON.parse(message.data) as McpJsonRpcResponse;
      if (parsed.id === expectedId) return parsed;
    } catch {
      continue;
    }
  }
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") return value;

  const cleaned = value.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  if (!cleaned) return value;

  try {
    return JSON.parse(cleaned);
  } catch {
    return value;
  }
}

function extractToolResult(response: McpJsonRpcResponse): McpActionResult {
  if (response.error) {
    return { error: response.error.message || JSON.stringify(response.error) };
  }

  const textContent = response.result?.content?.find((item) => typeof item.text === "string")?.text;

  if (response.result?.isError) {
    return { error: textContent || "MCP tool returned an error." };
  }

  const structuredContent = response.result?.structuredContent;

  if (
    structuredContent &&
    typeof structuredContent === "object" &&
    "result" in structuredContent
  ) {
    return { data: parseMaybeJson((structuredContent as { result: unknown }).result) };
  }

  if (typeof textContent === "string") {
    return { data: parseMaybeJson(textContent) };
  }

  if (structuredContent !== undefined) {
    return { data: structuredContent };
  }

  return { error: "MCP tool returned an empty response." };
}

async function callMcpTool(name: string, argumentsObj: Record<string, unknown>): Promise<McpActionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);
  let sseReader: ReturnType<typeof createSseReader> | null = null;

  try {
    const sseResponse = await fetch(MCP_SSE_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream"
      }
    });

    if (!sseResponse.ok || !sseResponse.body) {
      return { error: `MCP SSE 연결 실패: HTTP ${sseResponse.status}` };
    }

    sseReader = createSseReader(sseResponse.body);
    const endpointMessage = await sseReader.nextMessage();
    const messagesUrl = resolveMcpUrl(endpointMessage.data);
    const initId = `mcp-init-${Date.now()}`;
    const callId = `mcp-${name}-${Date.now()}`;

    await postMcpMessage(
      messagesUrl,
      "initialize",
      {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "trip-portal", version: "1.0.0" }
      },
      initId,
      controller.signal
    );
    await readJsonRpcResponse(sseReader, initId);

    await postMcpMessage(messagesUrl, "notifications/initialized", null, null, controller.signal);

    await postMcpMessage(
      messagesUrl,
      "tools/call",
      {
        name,
        arguments: argumentsObj
      },
      callId,
      controller.signal
    );

    const response = await readJsonRpcResponse(sseReader, callId);
    return extractToolResult(response);
  } catch (error) {
    console.error("Server Action MCP Error:", error);
    return {
      error:
        error instanceof Error && error.name === "AbortError"
          ? "MCP 서버 응답 시간이 초과되었습니다."
          : error instanceof Error
            ? error.message
            : "네트워크 연결을 확인하세요."
    };
  } finally {
    clearTimeout(timeout);
    await sseReader?.close();
  }
}

function getPlaceName(stop: unknown): string | null {
  if (typeof stop === "string") return stop.trim() || null;
  if (!stop || typeof stop !== "object") return null;

  const maybeStop = stop as { name?: unknown; title?: unknown; label?: unknown };
  const value = maybeStop.name || maybeStop.title || maybeStop.label;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPlaceNames(stops: unknown[]) {
  return stops.map(getPlaceName).filter((name): name is string => Boolean(name));
}

function extractMapUrl(value: unknown) {
  if (typeof value !== "string") return null;
  return value.match(/https?:\/\/\S+/)?.[0] || null;
}

export async function planTripAction(request: any) {
  return callMcpTool("plan_trip", {
    cities: Array.isArray(request?.cities) ? request.cities : [],
    start_date: request?.start_date || request?.startDate || "",
    end_date: request?.end_date || request?.endDate || ""
  });
}

export async function optimizeRouteAction(_city: string, stops: any[]) {
  return callMcpTool("optimize_daily_route", {
    locations: getPlaceNames(stops)
  });
}

export async function getWikiAction(_city: string, attraction_name: string) {
  return callMcpTool("get_attraction_wiki", {
    attraction_name: attraction_name.trim()
  });
}

export async function generateMapLinkAction(_city: string, stops: any[], _travel_mode: string = "walking") {
  const result = await callMcpTool("generate_map_links", {
    route: getPlaceNames(stops)
  });

  if (result.error) return result;

  const mapUrl = extractMapUrl(result.data);
  if (!mapUrl) return result;

  return {
    data: {
      map_url: mapUrl,
      result: result.data
    }
  };
}
