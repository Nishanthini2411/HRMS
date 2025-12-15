import { ArrowUpRight } from "lucide-react";

export default function StatCard({ title, value, subtitle, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-white p-4 shadow-sm ring-1 transition
        ${active ? "ring-indigo-300 shadow-md" : "ring-slate-100 hover:ring-indigo-200 hover:shadow"}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <span
          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold
          ${active ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-600"}
        `}
        >
          View <ArrowUpRight size={14} />
        </span>
      </div>
    </button>
  );
}
