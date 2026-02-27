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
  isWithinInterval,
  subMonths,
} from "date-fns";

import { useState, useRef, useMemo } from "react";

import { useUser } from "@clerk/nextjs";

import { toast } from "sonner";

import type { Attendance } from "@/generated/prisma";
import { AttendanceBadge, StatCard } from "@/components/Landing/StatCard";

interface MainPageProps {
  userRole: string;
  userAttendance: Attendance[];
}

type Stats = { present: number; late: number; onLeave: number; absent: number };

function getStatsForInterval(
  attendance: Attendance[],
  from: Date,
  to: Date,
): Stats {
  const counts: Stats = { present: 0, late: 0, onLeave: 0, absent: 0 };
  attendance
    .filter((a) => isWithinInterval(new Date(a.date), { start: from, end: to }))
    .forEach((a) => {
      if (a.status === "ON_TIME") counts.present++;
      else if (a.status === "LATE") counts.late++;
      else if (a.status === "ON_LEAVE") counts.onLeave++;
      else if (a.status === "ABSENT") counts.absent++;
    });
  return counts;
}

function computeTrend(
  curr: number,
  prev: number,
): { label: string; direction: "up" | "down" | "stable" } {
  if (prev === 0 && curr === 0) return { label: "Stable", direction: "stable" };
  if (prev === 0) return { label: "New", direction: "up" };

  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return { label: "Stable", direction: "stable" };
  if (pct > 0) return { label: `${pct}%`, direction: "up" };
  return { label: `${Math.abs(pct)}%`, direction: "down" };
}

export default function MainPage({
  userRole,
  userAttendance = [],
}: MainPageProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [eventType, setEventType] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const user = useUser();
  const router = useRouter();

  if (user) console.log("User info:", user);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    userAttendance.forEach((a) => {
      map.set(format(new Date(a.date), "yyyy-MM-dd"), a);
    });
    return map;
  }, [userAttendance]);

  const stats = useMemo<Stats>(() => {
    if (!date) return { present: 0, late: 0, onLeave: 0, absent: 0 };
    return getStatsForInterval(
      userAttendance,
      startOfMonth(date),
      endOfMonth(date),
    );
  }, [date, userAttendance]);

  const prevStats = useMemo<Stats>(() => {
    if (!date) return { present: 0, late: 0, onLeave: 0, absent: 0 };
    const prevMonth = subMonths(date, 1);
    return getStatsForInterval(
      userAttendance,
      startOfMonth(prevMonth),
      endOfMonth(prevMonth),
    );
  }, [date, userAttendance]);

  const trends = useMemo(
    () => ({
      present: computeTrend(stats.present, prevStats.present),
      late: computeTrend(stats.late, prevStats.late),
      onLeave: computeTrend(stats.onLeave, prevStats.onLeave),
      absent: computeTrend(stats.absent, prevStats.absent),
    }),
    [stats, prevStats],
  );

  const calendarDays = useMemo(() => {
    if (!date) return [];
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    let startDay = getDay(monthStart);
    startDay = startDay === 0 ? 6 : startDay - 1;

    return [
      ...Array(startDay).fill(null),
      ...eachDayOfInterval({ start: monthStart, end: monthEnd }),
    ];
  }, [date]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors: Record<string, string> = {};
    if (!eventType) newErrors.eventType = "Please select an event type";
    if (!selectedDate) {
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
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    const errorMessage = "Event creation failed, please try again.";

    try {
      const isEdit = !!selectedAttendance;

      const response = await fetch("/api/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: selectedAttendance?.id ?? null,
          requestType: isEdit ? "UPDATE" : "CREATE",
          date: new Date(
            Date.UTC(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
            ),
          ).toISOString(),
          eventType,
          reason: reason || "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          data.message ||
            (userRole === "ADMIN"
              ? "Event created successfully"
              : "Request submitted successfully"),
        );
        setEventType("");
        setReason("");
        setSelectedDate(undefined);

        dialogCloseRef.current?.click();
      } else {
        toast.error(data.message || errorMessage);
        setErrors({ submit: data.message ?? errorMessage });
      }
    } catch (error) {
      console.error("Full error:", error);
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
      router.refresh();
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
          date: selectedAttendance.date,
          eventType: selectedAttendance.status,
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
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-gray-800 font-semibold tracking-wide">
              My Attendance
            </h1>
            <h3 className="text-lg text-gray-600">
              View and manage your attendance
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="fa-clock"
            label="Present"
            value={stats.present}
            trend={trends.present}
            week={false}
          />
          <StatCard
            icon="fa-hourglass-end"
            label="Late Entry"
            value={stats.late}
            trend={trends.late}
            week={false}
          />
          <StatCard
            icon="fa-calendar-check"
            label="On Leave"
            value={stats.onLeave}
            trend={trends.onLeave}
            week={false}
          />
          <StatCard
            icon="fa-user-minus"
            label="Absent"
            value={stats.absent}
            trend={trends.absent}
            week={false}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!date}
              className="data-[empty=true]:text-muted-foreground w-max justify-between text-left font-normal mb-6"
            >
              <i className="fa-solid fa-calendar text-primary mr-2"></i>
              {date ? format(date, "MMMM yyyy") : "Select month"}
              <i className="fa-solid fa-chevron-down ml-2"></i>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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

        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="py-4 px-4 text-center text-base font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
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
                      const isToday =
                        dateKey === format(new Date(), "yyyy-MM-dd");

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
                                  const record =
                                    attendanceMap.get(
                                      format(dayData, "yyyy-MM-dd"),
                                    ) || null;
                                  setSelectedAttendance(record);
                                  setEventType(record ? record.status : "");
                                }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {format(dayData, "d")}
                                  </span>
                                  {isToday && (
                                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                                  )}
                                </div>
                                <div className="flex-1 min-h-0 overflow-hidden">
                                  {attendanceRecord && (
                                    <AttendanceBadge
                                      record={attendanceRecord}
                                    />
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
                                    onValueChange={setEventType}
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
                                      onChange={(e) =>
                                        setReason(e.target.value)
                                      }
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
    </div>
  );
}
