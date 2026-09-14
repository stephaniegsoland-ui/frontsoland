"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface ActionState {
  error?: string;
  success?: boolean;
  status?: number;
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://sistemasoland.onrender.com"
).replace(/\/+$/, "");

function getAuthHeaders(token: string | undefined): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createPersonalAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const rol = formData.get("rol") as string;
  const department = formData.get("departamento") as string;
  const nombreCompleto = formData.get("nombre_completo") as string;
  const cargo = formData.get("cargo") as string;
  const hojaVida = formData.get("hoja_vida") as string;
  const photoFile = formData.get("photo_data") as File | null;
  const permissions = formData.getAll("permissions").map(String);

  if (!email || !username || !password || !rol) {
    return { error: "El correo, usuario, contraseña y rol son obligatorios.", status: 400 };
  }

  const level = parseInt(rol, 10);
  const is_superuser = level === 1;
  const payload: Record<string, unknown> = {
    email,
    password,
    is_active: true,
    is_superuser,
    is_verified: true,
    username,
    level,
    permissions,
  };

  if (department) {
    payload.department = department;
  }
  if (nombreCompleto) {
    payload.nombre_completo = nombreCompleto;
  }
  if (cargo) {
    payload.cargo = cargo;
  }
  if (hojaVida) {
    payload.hoja_vida = hojaVida;
  }

  if (photoFile instanceof File) {
    const arrayBuffer = await photoFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    payload.photo_data = `data:${photoFile.type};base64,${base64}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(token),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 400 && errorData.detail) {
        if (errorData.detail === "REGISTER_USER_ALREADY_EXISTS") {
          return { error: "Este correo electrónico ya está registrado en el sistema.", status: 400 };
        }
        if (errorData.detail?.code === "REGISTER_INVALID_PASSWORD") {
          return { error: `Contraseña inválida: ${errorData.detail.reason}`, status: 400 };
        }
        if (typeof errorData.detail === "string") {
          return { error: errorData.detail, status: 400 };
        }
      }
      if (res.status === 422) {
        return { error: "Error de validación: Revisa que el formato del correo sea válido.", status: 422 };
      }
      return { error: "Ocurrió un error inesperado al registrar el personal.", status: res.status };
    }

    revalidatePath("/dashboard/personal");
    return { success: true };
  } catch (error) {
    console.error("Error en createPersonalAction:", error);
    return { error: "Error de conexión con el servidor de autenticación.", status: 500 };
  }
}

export async function fetchPersonalData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado.", status: 401 };

  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      headers: {
        ...getAuthHeaders(token),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: "Error al obtener la lista de usuarios.", status: res.status };
    }

    const users = await res.json();
    return users;
  } catch (err) {
    console.error("Error en fetchPersonalData:", err);
    return { error: "Error de conexión con el servidor.", status: 500 };
  }
}

export async function fetchAssignableUsers() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado.", status: 401 };

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat/users`, {
      headers: getAuthHeaders(token),
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: "Error al obtener la lista de usuarios.", status: res.status };
    }

    return await res.json();
  } catch (err) {
    console.error("Error en fetchAssignableUsers:", err);
    return { error: "Error de conexión con el servidor.", status: 500 };
  }
}

export async function getPersonalById(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado.", status: 401 };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/admin/${id}`, {
      headers: {
        ...getAuthHeaders(token),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: "Usuario no encontrado.", status: res.status };
    }

    const user = await res.json();
    return { user };
  } catch (err) {
    console.error("Error en getPersonalById:", err);
    return { error: "Error de conexión con el servidor.", status: 500 };
  }
}

export async function updatePersonalAction(
  userId: string,
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado.", status: 401 };
  }

  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rol = formData.get("rol") as string;
  const isActiveValue = formData.get("is_active") as string;
  const department = formData.get("departamento") as string;
  const nombreCompleto = formData.get("nombre_completo") as string;
  const cargo = formData.get("cargo") as string;
  const hojaVida = formData.get("hoja_vida") as string;
  const photoFile = formData.get("photo_data") as File | null;
  const permissions = formData.getAll("permissions").map(String);

  if (!username || !email || !rol) {
    return { error: "Usuario, correo y rol son obligatorios.", status: 400 };
  }

  const payload: Record<string, unknown> = {
    username,
    email,
    level: parseInt(rol, 10),
    is_active: isActiveValue === "true",
    is_superuser: parseInt(rol, 10) === 1,
    permissions,
  };

  if (department) {
    payload.department = department;
  }
  if (nombreCompleto) {
    payload.nombre_completo = nombreCompleto;
  }
  if (cargo) {
    payload.cargo = cargo;
  }
  if (hojaVida) {
    payload.hoja_vida = hojaVida;
  }

  if (password) {
    payload.password = password;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/admin/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(token),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        error: errorData.detail || "No se pudo actualizar el usuario.",
        status: res.status,
      };
    }

    if (photoFile instanceof File) {
      const uploadForm = new FormData();
      uploadForm.append("photo", photoFile);

      const photoRes = await fetch(`${BACKEND_URL}/api/users/${userId}/photo`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(token),
        },
        body: uploadForm,
      });

      if (!photoRes.ok) {
        const errorData = await photoRes.json().catch(() => ({}));
        return {
          error: errorData.detail || "No se pudo actualizar la foto del usuario.",
          status: photoRes.status,
        };
      }
    }

    revalidatePath("/dashboard/personal");
    return { success: true };
  } catch (error) {
    console.error("Error en updatePersonalAction:", error);
    return { error: "Error de conexión con el servidor.", status: 500 };
  }
}

export async function deletePersonalAction(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "No autorizado.", status: 401 };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(token),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        error: errorData.detail || "No se pudo eliminar el usuario.",
        status: res.status,
      };
    }

    revalidatePath("/dashboard/personal");
    return { success: true };
  } catch (error) {
    console.error("Error en deletePersonalAction:", error);
    return { error: "Error de conexión con el servidor.", status: 500 };
  }
}
