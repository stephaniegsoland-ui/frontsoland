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
  type CountResult = { count: number } | { error: string };
  const results: CountResult[] = await Promise.all(paths.map(async (path) => {
    try {
      const response = await fetch(getApiUrl(path), {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) return { error: `HTTP ${response.status}` };

      const records: unknown = await response.json();
      if (!Array.isArray(records)) return { error: "respuesta no válida" };
      return { count: records.length };
    } catch {
      return { error: "fallo de conexión" };
    }
  }));

  const failedResults = results.filter((result): result is { error: string } => "error" in result);
  if (failedResults.length > 0) return { error: failedResults[0].error };

  const successfulResults = results.filter((result): result is { count: number } => "count" in result);
  return {
    count: successfulResults.reduce((total, result) => total + result.count, 0),
  };
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

    const data = await fetchRecordCount(module.paths, token);
    if ("error" in data) return { error: `${module.name} (${data.error})` };
    return { result: { name: module.name, count: data.count } };
  }));

  return {
    modules: results.flatMap(({ result }) => result ? [result] : []),
    errors: results.flatMap(({ error }) => error ? [error] : []),
  };
}
