"use client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";

import { useState, useRef, useMemo } from "react";

import { useUser } from "@clerk/nextjs";

import { toast } from "sonner";

import type { Attendance } from "@/generated/prisma";

interface MainPageProps {
  userRole: string;
  userAttendance: Attendance[];
}

function AttendanceBadge({ record }: { record: Attendance }) {
  const statusStyles = {
    ON_TIME: "bg-green-100 text-green-800 border-green-200",
    ON_LEAVE: "bg-red-100 text-red-800 border-red-200",
    LATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ABSENT: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const statusIcons = {
    ON_TIME: "fa-check",
    ABSENT: "fa-times",
    ON_LEAVE: "fa-calendar",
    LATE: "fa-clock",
  };

  const statusLabels = {
    ON_TIME: "ON_TIME",
    ABSENT: "ABSENT",
    ON_LEAVE: "ON_LEAVE",
    LATE: "LATE",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${
        statusStyles[record.status as keyof typeof statusStyles]
      }`}
    >
      <i
        className={`fa-solid ${statusIcons[record.status as keyof typeof statusIcons]}`}
      ></i>
      <span>{statusLabels[record.status as keyof typeof statusLabels]}</span>
    </div>
  );
}

export default function MainPage({
  userRole,
  userAttendance = [],
}: MainPageProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [eventType, setEventType] = useState<string>("");

  const [reason, setReason] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);

  const user = useUser();

  const router = useRouter();

  if (user) {
    console.log("User info:", user);
  }

  // Build attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    userAttendance.forEach((attendance) => {
      const key = format(new Date(attendance.date), "yyyy-MM-dd");
      map.set(key, attendance);
    });
    return map;
  }, [userAttendance]);

  // Calculate overall stats from all attendance records
  const stats = useMemo(() => {
    const counts = { present: 0, late: 0, onLeave: 0, absent: 0 };
    userAttendance.forEach((a) => {
      if (a.status === "ON_TIME") counts.present++;
      else if (a.status === "LATE") counts.late++;
      else if (a.status === "ON_LEAVE") counts.onLeave++;
      else if (a.status === "ABSENT") counts.absent++;
    });
    return counts;
  }, [userAttendance]);

  // Generate calendar days for the selected month
  const getCalendarDays = () => {
    if (!date) return [];

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    let startDay = getDay(monthStart);
    // Convert to Monday-based (0 = Monday, 6 = Sunday)
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add empty cells for days before the month starts
    const emptyDays = Array(startDay).fill(null);

    return [...emptyDays, ...daysInMonth];
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors: Record<string, string> = {};

    if (!eventType) {
      newErrors.eventType = "Please select an event type";
    }

    if (!selectedDate) {
      newErrors.date = "Please select a date";
      setIsLoading(false);
      toast.error("Please select a date");
      return;
    }

    if (eventType === "ON_LEAVE" && (!reason || reason.length < 8)) {
      newErrors.reason = "Your reason must be at least 8 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);

      // Show error toast
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    let errorMessage = "Event creation failed, please try again.";

    try {
      const isEdit = !!selectedAttendance;

      const response = await fetch("/api/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: selectedAttendance?.id ?? null,
          requestType: isEdit ? "UPDATE" : "CREATE",
          date: selectedDate.toISOString(),
          eventType,
          reason: reason || "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success toast
        toast.success(
          data.message ||
            (userRole === "ADMIN"
              ? "Event created successfully"
              : "Request submitted successfully"),
        );

        // Close dialog and refresh
        setEventType("");
        setReason("");
        setSelectedDate(undefined);
        dialogCloseRef.current?.click();
        router.refresh();
      } else {
        // Show error toast
        toast.error(data.message || errorMessage);
        setErrors({ submit: data.message ?? errorMessage });
      }
    } catch (error) {
      console.error("Full error:", error);

      // Show error toast
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedAttendance) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: selectedAttendance.id,
          requestType: "DELETE",
          date: selectedAttendance.date, // ← ADD THIS
          eventType: selectedAttendance.status, // ← ADD THIS
          reason: "Delete request",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Delete request submitted");
        dialogCloseRef.current?.click();
        router.refresh();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-gray-800 font-semibold tracking-wide">
            Student Recap
          </h1>
          <h3 className="text-lg text-gray-600">Analyse your student recap</h3>
        </div>

        <Button>
          Download <i className="fa-solid fa-download ml-2"></i>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-3 items-center">
            <div className="flex items-center justify-center w-10 h-10 bbg-gray-300-50 border border-gray-400 rounded-md">
              <i className="fa fa-clock text-primary"></i>
            </div>
            <h2 className="text-base font-semibold text-gray-700">Present</h2>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{stats.present}</h1>
          <p className="text-sm text-gray-500">Times you were present</p>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-3 items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
              <i className="fa fa-hourglass-end text-primary"></i>
            </div>
            <h2 className="text-base font-semibold text-gray-700">
              Late Entry
            </h2>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{stats.late}</h1>
          <p className="text-sm text-gray-500">Times you were late</p>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-3 items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
              <i className="fa fa-calendar-check text-primary"></i>
            </div>
            <h2 className="text-base font-semibold text-gray-700">On Leave</h2>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{stats.onLeave}</h1>
          <p className="text-sm text-gray-500">Times you were on leave</p>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-3 items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
              <i className="fa fa-user-minus text-primary"></i>
            </div>
            <h2 className="text-base font-semibold text-gray-700">Absent</h2>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{stats.absent}</h1>
          <p className="text-sm text-gray-500">Times you were absent</p>
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!date}
            className="data-[empty=true]:text-muted-foreground w-max justify-between text-left font-normal mt-4"
          >
            <i className="fa-solid fa-calendar text-primary mx-2"></i>
            {date ? format(date, "MMMM yyyy") : "Select month"}
            <i className="fa-solid fa-chevron-down mx-2"></i>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* Month and Year Selector */}
          <div className="p-4">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Month
                </label>
                <Select
                  value={
                    date?.getMonth().toString() ??
                    new Date().getMonth().toString()
                  }
                  onValueChange={(value) => {
                    const newDate = new Date(date ?? new Date());
                    newDate.setMonth(parseInt(value));
                    setDate(newDate);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(2000, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-28">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Year
                </label>
                <Select
                  value={
                    date?.getFullYear().toString() ??
                    new Date().getFullYear().toString()
                  }
                  onValueChange={(value) => {
                    const newDate = new Date(date ?? new Date());
                    newDate.setFullYear(parseInt(value));
                    setDate(newDate);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Calendar Grid */}
      <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gray-50">
              {weekDays.map((day) => (
                <th
                  key={day}
                  className="py-3 px-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map(
              (_, weekIndex) => (
                <tr key={weekIndex}>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dayData = calendarDays[weekIndex * 7 + dayIndex];

                    if (!dayData) {
                      return (
                        <td
                          key={dayIndex}
                          className="h-24 border border-gray-200 p-3 bg-gray-50/50"
                        />
                      );
                    }

                    const dateKey = format(dayData, "yyyy-MM-dd");
                    const attendanceRecord = attendanceMap.get(dateKey);

                    return (
                      <td
                        key={dayIndex}
                        className="h-24 border border-gray-200 p-0 overflow-hidden align-top"
                      >
                        <Dialog>
                          <DialogTrigger asChild>
                            <div
                              className="h-24 w-full p-3 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col"
                              onClick={() => {
                                setSelectedDate(dayData);

                                const dateKey = format(dayData, "yyyy-MM-dd");
                                const record =
                                  attendanceMap.get(dateKey) || null;

                                setSelectedAttendance(record);

                                if (record) {
                                  setEventType(record.status);
                                } else {
                                  setEventType("");
                                }
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {format(dayData, "d")}
                                </span>
                                {format(dayData, "yyyy-MM-dd") ===
                                  format(new Date(), "yyyy-MM-dd") && (
                                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                                )}
                              </div>
                              <div className="flex-1 min-h-0 overflow-hidden">
                                {attendanceRecord && (
                                  <AttendanceBadge record={attendanceRecord} />
                                )}
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {format(dayData, "EEEE, MMMM d, yyyy")}
                              </DialogTitle>
                            </DialogHeader>

                            {attendanceRecord && (
                              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                                <span className="text-sm text-gray-600">
                                  Current status:
                                </span>
                                <AttendanceBadge record={attendanceRecord} />
                              </div>
                            )}

                            <form
                              className="grid gap-4"
                              onSubmit={handleSubmit}
                            >
                              <div>
                                <Select
                                  value={eventType}
                                  onValueChange={(value) => {
                                    setEventType(value);
                                  }}
                                >
                                  <SelectTrigger className="w-full mt-2">
                                    <SelectValue placeholder="Select event type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ON_TIME">
                                      Present
                                    </SelectItem>
                                    <SelectItem value="LATE">
                                      Late Entry
                                    </SelectItem>
                                    <SelectItem value="ON_LEAVE">
                                      On Leave
                                    </SelectItem>
                                    <SelectItem value="ABSENT">
                                      Absent
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {errors.eventType && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {errors.eventType}
                                  </p>
                                )}
                              </div>

                              {eventType === "ON_LEAVE" && (
                                <div>
                                  <Textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Reason for leave (minimum 8 characters)"
                                  />
                                  {errors.reason && (
                                    <p className="text-sm text-red-500 mt-1">
                                      {errors.reason}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading
                                    ? "Saving..."
                                    : userRole === "ADMIN"
                                      ? "Save"
                                      : "Request"}
                                </Button>
                                {selectedAttendance && (
                                  <Button
                                    type="button"
                                    variant="default"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                  >
                                    Request Delete
                                  </Button>
                                )}
                                <DialogClose asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    ref={dialogCloseRef}
                                  >
                                    Cancel
                                  </Button>
                                </DialogClose>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </td>
                    );
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
