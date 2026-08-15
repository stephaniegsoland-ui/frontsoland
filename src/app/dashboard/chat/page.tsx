import { getCurrentUser } from "@/actions/auth";
import { ChatInternalClient } from "./ChatInternalClient";

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <ChatInternalClient currentUser={user} />;
}
