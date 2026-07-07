"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface ActionState {
  error?: string;
  success?: boolean;
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

  if (!email || !username || !password || !rol) {
    return { error: "El correo, usuario, contraseña y rol son obligatorios." };
  }

  const level = parseInt(rol);
  const is_superuser = level === 1;
  const payload = {
    email,
    password,
    is_active: true,
    is_superuser,
    is_verified: true,
    username,
    level,
  };

  try {
    const res = await fetch("http://localhost:8000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      if (res.status === 400 && errorData.detail) {
        if (errorData.detail === "REGISTER_USER_ALREADY_EXISTS") {
          return { error: "Este correo electrónico ya está registrado en el sistema." };
        } 
        if (errorData.detail?.code === "REGISTER_INVALID_PASSWORD") {
          return { error: `Contraseña inválida: ${errorData.detail.reason}` };
        }
        if (typeof errorData.detail === "string") {
          return { error: errorData.detail };
        }
      }
      
      if (res.status === 422) {
        return { error: "Error de validación: Revisa que el formato del correo sea válido." };
      }

      return { error: "Ocurrió un error inesperado al registrar el personal." };
    }

    revalidatePath("/dashboard/personal");
    return { success: true };
    
  } catch (error) {
    console.error("Error en createPersonalAction:", error);
    return { error: "Error de conexión con el servidor de autenticación." };
  }
}

export async function fetchPersonalData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return { error: "No autorizado." };

  try {
    const res = await fetch("http://localhost:8000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: "Error al obtener la lista de usuarios." };
    }

    const users = await res.json();
    return users;
  } catch (err) {
    console.error("Error en fetchPersonalData:", err);
    return { error: "Error de conexión con el servidor." };
  }
}