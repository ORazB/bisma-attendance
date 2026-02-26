import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Role } from './generated/prisma';

const isPublicRoute = createRouteMatcher(['/login', '/register', '/api/auth/(.*)']); 
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  const role = (sessionClaims as { role?: string })?.role;
  console.log(role);

  if (userId && isAdminRoute(req)) {
    if (!sessionClaims || role !== Role.ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};