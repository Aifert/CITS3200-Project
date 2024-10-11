import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api_v2/')) {
    if (token) {
      return NextResponse.next();
    } else {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (!token) {
    const loginUrl = new URL('/login', req.url);

    loginUrl.searchParams.set('requestedUrl', encodeURIComponent(pathname));

    console.log(`Redirecting to login. RequestedUrl:`, loginUrl.searchParams.get('requestedUrl'));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/api_v2/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/channel-listening/:path*',
    '/api-key/:path*',
    '/api/auth/:path*',
  ],
};
