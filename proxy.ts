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

  if (isPublicRoute(req)) return NextResponse.next();

  // if (!userId) return NextResponse.redirect(new URL('/login', req.url));

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (isAdminRoute(req)) {
    if (user?.role !== Role.ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
});
