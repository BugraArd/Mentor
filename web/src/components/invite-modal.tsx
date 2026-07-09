"use client";

import { useState } from "react";
import { createInviteCode } from "@/lib/actions/mentor-actions";
import { XIcon, CopyIcon, CheckCircleIcon } from "@/components/icons";

export function InviteModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const result = await createInviteCode();
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.inviteCode) {
      setCode(result.inviteCode);
    }
  }

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setCode(null);
    setError(null);
    setCopied(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative glass-card max-w-sm w-full mx-4 p-6 animate-slide-up">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-ink-faint hover:text-ink transition-colors"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold mb-2">Öğrenci Davet Kodu</h3>
        <p className="text-sm text-ink-soft mb-6">
          Bu kodu öğrencinle paylaş. Kayıt olurken kullanacak.
        </p>

        {!code && !loading && (
          <button
            onClick={handleCreate}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Kod Oluştur
          </button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {code && (
          <div className="text-center">
            <div className="rounded-xl bg-surface-2 px-6 py-4 mb-4">
              <p className="stat-number text-3xl font-bold tracking-widest">
                {code}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-go" />
                  Kopyalandı!
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  Kopyala
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-time mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
