import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protect admin-branch dashboard
  if (path.startsWith('/admin-branch/dashboard') && !request.cookies.get('admin_branch_token')) {
    return NextResponse.redirect(new URL('/admin-branch', request.url));
  }
  
  // Protect reseller-dealer dashboard
  if (path.startsWith('/reseller-dealer/dashboard') && !request.cookies.get('reseller_token')) {
    return NextResponse.redirect(new URL('/reseller-dealer', request.url));
  }
  
  // Protect field-agent dashboard
  if (path.startsWith('/field-agent/dashboard') && !request.cookies.get('field_agent_token')) {
    return NextResponse.redirect(new URL('/field-agent', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-branch/:path*', '/reseller-dealer/:path*', '/field-agent/:path*'],
};