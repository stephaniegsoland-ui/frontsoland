import { getCurrentUser } from "@/actions/auth";
import { fetchStockData } from "@/actions/inventario";
import { DashboardOverviewClient } from "./DashboardOverviewClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let user = null;
  let stockData: Awaited<ReturnType<typeof fetchStockData>> = { categorias: [], resumen: { items: [] } };

  try {
    [user, stockData] = await Promise.all([getCurrentUser(), fetchStockData()]);
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);
  }

  const username = user?.username || "Usuario";

  return (
    <DashboardOverviewClient
      username={username}
      userLevel={user?.level}
      userPermissions={user?.permissions}
      categories={Array.isArray(stockData.categorias) ? stockData.categorias : []}
      resumen={stockData.resumen && typeof stockData.resumen === "object" ? stockData.resumen : { items: [] }}
      errorMessage={stockData.error ?? null}
    />
  );
}