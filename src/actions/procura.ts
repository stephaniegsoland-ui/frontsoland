"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function fetchProcuraData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch("http://localhost:8000/api/procura/", {
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
    const res = await fetch("http://localhost:8000/api/inventary/items", {
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

  const reference = (formData.get("reference") as string) || undefined;
  const supplier = (formData.get("supplier") as string) || undefined;
  const description = (formData.get("description") as string) || undefined;
  const usage = (formData.get("usage") as string) || undefined;

  const attrKeys = formData.getAll("attr_keys") as string[];
  const attrValues = formData.getAll("attr_values") as string[];
  const attribute: Record<string, any> = {};
  attrKeys.forEach((k, i) => {
    const key = k?.trim();
    const val = attrValues[i]?.trim();
    if (key) attribute[key] = val;
  });

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
    const res = await fetch("http://localhost:8000/api/procura/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reference, supplier, description, usage, attribute, items }),
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
