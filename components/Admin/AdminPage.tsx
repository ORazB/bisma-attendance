"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

import { toast } from "sonner";

import Image from "next/image";

import {
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  isWithinInterval,
  subWeeks,
} from "date-fns";

import { useState, useMemo, useRef } from "react";

import { useUser } from "@clerk/nextjs";

import type { Attendance, User, Major, Grade } from "@/generated/prisma";

import { AttendanceBadge, StatCard } from "@/components/Landing/StatCard";

interface AdminPageProps {
  users: User[];
  userAttendance: Attendance[];
  userImages: Record<string, string>;
  grades: Grade[];
  majors: Major[];
}

type WeekStats = {
  present: number;
  late: number;
  onLeave: number;
  absent: number;
};

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

function getStatsForInterval(
  attendance: Attendance[],
  from: Date,
  to: Date,
): WeekStats {
  const stats: WeekStats = { present: 0, late: 0, onLeave: 0, absent: 0 };
  attendance
    .filter((a) => isWithinInterval(new Date(a.date), { start: from, end: to }))
    .forEach((a) => {
      if (a.status === "ON_TIME") stats.present++;
      else if (a.status === "LATE") stats.late++;
      else if (a.status === "ON_LEAVE") stats.onLeave++;
      else if (a.status === "ABSENT") stats.absent++;
    });
  return stats;
}

export default function AdminPage({
  users,
  userAttendance,
  userImages,
  grades,
  majors,
}: AdminPageProps) {
  const defaultDate = new Date();

  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [selectedMajor, setSelectedMajor] = useState<number | undefined>(
    undefined,
  );
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(
    undefined,
  );

  const [selectedFilterGrade, setSelectedFilterGrade] = useState<
    string | undefined
  >(undefined);
  const [selectedFilterMajor, setSelectedFilterMajor] = useState<
    string | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const [week, setWeek] = useState<{ from: Date; to: Date } | null>({
    from: startOfWeek(defaultDate, { weekStartsOn: 1 }),
    to: endOfWeek(defaultDate, { weekStartsOn: 1 }),
  });

  const { user } = useUser();
  if (user) console.log("User info:", user);

  async function handleSubmit(e: React.SubmitEvent, userId: number) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeId: selectedGrade,
          majorId: selectedMajor,
        }),
      });

      if (response.ok) {
        setIsLoading(false);
        toast.success("User edited successfuly");
        dialogCloseRef.current?.click();
      } else {
        setIsLoading(false);
        toast.error("User edited failed");
        dialogCloseRef.current?.click();
      }
    } catch (error) {
      toast.error("Internal server error");
      console.log(error);
    }
  }

  const handleWeekSelect = (selected: Date | undefined) => {
    if (!selected) return;
    setDate(selected);
    setWeek({
      from: startOfWeek(selected, { weekStartsOn: 1 }),
      to: endOfWeek(selected, { weekStartsOn: 1 }),
    });
  };

  const weekDays = week
    ? eachDayOfInterval({ start: week.from, end: week.to })
    : [];

  const weekStats = useMemo<WeekStats>(() => {
    if (!week) return { present: 0, late: 0, onLeave: 0, absent: 0 };
    return getStatsForInterval(userAttendance, week.from, week.to);
  }, [week, userAttendance]);

  // for trend comparison
  const prevWeekStats = useMemo<WeekStats>(() => {
    if (!week) return { present: 0, late: 0, onLeave: 0, absent: 0 };
    const prevFrom = subWeeks(week.from, 1);
    const prevTo = subWeeks(week.to, 1);
    return getStatsForInterval(userAttendance, prevFrom, prevTo);
  }, [week, userAttendance]);

  const trends = useMemo(
    () => ({
      present: computeTrend(weekStats.present, prevWeekStats.present),
      late: computeTrend(weekStats.late, prevWeekStats.late),
      onLeave: computeTrend(weekStats.onLeave, prevWeekStats.onLeave),
      absent: computeTrend(weekStats.absent, prevWeekStats.absent),
    }),
    [weekStats, prevWeekStats],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesGrade = selectedFilterGrade
        ? u.gradeId === parseInt(selectedFilterGrade) ||
          selectedFilterGrade === "all"
        : true;
      const matchesMajor = selectedFilterMajor
        ? u.majorId === parseInt(selectedFilterMajor) ||
          selectedFilterMajor === "all"
        : true;

      const isActingUser = u.clerkId !== user?.id;
      return matchesGrade && matchesMajor && isActingUser;
    });
  }, [users, selectedFilterGrade, selectedFilterMajor, user]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    userAttendance.forEach((attendance) => {
      const key = `${attendance.userId}-${new Date(attendance.date).toISOString().split("T")[0]}`;
      map.set(key, attendance);
    });
    return map;
  }, [userAttendance]);

  function getAttendance(userId: number, day: Date) {
    const key = `${userId}-${format(day, "yyyy-MM-dd")}`;
    return attendanceMap.get(key);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-gray-800 font-semibold tracking-wide">
              Student Attendance
            </h1>
            <h3 className="text-lg text-gray-600">
              Analyse attendance records of students
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="fa-clock"
            label="Present"
            value={weekStats.present}
            trend={trends.present}
            week={true}
          />
          <StatCard
            icon="fa-hourglass-end"
            label="Late Entry"
            value={weekStats.late}
            trend={trends.late}
            week={true}
          />
          <StatCard
            icon="fa-calendar-check"
            label="On Leave"
            value={weekStats.onLeave}
            trend={trends.onLeave}
            week={true}
          />
          <StatCard
            icon="fa-user-minus"
            label="Absent"
            value={weekStats.absent}
            trend={trends.absent}
            week={true}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                data-empty={!date}
                className="data-[empty=true]:text-muted-foreground w-max justify-between text-left font-normal"
              >
                <i className="fa-solid fa-calendar text-primary mr-2"></i>
                {week
                  ? `${format(week.from, "PPP")} – ${format(week.to, "PPP")}`
                  : "Pick a week"}
                <i className="fa-solid fa-chevron-down ml-2"></i>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleWeekSelect}
              />
            </PopoverContent>
          </Popover>

          <Select onValueChange={setSelectedFilterGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade.id} value={grade.id.toString()}>
                  {grade.value}
                </SelectItem>
              ))}
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedFilterMajor}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {majors.map((major) => (
                <SelectItem key={major.id} value={major.id.toString()}>
                  {major.name}
                </SelectItem>
              ))}
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attendance Table */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-300">
                  <th className="text-left py-4 px-6 text-base font-semibold text-gray-700">
                    Student
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className="text-center px-4 py-4"
                    >
                      <div className="text-base font-semibold text-gray-700">
                        {format(day, "EEEE")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200">
                    <Dialog>
                      <DialogTrigger asChild>
                        <td className="py-4 px-6 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Image
                              width={40}
                              height={40}
                              src={userImages[u.clerkId]}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {u.name}
                              </div>
                              {/*<div className="text-sm text-gray-500">{u.role}</div>*/}
                              <div className="text-sm text-gray-500">
                                Grade:
                                {grades.find((grade) => u.gradeId == grade.id)
                                  ?.value ?? "Not Assigned"}
                              </div>

                              <div className="text-sm text-gray-500">
                                Major:
                                {majors.find((major) => u.majorId == major.id)
                                  ?.name ?? "Undeclared"}
                              </div>
                            </div>
                          </div>
                        </td>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogTitle>Edit User: {u.name}</DialogTitle>
                        <DialogHeader>ID: {u.id}</DialogHeader>

                        <form onSubmit={(e) => handleSubmit(e, u.id)}>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-gray-600 mb-2">Grade</p>
                              <Select
                                onValueChange={(value) =>
                                  setSelectedGrade(parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={grades.find((g) => g.id === u.gradeId)?.value || "Select Grade"}>
                                    {selectedGrade
                                      ? grades.find(
                                          (g) => g.id === selectedGrade,
                                        )?.value
                                      : "Select Grade"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {grades.map((grade) => (
                                    <SelectItem
                                      key={grade.id}
                                      value={grade.id.toString()}
                                    >
                                      {grade.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <p className="text-gray-600 mb-2">Major</p>
                              <Select
                                onValueChange={(value) =>
                                  setSelectedMajor(parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={majors.find((m) => m.id === u.majorId)?.name || "Select Major"}>
                                    {selectedMajor
                                      ? majors.find(
                                          (m) => m.id === selectedMajor,
                                        )?.name
                                      : "Select Major"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {majors.map((major) => (
                                    <SelectItem
                                      key={major.id}
                                      value={major.id.toString()}
                                    >
                                      {major.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-4">
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? "Saving..." : "Save"}
                            </Button>
                            <DialogClose asChild ref={dialogCloseRef}>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {weekDays.map((day) => {
                      const record = getAttendance(u.id, day);
                      return (
                        <td
                          key={day.toISOString()}
                          className="cursor-pointer text-center border-l border-gray-200 p-4 min-w-36 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-left text-gray-600 mb-2">
                              {day.getDate()}
                            </span>
                            <div className="min-h-7 w-max">
                              {record && <AttendanceBadge record={record} />}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
