import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.text();

  try {
    const response = await fetch(`${getBackendUrl()}/api/notifications/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      cache: "no-store",
    });
    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("No se pudo actualizar la notificación:", error);
    return NextResponse.json({ detail: "Backend no disponible." }, { status: 503 });
  }
}
