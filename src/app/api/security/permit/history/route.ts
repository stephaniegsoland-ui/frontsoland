import { NextRequest, NextResponse } from "next/server"

const API_URL =
  process.env.BACKEND_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000"

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 })

  try {
    const response = await fetch(`${API_URL}/api/security/permit/history`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    })
    const text = await response.text()
    try {
      return NextResponse.json(JSON.parse(text), { status: response.status })
    } catch {
      return new NextResponse(text, { status: response.status })
    }
  } catch (error) {
    console.error("Permit history proxy failed:", error)
    return NextResponse.json(
      { detail: "No se pudo conectar con el backend. Revisa BACKEND_URL o el estado del servidor." },
      { status: 502 },
    )
  }
}
