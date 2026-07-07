import { fetchPersonalData } from "@/actions/personal";
import { fetchFleetData } from "@/actions/vehiculos";
import { PeajeClient } from "./PeajeClient";

export default async function VehiculosPeajePage() {
  const [fleetResult, usersResult] = await Promise.all([
    fetchFleetData(),
    fetchPersonalData(),
  ]);

  const vehicles = Array.isArray(fleetResult.vehicles) ? fleetResult.vehicles : [];
  const users = Array.isArray(usersResult) ? usersResult : [];
  const initialFetchError = typeof usersResult === "object" && !Array.isArray(usersResult)
    ? usersResult.error || null
    : null;

  return <PeajeClient initialVehicles={vehicles} initialUsers={users} initialFetchError={initialFetchError} />;
}
