import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from './lib/prisma';

import { Role } from './app/generated/prisma';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPublicRoute = createRouteMatcher(['/register', '/login', '/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isPublicRoute(req)) return NextResponse.next();
  
  if (!userId) return NextResponse.redirect(new URL('/register', req.url));

  const user = await prisma.user.findUnique({
    where: {clerkId: userId}
  })
  
  if (!user) {
    return NextResponse.redirect(new URL('/register', req.url));
  }
  
  if (isAdminRoute(req)) {
    if (user.role !== Role.ADMIN) {
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