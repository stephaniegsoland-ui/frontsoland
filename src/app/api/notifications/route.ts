import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/\/+$/, "") || "http://localhost:8000";

async function proxyNotifications(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 });
  }

  const url = `${API_URL}/api/notifications${req.nextUrl.search}`;
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const response = await fetch(url, init);
  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers(response.headers);

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest) {
  return proxyNotifications(req);
}

export async function POST(req: NextRequest) {
  return proxyNotifications(req);
}

export async function PUT(req: NextRequest) {
  return proxyNotifications(req);
}

export async function DELETE(req: NextRequest) {
  return proxyNotifications(req);
}
