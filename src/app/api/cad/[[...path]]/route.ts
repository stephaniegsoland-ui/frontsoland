import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyCADRequest(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 });

  const { path = [] } = await context.params;
  const backendPath = path.length ? `/${path.map(encodeURIComponent).join("/")}` : "";
  const url = `${getBackendUrl()}/api/cad${backendPath}${request.nextUrl.search}`;
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
    for (const header of ["content-type", "content-disposition"]) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    console.error("CAD API proxy failed:", error);
    return NextResponse.json({ detail: "No se pudo conectar con el repositorio CAD." }, { status: 502 });
  }
}

export const GET = proxyCADRequest;
export const POST = proxyCADRequest;
export const DELETE = proxyCADRequest;
