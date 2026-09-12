import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.text();
    const response = await fetch(`${API_URL}/api/assistant/ask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const text = await response.text();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "application/json");

    return new NextResponse(text, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Assistant API proxy error:", error);
    return NextResponse.json({ detail: "No se pudo contactar con la IA del sistema." }, { status: 502 });
  }
}
