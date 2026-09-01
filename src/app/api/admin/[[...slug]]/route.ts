import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export async function GET(req: NextRequest) {
  return proxyRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req, "PUT");
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, "PATCH");
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req, "DELETE");
}

async function proxyRequest(req: NextRequest, method: string) {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "No autorizado." }, { status: 401 });
  }

  const params = req.nextUrl.search;
  const slug = req.nextUrl.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/+$/, "");
  const targetPath = slug ? `/api/admin/${slug}` : "/api/admin";
  const targetUrl = `${API_URL}${targetPath}${params}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseBody = await response.arrayBuffer();
    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-length") return;
      proxyResponse.headers.set(key, value);
    });

    return proxyResponse;
  } catch (error) {
    console.error("Proxy /api/admin falló:", error);
    return NextResponse.json({ detail: "Backend no disponible." }, { status: 503 });
  }
}