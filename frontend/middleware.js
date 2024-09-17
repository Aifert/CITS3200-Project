import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  console.log('Middleware triggered for path:', req.nextUrl.pathname);

  // Get the token from the request to check if the user is authenticated
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If the user is not authenticated and tries to access a protected route, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login...');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Allow the request if the user is authenticated or if it's a public route
  return NextResponse.next();
}

// This config defines which routes the middleware should apply to
export const config = {
  matcher: ['/dashboard/:path*'],  // Apply to dashboard routes
};
