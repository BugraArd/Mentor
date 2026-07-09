import { requireRole } from "@/lib/dal";
import { ProfileInfoForm } from "@/components/profile-settings";

export default async function OgrenciProfilPage() {
  const profile: any = await requireRole("student");
  return (
    <ProfileInfoForm
      profile={profile}
      profilHref="/ogrenci/profil"
      ayarlarHref="/ogrenci/ayarlar"
    />
  );
}
