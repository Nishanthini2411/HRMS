import { X } from "lucide-react";
import { useEffect } from "react";

export function Badge({ tone = "neutral", children }) {
  const map = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    info: "bg-blue-50 text-blue-700 ring-blue-100",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-800 ring-amber-100",
    danger: "bg-rose-50 text-rose-700 ring-rose-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${map[tone] || map.neutral}`}
    >
      {children}
    </span>
  );
}

export function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function StatPill({ label, value, hint, tone = "neutral" }) {
  const map = {
    neutral: "bg-slate-50 border-slate-200",
    info: "bg-blue-50 border-blue-100",
    success: "bg-emerald-50 border-emerald-100",
    warning: "bg-amber-50 border-amber-100",
    danger: "bg-rose-50 border-rose-100",
    purple: "bg-purple-50 border-purple-100",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${map[tone] || map.neutral}`}>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl border bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({ open, title, subtitle, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-3xl border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
