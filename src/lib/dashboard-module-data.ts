import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/backend-url";
import { hasModuleAccess, type ModulePermission } from "@/lib/permissions";

export interface DashboardModuleData {
  modules: Array<{ name: string; count: number }>;
  errors: string[];
}

const moduleSources: Array<{
  name: string;
  permission: ModulePermission;
  paths: string[];
  requiresSupervisor?: boolean;
}> = [
  { name: "Inventario", permission: "stock", paths: [] },
  { name: "Procura", permission: "procura", paths: ["/api/procura/"] },
  { name: "Personal", permission: "personal", paths: ["/api/users/"], requiresSupervisor: true },
  { name: "Vehículos", permission: "vehiculos", paths: ["/api/vehicle/"] },
  { name: "Inspecciones", permission: "scanner", paths: ["/api/vehicle/inspection/history"] },
  { name: "Seguridad", permission: "seguridad", paths: ["/api/security/epp/history", "/api/security/permit/history"] },
  { name: "Ambiente", permission: "ambiente", paths: ["/api/environment/talks", "/api/environment/drills", "/api/environment/documents"] },
  { name: "Calidad", permission: "calidad", paths: ["/api/quality/records"] },
  { name: "CAD", permission: "cad", paths: ["/api/cad/drawings"] },
  { name: "Hoja de tiempo", permission: "tiempo", paths: ["/api/timesheet/"] },
  { name: "Documentos", permission: "administracion", paths: ["/api/documents"] },
  { name: "Administración", permission: "administracion", paths: ["/api/admin/companies/", "/api/admin/invoices", "/api/admin/peaje/"], requiresSupervisor: true },
  { name: "Chat interno", permission: "chat", paths: ["/api/chat/"] },
];

async function fetchRecordCount(paths: string[], token: string) {
  const counts = await Promise.all(paths.map(async (path) => {
    const response = await fetch(getApiUrl(path), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`${path} respondió ${response.status}.`);

    const records: unknown = await response.json();
    if (!Array.isArray(records)) throw new Error(`${path} no devolvió una lista.`);
    return records.length;
  }));

  return counts.reduce((total, count) => total + count, 0);
}

export async function fetchDashboardModuleData(
  userLevel: number | undefined,
  userPermissions: string[] | null | undefined,
  inventoryCount: number,
): Promise<DashboardModuleData> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token || userLevel === undefined) {
    return { modules: [], errors: ["No se pudo validar la sesión para consultar los módulos."] };
  }

  const accessibleModules = moduleSources.filter(({ permission, requiresSupervisor }) =>
    hasModuleAccess(userLevel, userPermissions, permission)
    && (!requiresSupervisor || userLevel <= 2),
  );

  const results = await Promise.all(accessibleModules.map(async (module) => {
    if (module.name === "Inventario") {
      return { result: { name: module.name, count: inventoryCount } };
    }

    try {
      const count = await fetchRecordCount(module.paths, token);
      return { result: { name: module.name, count } };
    } catch (error) {
      console.warn(`No se pudieron consultar los datos del módulo ${module.name}:`, error);
      return { error: module.name };
    }
  }));

  return {
    modules: results.flatMap(({ result }) => result ? [result] : []),
    errors: results.flatMap(({ error }) => error ? [error] : []),
  };
}
