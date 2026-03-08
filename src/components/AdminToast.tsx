"use client";

type AdminToastProps = {
  message: string;
  onClose: () => void;
};

export default function AdminToast({ message, onClose }: AdminToastProps) {
  if (!message) return null;

  return (
    <div className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_14px_36px_rgba(16,185,129,0.18)] sm:right-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-emerald-700">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
