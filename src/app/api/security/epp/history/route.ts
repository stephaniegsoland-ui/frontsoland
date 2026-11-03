import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

const API_URL =
  getBackendUrl()

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get("access_token")?.value
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const token = cookieToken || headerToken

  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_URL}/api/security/epp/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const responseBody = await response.text()
    const responseHeaders = new Headers(response.headers)

    if (response.headers.get("content-type")?.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(responseBody), {
          status: response.status,
          headers: responseHeaders,
        })
      } catch {
        return new NextResponse(responseBody, {
          status: response.status,
          headers: responseHeaders,
        })
      }
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("EPP history proxy failed:", error)
    return NextResponse.json(
      { detail: "No se pudo conectar con el backend. Revisa BACKEND_URL o el estado del servidor." },
      { status: 502 },
    )
  }
}
