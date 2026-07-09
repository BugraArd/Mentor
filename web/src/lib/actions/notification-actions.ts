"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getMyNotifications(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const profile: any = await getProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, read_at, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(15);

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  return {
    items: (data ?? []) as NotificationItem[],
    unreadCount: count ?? 0,
  };
}

export async function markNotificationRead(id: string) {
  const profile: any = await getProfile();
  const supabase = await createClient();
  await (supabase as any)
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id);
}

export async function markAllNotificationsRead() {
  const profile: any = await getProfile();
  const supabase = await createClient();
  await (supabase as any)
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
}
