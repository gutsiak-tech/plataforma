export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const API_URL_LEGACY = (import.meta.env.VITE_API_URL ?? "").trim();
const API_BASE = API_BASE_URL || API_URL_LEGACY || "http://localhost:8000";

if (import.meta.env.DEV && API_BASE_URL && API_URL_LEGACY && API_BASE_URL !== API_URL_LEGACY) {
  // Operational warning only: avoid ambiguous API target during setup.
  console.warn(
    `[env] VITE_API_BASE_URL (${API_BASE_URL}) and VITE_API_URL (${API_URL_LEGACY}) differ; using VITE_API_BASE_URL.`
  );
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, ...init } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const raw = await response.text();
    const data = raw ? safeJsonParse(raw) : null;

    if (!response.ok) {
      const message = extractErrorMessage(data) ?? `HTTP ${response.status}`;
      throw new ApiError(message, response.status, "HTTP_ERROR", data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timeout reached", 408, "TIMEOUT");
    }
    throw new ApiError(error instanceof Error ? error.message : "Unexpected request error", 0, "NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError("Failed to parse server JSON response", 500, "INVALID_JSON", value);
  }
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if ("message" in data && typeof (data as { message?: unknown }).message === "string") {
    return (data as { message: string }).message;
  }
  if ("detail" in data && typeof (data as { detail?: unknown }).detail === "string") {
    return (data as { detail: string }).detail;
  }
  return null;
}

export { API_BASE };
