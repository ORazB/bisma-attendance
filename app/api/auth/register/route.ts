import { NextRequest, NextResponse} from "next/server";

import { clerkClient } from "@clerk/nextjs/server";
import { ClerkAPIResponseError } from "@clerk/types";

import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {email, username, password} = body;
  const client = await clerkClient();

  // Check if the error is from Clerk
  function isClerkError(err: unknown): err is ClerkAPIResponseError {
    return (
      typeof err === "object" &&
      err !== null &&
      "errors" in err &&
      Array.isArray((err as any).errors) &&
      typeof (err as any).status === "number"
    );
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists."}, { status: 400});
    }

    const clerkUser = await client.users.createUser({
      emailAddress: [email],
      password: password,
      username: username
    });

    if (!clerkUser) {
      return NextResponse.json({message: "Failed to create user in clerk."}, { status: 500 })
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        name: username,
        role: "USER"
      }
    })

    if (!newUser) {
      // Rollback Clerk user creation
      await client.users.deleteUser(clerkUser.id);
      
      return NextResponse.json({ message: "Failed to create user in database."}, { status: 500 });

    }

    return NextResponse.json({ message: "User registered successfully."}, { status: 201 });

  } catch (error) {
    if (isClerkError(error)) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: error.status }
      );
    }
  
    // If the error is not from Clerk we can safely return a generic error message
    return NextResponse.json(
      { message: "Internal server error"},
      { status: 500 }
    );
  }

}