"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function fetchStockData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Inicia sesión nuevamente." };
  }

  try {
    // Hacemos ambas peticiones en paralelo con 'no-store' para tener datos en tiempo real
    const [resCategorias, resResumen] = await Promise.all([
      fetch("http://localhost:8000/api/categories/", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch("http://localhost:8000/api/inventary/dashboard/resumen", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    ]);

    if (!resCategorias.ok || !resResumen.ok) {
      return { error: "Error al traer los datos del backend." };
    }

    const categorias = await resCategorias.json();
    const resumen = await resResumen.json();

    return { categorias, resumen };
    
  } catch (error) {
    console.error(error)
    return { error: "Error de conexión con el servidor FastAPI." };
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
    const res = await fetch("http://localhost:8000/api/categories/", {
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
    const res = await fetch(`http://localhost:8000/api/categories/${categoryId}`, {
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