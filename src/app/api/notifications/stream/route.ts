import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/\/+$/, "") || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 });
  }

  const backendUrl = `${API_URL}/api/notifications/stream`;
  const response = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Cache-Control", "no-cache");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
