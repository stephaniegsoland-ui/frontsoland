"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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