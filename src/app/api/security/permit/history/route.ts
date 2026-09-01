import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ detail: "No autorizado." }, { status: 401 })

  const response = await fetch("http://localhost:8000/api/security/permit/history", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  })
  const text = await response.text()
  try {
    return NextResponse.json(JSON.parse(text), { status: response.status })
  } catch {
    return new NextResponse(text, { status: response.status })
  }
}
