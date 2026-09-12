export type ModulePermission =
  | "vehiculos"
  | "stock"
  | "seguridad"
  | "scanner"
  | "ia"
  | "personal"
  | "procura"
  | "tiempo"
  | "reportes"
  | "chat"
  | "administracion"
  | "ambiente"
  | "configuracion";

export const MODULE_OPTIONS: { key: ModulePermission; label: string }[] = [
  { key: "vehiculos", label: "Vehículos" },
  { key: "stock", label: "Stock" },
  { key: "seguridad", label: "Seguridad" },
  { key: "scanner", label: "Scanner" },
  { key: "ia", label: "Consulta IA" },
  { key: "personal", label: "Personal" },
  { key: "procura", label: "Procura" },
  { key: "tiempo", label: "Hoja de Tiempo" },
  { key: "reportes", label: "Reportes" },
  { key: "chat", label: "Chat interno" },
  { key: "administracion", label: "Administración" },
  { key: "ambiente", label: "Ambiente" },
  { key: "configuracion", label: "Configuración" },
];

const PATH_PERMISSIONS: [string, ModulePermission][] = [
  ["/dashboard/vehiculos", "vehiculos"],
  ["/dashboard/stock", "stock"],
  ["/dashboard/operaciones-seguridad", "seguridad"],
  ["/dashboard/seguridad-epp", "seguridad"],
  ["/dashboard/seguridad-permisos", "seguridad"],
  ["/dashboard/ambiente", "ambiente"],
  ["/dashboard/inspeccion", "scanner"],
  ["/dashboard/ia", "ia"],
  ["/dashboard/personal", "personal"],
  ["/dashboard/procura", "procura"],
  ["/dashboard/tiempo", "tiempo"],
  ["/dashboard/timesheet", "tiempo"],
  ["/dashboard/administracion/tiempo", "tiempo"],
  ["/dashboard/reportes", "reportes"],
  ["/dashboard/chat", "chat"],
  ["/dashboard/administracion/companies", "administracion"],
  ["/dashboard/administracion/pendientes", "administracion"],
  ["/dashboard/administracion/peaje", "administracion"],
  ["/dashboard/administracion/retencion", "administracion"],
  ["/dashboard/administracion", "administracion"],
  ["/dashboard/configuracion", "configuracion"],
];

export function hasModuleAccess(
  level: number,
  permissions: string[] | null | undefined,
  permission: ModulePermission,
) {
  return level === 1 || permissions == null || permissions.includes(permission);
}

export function permissionForPath(pathname: string): ModulePermission | null {
  return PATH_PERMISSIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? null;
}