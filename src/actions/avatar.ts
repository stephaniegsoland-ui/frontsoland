"use server";

import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

export async function saveAvatarConfig(userId: string, avatarConfig: Record<string, unknown>) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "No autorizado.", status: 401 };

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/admin/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar_config: avatarConfig }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.detail || "No se pudo guardar el avatar.", status: response.status };
    }
    return { success: true };
  } catch {
    return { error: "No se pudo conectar con el servidor.", status: 500 };
  }
}