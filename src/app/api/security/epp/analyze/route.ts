import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const cookieToken = req.cookies.get("access_token")?.value
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const token = cookieToken || headerToken

  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 })
  }

  const contentType = req.headers.get("content-type") || undefined
  const body = await req.arrayBuffer()

  const response = await fetch("http://localhost:8000/api/security/epp/analyze", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { "content-type": contentType } : {}),
    },
    body,
  })

  const responseHeaders = new Headers(response.headers)
  const responseBody = await response.text()

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
