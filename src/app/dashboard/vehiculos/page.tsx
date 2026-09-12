import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { VehiculosClient } from "./VehiculosClient";
import { fetchFleetData } from "@/actions/vehiculos";
import { getCurrentUser } from "@/actions/auth";
import { fetchPersonalData } from "@/actions/personal";

export default async function VehiculosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const currentUser = await getCurrentUser();
  const data = await fetchFleetData();
  const users = await fetchPersonalData();
  const userLevel = currentUser?.level ?? 3;

  if (!token) {
    return notFound();
  }

  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  const typeRecords = Array.isArray(data?.typeRecord) ? data.typeRecord : [];

  return (
    <VehiculosClient
      initialVehicles={vehicles}
      typeRecords={typeRecords}
      users={users}
      userLevel={Number(userLevel)}
    />
  );
}
