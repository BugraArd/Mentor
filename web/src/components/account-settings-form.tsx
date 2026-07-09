"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/profile-actions";
import { AccountTabs } from "@/components/account-tabs";

export function AccountSettingsForm({
  profilHref,
  ayarlarHref,
}: {
  profilHref: string;
  ayarlarHref: string;
}) {
  const [passState, passAction, passPending] = useActionState(
    updatePassword,
    undefined
  );

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink">Ayarlar</h1>
        <p className="text-ink-soft mt-1">Şifreni buradan güncelleyebilirsin.</p>
      </div>

      <AccountTabs profilHref={profilHref} ayarlarHref={ayarlarHref} />

      <form action={passAction} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            Yeni Şifre
          </label>
          <input
            name="password"
            type="password"
            className="input-field"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            Yeni Şifre (tekrar)
          </label>
          <input
            name="passwordConfirm"
            type="password"
            className="input-field"
            required
            minLength={8}
          />
        </div>

        {passState?.error && (
          <p className="text-sm text-time">{passState.error}</p>
        )}
        {passState?.success && (
          <p className="text-sm text-go">Şifre güncellendi ✓</p>
        )}

        <button
          type="submit"
          disabled={passPending}
          className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {passPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
      </form>
    </div>
  );
}
