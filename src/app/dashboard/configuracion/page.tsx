import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <SettingsClient user={user} />;
}