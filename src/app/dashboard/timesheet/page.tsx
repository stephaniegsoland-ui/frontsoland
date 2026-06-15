import { cookies } from "next/headers";
import { fetchTimesheetData } from "@/actions/timesheet";
import { TimesheetClient } from "./TimesheetClient";

type MonthlyTrendPoint = { label: string; value: number };

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

function getCookieHeader() {
  const cookieStore = cookies();
  return cookieStore.getAll().map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`).join("; ");
}

async function fetchMonthlyTrend(): Promise<MonthlyTrendPoint[]> {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  const cookieHeader = getCookieHeader();
  const months = getLast6Months();

  return await Promise.all(
    months.map(async ({ year, month, label }) => {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (cookieHeader) headers.cookie = cookieHeader;

      const res = await fetch(`http://localhost:8000/api/timesheet/summary/month/${year}/${month}`, {
        headers,
        cache: "no-store",
        credentials: "include",
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
