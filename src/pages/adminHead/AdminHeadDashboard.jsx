import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, FileSpreadsheet, ShieldCheck, Users } from "lucide-react";

const cards = [
  { label: "Total Workforce", value: "2,430", sub: "Active employees", icon: Users },
  { label: "Attendance Health", value: "92%", sub: "Present today", icon: ClipboardCheck },
  { label: "Pending Approvals", value: "38", sub: "Across all streams", icon: CheckCircle2 },
  { label: "Compliance Alerts", value: "5", sub: "Expiring docs / policies", icon: ShieldCheck },
  { label: "Payroll Readiness", value: "On Track", sub: "Inputs closing in 3 days", icon: FileSpreadsheet },
  { label: "System Health", value: "Good", sub: "No sync delays", icon: BarChart3 },
];

const sections = [
  {
    title: "Workforce Summary",
    items: ["Total employees, active, on leave", "Department performance trends", "Attrition and hiring snapshot"],
  },
  {
    title: "Attendance & Leave Overview",
    items: ["Present / Absent / Late", "Team leave overlaps", "Attendance correction backlog"],
  },
  {
    title: "Approvals Overview",
    items: ["CEO + Manager + HR pending approvals", "Attendance corrections", "Document and payroll input approvals"],
  },
  {
    title: "Compliance Alerts",
    items: ["Document expiries", "Policy acknowledgements pending", "Data accuracy checks"],
  },
];

export default function AdminHeadDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Dashboard</h1>
          <p className="text-sm text-slate-500">Workforce summary, compliance, system health, and approvals.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1">
          <AlertTriangle size={14} />
          High-Level View
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border bg-slate-50 p-4 flex items-start gap-3">
              <span className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center text-indigo-700">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="text-xl font-bold text-slate-900">{c.value}</p>
                <p className="text-xs text-slate-500">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
