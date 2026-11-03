import { getCurrentUser } from "@/actions/auth";
import { getBackendUrl } from "@/lib/backend-url";
import { SystemAssistantClient } from "./SystemAssistantClient";

export default async function IAPage() {
  const user = await getCurrentUser().catch(() => null);
  const backendUrl = getBackendUrl();
  const rawPhoto = user?.photo_path ?? user?.photo_data ?? null;
  const photoData = rawPhoto
    ? rawPhoto.startsWith("/static/")
      ? `${backendUrl}${rawPhoto}`
      : rawPhoto.startsWith("data:") || rawPhoto.startsWith("http")
        ? rawPhoto
        : `data:image/png;base64,${rawPhoto}`
    : null;

  return <SystemAssistantClient username={user?.username || "Usuario"} photoData={photoData} userId={user?.id || ""} avatarConfig={user?.avatar_config as any} />;
}
