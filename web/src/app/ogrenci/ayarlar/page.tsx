import { requireRole } from "@/lib/dal";
import { AccountSettingsForm } from "@/components/account-settings-form";

export default async function OgrenciAyarlarPage() {
  await requireRole("student");
  return (
    <AccountSettingsForm
      profilHref="/ogrenci/profil"
      ayarlarHref="/ogrenci/ayarlar"
    />
  );
}
