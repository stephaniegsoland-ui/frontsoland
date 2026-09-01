import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

async function proxy(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 });

  const path = req.nextUrl.pathname.replace(/^\/api\/chat/, "") || "/";
  const target = `${API_URL}/api/chat${path}${req.nextUrl.search}`;
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const response = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
  });
  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  });
}

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }