import { useMemo, useState } from "react";
import { AlertCircle, Check, Clock4, Eye, Shield } from "lucide-react";
import { getManagerSession, leaveRequests as seedRequests } from "./managerData";

const statusTone = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ManagerApprovals() {
  const session = getManagerSession();
  const canAct = session.role === "approver";
  const [requests, setRequests] = useState(seedRequests);

  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === "Pending").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    return { pending, approved };
  }, [requests]);

  const handleAction = (id, status) => {
    if (!canAct) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              approvedBy: session.name,
              approvedAt: new Date().toLocaleString(),
            }
          : r
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-indigo-50 p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-900 font-semibold text-lg">
          <Shield size={18} /> Leave Approvals
        </div>
        <p className="text-sm text-indigo-800/80">
          Two managers sign in with separate IDs. Only the approver can approve or reject; the second manager has
          read-only visibility.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-indigo-800 font-semibold border border-indigo-200">
            <Clock4 size={14} /> Pending: {metrics.pending}
          </span>
          <span className="inline-flex items-center gap-1 bg-emerald-100 px-3 py-1 rounded-full text-emerald-700 font-semibold border border-emerald-200">
            <Check size={14} /> Approved: {metrics.approved}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${
              canAct ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
            }`}
          >
            Role: {canAct ? "Approver" : "View only"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((req) => (
          <div key={req.id} className="rounded-2xl border p-4 bg-white shadow-sm space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{req.employee}</p>
                <p className="text-xs text-slate-500">{req.type}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${statusTone[req.status]}`}>
                {req.status}
              </span>
            </div>

            <div className="text-sm text-slate-700">
              <p>
                <span className="font-semibold">Dates:</span> {req.dates}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Reason:</span> {req.reason}
              </p>
              <p className="text-xs text-slate-500 mt-1">Handover: {req.handover}</p>
            </div>

            {req.approvedBy && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <Check size={14} /> Approved by {req.approvedBy} at {req.approvedAt || "previous run"}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                disabled={!canAct}
                onClick={() => handleAction(req.id, "Approved")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold border ${
                  canAct
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-500 cursor-not-allowed"
                }`}
              >
                Approve
              </button>
              <button
                disabled={!canAct}
                onClick={() => handleAction(req.id, "Rejected")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold border ${
                  canAct
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-100 text-slate-500 cursor-not-allowed"
                }`}
              >
                Reject
              </button>
              {!canAct && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Eye size={14} /> View only (no actions)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!canAct && (
        <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-slate-600 flex gap-2 items-start">
          <AlertCircle size={16} className="text-amber-600 mt-0.5" />
          <div>
            You are logged in as the view-only manager. To approve or reject, sign in with the approver manager ID
            (manager1@hrms.com).
          </div>
        </div>
      )}
    </div>
  );
}
