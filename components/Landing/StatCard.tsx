import type { Attendance } from "@/generated/prisma";

export function AttendanceBadge({ record }: { record: Attendance }) {
  const statusStyles: Record<string, string> = {
    ON_TIME: "bg-green-100 text-green-800 border-green-200",
    ON_LEAVE: "bg-red-100 text-red-800 border-red-200",
    LATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ABSENT: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const statusIcons: Record<string, string> = {
    ON_TIME: "fa-check",
    ABSENT: "fa-times",
    ON_LEAVE: "fa-calendar",
    LATE: "fa-clock",
  };

  const statusLabels: Record<string, string> = {
    ON_TIME: "On Time",
    ABSENT: "Absent",
    ON_LEAVE: "On Leave",
    LATE: "Late",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${
        statusStyles[record.status] ??
        "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      <i
        className={`fa-solid ${statusIcons[record.status] ?? "fa-question"}`}
      ></i>
      <span>{statusLabels[record.status] ?? record.status}</span>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  week
}: {
  icon: string;
  label: string;
  value: number;
  trend: { label: string; direction?: "up" | "down" | "stable" };
  week: boolean;
}) {
  const trendColor =
    trend.direction === "stable" ? "text-gray-500" : "text-primary";
  const trendPrefix =
    trend.direction === "up" ? "↑ " : trend.direction === "down" ? "↓ " : "";

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="flex gap-3 items-center">
        <div className="flex items-center justify-center w-10 h-10 border border-gray-400 rounded-md">
          <i className={`fa ${icon} text-primary`}></i>
        </div>
        <h2 className="text-base font-semibold text-gray-700">{label}</h2>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{value}</h1>
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-xs font-medium ${trendColor}`}>
            {trendPrefix}
            {trend.label}
          </span>
          <span className="text-xs text-gray-400">vs. last {week ? "week" : "month"}</span>
        </div>
      </div>
    </div>
  );
}