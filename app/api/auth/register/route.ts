import { NextRequest, NextResponse } from "next/server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { email, username, password } = body;
  const client = await clerkClient();

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 400 },
      );
    }

    let clerkUser;
    try {
      clerkUser = await client.users.createUser({
        emailAddress: [email],
        password: password,
        username: username,
      });
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: error.status },
        );
      }
      return NextResponse.json(
        { message: "Failed to create user in Clerk" },
        { status: 500 },
      );
    }

    try {
      await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: email,
          name: username,
          role: "USER",
        },
      });
    } catch {
      // Rollback Clerk user creation
      await client.users.deleteUser(clerkUser.id);

      return NextResponse.json(
        { message: "Failed to create user in database." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "User registered successfully." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
