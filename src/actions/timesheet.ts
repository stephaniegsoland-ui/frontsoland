"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function fetchTimesheetData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch(`${API_URL}/api/timesheet/`, {
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
  const entriesJson = formData.get("entries") as string | null;

  if (!entriesJson) {
    return { error: "No se encontraron las entradas de la hoja de tiempo." };
  }

  let entries: any[];
  try {
    entries = JSON.parse(entriesJson);
  } catch (parseError) {
    console.error("JSON inválido en entries:", parseError);
    return { error: "Las entradas de la hoja de tiempo no son válidas." };
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { error: "Agrega al menos una actividad antes de enviar." };
  }

  try {
    const res = await fetch(`${API_URL}/api/timesheet/create`, {
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

  const url = month
    ? `${API_URL}/api/timesheet/summary/month/${year}/${month}`
    : `${API_URL}/api/timesheet/summary/year/${year}`;
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
