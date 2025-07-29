// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const maintenancePage = new URL('/maintenance', request.url);
  return NextResponse.redirect(maintenancePage);
}

// הפעל רק עבור הדומיין הראשי
export const config = {
  matcher: ['/', '/((?!_next|favicon.ico).*)'],
};
