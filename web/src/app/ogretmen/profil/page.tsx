import { requireRole } from "@/lib/dal";
import { ProfileInfoForm } from "@/components/profile-settings";

export default async function OgretmenProfilPage() {
  const profile: any = await requireRole("teacher");
  return (
    <ProfileInfoForm
      profile={profile}
      profilHref="/ogretmen/profil"
      ayarlarHref="/ogretmen/ayarlar"
    />
  );
}
