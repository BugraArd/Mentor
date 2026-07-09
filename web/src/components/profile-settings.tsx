"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile-actions";
import { AccountTabs } from "@/components/account-tabs";

export function ProfileInfoForm({
  profile,
  profilHref,
  ayarlarHref,
}: {
  profile: {
    full_name: string;
    email: string | null;
    phone: string | null;
    role: "teacher" | "student" | "admin";
  };
  profilHref: string;
  ayarlarHref: string;
}) {
  const [infoState, infoAction, infoPending] = useActionState(
    updateProfile,
    undefined
  );

  const roleLabel =
    profile.role === "teacher"
      ? "Öğretmen"
      : profile.role === "student"
      ? "Öğrenci"
      : "Yönetici";

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink">Profil</h1>
        <p className="text-ink-soft mt-1">
          Hesap bilgilerini buradan güncelleyebilirsin.
        </p>
      </div>

      <AccountTabs profilHref={profilHref} ayarlarHref={ayarlarHref} />

      <div className="mb-6 flex justify-center">
        <span className="badge badge-accent">{roleLabel}</span>
      </div>

      <form action={infoAction} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            Ad Soyad
          </label>
          <input
            name="fullName"
            type="text"
            defaultValue={profile.full_name}
            className="input-field"
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            E-posta
          </label>
          <input
            type="email"
            value={profile.email ?? ""}
            disabled
            className="input-field opacity-60 cursor-not-allowed"
          />
          <p className="text-xs text-ink-faint mt-1">
            E-posta adresi değiştirilemez.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            Telefon (opsiyonel)
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            className="input-field"
            placeholder="05xx xxx xx xx"
          />
        </div>

        {infoState?.error && (
          <p className="text-sm text-time">{infoState.error}</p>
        )}
        {infoState?.success && (
          <p className="text-sm text-go">Bilgiler güncellendi ✓</p>
        )}

        <button
          type="submit"
          disabled={infoPending}
          className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {infoPending ? "Kaydediliyor..." : "Bilgileri Kaydet"}
        </button>
      </form>
    </div>
  );
}
