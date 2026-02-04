import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { AttendanceStatus } from "@/app/generated/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
  })

  if (!actingUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (actingUser.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const attendanceRequest = await prisma.attendanceRequest.delete({
    where: { id: Number(id) }
  });

  const newAttendance = await prisma.attendance.create({
    data: {
      userId: attendanceRequest.studentId,
      date: attendanceRequest.requestedDate,
      status: attendanceRequest.requestedEventType,
    }
  })

  if (newAttendance) {
    console.log("Attendance record created successfully:", newAttendance);
  }


  if (!attendanceRequest) {
    return NextResponse.json({ message: "Attendance request not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Attendance request approved", deletedAttendanceRequest: attendanceRequest }, { status: 200 });
}