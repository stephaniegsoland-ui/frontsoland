import { fetchProcuraData, fetchStockItems } from "@/actions/procura";
import { ProcuraClient } from "./ProcuraClient";

export default async function Page() {
  const [procuraRes, stockRes] = await Promise.all([fetchProcuraData(), fetchStockItems()]);
  const procuras = procuraRes.error ? undefined : procuraRes.procuras;
  const stockItems = stockRes.error ? undefined : stockRes.items;
  const error = procuraRes.error || stockRes.error;

  return <ProcuraClient procuras={procuras} stockItems={stockItems} error={error} />;
}
