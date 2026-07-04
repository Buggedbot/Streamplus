"use client";

import { createPortal } from "react-dom";

const REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Copyright",
  "Harassment or hate",
  "Other",
];

export function ReportSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (reason: string) => void;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-md mx-auto rounded-t-2xl bg-neutral-900 border-t border-white/10 p-2 pb-4">
        <p className="px-3 py-3 text-sm font-semibold">Report this reel</p>
        <div className="flex flex-col">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => onPick(reason)}
              className="text-left px-3 py-3 text-sm rounded-lg hover:bg-white/5 transition-colors"
            >
              {reason}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
