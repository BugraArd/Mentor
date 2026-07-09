"use client";

import { useActionState, useState, useEffect } from "react";
import { createAssignment } from "@/lib/actions/assignment-actions";
import { StepIndicator } from "@/components/step-indicator";
import { RubricBuilder } from "@/components/rubric-builder";
import { createClient } from "@/lib/supabase/client";
import type { RubricCriterion } from "@/lib/database.types";
import { ArrowLeftIcon } from "@/components/icons";
import Link from "next/link";

const STEPS = [
  "Temel Bilgiler",
  "Rubrik (Kriterler)",
  "Zamanlama",
  "Atama & Önizleme",
];

export default function OdevOlusturPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, formAction, pending] = useActionState(createAssignment, undefined);

  // Form states to maintain preview & multi-step values
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [voiceNoteUrl, setVoiceNoteUrl] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // DB student list
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("mentor_relations")
      .select("student:profiles!mentor_relations_student_id_fkey(id, full_name)")
      .eq("status", "active")
      .then(({ data }) => {
        if (data) {
          // Aynı öğrenciyle birden fazla eşleşme kaydı varsa tekilleştir —
          // yinelenen id'ler React'te duplicate-key hatasına yol açıyor.
          const uniq = new Map<string, any>();
          for (const d of data as any[]) {
            if (d.student) uniq.set(d.student.id, d.student);
          }
          setStudents([...uniq.values()]);
        }
        setLoadingStudents(false);
      });
  }, []);

  function handleNext() {
    if (currentStep === 0 && !title.trim()) {
      alert("Lütfen ödev başlığı girin.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handlePrev() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  function handleStudentToggle(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Back to panel */}
      <Link
        href="/ogretmen"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Panele Dön
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-ink">Yeni Ödev Oluştur</h1>
        <p className="text-ink-soft mt-1">
          Öğrencilerinize göndermek üzere rubrikli ve zamanlı bir ödev yönergesi tasarlayın.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Main Form action matches Server Action */}
      <form action={formAction} className="space-y-6">
        {/* Hidden inputs to send state values to the Server Action */}
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="instructions" value={instructions} />
        <input type="hidden" name="voiceNoteUrl" value={voiceNoteUrl} />
        <input type="hidden" name="attachmentUrl" value={attachmentUrl} />
        <input type="hidden" name="rubric" value={JSON.stringify(rubric)} />
        <input type="hidden" name="publishNow" value={String(publishNow)} />
        <input type="hidden" name="startsAt" value={startsAt} />
        <input type="hidden" name="endsAt" value={endsAt} />
        {selectedStudents.map((sid) => (
          <input key={sid} type="hidden" name="studentIds" value={sid} />
        ))}

        {/* Step 1: Temel Bilgiler */}
        {currentStep === 0 && (
          <div className="glass-card p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-semibold text-ink">1. Temel Bilgiler</h2>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">
                Ödev Başlığı <span className="text-time">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Modern Fizik Soruları ve Çözümleri"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">
                Yönerge / Açıklama
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Öğrencinin ne yapması gerektiğini detaylıca açıklayın..."
                rows={6}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">
                Sesli Yönerge URL (Opsiyonel)
              </label>
              <input
                type="url"
                value={voiceNoteUrl}
                onChange={(e) => setVoiceNoteUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">
                Ek Dosya URL (Opsiyonel)
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/dosya.pdf"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Step 2: Rubrik Kriterleri */}
        {currentStep === 1 && (
          <div className="glass-card p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-semibold text-ink">2. Rubrik Kriterleri</h2>
            <p className="text-sm text-ink-soft">
              Ödevi değerlendirirken kullanacağınız kriterleri ve puan ağırlıklarını belirleyin.
            </p>
            <RubricBuilder criteria={rubric} onChange={setRubric} />
          </div>
        )}

        {/* Step 3: Zamanlama */}
        {currentStep === 2 && (
          <div className="glass-card p-6 space-y-6 animate-slide-up">
            <h2 className="text-lg font-semibold text-ink">3. Zamanlama</h2>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2">
              <input
                type="checkbox"
                id="publishNow"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              <label htmlFor="publishNow" className="text-sm font-medium text-ink cursor-pointer select-none">
                Hemen Yayınla (Ödev hemen aktif hale gelecektir)
              </label>
            </div>

            {!publishNow && (
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">
                  Başlangıç Tarihi & Saati
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">
                Teslim Son Tarihi & Saati
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Step 4: Atama & Önizleme */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-ink">Ödev Önizlemesi</h2>
              <div className="p-4 rounded-lg bg-surface-2 space-y-2">
                <p className="text-sm font-semibold text-ink">{title || "Başlıksız Ödev"}</p>
                {instructions && (
                  <p className="text-xs text-ink-soft line-clamp-3">{instructions}</p>
                )}
                {rubric.length > 0 && (
                  <p className="text-xs text-ink-faint">
                    Rubrik: {rubric.length} kriter, toplam {rubric.reduce((s, c) => s + c.points, 0)} puan
                  </p>
                )}
                <p className="text-xs text-ink-faint">
                  Zamanlama: {publishNow ? "Hemen aktif" : startsAt ? `${new Date(startsAt).toLocaleString("tr-TR")}'de başlayacak` : "Belirtilmedi"}
                </p>
                {endsAt && (
                  <p className="text-xs text-time">
                    Son Teslim: {new Date(endsAt).toLocaleString("tr-TR")}
                  </p>
                )}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-ink">Öğrencilere Ata</h2>
                {students.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {selectedStudents.length === students.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </button>
                )}
              </div>

              {loadingStudents ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-ink-faint">Aktif mentörlük yaptığınız öğrenci bulunamadı.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students.map((student) => {
                    const isChecked = selectedStudents.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleStudentToggle(student.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          isChecked
                            ? "bg-accent-wash/30 border-accent text-accent-ink"
                            : "border-line bg-surface hover:bg-surface-2 text-ink-soft"
                        }`}
                      >
                        <span className="text-sm font-medium">{student.full_name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by onClick on div
                          className="h-4 w-4 rounded text-accent"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {state?.error && <p className="text-sm text-time">{state.error}</p>}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0 || pending}
            className="px-4 py-2 border border-line rounded-lg text-sm font-semibold text-ink-soft hover:bg-surface-2 disabled:opacity-50 transition-colors"
          >
            Geri
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-surface text-ink border border-line rounded-lg text-sm font-semibold hover:bg-surface-2 transition-colors"
            >
              İleri
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pending ? "Oluşturuluyor..." : "Ödevi Oluştur & Ata"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
