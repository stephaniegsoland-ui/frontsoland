import { headers } from "next/headers";
import { DashboardLayoutClient } from "./dashboard/DashboardLayoutClient";
import { DashboardNotFoundContent, PublicNotFoundContent } from "@/components/NotFoundComponents";
import { getCurrentUser } from "@/actions/auth";


export default async function GlobalNotFound() {
  const headersList = await headers();
  const fullUrl = headersList.get("referer") || "";
  const isDashboardRoute = fullUrl.includes("/dashboard");

  // Caso A: Si el error ocurrió dentro del Dashboard
  if (isDashboardRoute) {
    const user = await getCurrentUser();
    const username = user ? user.username : "Usuario Activo";
    let roleDescription = "Usuario del Sistema";
    
    if (user) {
      if (user.is_superuser || user.level === 1) roleDescription = "Administrador";
      else if (user.level === 2) roleDescription = "Supervisor";
      else roleDescription = "Operador";
    }

    return (
      <DashboardLayoutClient username={username} roleDescription={roleDescription}>
        <DashboardNotFoundContent />
      </DashboardLayoutClient>
    );
  }

  // Caso B: Si es fuera del dashboard (Login público)
  return <PublicNotFoundContent />;
}