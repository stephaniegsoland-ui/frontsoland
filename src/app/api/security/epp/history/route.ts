import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get("access_token")?.value
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const token = cookieToken || headerToken

  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 })
  }

  const response = await fetch("http://localhost:8000/api/security/epp/history", {
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
}
