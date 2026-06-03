import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/dashboard') && token) {
    try {
      const response = await fetch("http://localhost:8000/api/users/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        const nextResponse = NextResponse.redirect(new URL('/', request.url));
        nextResponse.cookies.delete('access_token');
        return nextResponse;
      }
    } catch (error) {
      console.error("FastAPI inalcanzable en middleware:", error);
    }
  }

  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};