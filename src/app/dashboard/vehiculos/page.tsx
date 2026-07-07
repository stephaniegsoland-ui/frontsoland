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

  return (
    <VehiculosClient
      initialVehicles={data.vehicles}
      typeRecords={data.typeRecord}
      users={users}
      userLevel={Number(userLevel)}
    />
  );
}
