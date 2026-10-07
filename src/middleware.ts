import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/** Protects the admin (ADMIN role) and customer account area (any signed-in user). */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    if (pathname.startsWith('/admin') && req.nextauth.token?.role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/account/login';
      url.search = `?callbackUrl=${encodeURIComponent(pathname)}&error=admin`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith('/account/login') || pathname.startsWith('/account/register')) return true;
        return !!token;
      },
    },
    pages: { signIn: '/account/login' },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
