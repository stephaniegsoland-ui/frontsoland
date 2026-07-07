"use server";

import { cookies } from "next/headers";

export type SecurityHistoryItem = {
  id: string;
  operator_name?: string | null;
  turno?: string | null;
  summary?: string | null;
  score: number;
  created_at: string;
};

export async function analyzeSecurityEppAction(prevState: any | null, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Inicia sesión nuevamente." };
  }

  try {
    const res = await fetch("http://localhost:8000/api/security/epp/analyze", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status === 401) {
      try { cookieStore.delete("access_token"); } catch (err) {}
      return { error: "No autorizado.", needsLogin: true };
    }

    let body: any = {};
    try { body = await res.json(); } catch (err) { body = { detail: await res.text().catch(() => res.statusText) }; }

    if (!res.ok) {
      return { error: body.detail || `Error ${res.status}` };
    }

    return { result: body };
  } catch (error) {
    console.error("Error en analyzeSecurityEppAction:", error);
    return { error: "Error de conexión con el servidor." };
  }
}

export async function fetchSecurityHistoryAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch("http://localhost:8000/api/security/epp/history", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.status === 401) {
      try { cookieStore.delete("access_token"); } catch (err) {}
      return { error: "No autorizado.", needsLogin: true };
    }

    if (!res.ok) {
      return { error: "No se pudo obtener el historial de seguridad." };
    }

    const history = await res.json();
    return { history };
  } catch (error) {
    console.error("Error en fetchSecurityHistoryAction:", error);
    return { error: "Error de conexión con el servidor." };
  }
}
