import prisma from "@/lib/prisma";

import { Role } from "@/generated/prisma";
import { auth } from "@clerk/nextjs/server";

import { NextResponse, NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  const { id } = await params;

  console.log(id);

  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gradeId, majorId } = await request.json();

  const actingUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!actingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (actingUser.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  // console.log("clerkId from auth:", userId);
  // console.log("actingUser found:", actingUser);
  // console.log("gradeId:", gradeId);
  // console.log("majorId:", majorId);
  try {
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        gradeId: gradeId,
        majorId: majorId,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { message: "User updated successfully" },
    { status: 200 },
  );
}
