import { cookies } from "next/headers";
import { fetchTimesheetData } from "@/actions/timesheet";
import { TimesheetClient } from "../timesheet/TimesheetClient";

type MonthlyTrendPoint = { label: string; value: number };
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export default async function Page() {
  const res = await fetchTimesheetData();
  const timesheets = res.error ? undefined : res.timesheets;
  const error = res.error;
  const trend = await fetchMonthlyTrend();

  return <TimesheetClient timesheets={timesheets} error={error} trend={trend} />;
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
      const res = await fetch(`${API_URL}/api/timesheet/summary/month/${year}/${month}`, {
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
