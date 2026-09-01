import { getCurrentUser } from "@/actions/auth";
import DashboardLayoutClient from "./DashboardLayoutClientWrapper";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  username,
  roleDescription,
  photoData,
}: {
  children: React.ReactNode;
  username?: string;
  roleDescription?: string;
  photoData?: string | null;
}) {
  const user = await getCurrentUser();
  let resolvedUsername = username;
  let resolvedRoleDescription = roleDescription;
  const resolvedPhotoData = photoData;

  if (!resolvedUsername || !resolvedRoleDescription) {
    resolvedUsername = user?.username || "Usuario Activo";
    resolvedRoleDescription = "Usuario del Sistema";
    if (user) {
      if (user.is_superuser || user.level === 1) {
        resolvedRoleDescription = "Administrador";
      } else if (user.level === 2) {
        resolvedRoleDescription = "Supervisor";
      } else {
        resolvedRoleDescription = "Operador";
      }
    }
  }

  // Prefer explicit photo_path passed from parent, otherwise use user's `photo_path` returned by the API
  const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

  const apiPhotoPath = user?.photo_path ?? null;
  const apiPhotoData = user?.photo_data ?? null;
  const rawPhoto = resolvedPhotoData ?? apiPhotoPath ?? apiPhotoData ?? null;

  const finalPhotoUrl = rawPhoto
    ? rawPhoto.startsWith("/static/")
      ? `${BACKEND_URL}${rawPhoto}`
      : rawPhoto.startsWith("data:")
      ? rawPhoto
      : rawPhoto.startsWith("http")
      ? rawPhoto
      : `data:image/png;base64,${rawPhoto}`
    : null;

  return (
    <DashboardLayoutClient
      username={resolvedUsername}
      roleDescription={resolvedRoleDescription}
      photoData={finalPhotoUrl}
      currentUser={user ? {
        id: user.id,
        username: user.username,
        level: user.level,
        email: user.email,
      } : undefined}
    >
      {children}
    </DashboardLayoutClient>
  );
}
