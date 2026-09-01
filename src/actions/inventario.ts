"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  process.env.BACKEND_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

function getApiUrl(path: string) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${BACKEND_URL}/`).toString().replace(/\/$/, "");
}

export async function fetchStockData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Inicia sesión nuevamente." };
  }

  try {
    const [resCategorias, resResumen] = await Promise.all([
      fetch(getApiUrl("/api/categories/"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(getApiUrl("/api/inventary/dashboard/resumen"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    if (!resCategorias.ok || !resResumen.ok) {
      return {
        categorias: [],
        resumen: { items: [] },
        error: "Error al traer los datos del backend.",
      };
    }

    const categorias = await resCategorias.json();
    const resumen = await resResumen.json();

    return {
      categorias: Array.isArray(categorias) ? categorias : [],
      resumen: resumen && typeof resumen === "object" ? resumen : { items: [] },
    };
  } catch (error) {
    console.error("fetchStockData error:", error);
    return {
      categorias: [],
      resumen: { items: [] },
      error: "Error de conexión con el servidor FastAPI.",
    };
  }
}

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createCategoryAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const name = formData.get("name") as string;
  const color_hex = formData.get("color_hex") as string;
  const icon = (formData.get("icon") as string) || "box";

  if (!name || !color_hex) {
    return { error: "El nombre y el color son obligatorios." };
  }

  try {
    const res = await fetch(getApiUrl("/api/categories/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, color_hex, icon }),
    });

    if (!res.ok) {
      return { error: "Error al crear la categoría en el servidor." };
    }

    revalidatePath("/dashboard/stock");
    return { success: true };
  } catch (error) {
    console.error("Error en createCategoryAction:", error);
    return { error: "Error de conexión con el servidor." };
  }
}

export async function deleteCategoryAction(categoryId: number): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  try {
    const res = await fetch(getApiUrl(`/api/categories/${categoryId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return { error: "No se pudo eliminar la categoría." };

    revalidatePath("/dashboard/stock");
    return { success: true };
  } catch (error) {
    console.error(error)
    return { error: "Error de conexión." };
  }
}

export async function createItemAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const category_id = parseInt(formData.get("category_id") as string);
  const name = formData.get("name") as string;
  const quantity = parseInt(formData.get("quantity") as string); 
  const observacion = formData.get("observacion") as string;

  if (!name || isNaN(quantity) || isNaN(category_id)) {
    return { error: "El nombre, la cantidad y la categoría son obligatorios." };
  }

  // 1. Inicializamos el diccionario de atributos
  const attribute: Record<string, any> = {};

  // 2. Si hay una observación directa, la metemos al diccionario
  if (observacion && observacion.trim() !== "") {
    attribute["observacion"] = observacion.trim();
  }

  // 3. Extraemos todos los inputs dinámicos usando getAll()
  const attrKeys = formData.getAll("attr_keys") as string[];
  const attrValues = formData.getAll("attr_values") as string[];

  // 4. Emparejamos las claves con los valores
  attrKeys.forEach((key, index) => {
    const cleanKey = key.trim();
    const cleanValue = attrValues[index]?.trim();
    
    // Solo lo añadimos si ambos campos tienen texto
    if (cleanKey && cleanValue) {
      attribute[cleanKey] = cleanValue;
    }
  });

  try {
    const res = await fetch(getApiUrl("/api/inventary/create"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        quantity,
        category_id,
        attribute,
      }),
    });

    if (!res.ok) {
      return { error: "Error al registrar el suministro en el servidor." };
    }

    revalidatePath(`/dashboard/stock/${category_id}`);
    revalidatePath("/dashboard/stock");
    
    return { success: true };
  } catch (error) {
    console.error("Error en createItemAction:", error);
    return { error: "Error de red al intentar crear el ítem." };
  }
}