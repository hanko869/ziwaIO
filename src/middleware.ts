import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/payment/webhook', '/api/test-db', '/api/debug-user', '/api/test-tables', '/test'];

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /login, /admin)
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = publicRoutes.includes(path);

  // Get the token from the cookies
  const token = request.cookies.get('auth-token')?.value || '';

  // Redirect logic
  if (!isPublicPath && !token) {
    // If trying to access a protected route without a token, redirect to login
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (isPublicPath && token && path === '/login') {
    // If trying to access login page with a token, redirect to home
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // For API routes, return 401 if not authenticated
  if (path.startsWith('/api') && !isPublicPath && !token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 