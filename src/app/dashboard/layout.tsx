import { getCurrentUser } from "@/actions/auth";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

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
  let user = null;
  let resolvedUsername = username;
  let resolvedRoleDescription = roleDescription;
  let resolvedPhotoData = photoData;

  if (!resolvedUsername || !resolvedRoleDescription) {
    user = await getCurrentUser();
    resolvedUsername = user ? user.username : "Usuario Activo";
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

  const finalPhotoData = resolvedPhotoData ?? user?.photo_data ?? null;

  return (
    <DashboardLayoutClient
      username={resolvedUsername}
      roleDescription={resolvedRoleDescription}
      photoData={finalPhotoData}
    >
      {children}
    </DashboardLayoutClient>
  );
}
