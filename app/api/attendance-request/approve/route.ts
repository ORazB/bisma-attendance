import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const actingUser = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (!actingUser || actingUser.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const attendanceRequest = await prisma.attendanceRequest.findUnique({
    where: { id: Number(id) }
  });

  if (!attendanceRequest) {
    return NextResponse.json({ message: "Attendance request not found" }, { status: 404 });
  }

  const { requestType, attendanceId, studentId, requestedDate, requestedEventType } = attendanceRequest;

  try {
    let attendance;

    if (requestType === "CREATE") {
      attendance = await prisma.attendance.create({
        data: {
          userId: studentId,
          date: requestedDate,
          status: requestedEventType,
        }
      });

    } else if (requestType === "UPDATE") {
      if (!attendanceId) {
        return NextResponse.json({ message: "Missing attendanceId for UPDATE" }, { status: 400 });
      }

      attendance = await prisma.attendance.update({
        where: { id: attendanceId },
        data: { status: requestedEventType }
      });

    } else if (requestType === "DELETE") {
      if (!attendanceId) {
        return NextResponse.json({ message: "Missing attendanceId for DELETE" }, { status: 400 });
      }

      attendance = await prisma.attendance.delete({
        where: { id: attendanceId }
      });

    } else {
      return NextResponse.json({ message: "Invalid request type" }, { status: 400 });
    }

    // Remove the request after processing
    await prisma.attendanceRequest.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json(
      { message: `Attendance request (${requestType}) approved`, attendance },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error processing attendance request:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}