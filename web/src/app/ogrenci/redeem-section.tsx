"use client";

import { useActionState } from "react";
import { redeemInvite } from "@/lib/actions/mentor-actions";

export function RedeemSection() {
  const [state, action, pending] = useActionState(redeemInvite, undefined);

  if (state?.inviteCode) {
    return (
      <div className="glass-card p-5 border-go/30 bg-go-wash animate-fade-in">
        <p className="text-go font-semibold">✓ Mentörünle eşleştin!</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 border-accent/30 animate-slide-up">
      <h3 className="font-semibold mb-2">Mentörünle Bağlan</h3>
      <p className="text-sm text-ink-soft mb-4">
        Öğretmeninden aldığın davet kodunu gir.
      </p>
      <form action={action} className="flex gap-3">
        <input
          name="code"
          placeholder="Davet kodu"
          className="input-field flex-1"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "..." : "Bağlan"}
        </button>
      </form>
      {state?.error && (
        <p className="text-sm text-time mt-2">{state.error}</p>
      )}
    </div>
  );
}
