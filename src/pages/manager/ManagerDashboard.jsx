import { useMemo } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Lock,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { getManagerSession, leaveRequests, payrollRecords, payslipRecords, teamMembers } from "./managerData";

const StatCard = ({ icon: Icon, label, value, tone = "indigo" }) => {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm flex gap-3">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

export default function ManagerDashboard() {
  const session = getManagerSession();
  const approver = session.role === "approver";

  const onLeave = useMemo(() => teamMembers.filter((m) => m.status === "On Leave"), []);
  const pending = useMemo(() => leaveRequests.filter((l) => l.status === "Pending"), []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Welcome back, {session.name}</p>
            <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Track team presence, handle leave approvals, and view payroll & payslips. Only one manager can approve
              leaves; the other has view-only access.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 font-semibold">
              <Sparkles size={14} /> {session.team} squad
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${
                approver ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              <Workflow size={14} />
              {approver ? "Approver access" : "View-only"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Team Members" value={teamMembers.length} />
        <StatCard icon={CalendarClock} label="On Leave" value={onLeave.length} tone="amber" />
        <StatCard icon={CheckCircle2} label="Pending Approvals" value={pending.length} tone="emerald" />
        <StatCard icon={Eye} label="Payroll / Payslip" value="View only" tone="slate" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Leave Board</h3>
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                {onLeave.length} on leave now
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {onLeave.map((m) => (
                <div key={m.id} className="rounded-xl border p-3 bg-amber-50/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.role}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      {m.leaveType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{m.leaveDates}</p>
                  <p className="text-xs text-slate-500 mt-1">Location: {m.location}</p>
                </div>
              ))}
              {!onLeave.length && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No one is on leave right now.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Approval Queue</h3>
              <span className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
                {approver ? "You can act" : "View only"}
              </span>
            </div>
            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{req.employee}</p>
                      <p className="text-xs text-slate-500">{req.type}</p>
                    </div>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">{req.dates}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">Reason: {req.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">Handover: {req.handover}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <button
                      disabled={!approver}
                      className={`rounded-lg px-3 py-2 font-semibold border ${
                        approver
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-100 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      disabled={!approver}
                      className={`rounded-lg px-3 py-2 font-semibold border ${
                        approver
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Reject
                    </button>
                    {!approver && <span className="text-slate-400">(Only approver can act)</span>}
                  </div>
                </div>
              ))}
              {!pending.length && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No pending approvals.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Team Roster</h3>
              <span className="text-xs text-slate-500">Live</span>
            </div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="rounded-xl border p-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Location: {member.location}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                      member.status === "On Leave"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-900 text-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Lock size={16} />
              <div className="text-sm font-semibold">Payroll & Payslip (View Only)</div>
            </div>
            <p className="text-xs text-slate-200">
              Both managers have read-only access to payroll snapshots and payslip status.
            </p>
            <div className="bg-black/20 rounded-xl p-3 space-y-2 text-sm">
              {payrollRecords.slice(0, 2).map((p) => (
                <div key={p.month} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.month}</p>
                    <p className="text-xs text-slate-200">{p.remarks}</p>
                  </div>
                  <span className="text-[11px] bg-white/10 px-2 py-1 rounded-full">{p.status}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-xs text-slate-100 flex items-center justify-between">
              <span>Payslips published for {payslipRecords[0].month}</span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-full">
                <Eye size={12} /> View only
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
