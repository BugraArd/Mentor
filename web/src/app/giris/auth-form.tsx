"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/database.types";

type Tab = "giris" | "kayit";

export function AuthForm() {
  const [tab, setTab] = useState<Tab>("giris");
  const [role, setRole] = useState<UserRole>("teacher");

  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    undefined
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    undefined
  );

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setTab("giris")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "giris"
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-faint"
          }`}
        >
          Giriş Yap
        </button>
        <button
          type="button"
          onClick={() => setTab("kayit")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "kayit"
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-faint"
          }`}
        >
          Kayıt Ol
        </button>
      </div>

      {tab === "giris" ? (
        <form action={signInAction} className="space-y-4">
          <Field label="E-posta" name="email" type="email" required />
          <Field label="Şifre" name="password" type="password" required />
          {signInState?.error && <ErrorText>{signInState.error}</ErrorText>}
          <SubmitButton pending={signInPending}>Giriş Yap</SubmitButton>
        </form>
      ) : (
        <form action={signUpAction} className="space-y-4">
          <div>
            <span className="mb-2 block text-sm font-medium text-ink-soft">
              Rolün ne?
            </span>
            <input type="hidden" name="role" value={role} />
            <div className="grid grid-cols-2 gap-2">
              <RoleCard
                label="Öğretmenim"
                active={role === "teacher"}
                onClick={() => setRole("teacher")}
              />
              <RoleCard
                label="Öğrenciyim"
                active={role === "student"}
                onClick={() => setRole("student")}
              />
            </div>
          </div>

          <Field label="Ad Soyad" name="fullName" required />
          <Field label="E-posta" name="email" type="email" required />
          <Field
            label="Şifre"
            name="password"
            type="password"
            required
            hint="En az 8 karakter"
          />

          {role === "student" && (
            <Field
              label="Mentörünün davet kodu"
              name="inviteCode"
              required
              hint="Öğretmeninden aldığın kod"
            />
          )}

          {signUpState?.error && <ErrorText>{signUpState.error}</ErrorText>}
          <SubmitButton pending={signUpPending}>Devam Et</SubmitButton>
        </form>
      )}
    </div>
  );
}

function RoleCard({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-accent bg-accent-wash text-accent-ink"
          : "border-line text-ink-soft hover:border-ink-faint"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-wash"
      />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-time/30 bg-time-wash px-3 py-2 text-sm text-time">
      {children}
    </p>
  );
}

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Bekleyin…" : children}
    </button>
  );
}
