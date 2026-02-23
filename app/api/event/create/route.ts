import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceId, requestType, date, eventType, reason } = body;
    
    console.log(requestType);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Normalize date
    let normalizedDate: Date | null = null;
    if (date) {
      const parsedDate = new Date(date);
      normalizedDate = new Date(Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
        0, 0, 0, 0
      ));
    }

    const validStatuses = ['ON_TIME', 'ON_LEAVE', 'LATE', 'ABSENT'];
    if (eventType && !validStatuses.includes(eventType)) {
      return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
    }

    // ==============================
    // ===== ADMIN LOGIC ============
    // ==============================
    if (user.role === "ADMIN") {

      if (requestType === "CREATE") {
        const existingEvent = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId: user.id,
              date: normalizedDate!
            }
          }
        });

        if (existingEvent) {
          return NextResponse.json({ message: "Attendance already exists" }, { status: 400 });
        }

        const newEvent = await prisma.attendance.create({
          data: {
            userId: user.id,
            status: eventType,
            date: normalizedDate!
          }
        });

        return NextResponse.json({ message: "Attendance created", event: newEvent }, { status: 201 });
      }

      if (requestType === "UPDATE") {
        if (!attendanceId) {
          return NextResponse.json({ message: "Missing attendanceId" }, { status: 400 });
        }

        const updated = await prisma.attendance.update({
          where: { id: attendanceId },
          data: { status: eventType }
        });

        return NextResponse.json({ message: "Attendance updated", event: updated });
      }

      if (requestType === "DELETE") {
        if (!attendanceId) {
          return NextResponse.json({ message: "Missing attendanceId" }, { status: 400 });
        }

        await prisma.attendance.delete({
          where: { id: attendanceId }
        });

        return NextResponse.json({ message: "Attendance deleted" });
      }
    }

    // ==============================
    // ===== USER (STUDENT) LOGIC ===
    // ==============================
    if (user.role === "USER") {

      if (!normalizedDate) {
        return NextResponse.json({ message: "Date required" }, { status: 400 });
      }

      // Prevent duplicate pending request
      const existingRequest = await prisma.attendanceRequest.findFirst({
        where: {
          studentId: user.id,
          requestedDate: normalizedDate,
          status: "PENDING"
        }
      });

      if (existingRequest) {
        return NextResponse.json({
          message: "You already have a pending request for this date"
        }, { status: 400 });
      }

      // CREATE or UPDATE request
      if (requestType === "CREATE" || requestType === "UPDATE") {
        const newRequest = await prisma.attendanceRequest.create({
          data: {
            attendanceId: attendanceId ?? null,
            studentId: user.id,
            requestedEventType: eventType,
            requestType: requestType,
            requestedDate: normalizedDate,
            status: "PENDING",
            reason: reason || ""
          }
        });

        return NextResponse.json({
          message: "Request submitted successfully",
          request: newRequest
        }, { status: 201 });
      }

      // DELETE request
      if (requestType === "DELETE") {
        if (!attendanceId) {
          return NextResponse.json({ message: "Missing attendanceId" }, { status: 400 });
        }

        const deleteRequest = await prisma.attendanceRequest.create({
          data: {
            attendanceId,
            studentId: user.id,
            requestedEventType: eventType,
            requestType: requestType,
            requestedDate: normalizedDate,
            status: "PENDING",
            reason: reason || "Delete request"
          }
        });

        return NextResponse.json({
          message: "Delete request submitted",
          request: deleteRequest
        }, { status: 201 });
      }
    }

    return NextResponse.json({ message: "Invalid role" }, { status: 400 });

  } catch (error) {
    console.error("Error handling attendance:", error);
    return NextResponse.json({
      message: "Internal Server Error"
    }, { status: 500 });
  }
}
