import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/\/+$/, "") || "http://localhost:8000"

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 })
  }

  const response = await fetch(`${API_URL}/api/vehicle/inspection/history`, {
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
