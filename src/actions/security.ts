"use server";

import { cookies } from "next/headers";

export type SecurityHistoryItem = {
  id: string;
  operator_name?: string | null;
  turno?: string | null;
  thumbnail_path?: string | null;
  image_path?: string | null;
  missing_items?: string | null;
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

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:8000";

  try {
    const file = formData.get("file");
    if (file instanceof File && file.size > 1024 * 1024 * 5) {
      return { error: "La imagen es demasiado grande. Reduce el tamaño a menos de 5 MB." };
    }

    const res = await fetch(`${apiBase}/api/security/epp/analyze`, {
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

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:8000";

  try {
    const res = await fetch(`${apiBase}/api/security/epp/history`, {
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
