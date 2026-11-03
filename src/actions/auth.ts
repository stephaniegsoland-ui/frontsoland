"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AvatarConfig } from "@/components/CartoonAvatar";
import { getApiUrl } from "@/lib/backend-url";

// 1. Tipamos el estado que devuelve la Server Action
export interface ActionState {
  error?: string;
  mfaRequired?: boolean;
}

// 2. Aplicamos el tipo ActionState (puede ser nulo la primera vez que carga)
export async function loginAction(
  prevState: ActionState | null | undefined, 
  formData: FormData
): Promise<ActionState | undefined> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const totpCode = formData.get("totp_code") as string | null;

  if (!username || !password) {
    return {
      error: "Por favor, ingresa usuario y contraseña.",
    };
  }

  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);
  if (totpCode) body.append("totp_code", totpCode);

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
      const responseBody = await response.json().catch(() => ({}));
      if (responseBody.detail === "MFA_REQUIRED" || responseBody.detail === "MFA_INVALID") {
        return { error: responseBody.detail === "MFA_REQUIRED" ? "Ingresa el código de tu aplicación autenticadora." : "El código de verificación no es válido.", mfaRequired: true };
      }
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
  department?: string | null;
  nombre_completo?: string | null;
  cargo?: string | null;
  hoja_vida?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  mfa_enabled?: boolean;
  last_login_at?: string | null;
  username: string;
  level: number;
  permissions?: string[] | null;
  avatar_config?: AvatarConfig | null;
  photo_path?: string | null;
  photo_data?: string | null;
}

export type UserProfileUpdate = Pick<UserRead, "username" | "email" | "nombre_completo" | "department" | "cargo" | "hoja_vida">;

export interface UserPreferences {
  notifications_enabled: boolean;
  browser_notifications: boolean;
  document_expiry_days: number[] | null;
  timezone: string;
  language: "es-VE" | "es-PE";
  density: "comfortable" | "compact";
  text_size: "normal" | "large";
  reduce_motion: boolean;
}

export interface MFASetupResponse {
  secret: string;
  provisioning_uri: string;
}

export interface SystemSettings {
  company_name: string;
  support_email: string | null;
  support_phone: string | null;
  company_address: string | null;
  default_timezone: string;
  expiry_reminder_days: number[];
  ocr_language: "auto" | "spa" | "eng";
  max_document_upload_mb: number;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_username: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
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

export async function updateCurrentProfile(profile: UserProfileUpdate) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };

  try {
    const response = await fetch(getApiUrl("/api/users/me/profile"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { error: body.detail || "No se pudo guardar el perfil." };
    return { user: body as UserRead };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function changeCurrentPassword(passwords: { current_password: string; new_password: string }) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };

  try {
    const response = await fetch(getApiUrl("/api/users/me/password"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(passwords),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { error: body.detail || "No se pudo cambiar la contraseña." };
    }
    return { success: true };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function listUsersForSettings() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };

  try {
    const response = await fetch(getApiUrl("/api/users/"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { error: body.detail || "No se pudieron cargar los usuarios." };
    return { users: body as UserRead[] };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function saveUserModulePermissions(userId: string, permissions: string[]) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };

  try {
    const response = await fetch(getApiUrl(`/api/users/admin/${encodeURIComponent(userId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ permissions }),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { error: body.detail || "No se pudieron guardar los permisos." };
    return { user: body as UserRead };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function getUserPreferences() {
  return getSettingsResource<UserPreferences>("/api/settings/preferences", "No se pudieron cargar tus preferencias.");
}

export async function saveUserPreferences(preferences: UserPreferences) {
  return updateSettingsResource<UserPreferences>("/api/settings/preferences", preferences, "No se pudieron guardar tus preferencias.");
}

export async function getSystemSettings() {
  return getSettingsResource<SystemSettings>("/api/settings/system", "No se pudo cargar la configuración del sistema.");
}

export async function saveSystemSettings(settings: SystemSettings) {
  return updateSettingsResource<SystemSettings>("/api/settings/system", settings, "No se pudo guardar la configuración del sistema.");
}

export async function getAuditLog() {
  return getSettingsResource<AuditLogEntry[]>("/api/settings/audit?limit=100", "No se pudo cargar la bitácora.");
}

export async function setupCurrentMfa(currentPassword: string) {
  return postUserSecurityAction<MFASetupResponse>("/api/users/me/mfa/setup", { current_password: currentPassword }, "No se pudo iniciar MFA.");
}

export async function enableCurrentMfa(code: string) {
  return postUserSecurityAction<{ mfa_enabled: boolean; sessions_revoked: boolean; recovery_codes: string[] }>("/api/users/me/mfa/enable", { code }, "No se pudo activar MFA.");
}

export async function disableCurrentMfa(currentPassword: string, code: string) {
  return postUserSecurityAction<{ mfa_enabled: boolean; sessions_revoked: boolean }>("/api/users/me/mfa/disable", { current_password: currentPassword, code }, "No se pudo desactivar MFA.");
}

export async function revokeCurrentUserSessions() {
  return postUserSecurityAction<void>("/api/users/me/sessions/revoke", {}, "No se pudieron cerrar las sesiones.");
}

async function getSettingsResource<T>(path: string, fallbackError: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };
  try {
    const response = await fetch(getApiUrl(path), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { error: body.detail || fallbackError };
    return { data: body as T };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

async function updateSettingsResource<T>(path: string, payload: unknown, fallbackError: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };
  try {
    const response = await fetch(getApiUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { error: body.detail || fallbackError };
    return { data: body as T };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

async function postUserSecurityAction<T>(path: string, payload: unknown, fallbackError: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return { error: "La sesión venció. Inicia sesión nuevamente." };
  try {
    const response = await fetch(getApiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => ({}));
    if (!response.ok) return { error: body?.detail || fallbackError };
    return { data: body as T | undefined };
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}