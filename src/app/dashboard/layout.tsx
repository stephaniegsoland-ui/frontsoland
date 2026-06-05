import { getCurrentUser } from "@/actions/auth";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Traemos el usuario logueado en el servidor de forma segura
  const user = await getCurrentUser();

  // Variables por defecto si falla o si no encuentra datos
  const username = user ? user.username : "Usuario Activo";
  
  // Mapeamos el nivel del esquema UserRead a un texto amigable para la interfaz
  let roleDescription = "Usuario del Sistema";
  if (user) {
    if (user.is_superuser || user.level === 1) {
      roleDescription = "Administrador";
    } else if (user.level === 2) {
      roleDescription = "Supervisor";
    } else {
      roleDescription = "Operador";
    }
  }

  return (
    <DashboardLayoutClient username={username} roleDescription={roleDescription}>
      {children}
    </DashboardLayoutClient>
  );
}