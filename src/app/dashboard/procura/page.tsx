import { fetchProcuraData, fetchStockItems } from "@/actions/procura";
import { ProcuraClient } from "./ProcuraClient";
import { getCurrentUser } from "@/actions/auth";

export default async function Page() {
  const [procuraRes, stockRes, user] = await Promise.all([fetchProcuraData(), fetchStockItems(), getCurrentUser()]);
  const procuras = procuraRes.error ? [] : procuraRes.procuras || [];
  const stockItems = stockRes.error ? [] : stockRes.items || [];
  const currentUser = user || null;
  const isAdminOrSupervisor = currentUser ? currentUser.is_superuser || currentUser.level <= 2 : false;
  const filteredProcuras = currentUser
    ? isAdminOrSupervisor
      ? procuras
      : procuras.filter((procura: { requester_id?: string | number | null }) => String(procura.requester_id) === String(currentUser.id))
    : [];
  const error = procuraRes.error || stockRes.error;

  return (
    <ProcuraClient
      procuras={filteredProcuras}
      stockItems={stockItems}
      error={error}
      currentUser={currentUser}
    />
  );
}
