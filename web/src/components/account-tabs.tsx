"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountTabs({
  profilHref,
  ayarlarHref,
}: {
  profilHref: string;
  ayarlarHref: string;
}) {
  const pathname = usePathname();
  const tabs = [
    { href: profilHref, label: "Profil" },
    { href: ayarlarHref, label: "Ayarlar" },
  ];

  return (
    <div className="flex justify-center gap-8 border-b border-line-soft mb-8">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
