import { Bell, Eye } from "lucide-react";

const alerts = [
  { id: 1, title: "Payslips published", detail: "November payslips are ready for your team.", time: "10m ago" },
  { id: 2, title: "Leave overlap", detail: "Sneha and Neha are both on leave today.", time: "30m ago" },
  { id: 3, title: "Payroll cut-off", detail: "HR closes payroll inputs in 2 days (view only).", time: "2h ago" },
];

export default function ManagerNotifications() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center gap-2">
        <Bell className="text-indigo-600" size={18} />
        <div>
          <p className="text-lg font-bold text-slate-900">Notifications</p>
          <p className="text-sm text-slate-600">View important updates for your team.</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
          <Eye size={14} /> View only
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="rounded-2xl border bg-white p-4 shadow-sm flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Bell size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-600">{a.detail}</p>
              <p className="text-xs text-slate-400 mt-1">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
