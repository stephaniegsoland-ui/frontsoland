import { NewVehiclesClient } from "./NewVehiclesClient";
import { fetchPersonalData } from "@/actions/personal";

export default async function NewVehiclesPage() {
  const usersRes = await fetchPersonalData();
  const users = Array.isArray(usersRes) ? usersRes : [];

  return <NewVehiclesClient users={users} />;
}