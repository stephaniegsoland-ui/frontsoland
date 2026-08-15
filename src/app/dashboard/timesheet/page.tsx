import { cookies } from "next/headers";
import { fetchTimesheetData, fetchSummary } from "@/actions/timesheet";
import { TimesheetClient } from "./TimesheetClient";

type MonthlyTrendPoint = { label: string; value: number };

export default async function Page() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const res = await fetchTimesheetData();
  const timesheets = res.error ? undefined : res.timesheets;
  const error = res.error;
  const trend = await fetchMonthlyTrend();
  const summaryResult = await fetchSummary(currentYear, currentMonth);
  const monthlySummary = summaryResult.error ? null : summaryResult.data;
  const summaryError = summaryResult.error;

  return (
    <TimesheetClient
      timesheets={timesheets}
      error={error || summaryError}
      trend={trend}
      monthlySummary={monthlySummary}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  );
}

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: date.toLocaleString("default", { month: "short" }),
    };
  });
}

async function fetchMonthlyTrend(): Promise<MonthlyTrendPoint[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const months = getLast6Months();

  if (!token) {
    return months.map(({ label }) => ({ label, value: 0 }));
  }

  return await Promise.all(
    months.map(async ({ year, month, label }) => {
      const res = await fetch(`http://localhost:8000/api/timesheet/summary/month/${year}/${month}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return { label, value: 0 };
      }

      const raw = await res.json().catch(() => null);
      const candidate =
        typeof raw === "number"
          ? raw
          : raw && typeof raw === "object"
          ? raw.total_hours ?? raw.hours ?? raw.value ?? raw.summary ?? raw.total ?? 0
          : 0;
      return { label, value: Number(candidate) || 0 };
    })
  );
}
