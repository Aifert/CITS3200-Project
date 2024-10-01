import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
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
    '/api/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/channel-listening/:path*',
    '/api/auth/:path*',
    '/sdr_api/:path*'
  ],
};
