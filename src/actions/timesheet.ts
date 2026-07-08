"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function fetchTimesheetData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch("http://localhost:8000/api/timesheet/", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch (e) {}
      return { error: `Error al traer las hojas de tiempo. (${res.status} ${res.statusText}) ${body}` };
    }
    const timesheets = await res.json();
    return { timesheets };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión con el servidor." };
  }
}

export async function createTimesheetAction(prevState: any | null, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return { error: "No autorizado." };

  const period_start = formData.get("period_start") as string;
  const period_end = formData.get("period_end") as string;

  const entry_dates = formData.getAll("entry_date") as string[];
  const entry_starts = formData.getAll("entry_start") as string[];
  const entry_ends = formData.getAll("entry_end") as string[];
  const entry_activities = formData.getAll("entry_activity") as string[];
  const entry_viaticos = formData.getAll("entry_viaticos") as string[];

  const entries: any[] = [];
  for (let i = 0; i < entry_dates.length; i++) {
    const date = entry_dates[i];
    if (!date) continue;
    entries.push({
      date,
      start: entry_starts[i] || undefined,
      end: entry_ends[i] || undefined,
      activity: entry_activities[i] || undefined,
      viaticos: parseFloat((entry_viaticos[i] || "0").toString()) || 0,
    });
  }

  try {
    const res = await fetch("http://localhost:8000/api/timesheet/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ period_start, period_end, entries }),
    });

    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch (e) {}
      return { error: `Error al crear la hoja. ${res.status} ${res.statusText}${body ? `: ${body}` : ""}` };
    }

    revalidatePath("/dashboard/timesheet");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión." };
  }
}

export async function fetchSummary(year: number, month?: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return { error: "No autorizado." };

  const url = month ? `http://localhost:8000/api/timesheet/summary/month/${year}/${month}` : `http://localhost:8000/api/timesheet/summary/year/${year}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch (e) {}
      return { error: `Error al traer el resumen. ${res.status} ${res.statusText}: ${body}` };
    }
    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión." };
  }
}
