"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
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
      error:
        "Error de conexion con el servidor. Verifica que el backend este encendido.",
    };
  }
  redirect("/dashboard")
}
