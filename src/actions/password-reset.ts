"use server";

import { getApiUrl } from "@/lib/backend-url";

export interface PasswordResetState {
  error?: string;
  success?: string;
}

export async function requestPasswordReset(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Ingresa el correo asociado a tu cuenta." };

  try {
    const response = await fetch(getApiUrl("/api/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    if (!response.ok) {
      return { error: "No se pudo enviar el correo. Intenta de nuevo más tarde." };
    }

    return {
      success: "Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.",
    };
  } catch (error) {
    console.error("Error solicitando recuperación de contraseña:", error);
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo más tarde." };
  }
}

export async function resetPassword(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");

  if (!token) return { error: "El enlace de recuperación no es válido." };
  if (password.length < 8 || password.length > 128) {
    return { error: "La contraseña debe tener entre 8 y 128 caracteres." };
  }
  if (password !== confirmation) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    const response = await fetch(getApiUrl("/api/auth/reset-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });
    if (!response.ok) {
      return { error: "El enlace venció o no es válido. Solicita uno nuevo." };
    }

    return { success: "Tu contraseña se cambió correctamente. Ya puedes iniciar sesión." };
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo más tarde." };
  }
}
