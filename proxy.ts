import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from './lib/prisma';
import { Role } from './app/generated/prisma';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPublicRoute = createRouteMatcher(['/register', '/login', '/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // if (userId && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
  //   return NextResponse.redirect(new URL('/', req.url));
  // }

  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (userId && isAdminRoute(req)) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    if (user?.role !== Role.ADMIN) {
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