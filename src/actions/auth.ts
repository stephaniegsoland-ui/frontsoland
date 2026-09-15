"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AvatarConfig } from "@/components/CartoonAvatar";

function normalizeBackendUrl(value: string | undefined) {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
  return normalized || undefined;
}

const BACKEND_URL =
  normalizeBackendUrl(process.env.NEXT_PUBLIC_API_URL) ||
  normalizeBackendUrl(process.env.BACKEND_URL) ||
  (process.env.NODE_ENV === "production" ? "https://sistemasoland.onrender.com" : "http://localhost:8000");

function getApiUrl(path: string) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${BACKEND_URL}/`).toString().replace(/\/$/, "");
}

// 1. Tipamos el estado que devuelve la Server Action
export interface ActionState {
  error?: string;
}

// 2. Aplicamos el tipo ActionState (puede ser nulo la primera vez que carga)
export async function loginAction(
  prevState: ActionState | null | undefined, 
  formData: FormData
): Promise<ActionState | undefined> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return {
      error: "Por favor, ingresa usuario y contraseña.",
    };
  }

  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    let response: Response;
    try {
      response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Validamos que las credenciales sean correctas antes de leer el JSON
    if (!response.ok) {
      return { error: "Credenciales incorrectas. Intenta de nuevo." };
    }

    const data = await response.json();
    if (typeof data.access_token !== "string" || !data.access_token) {
      return { error: "El servidor devolvio una respuesta de autenticacion invalida." };
    }
    const cookieStore = await cookies();
    cookieStore.set("access_token", data.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  } catch (error) {
    console.error(error);
    return {
      error: "Error de conexion con el servidor. Verifica que el backend este encendido.",
    };
  }
  
  redirect("/dashboard");
}

// 3. Tipamos el usuario basándonos en tu esquema UserRead de FastAPI
export interface UserRead {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  username: string;
  level: number;
  permissions?: string[] | null;
  avatar_config?: AvatarConfig | null;
  photo_path?: string | null;
  photo_data?: string | null;
}

// 4. Le decimos a TypeScript que esta función devuelve un UserRead o null
export async function getCurrentUser(): Promise<UserRead | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(getApiUrl("/api/users/me"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete("access_token");
  redirect("/")
}