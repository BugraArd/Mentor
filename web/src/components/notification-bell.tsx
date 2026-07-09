"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "./icons";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/actions/notification-actions";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  return `${Math.floor(hr / 24)} gün önce`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await getMyNotifications();
    setItems(data.items);
    setUnread(data.unreadCount);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleItemClick(id: string, alreadyRead: string | null) {
    if (alreadyRead) return;
    await markNotificationRead(id);
    load();
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Bildirimler"
        aria-expanded={open}
        className={`relative grid h-8 w-8 place-items-center rounded-full transition-colors ${
          open ? "bg-surface-2 text-ink" : "text-ink-soft hover:bg-surface-2"
        }`}
      >
        <BellIcon className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in rounded-lg border border-line bg-surface py-1 shadow-lg">
          <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
            <p className="text-sm font-medium text-ink">Bildirimler</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-accent hover:underline"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-faint">
                Henüz bildirimin yok.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n.id, n.read_at)}
                  className={`block w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2 ${
                    !n.read_at ? "bg-accent-wash/40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${!n.read_at ? "text-ink" : "text-ink-soft"}`}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-ink-faint">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-ink-faint">{n.body}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
