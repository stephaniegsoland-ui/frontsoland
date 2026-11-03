export function normalizeBackendUrl(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "") || undefined;
}

export function getBackendUrl() {
  const backendUrl = (
    normalizeBackendUrl(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeBackendUrl(process.env.BACKEND_URL) ||
    (process.env.NODE_ENV === "production" ? "https://api.soland.com" : "http://localhost:8000")
  );

  if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
    return backendUrl.replace(/^http:\/\/localhost(?=:|$)/i, "http://127.0.0.1");
  }

  return backendUrl;
}

export function getApiUrl(path: string) {
  const base = getBackendUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${base}/`).toString().replace(/\/$/, "");
}

export const BACKEND_URL = getBackendUrl();
