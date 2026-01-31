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

export default function MainPage() {

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [week, setWeek] = useState<{ from: Date; to: Date } | null>(null);

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
    handleWeekSelect(new Date('2026-02-03')) // DEfault week
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
    <div>
      <div className="m-24 container w-3/4 mx-auto p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-800 font-semibold tracking-wide">
              Student Attendance
            </h1>
            <h3 className="text-lg text-gray-600">
              Analyse attendance records of students
            </h3>
          </div>

          <Button>
            Download <i className="fa-solid fa-download"></i>
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">

          <div className="grid gap-2 p-3 border border-gray-300 rounded-lg">
            <div className="flex gap-2 items-center">
              <div className="grid place-items-center p-2 border border-gray-300 rounded-md">
                <i className="fa fa-clock text-primary"></i>
              </div>
              <h2 className="text-lg font-semibold">Present Today</h2>

            </div>
            <h1 className="text-2xl font-bold">24</h1>
            <p>124 Student remaining</p>
          </div>

          <div className="grid gap-2 p-3 border border-gray-300 rounded-lg">
            <div className="flex gap-2 items-center">
              <div className="grid place-items-center p-2 border border-gray-300 rounded-md">
                <i className="fa fa-hourglass-end text-primary"></i>
              </div>
              <h2 className="text-lg font-semibold">Late Entry</h2>

            </div>
            <h1 className="text-2xl font-bold">24</h1>
            <p>12 People are on Time</p>
          </div>

          <div className="grid gap-2 p-3 border border-gray-300 rounded-lg">
            <div className="flex gap-2 items-center">
              <div className="grid place-items-center p-2 border border-gray-300 rounded-md">
                <i className="fa fa-calendar-check text-primary"></i>
              </div>
              <h2 className="text-lg font-semibold">On Leave</h2>

            </div>
            <h1 className="text-2xl font-bold">24</h1>
            <p>Approved Leave</p>
          </div>

          <div className="grid gap-2 p-3 border border-gray-300 rounded-lg">
            <div className="flex gap-2 items-center">
              <div className="grid place-items-center p-2 border border-gray-300 rounded-md">
                <i className="fa fa-user-minus text-primary"></i>
              </div>
              <h2 className="text-lg font-semibold">Absent</h2>

            </div>
            <h1 className="text-2xl font-bold">24</h1>
            <p>Without informing</p>
          </div>

        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!date}
              className="data-[empty=true]:text-muted-foreground w-53 justify-between text-left font-normal mt-4"
            >
              <i className="fa-solid fa-calendar text-primary mx-2"></i>
              {week
                ? `${format(week.from, "PPP")} - ${format(week.to, "PPP")}`
                : "Pick a week"}
              <i className="fa-solid fa-chevron-down mx-2"></i>
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

        <div className="border-gray-300 border rounded-md p-6 pt-2 mt-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-base font-semibold">Employee</th>

                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className="text-center px-4 py-2"
                  >
                    <div className="text-base font-semibold">
                      {format(day, "EEEE")}
                    </div>
                  </th>
                ))}
              </tr>

            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  {/* Employee column */}
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={employee.avatar}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const record = getAttendance(employee.id, day)

                    return (
                      <td key={day.toISOString()} className="w-40 text-center border border-gray-200 p-4">
                        <div className="w-full">
                          <h1 className="text-left grid place-items-start mb-2">{day.getDate()}</h1>
                          {record ? (
                            <AttendanceBadge record={record} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
  )
}
