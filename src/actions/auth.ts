"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
    const response = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    // Validamos que las credenciales sean correctas antes de leer el JSON
    if (!response.ok) {
      return { error: "Credenciales incorrectas. Intenta de nuevo." };
    }

    const data = await response.json();
    const cookieStore = await cookies();
    cookieStore.set("access_token", data.access_token, {
      httpOnly: true,
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
  is_active: number;
  is_superuser: boolean;
  is_verified: boolean;
  username: string;
  level: number;
}

// 4. Le decimos a TypeScript que esta función devuelve un UserRead o null
export async function getCurrentUser(): Promise<UserRead | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  try {
    const res = await fetch("http://localhost:8000/api/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", 
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return null;
  }
}