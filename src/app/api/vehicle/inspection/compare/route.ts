import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

const API_URL =
  getBackendUrl()

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value

  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 })
  }

  const contentType = req.headers.get("content-type") ?? undefined
  const body = await req.arrayBuffer()

  try {
    const response = await fetch(`${API_URL}/api/vehicle/inspection/compare`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(contentType ? { "content-type": contentType } : {}),
      },
      body,
    })

  const responseHeaders = Object.fromEntries(response.headers.entries())
  delete responseHeaders["content-length"]
  const responseBody = await response.text()
  const responseContentType = response.headers.get("content-type") ?? ""

  if (responseContentType.includes("application/json")) {
    try {
      const parsedBody = JSON.parse(responseBody)
      return NextResponse.json(parsedBody, {
        status: response.status,
        headers: responseHeaders,
      })
    } catch (e) {
      return new Response(responseBody, {
        status: response.status,
        headers: responseHeaders,
      })
    }
  }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Vehicle inspection compare proxy failed:", error)
    return NextResponse.json(
      { detail: "No se pudo conectar con el backend de inspección. Revisa BACKEND_URL o el estado del servidor." },
      { status: 502 },
    )
  }
}
