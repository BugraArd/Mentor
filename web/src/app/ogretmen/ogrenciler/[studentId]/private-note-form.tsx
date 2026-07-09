"use client";

import { useActionState, useEffect, useRef } from "react";
import { savePrivateNote } from "@/lib/actions/evaluation-actions";
import { EditIcon } from "@/components/icons";

export function PrivateNoteForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(savePrivateNote, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="studentId" value={studentId} />
      <textarea
        name="note"
        rows={3}
        required
        className="input-field"
        placeholder="Bu öğrenciyle ilgili sadece senin göreceğin bir not yaz..."
      />
      {state?.error && <p className="text-sm text-time">{state.error}</p>}
      {state?.success && <p className="text-sm text-go">Not kaydedildi.</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <EditIcon className="h-4 w-4" />
        {pending ? "Kaydediliyor..." : "Not Ekle"}
      </button>
    </form>
  );
}
