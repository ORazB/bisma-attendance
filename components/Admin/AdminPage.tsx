"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

import { startOfWeek, endOfWeek, format, eachDayOfInterval, isWithinInterval } from "date-fns"

import { useState, useEffect, useMemo } from "react";

import { useUser } from "@clerk/nextjs";

import { Attendance } from "@/app/generated/prisma";
import { User } from "@/app/generated/prisma";

interface AdminPageProps {
  users: User[];
  userAttendance: Attendance[];
  userImages: Record<string, string>;
}

export default function AdminPage({ users, userAttendance, userImages }: AdminPageProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [week, setWeek] = useState<{ from: Date; to: Date } | null>(null);

  const user = useUser();

  if (user) {
    console.log("User info:", user);
  }

  const handleWeekSelect = (selected: Date | undefined) => {
    if (!selected) return

    setDate(selected)

    const weekStart = startOfWeek(selected, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(selected, { weekStartsOn: 1 })

    setWeek({
      from: weekStart,
      to: weekEnd,
    })
  }

  useEffect(() => {
    handleWeekSelect(new Date('2026-02-03')) // Default week
  }, [])

  const weekDays = week
    ? eachDayOfInterval({
      start: week.from,
      end: week.to,
    })
    : []

  // Calculate attendance statistics for the selected week
  const weekStats = useMemo(() => {
    if (!week) return { present: 0, late: 0, onLeave: 0, absent: 0 };

    const weekAttendance = userAttendance.filter((attendance) => {
      const attendanceDate = new Date(attendance.date);
      return isWithinInterval(attendanceDate, { start: week.from, end: week.to });
    });

    const stats = {
      present: 0,
      late: 0,
      onLeave: 0,
      absent: 0,
    };

    weekAttendance.forEach((attendance) => {
      switch (attendance.status) {
        case 'ON_TIME':
          stats.present++;
          break;
        case 'LATE':
          stats.late++;
          break;
        case 'ON_LEAVE':
          stats.onLeave++;
          break;
        case 'ABSENT':
          stats.absent++;
          break;
      }
    });

    return stats;
  }, [week, userAttendance]);

  const totalUsers = users.length;
  const totalPossibleAttendance = totalUsers * weekDays.length;

  function AttendanceBadge({ record }: { record: any }) {
    const statusStyles = {
      ON_TIME: "bg-green-100 text-green-800 border-green-200",
      ON_LEAVE: "bg-red-100 text-red-800 border-red-200",
      LATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ABSENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }

    const statusIcons = {
      ON_TIME: "fa-check",
      ABSENT: "fa-times",
      ON_LEAVE: "fa-calendar",
      LATE: "fa-clock",
    }

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${statusStyles[record.status as keyof typeof statusStyles]}`}>
        <i className={`fa-solid ${statusIcons[record.status as keyof typeof statusIcons]}`}></i>
        <span>{record.status}</span>
      </div>
    )
  }

  const attendanceMap = new Map<string, any>()

  userAttendance.forEach((attendance) => {
    const key = `${attendance.userId}-${attendance.date.toISOString().split('T')[0]}`
    attendanceMap.set(key, attendance)
  })
  console.log(attendanceMap);

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

          <Button>
            Download <i className="fa-solid fa-download ml-2"></i>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bbg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-clock text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">Present</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{weekStats.present}</h1>
            <p className="text-sm text-gray-500">{totalPossibleAttendance - weekStats.present} records remaining</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-hourglass-end text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">Late Entry</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{weekStats.late}</h1>
            <p className="text-sm text-gray-500">{weekStats.present} on time</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-calendar-check text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">On Leave</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{weekStats.onLeave}</h1>
            <p className="text-sm text-gray-500">Approved leave</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-user-minus text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">Absent</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{weekStats.absent}</h1>
            <p className="text-sm text-gray-500">Without informing</p>
          </div>

        </div>

        {/* Week Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!date}
              className="data-[empty=true]:text-muted-foreground w-max justify-between text-left font-normal mb-6"
            >
              <i className="fa-solid fa-calendar text-primary mr-2"></i>
              {week
                ? `${format(week.from, "PPP")} - ${format(week.to, "PPP")}`
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

        {/* Attendance Table */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-300">
                  <th className="text-left py-4 px-6 text-base font-semibold text-gray-700">Employee</th>

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
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {/* Employee column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={userImages[user.clerkId]}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {weekDays.map((day) => {
                      const record = getAttendance(user.id, day)

                      return (
                        <td key={day.toISOString()} className="text-center border-l border-gray-200 p-4 min-w-35">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-left text-gray-600 mb-2">{day.getDate()}</span>
                            <div className="min-h-7">
                              {record && (
                                <AttendanceBadge record={record} />
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}