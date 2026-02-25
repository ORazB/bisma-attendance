import { NextRequest, NextResponse } from "next/server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

import prisma from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

import { z } from "zod";


const registerSchema = z.object({
  email: z.email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const { email, username, password } = parsed.data;

  const client = await clerkClient();
  const defaultRole = Role.USER;

  let clerkUser;

  try {
    clerkUser = await client.users.createUser({
      emailAddress: [email],
      password: password,
      username: username,

      publicMetadata: {
        role: defaultRole,
      },
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
        role: defaultRole,
      },
    });
  } catch (error) {
    // Rollback Clerk user creation if DB write fails.
    try {
      await client.users.deleteUser(clerkUser.id);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        return NextResponse.json(
          { message: err.errors[0].message },
          { status: err.status },
        );
      }
      return NextResponse.json(
        { message: "Failed to delete user in Clerk after DB fail" },
        { status: 500 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Failed to create user in database." },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { message: "User registered successfully." },
    { status: 201 },
  );
}
