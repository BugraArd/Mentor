"use client";

import { useActionState } from "react";
import { submitAssignment } from "@/lib/actions/submission-actions";
import { SendIcon } from "@/components/icons";

export function SubmitForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, pending] = useActionState(submitAssignment, undefined);

  return (
    <form action={action} className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-ink">Teslim Et</h3>
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">
          Yanıtın
        </label>
        <textarea
          name="body"
          rows={8}
          className="input-field"
          placeholder="Ödev yanıtını buraya yaz..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">
          Dosya Eki URL (opsiyonel)
        </label>
        <input
          name="attachmentUrl"
          type="url"
          className="input-field"
          placeholder="https://..."
        />
      </div>

      {state?.error && <p className="text-sm text-time">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <SendIcon className="h-4 w-4" />
        {pending ? "Gönderiliyor..." : "Teslim Et"}
      </button>
    </form>
  );
}
