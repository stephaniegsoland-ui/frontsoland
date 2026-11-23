"use server";

import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/backend-url";

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
  access_decision?: "approved" | "denied" | null;
  decision_by_username?: string | null;
  decision_at?: string | null;
};

export interface SecurityEppAnalysis {
  person_detected: boolean;
  full_body_detected?: boolean;
  face_detected: boolean;
  detected_items: Record<string, boolean>;
  present_items: string[];
  missing_items: string[];
  score: number;
  summary: string;
  recommendations: string[];
  recognized_username?: string | null;
  recognition_precision?: number | null;
  recognized_name?: string | null;
  recognized_cedula?: string | null;
  recognized_cargo?: string | null;
  recognized_photo_path?: string | null;
  report_id?: string | null;
}

export async function analyzeSecurityEppAction(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Inicia sesión nuevamente." };
  }

  try {
    const file = formData.get("file");
    if (file instanceof File && file.size > 1024 * 1024 * 5) {
      return { error: "La imagen es demasiado grande. Reduce el tamaño a menos de 5 MB." };
    }

    const res = await fetch(`${getBackendUrl()}/api/security/epp/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.status === 401) {
      cookieStore.delete("access_token");
      return { error: "No autorizado.", needsLogin: true };
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: body.detail || `Error ${res.status}` };
    }

    return { result: body as SecurityEppAnalysis };
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
    const res = await fetch(`${getBackendUrl()}/api/security/epp/history`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.status === 401) {
      cookieStore.delete("access_token");
      return { error: "No autorizado.", needsLogin: true };
    }

    if (!res.ok) {
      return { error: "No se pudo obtener el historial de seguridad." };
    }

    const history = await res.json() as SecurityHistoryItem[];
    return { history };
  } catch (error) {
    console.error("Error en fetchSecurityHistoryAction:", error);
    return { error: "Error de conexión con el servidor." };
  }
}

export async function recordSecurityDecisionAction(
  reportId: string,
  decision: "approved" | "denied",
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado. Inicia sesión nuevamente." };

  try {
    const res = await fetch(
      `${getBackendUrl()}/api/security/epp/history/${encodeURIComponent(reportId)}/decision`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      },
    );

    const responseBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        error: responseBody.detail || "No se pudo guardar la decisión de acceso.",
      };
    }

    return { report: responseBody as SecurityHistoryItem };
  } catch (error) {
    console.error("Error en recordSecurityDecisionAction:", error);
    return { error: "Error de conexión al guardar la decisión de acceso." };
  }
}
