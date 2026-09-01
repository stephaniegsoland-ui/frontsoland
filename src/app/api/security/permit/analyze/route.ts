import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 })

  const contentType = request.headers.get("content-type") || undefined
  const body = await request.arrayBuffer()
  const response = await fetch("http://localhost:8000/api/security/permit/analyze", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, ...(contentType ? { "content-type": contentType } : {}) },
    body,
  })
  const text = await response.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: response.status })
  } catch {
    return new NextResponse(text, { status: response.status })
  }
}
