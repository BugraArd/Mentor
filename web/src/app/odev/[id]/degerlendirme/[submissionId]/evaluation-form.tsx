"use client";

import { useActionState, useState } from "react";
import { evaluateSubmission, savePrivateNote } from "@/lib/actions/evaluation-actions";
import { RubricScorer } from "@/components/rubric-scorer";
import { LockIcon, CheckCircleIcon, AlertCircleIcon } from "@/components/icons";
import type { RubricCriterion, RubricScore } from "@/lib/database.types";

export function EvaluationForm({
  submissionId,
  assignmentId,
  studentId,
  rubric,
  isAssignmentExpired,
}: {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  rubric: RubricCriterion[] | null;
  isAssignmentExpired?: boolean;
}) {
  const [evalState, evalAction, evalPending] = useActionState(
    evaluateSubmission,
    undefined
  );
  const [noteState, noteAction, notePending] = useActionState(
    savePrivateNote,
    undefined
  );
  const [scores, setScores] = useState<RubricScore[]>(
    (rubric ?? []).map((c) => ({ ...c, score: 0 }))
  );
  const [requiresRevision, setRequiresRevision] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");

  const needsNewDeadline = requiresRevision && !!isAssignmentExpired;

  return (
    <div className="space-y-4">
      {/* Evaluation Form */}
      <form action={evalAction} className="glass-card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-ink">
          Değerlendirme Formu
        </h2>
        <input type="hidden" name="submissionId" value={submissionId} />
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <input
          type="hidden"
          name="rubricScores"
          value={JSON.stringify(scores)}
        />
        <input
          type="hidden"
          name="requiresRevision"
          value={String(requiresRevision)}
        />

        {rubric && rubric.length > 0 && (
          <RubricScorer
            criteria={rubric}
            scores={scores}
            onChange={setScores}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            Geri Bildirim
          </label>
          <textarea
            name="feedback"
            rows={4}
            className="input-field"
            placeholder="Öğrenciye yazılı geri bildirim..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">
            Sesli Geri Bildirim URL (opsiyonel)
          </label>
          <input
            name="voiceFeedbackUrl"
            type="url"
            className="input-field"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresRevision}
              onChange={(e) => setRequiresRevision(e.target.checked)}
              className="rounded border-line"
            />
            <span className="text-sm font-medium text-time">
              Revizyon iste
            </span>
          </label>
        </div>

        {needsNewDeadline && (
          <div className="rounded-lg bg-time-wash p-4 space-y-2">
            <p className="text-sm font-medium text-time">
              Bu ödevin teslim süresi doldu
            </p>
            <p className="text-xs text-ink-soft">
              Öğrenci artık teslim yapamıyor — revizyon isteyebilmen için ona
              yeni bir son teslim tarihi belirlemelisin. Bu tarih, ödevin
              tüm öğrencileri için geçerli son teslim tarihini de günceller.
            </p>
            <input
              type="datetime-local"
              name="newDeadline"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="input-field"
              required
            />
          </div>
        )}

        {evalState?.error && (
          <p className="text-sm text-time">{evalState.error}</p>
        )}
        {evalState?.success && (
          <p className="text-sm text-go">Değerlendirme kaydedildi ✓</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={evalPending || (needsNewDeadline && !newDeadline)}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
              requiresRevision ? "bg-time" : "bg-go"
            }`}
          >
            {requiresRevision ? (
              <>
                <AlertCircleIcon className="h-4 w-4" /> Revizyon İste
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" /> Onayla
              </>
            )}
          </button>
        </div>
      </form>

      {/* Private Note */}
      <form action={noteAction} className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <LockIcon className="h-4 w-4 text-ink-faint" />
          <h3 className="font-semibold text-sm text-ink">Gizli Not</h3>
          <span className="badge badge-muted">Sadece sen görebilirsin</span>
        </div>
        <input type="hidden" name="studentId" value={studentId} />
        <textarea
          name="note"
          rows={3}
          className="input-field"
          placeholder="Bu öğrenci hakkında özel notlar..."
        />
        {noteState?.error && (
          <p className="text-sm text-time">{noteState.error}</p>
        )}
        {noteState?.success && (
          <p className="text-sm text-go">Not kaydedildi ✓</p>
        )}
        <button
          type="submit"
          disabled={notePending}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint disabled:opacity-50"
        >
          {notePending ? "Kaydediliyor..." : "Notu Kaydet"}
        </button>
      </form>
    </div>
  );
}
