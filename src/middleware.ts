import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token) {
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/+$/, '');

    try {
      const response = await fetch(`${backendUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (response.status === 401 || response.status === 403) {
        const redirected = NextResponse.redirect(new URL('/', request.url));
        redirected.cookies.delete('access_token');
        return redirected;
      }

      if (response.ok && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};