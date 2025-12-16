import { useMemo, useState } from "react";
import {
  Bell,
  CalendarCheck,
  FileText,
  UploadCloud,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  LogOut,
} from "lucide-react";

import { useEmployeeDashboard } from "./shared/employeeStore";
import {
  Badge,
  SectionCard,
  StatPill,
  PrimaryButton,
  GhostButton,
  Modal,
  IconButton,
} from "./shared/ui.jsx";

const toneChip = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Cancelled: "neutral",
};

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function EmployeeDashboard() {
  const { data, view, actions, activeAction } = useEmployeeDashboard();

  // safety defaults
  const employee = data?.employee || {};
  const leaveBalance = data?.leaveBalance || [];
  const leaveRequests = data?.leaveRequests || [];
  const docs = data?.documents || { myDocs: [], companyDocs: [] };
  const notifications = data?.notifications || [];

  const recentLeaves = useMemo(() => leaveRequests.slice(0, 4), [leaveRequests]);
  const recentDocs = useMemo(() => (docs.myDocs || []).slice(0, 4), [docs.myDocs]);
  const topNotifs = useMemo(() => notifications.slice(0, 4), [notifications]);

  // ---- Modal form states (simple) ----
  const [leaveForm, setLeaveForm] = useState({
    type: "Casual Leave",
    from: "",
    to: "",
    reason: "",
  });

  const [docForm, setDocForm] = useState({
    fileName: "",
    category: "Other",
    expiryISO: "",
  });

  const openApplyLeave = () => {
    setLeaveForm({ type: "Casual Leave", from: "", to: "", reason: "" });
    actions.openAction({ kind: "APPLY_LEAVE", title: "Apply Leave", desc: "Submit a new leave request" });
  };

  const openUploadDoc = () => {
    setDocForm({ fileName: "", category: "Other", expiryISO: "" });
    actions.openAction({ kind: "UPLOAD_DOC", title: "Upload Document", desc: "Add a document to your profile" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">Employee Dashboard</h1>
            <Badge tone="purple">Self Service</Badge>
            <Badge tone={view.unreadCount ? "warning" : "success"}>
              {view.unreadCount ? `${view.unreadCount} Unread` : "All Read"}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {employee.name || "-"} • {employee.id || "-"} • {employee.role || "-"} • {employee.dept || "-"}
          </p>

          {view.expiringCount ? (
            <p className="mt-1 text-xs text-amber-700">
              <AlertTriangle className="inline -mt-0.5 mr-1" size={14} />
              {view.expiringCount} document(s) expiring within 30 days
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              <CheckCircle2 className="inline -mt-0.5 mr-1" size={14} />
              No upcoming document expiry alerts
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <IconButton title="Reset Demo Data" onClick={actions.resetDemo}>
            <LogOut size={18} />
          </IconButton>
        </div>
      </div>

      {/* 3 cards only */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEAVE */}
        <SectionCard
          title="Leave Details"
          subtitle="Balance + recent requests"
          action={<Badge tone="info">Leave</Badge>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {leaveBalance.map((lb) => (
              <StatPill
                key={lb.label}
                label={lb.label}
                value={lb.value}
                hint={lb.hint}
                tone={lb.tone}
              />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
              Recent Requests
            </div>
            <div className="divide-y">
              {recentLeaves.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No leave requests yet.</div>
              ) : (
                recentLeaves.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">
                        {r.type} <span className="text-slate-400 font-semibold">({r.days} day{r.days > 1 ? "s" : ""})</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(r.from)} → {fmtDate(r.to)} • {r.id}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.reason}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Badge tone={toneChip[r.status] || "neutral"}>{r.status}</Badge>
                      {r.status === "Pending" ? (
                        <button
                          className="text-xs font-bold text-rose-600 hover:underline"
                          onClick={() => actions.cancelLeave(r.id)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <PrimaryButton onClick={openApplyLeave}>
              <CalendarCheck size={16} className="mr-2" />
              Apply Leave
            </PrimaryButton>
            <GhostButton
              onClick={() =>
                actions.openAction({
                  kind: "VIEW_ALL_LEAVES",
                  title: "All Leave Requests",
                  desc: "View your full leave history",
                })
              }
            >
              View all
            </GhostButton>
          </div>
        </SectionCard>

        {/* DOCUMENTS */}
        <SectionCard
          title="Documents"
          subtitle="My documents + company documents"
          action={<Badge tone="purple">Docs</Badge>}
        >
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
              My Recent Uploads
            </div>
            <div className="divide-y">
              {recentDocs.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No documents uploaded.</div>
              ) : (
                recentDocs.map((d) => (
                  <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{d.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.category} • {fmtDate(d.uploadedAtISO)} • {d.sizeLabel}
                        {d.expiryISO ? ` • Exp: ${fmtDate(d.expiryISO)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <IconButton
                        title="View (demo)"
                        onClick={() =>
                          actions.openAction({
                            kind: "DOC_VIEW",
                            title: "View Document",
                            desc: `${d.name} (demo placeholder)`,
                          })
                        }
                      >
                        <Eye size={18} />
                      </IconButton>
                      <IconButton title="Delete" onClick={() => actions.deleteMyDoc(d.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {view.expiringCount ? (
            <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold text-amber-800">Expiry Alerts</p>
              <p className="mt-1 text-xs text-amber-700">
                {view.expiringDocs.map((d) => d.name).join(", ")}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <PrimaryButton onClick={openUploadDoc}>
              <UploadCloud size={16} className="mr-2" />
              Upload
            </PrimaryButton>
            <GhostButton
              onClick={() =>
                actions.openAction({
                  kind: "VIEW_ALL_DOCS",
                  title: "All Documents",
                  desc: "My Documents + Company Documents",
                })
              }
            >
              Manage
            </GhostButton>
          </div>
        </SectionCard>

        {/* NOTIFICATIONS */}
        <SectionCard
          title="Notifications"
          subtitle="Announcements, approvals, alerts"
          action={
            <Badge tone={view.unreadCount ? "warning" : "success"}>
              {view.unreadCount ? "Needs Attention" : "All Clear"}
            </Badge>
          }
        >
          <div className="space-y-3">
            {topNotifs.length === 0 ? (
              <div className="rounded-2xl border bg-emerald-50 px-4 py-3">
                <p className="text-sm font-extrabold text-emerald-800">No notifications 🎉</p>
                <p className="text-xs text-emerald-700 mt-1">You’re all caught up.</p>
              </div>
            ) : (
              topNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    n.tone === "warning"
                      ? "bg-amber-50 border-amber-100"
                      : n.tone === "success"
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Bell size={16} className="text-slate-700" />
                        {n.title}
                        {!n.read ? <Badge tone="warning">New</Badge> : null}
                      </p>
                      <p className="text-xs text-slate-700 mt-1">{n.body}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {fmtDate(n.createdAtISO)}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {!n.read ? (
                        <button
                          className="text-xs font-bold text-slate-900 hover:underline"
                          onClick={() => actions.markRead(n.id)}
                        >
                          Mark read
                        </button>
                      ) : null}
                      <button
                        className="text-xs font-bold text-rose-600 hover:underline"
                        onClick={() => actions.dismissNotif(n.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <GhostButton
              onClick={() =>
                actions.openAction({
                  kind: "VIEW_ALL_NOTIFS",
                  title: "All Notifications",
                  desc: "View all alerts & announcements",
                })
              }
            >
              View all
            </GhostButton>
          </div>
        </SectionCard>
      </div>

      {/* Modal (real flows) */}
      <Modal
        open={!!activeAction}
        title={activeAction?.title || "Action"}
        subtitle={activeAction?.desc || ""}
        onClose={actions.closeAction}
      >
        {/* APPLY LEAVE */}
        {activeAction?.kind === "APPLY_LEAVE" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, type: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Annual Leave</option>
                  <option>Work From Home</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Reason</label>
                <input
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Short reason"
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">From</label>
                <input
                  type="date"
                  value={leaveForm.from}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, from: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">To</label>
                <input
                  type="date"
                  value={leaveForm.to}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, to: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton onClick={actions.closeAction}>Cancel</GhostButton>
              <PrimaryButton
                onClick={() => {
                  actions.submitLeave(leaveForm);
                  actions.closeAction();
                }}
                disabled={!leaveForm.from || !leaveForm.to}
              >
                Submit
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* UPLOAD DOC */}
        {activeAction?.kind === "UPLOAD_DOC" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700">File Name</label>
                <input
                  value={docForm.fileName}
                  onChange={(e) => setDocForm((p) => ({ ...p, fileName: e.target.value }))}
                  placeholder="ex: Passport.pdf"
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={docForm.category}
                  onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option>Other</option>
                  <option>HR</option>
                  <option>KYC</option>
                  <option>Education</option>
                  <option>Tax</option>
                  <option>Bank</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={docForm.expiryISO}
                  onChange={(e) => setDocForm((p) => ({ ...p, expiryISO: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="sm:col-span-2 rounded-2xl border bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Demo note: This saves metadata only (no real file upload yet). Connect to backend later.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton onClick={actions.closeAction}>Cancel</GhostButton>
              <PrimaryButton
                onClick={() => {
                  actions.uploadDoc(docForm);
                  actions.closeAction();
                }}
              >
                Upload
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* VIEW ALL LEAVES */}
        {activeAction?.kind === "VIEW_ALL_LEAVES" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
                Leave History
              </div>
              <div className="divide-y max-h-[360px] overflow-auto">
                {leaveRequests.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">{r.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(r.from)} → {fmtDate(r.to)} • {r.id} • {r.days} day(s)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
                    </div>
                    <Badge tone={toneChip[r.status] || "neutral"}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton onClick={actions.closeAction}>Close</GhostButton>
              <PrimaryButton onClick={openApplyLeave}>Apply Leave</PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* VIEW ALL DOCS */}
        {activeAction?.kind === "VIEW_ALL_DOCS" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
                My Documents
              </div>
              <div className="divide-y max-h-[220px] overflow-auto">
                {(docs.myDocs || []).map((d) => (
                  <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{d.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.category} • {fmtDate(d.uploadedAtISO)} {d.expiryISO ? ` • Exp: ${fmtDate(d.expiryISO)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <IconButton title="View (demo)" onClick={() => {}}>
                        <Eye size={18} />
                      </IconButton>
                      <IconButton title="Delete" onClick={() => actions.deleteMyDoc(d.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
                Company Documents
              </div>
              <div className="divide-y max-h-[220px] overflow-auto">
                {(docs.companyDocs || []).map((d) => (
                  <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{d.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.category} • {fmtDate(d.uploadedAtISO)} • {d.sizeLabel}
                      </p>
                    </div>
                    <Badge tone="info">Company</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton onClick={actions.closeAction}>Close</GhostButton>
              <PrimaryButton onClick={openUploadDoc}>
                <UploadCloud size={16} className="mr-2" />
                Upload
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* VIEW ALL NOTIFICATIONS */}
        {activeAction?.kind === "VIEW_ALL_NOTIFS" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
                All Notifications
              </div>
              <div className="divide-y max-h-[420px] overflow-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{n.body}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{fmtDate(n.createdAtISO)}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {!n.read ? (
                        <button
                          className="text-xs font-bold text-slate-900 hover:underline"
                          onClick={() => actions.markRead(n.id)}
                        >
                          Mark read
                        </button>
                      ) : (
                        <Badge tone="success">Read</Badge>
                      )}
                      <button
                        className="text-xs font-bold text-rose-600 hover:underline"
                        onClick={() => actions.dismissNotif(n.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton onClick={actions.closeAction}>Close</GhostButton>
            </div>
          </div>
        ) : null}

        {/* Default placeholder */}
        {!activeAction?.kind ? (
          <div className="flex justify-end">
            <GhostButton onClick={actions.closeAction}>Close</GhostButton>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
