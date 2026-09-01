import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 });

  try {
    const response = await fetch(`${API_URL}/api/chat/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    console.error("Proxy /api/chat/users falló:", error);
    return NextResponse.json({ detail: "Backend no disponible." }, { status: 503 });
  }
}
