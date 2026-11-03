import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

const configuredBackendUrl = getBackendUrl();
const API_URL = process.env.NODE_ENV === "development"
  ? configuredBackendUrl.replace(/^http:\/\/localhost(?=:|$)/i, "http://127.0.0.1")
  : configuredBackendUrl;

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyDocumentRequest(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 });

  const { path = [] } = await context.params;
  const url = `${API_URL}/api/documents${path.length ? `/${path.map(encodeURIComponent).join("/")}` : ""}`;
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const header of ["content-type", "content-disposition", "cache-control"]) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }
    const proxiedResponse = new NextResponse(response.body, { status: response.status, headers: responseHeaders });
    if (response.status === 401) proxiedResponse.cookies.delete("access_token");
    return proxiedResponse;
  } catch (error) {
    console.error("Document API proxy failed:", error);
    return NextResponse.json(
      { detail: "No se pudo conectar con el backend. Revisa BACKEND_URL o el estado del servidor." },
      { status: 502 },
    );
  }
}

export const GET = proxyDocumentRequest;
export const POST = proxyDocumentRequest;
export const PATCH = proxyDocumentRequest;