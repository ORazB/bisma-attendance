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

import Image from "next/image";

import {
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  isWithinInterval,
} from "date-fns";

import { useState, useMemo } from "react";

import { useUser } from "@clerk/nextjs";

import type { Attendance, User } from "@/generated/prisma";

import { AttendanceBadge, StatCard } from "@/components/Landing/StatCard";

interface AdminPageProps {
  users: User[];
  userAttendance: Attendance[];
  userImages: Record<string, string>;
}

export default function AdminPage({
  users,
  userAttendance,
  userImages,
}: AdminPageProps) {
  const defaultDate = new Date();

  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [selectedClass, setSelectedClass] = useState<string | undefined>(
    undefined,
  );
  const [selectedGrade, setSelectedGrade] = useState<string | undefined>(
    undefined,
  );
  const [week, setWeek] = useState<{ from: Date; to: Date } | null>({
    from: startOfWeek(defaultDate, { weekStartsOn: 1 }),
    to: endOfWeek(defaultDate, { weekStartsOn: 1 }),
  });

  const user = useUser();
  if (user) console.log("User info:", user);

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

  const weekStats = useMemo(() => {
    if (!week) return { present: 0, late: 0, onLeave: 0, absent: 0 };

    const stats = { present: 0, late: 0, onLeave: 0, absent: 0 };

    userAttendance
      .filter((a) =>
        isWithinInterval(new Date(a.date), { start: week.from, end: week.to }),
      )
      .forEach((a) => {
        if (a.status === "ON_TIME") stats.present++;
        else if (a.status === "LATE") stats.late++;
        else if (a.status === "ON_LEAVE") stats.onLeave++;
        else if (a.status === "ABSENT") stats.absent++;
      });

    return stats;
  }, [week, userAttendance]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    userAttendance.forEach((a) => {
      const key = `${a.userId}-${new Date(a.date).toISOString().split("T")[0]}`;
      map.set(key, a);
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

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="fa-clock"
            label="Present"
            value={weekStats.present}
            trend={{ label: "12%", direction: "up" }}
            week={true}
          />
          <StatCard
            icon="fa-hourglass-end"
            label="Late Entry"
            value={weekStats.late}
            trend={{ label: "2%", direction: "up" }}
            week={true}
          />
          <StatCard
            icon="fa-calendar-check"
            label="On Leave"
            value={weekStats.onLeave}
            trend={{ label: "Stable", direction: "stable" }}
            week={true}
          />
          <StatCard
            icon="fa-user-minus"
            label="Absent"
            value={weekStats.absent}
            trend={{ label: "4%", direction: "down" }}
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

          <Select onValueChange={setSelectedGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="11">11</SelectItem>
              <SelectItem value="12">12</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DKV">DKV</SelectItem>
              <SelectItem value="PPLG">PPLG</SelectItem>
              <SelectItem value="TJKT">TJKT</SelectItem>
              <SelectItem value="AKUNTANSI">AKUNTANSI</SelectItem>
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
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200">
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
                          <div className="text-sm text-gray-500">{u.role}</div>
                        </div>
                      </div>
                    </td>
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
