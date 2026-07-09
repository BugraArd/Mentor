"use client";

import { useState } from "react";
import { InviteModal } from "@/components/invite-modal";
import { PlusCircleIcon } from "@/components/icons";

export function InviteSection() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
      >
        <PlusCircleIcon className="h-3.5 w-3.5" />
        Davet Kodu
      </button>
      <InviteModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
