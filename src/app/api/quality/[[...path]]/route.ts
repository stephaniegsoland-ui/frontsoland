import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyQualityRequest(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 });

  const { path = [] } = await context.params;
  const backendPath = path.length ? `/${path.map(encodeURIComponent).join("/")}` : "";
  const url = `${getBackendUrl()}/api/quality${backendPath}${request.nextUrl.search}`;
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) responseHeaders.set("Content-Type", responseType);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    console.error("Quality API proxy failed:", error);
    return NextResponse.json({ detail: "No se pudo conectar con el módulo de calidad." }, { status: 502 });
  }
}

export const GET = proxyQualityRequest;
export const POST = proxyQualityRequest;
export const PATCH = proxyQualityRequest;
