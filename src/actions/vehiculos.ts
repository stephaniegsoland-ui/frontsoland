"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  process.env.BACKEND_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

function getApiUrl(path: string) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${BACKEND_URL}/`).toString().replace(/\/$/, "");
}

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function fetchFleetData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Por favor, inicia sesion." };
  }

  try {
    const [resVehicles, resTypes] = await Promise.all([
      fetch(getApiUrl("/api/vehicle/"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(getApiUrl("/api/type_record/"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    if (!resVehicles.ok) {
      return { error: "Error al sincronizar datos con el servidor de Flota." };
    }

    const vehicles = await resVehicles.json();
    const typeRecord = (await resTypes.ok) ? await resTypes.json() : [];

    return { vehicles, typeRecord };
  } catch (error) {
    console.error("Error en fetchFleetData:", error);
    return { error: "Error de red con el servidor." };
  }
}

export async function createVehicleAction(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "Sesion expirada. Por favor, inicia sesion nuevamente." };
  }

  const license_plate = formData.get("license_plate") as string;
  const model = formData.get("model") as string;
  const km_actual_str = formData.get("km_actual") as string;
  const status = formData.get("status") as string;
  const register_date = formData.get("register_date") as string;
  const user_id = formData.get("user_id") as string;

  if (!license_plate || !model) {
    return { error: "La placa y el modelo son campos obligatorios." };
  }

  const payload: Record<string, any> = {
    license_plate: license_plate.trim().toUpperCase(),
    model: model.trim(),
    km_actual: parseInt(km_actual_str) || 0,
    status: status || "Activo",
    register_date: register_date || new Date().toISOString().split("T")[0],
  };

  if (user_id && user_id.trim() !== "") {
    payload.user_id = user_id.trim();
  }

  try {
    const res = await fetch(getApiUrl("/api/vehicle/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));

      if (res.status === 422) {
        return {
          error:
            "Formato de datos invalido. Revisa la placa o el UUID del usuario.",
        };
      }
      return {
        error:
          errorData.detail || "Error al registrar el vehiculo en el servidor.",
      };
    }
  } catch (error) {
    console.error("Error en createVehicleAction:", error);
    return { error: "Error de conexion con el servidor FastAPI." };
  }
  revalidatePath("/dashboard/vehiculos");
  redirect("/dashboard/vehiculos");
}

export async function updateVehicleAction(
  vehicleId: string,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  const updateData: any = {};

  const status = formData.get("status");
  const km = formData.get("km_actual");
  const model = formData.get("model");
  const license_plate = formData.get("lincense_plate");
  const user_id = formData.get("user_id");

  if (status) updateData.status = status;
  if (km) updateData.km_actual = Number(km);
  if (model) updateData.model = model;
  if (license_plate) updateData.license_plate = license_plate;

  if (user_id != null) {
    updateData.user_id = user_id === "" ? null : user_id;
  }

  try {
    const res = await fetch(getApiUrl(`/api/vehicle/${vehicleId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const error = await res.json();
      return { error: error.detail || "Error al actualizar el vehiculo." };
    }

    return { sucess: true };
  } catch (error) {
    console.error("Error en updateVehicleAction:", error);
    return { error: "Error de conexion con el servidor." };
  }
}

export async function createTypeRecordAction(
  prevState: any,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  const name = formData.get("name") as string;
  const color_hex = formData.get("color_hex") as string;
  const icon = formData.get("icon") as string;

  if (!name) return { error: "El nombre es obligatorio." };

  const payload = {
    name,
    color_hex: color_hex || "#ffffff",
    icon: icon || "tool",
  };

  try {
    const res = await fetch(getApiUrl("/api/type_record/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return { error: "Error al crear el tipo de registro." };

    revalidatePath("/dashboard/vehiculos");
    return { success: true };
  } catch (error) {
    console.error("Error en createTypeRecordAction:", error);
    return { error: "Error de conexion con el servidor." };
  }
}

export async function createFleetRecordAction(
  vehicleId: string,
  prevState: any,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado" };

  const type_id = formData.get("type_id") as string;
  const km = formData.get("km") as string;
  const notas = formData.get("notas") as string;

  if (!type_id || !km)
    return { error: "El tipo y el kilometraje son obligatorios." };

  const payload = {
    type_id: parseInt(type_id),
    km: parseInt(km),
    details: {
      notas: notas || "Sin observaciones",
    },
  };

  try {
    const res = await fetch(
      getApiUrl(`/api/vehicle/${vehicleId}/record`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return { error: error.detail || "Error al guardar el registro." };
    }

    revalidatePath("/dashboard/vehicuos");
    return { success: true };
  } catch (error) {
    console.error("Error en createFleetRecordAction:", error);
    return { error: "Error de conexion con el servidor" };
  }
}

export async function getVehicleRecordAction(
  vehicleId: string,
  typeId?: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  try {
    let url = getApiUrl(`/api/vehicle/${vehicleId}/record`);
    if (typeId) {
      url += `?type_id=${typeId}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return { error: "No se pudo cargar el historial del vehiculo." };
    }

    const records = await res.json();
    return { records };
  } catch (error) {
    console.error("Error en getVehicleRecordAction:", error);
    return { error: "Error de conexion en el servidor." };
  }
}

export async function compareVehicleInspectionAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Por favor, inicia sesión nuevamente." };
  }

  try {
    const res = await fetch(getApiUrl("/api/vehicle/inspection/compare"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status === 401) {
      try {
        cookieStore.delete("access_token");
      } catch (err) {}
      return { error: "No autorizado. Por favor, inicia sesión nuevamente.", needsLogin: true };
    }

    let body: any = {};
    try {
      body = await res.json();
    } catch (err) {
      const txt = await res.text().catch(() => "");
      body = { detail: txt || res.statusText };
    }

    if (!res.ok) {
      return { error: body.detail || `Error ${res.status}: ${res.statusText}` };
    }

    return { inspection: body };
  } catch (error) {
    console.error("Error en compareVehicleInspectionAction:", error);
    return { error: "Error de conexión con el servidor FastAPI." };
  }
}

export async function fetchVehicleInspectionHistory() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado. Inicia sesión nuevamente." };
  }

  try {
    const res = await fetch(getApiUrl("/api/vehicle/inspection/history"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      try {
        cookieStore.delete("access_token");
      } catch (err) {}
      return { error: "No autorizado. Inicia sesión nuevamente.", needsLogin: true };
    }

    if (!res.ok) {
      return { error: "No se pudo cargar el historial de inspecciones." };
    }

    const history = await res.json();
    return { history };
  } catch (error) {
    console.error("Error en fetchVehicleInspectionHistory:", error);
    return { error: "Error de conexión con el servidor FastAPI." };
  }
}
