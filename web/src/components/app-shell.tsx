"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string };

export function AppShell({
  fullName,
  navItems,
  profileHref,
  settingsHref,
  children,
}: {
  fullName: string;
  navItems: NavItem[];
  profileHref: string;
  settingsHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sayfa değiştiğinde menü açık kalmasın
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // En uzun eşleşen href aktif sayılır — "/ogretmen/odev-olustur" hem
  // "/ogretmen" hem kendi kaydıyla eşleşir, uzun olan kazanır.
  const activeHref = navItems
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isAccountActive =
    pathname === profileHref ||
    pathname.startsWith(profileHref + "/") ||
    pathname === settingsHref ||
    pathname.startsWith(settingsHref + "/");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-future text-xs font-bold text-white">
          M
        </div>
        <span className="font-bold tracking-tight">MENTOR</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-ink-soft sm:inline">
            {fullName}
          </span>
          <ThemeToggle />
          <NotificationBell />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title="Hesap"
              aria-expanded={menuOpen}
              className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors ${
                isAccountActive || menuOpen
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-ink-soft hover:opacity-80"
              }`}
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-line bg-surface py-1 shadow-lg z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-line-soft">
                  <p className="text-sm font-medium text-ink truncate">
                    {fullName}
                  </p>
                </div>
                <Link
                  href={profileHref}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Profil
                </Link>
                <Link
                  href={settingsHref}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Ayarlar
                </Link>
              </div>
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint"
            >
              Çıkış
            </button>
          </form>
        </div>
      </header>

      {/* Mobil sekme çubuğu: masaüstündeki yan menü `sm` altında gizli
          olduğundan, aynı sekmeler burada yatay bir şerit olarak da
          gösterilir — aksi halde küçük ekranda "Panel" gibi sekmelere
          hiç erişilemezdi. */}
      <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 sm:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              item.href === activeHref
                ? "bg-surface-2 text-ink"
                : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-1">
        <nav className="hidden w-48 shrink-0 flex-col gap-1 border-r border-line bg-surface p-4 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                item.href === activeHref
                  ? "bg-surface-2 text-ink"
                  : "text-ink-soft hover:bg-surface-2"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
