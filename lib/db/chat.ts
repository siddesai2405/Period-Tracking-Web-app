import { supabase } from "@/lib/supabase";
import type { StoredChatMessage } from "@/lib/store";

const MAX_MESSAGES = 60;

export async function getChatHistory(userId: string): Promise<StoredChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES);

  if (error || !data) return [];
  return data.map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
    ts: new Date(row.created_at).getTime(),
  }));
}

export async function appendMessage(userId: string, msg: StoredChatMessage): Promise<void> {
  await supabase.from("chat_messages").insert({
    user_id: userId,
    role: msg.role,
    content: msg.content,
  });

  // Keep only last MAX_MESSAGES — delete older ones
  const { data } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(MAX_MESSAGES, 9999);

  if (data && data.length > 0) {
    await supabase
      .from("chat_messages")
      .delete()
      .in("id", data.map((r) => r.id));
  }
}

export async function clearChat(userId: string): Promise<void> {
  await supabase.from("chat_messages").delete().eq("user_id", userId);
}
