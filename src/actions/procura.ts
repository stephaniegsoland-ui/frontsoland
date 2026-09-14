"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function fetchProcuraData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch(`${API_URL}/api/procura/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch (e) {}
      return { error: `Error al traer las procuras. (${res.status} ${res.statusText}) ${body}` };
    }

    const procuras = await res.json();
    return { procuras };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión con el servidor." };
  }
}

export async function fetchStockItems() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch(`${API_URL}/api/inventary/items`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch (e) {}
      return { error: `Error al traer los items del stock. (${res.status} ${res.statusText}) ${body}` };
    }

    const items = await res.json();
    return { items };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión con el servidor." };
  }
}

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createProcuraAction(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  if (!formData || typeof (formData as any).get !== "function") {
    return { error: "No se recibieron datos del formulario. Asegúrate de que el formulario envíe datos correctamente." };
  }

  const usage = (formData.get("usage") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  // Items: soportamos múltiples inputs con el mismo nombre
  const itemNames = formData.getAll("item_name") as string[];
  const itemQtys = formData.getAll("item_qty") as string[];

  const items: any[] = [];
  for (let i = 0; i < itemNames.length; i++) {
    const name = (itemNames[i] || "").trim();
    const qty = parseInt((itemQtys[i] || "1").toString()) || 1;
    if (!name) continue;
    items.push({ name, quantity: qty });
  }

  try {
    const res = await fetch(`${API_URL}/api/procura/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ usage, notes, items }),
    });

    if (!res.ok) {
      let body = "";
      try {
        const text = await res.text();
        body = text || "";
      } catch (parseErr) {
        console.error(parseErr);
      }
      return { error: `Error al crear la procura. ${res.status} ${res.statusText}${body ? `: ${body}` : ""}` };
    }

    revalidatePath("/dashboard/procura");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión." };
  }
}

export async function updateProcuraStatusAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  const requestId = (formData.get("request_id") as string) || "";
  const status = (formData.get("status") as string) || "";
  const notes = (formData.get("notes") as string) || "";

  if (!requestId || !status) return { error: "Faltan datos para actualizar el estado." };

  try {
    const res = await fetch(`${API_URL}/api/procura/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes }),
    });

    if (!res.ok) {
      let body = "";
      try { body = await res.text(); } catch (e) {}
      return { error: `Error al actualizar estado. ${res.status} ${res.statusText}${body ? `: ${body}` : ""}` };
    }

    revalidatePath("/dashboard/procura");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Error de conexión al actualizar estado." };
  }
}
