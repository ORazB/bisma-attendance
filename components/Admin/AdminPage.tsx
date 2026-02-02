"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

import { startOfWeek, endOfWeek, format, eachDayOfInterval } from "date-fns"

import { useState, useEffect } from "react";

import { useUser } from "@clerk/nextjs";

export default function AdminPage() {

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

  function AttendanceBadge({ record }: { record: any }) {
    const statusStyles = {
      PRESENT: "bg-green-100 text-green-800 border-green-200",
      ABSENT: "bg-red-100 text-red-800 border-red-200",
      LEAVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }

    const statusIcons = {
      PRESENT: "fa-check",
      ABSENT: "fa-times",
      LEAVE: "fa-calendar",
    }

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${statusStyles[record.status as keyof typeof statusStyles]}`}>
        <i className={`fa-solid ${statusIcons[record.status as keyof typeof statusIcons]}`}></i>
        <span>{record.status}</span>
        {record.hoursWorked && (
          <span className="text-xs opacity-75">({record.hoursWorked}h)</span>
        )}
      </div>
    )
  }

  const employees = [
    {
      id: 1,
      name: "Dianne Russell",
      role: "UI/UX Designer",
      avatar: "https://i.pravatar.cc/150?img=32",
    },
    {
      id: 2,
      name: "Bessie Cooper",
      role: "Product Designer",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 3,
      name: "Brooklyn Jones",
      role: "Marketing Officer",
      avatar: "https://i.pravatar.cc/150?img=45",
    },
    {
      id: 4,
      name: "Eleanor Pena",
      role: "Content Writer",
      avatar: "https://i.pravatar.cc/150?img=56",
    },
    {
      id: 5,
      name: "Darlene Robertson",
      role: "UX Engineer",
      avatar: "https://i.pravatar.cc/150?img=23",
    },
  ];

  const attendanceRecords = [
    {
      employeeId: 1,
      date: "2026-02-03",
      status: "PRESENT",
      hoursWorked: 8,
    },
    {
      employeeId: 1,
      date: "2026-02-05",
      status: "LEAVE",
    },
    {
      employeeId: 2,
      date: "2026-02-04",
      status: "ABSENT",
    },
    {
      employeeId: 3,
      date: "2026-02-06",
      status: "PRESENT",
      hoursWorked: 7.5,
    },
    {
      employeeId: 4,
      date: "2026-02-03",
      status: "PRESENT",
      hoursWorked: 8.25,
    },
    {
      employeeId: 5,
      date: "2026-02-04",
      status: "LEAVE",
    },
  ]

  const attendanceMap = new Map<string, any>()

  attendanceRecords.forEach((a) => {
    const key = `${a.employeeId}-${a.date}`
    attendanceMap.set(key, a)
  })

  function getAttendance(userId: number, day: Date) {
    return attendanceMap.get(
      `${userId}-${format(day, "yyyy-MM-dd")}`
    )
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
              <h2 className="text-base font-semibold text-gray-700">Present Today</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">24</h1>
            <p className="text-sm text-gray-500">124 Students remaining</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-hourglass-end text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">Late Entry</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">24</h1>
            <p className="text-sm text-gray-500">12 People on time</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-calendar-check text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">On Leave</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">24</h1>
            <p className="text-sm text-gray-500">Approved leave</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300-50 border border-gray-400 rounded-md">
                <i className="fa fa-user-minus text-gray-700"></i>
              </div>
              <h2 className="text-base font-semibold text-gray-700">Absent</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">24</h1>
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
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {/* Employee column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {employee.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {weekDays.map((day) => {
                      const record = getAttendance(employee.id, day)

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