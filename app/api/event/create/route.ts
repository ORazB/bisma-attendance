import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    console.log("Received request to create event");
    const body = await request.json();
    const { date, eventType, reason } = body;

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

    // Validate enum value
    const validStatuses = ['ON_TIME', 'ON_LEAVE', 'LATE', 'ABSENT'];
    if (!validStatuses.includes(eventType)) {
      return NextResponse.json({ 
        message: "Invalid event type" 
      }, { status: 400 });
    }

    // Normalize date to midnight UTC to avoid timezone issues
    const parsedDate = new Date(date);
    const normalizedDate = new Date(Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
    console.log("Original date:", date);
    console.log("Normalized date:", normalizedDate);
    
    // Check for existing event
    const existingEvent = await prisma.attendance.findUnique({
      where: { 
        userId_date: {
          userId: user.id,
          date: normalizedDate
        }
      }
    });

    if (existingEvent) {
      return NextResponse.json({ 
        message: `There is already an existing event on ${normalizedDate.toLocaleDateString()}` 
      }, { status: 400 });
    }

    if (user.role === "ADMIN") {
      const newEvent = await prisma.attendance.create({
        data: {
          userId: user.id,
          status: eventType,
          date: normalizedDate
        }
      });

      return NextResponse.json({ 
        message: "Event created successfully.",
        event: newEvent 
      }, { status: 201 });

    } else if (user.role === "USER") {

      const existingRequest = await prisma.attendanceRequest.findFirst({
        where: {
          studentId: user.id,
          requestedDate: normalizedDate
        }
      });

      if (existingRequest) {
        return NextResponse.json({ 
          message: `There is already an existing request for ${normalizedDate.toLocaleDateString()}` 
        }, { status: 400 });
      }

      const newRequest = await prisma.attendanceRequest.create({
        data: {
          studentId: user.id,
          requestedEventType: eventType,
          requestedDate: normalizedDate,
          status: "PENDING",
          reason: reason || "",
        }
      });

      return NextResponse.json({ 
        message: "Request created successfully.",
        request: newRequest 
      }, { status: 201 });
    }

    return NextResponse.json({ message: "Invalid user role" }, { status: 400 });

  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ 
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}