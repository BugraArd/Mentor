import { requireRole } from "@/lib/dal";
import { AccountSettingsForm } from "@/components/account-settings-form";

export default async function OgretmenAyarlarPage() {
  await requireRole("teacher");
  return (
    <AccountSettingsForm
      profilHref="/ogretmen/profil"
      ayarlarHref="/ogretmen/ayarlar"
    />
  );
}
