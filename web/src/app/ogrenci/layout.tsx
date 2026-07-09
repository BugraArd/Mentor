import { requireRole } from "@/lib/dal";
import { AppShell } from "@/components/app-shell";

const NAV_ITEMS = [{ href: "/ogrenci", label: "Panel" }];

export default async function OgrenciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile: any = await requireRole("student");
  return (
    <AppShell
      fullName={profile.full_name}
      navItems={NAV_ITEMS}
      profileHref="/ogrenci/profil"
      settingsHref="/ogrenci/ayarlar"
    >
      {children}
    </AppShell>
  );
}
