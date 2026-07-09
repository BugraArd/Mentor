import { requireRole } from "@/lib/dal";
import { AppShell } from "@/components/app-shell";

const NAV_ITEMS = [
  { href: "/ogretmen", label: "Panel" },
  { href: "/ogretmen/odev-olustur", label: "Ödev Oluştur" },
];

export default async function OgretmenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile: any = await requireRole("teacher");
  return (
    <AppShell
      fullName={profile.full_name}
      navItems={NAV_ITEMS}
      profileHref="/ogretmen/profil"
      settingsHref="/ogretmen/ayarlar"
    >
      {children}
    </AppShell>
  );
}
