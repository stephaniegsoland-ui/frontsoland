import { getCurrentUser } from "@/actions/auth";
import { fetchStockData } from "@/actions/inventario";
import { DashboardOverviewClient } from "./DashboardOverviewClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let user = null;
  let stockData: any = { categorias: [], resumen: { items: [] } };

  try {
    [user, stockData] = await Promise.all([getCurrentUser(), fetchStockData()]);
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);
  }

  const username = user?.username || "Usuario";
  const level = user?.level ?? 3;
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const rawPhoto = user?.photo_path ?? user?.photo_data ?? null;
  const photoData = rawPhoto
    ? rawPhoto.startsWith("/static/")
      ? `${backendUrl}${rawPhoto}`
      : rawPhoto.startsWith("data:") || rawPhoto.startsWith("http")
        ? rawPhoto
        : `data:image/png;base64,${rawPhoto}`
    : null;

  return (
    <DashboardOverviewClient
      username={username}
      level={level}
      avatarConfig={user?.avatar_config}
      photoData={photoData}
      categories={Array.isArray(stockData?.categorias) ? stockData.categorias : []}
      resumen={stockData?.resumen && typeof stockData.resumen === "object" ? stockData.resumen : { items: [] }}
      errorMessage={typeof stockData?.error === "string" ? stockData.error : null}
    />
  );
}