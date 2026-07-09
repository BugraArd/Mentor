import { getProfile } from "@/lib/dal";
import { AppShell } from "@/components/app-shell";

export default async function OdevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile: any = await getProfile();

  const navItems =
    profile.role === "teacher"
      ? [
          { href: "/ogretmen", label: "Panel" },
          { href: "/ogretmen/odev-olustur", label: "Ödev Oluştur" },
        ]
      : [{ href: "/ogrenci", label: "Panel" }];

  const profileHref =
    profile.role === "teacher" ? "/ogretmen/profil" : "/ogrenci/profil";
  const settingsHref =
    profile.role === "teacher" ? "/ogretmen/ayarlar" : "/ogrenci/ayarlar";

  return (
    <AppShell
      fullName={profile.full_name}
      navItems={navItems}
      profileHref={profileHref}
      settingsHref={settingsHref}
    >
      {children}
    </AppShell>
  );
}
