import { useEffect, useMemo, useState } from "react";
import { Plus, Eye, Pencil, X, Save, Trash2 } from "lucide-react";

const EMP = { id: "EMP-001", name: "Priya Sharma" };
const LS_KEY = (empId) => `HRMS_EMP_LEAVES_${empId}`;

const leaveTypes = ["Casual Leave", "Sick Leave", "Annual Leave", "Work From Home", "Other"];

function uid(prefix = "LR") {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function loadLeaves(empId) {
  try {
    const raw = localStorage.getItem(LS_KEY(empId));
    if (raw) return JSON.parse(raw);
  } catch {}
  // seed
  return [
    {
      id: "LR-2001",
      employeeId: empId,
      employeeName: EMP.name,
      leaveType: "Casual Leave",
      from: "2025-12-15",
      to: "2025-12-16",
      reason: "Family function",
      status: "Pending",
      appliedAt: new Date().toISOString(),
      decisionNote: "",
      decidedAt: "",
    },
  ];
}

function saveLeaves(empId, rows) {
  localStorage.setItem(LS_KEY(empId), JSON.stringify(rows));
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] bg-black/40 p-4 flex items-center justify-center">
    <div className="w-full max-w-2xl bg-white rounded-2xl border shadow-xl">
      <div className="p-5 border-b flex items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export default function EmployeeLeaveManagement() {
  const [rows, setRows] = useState(() => loadLeaves(EMP.id));

  // modal states
  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // create form
  const [cType, setCType] = useState("Casual Leave");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [cReason, setCReason] = useState("");

  // edit form
  const [eType, setEType] = useState("Casual Leave");
  const [eFrom, setEFrom] = useState("");
  const [eTo, setETo] = useState("");
  const [eReason, setEReason] = useState("");

  useEffect(() => {
    saveLeaves(EMP.id, rows);
  }, [rows]);

  const selectedView = useMemo(() => rows.find((r) => r.id === viewId) || null, [rows, viewId]);
  const selectedEdit = useMemo(() => rows.find((r) => r.id === editId) || null, [rows, editId]);

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "Pending").length, [rows]);

  const openEdit = (row) => {
    setEditId(row.id);
    setEType(row.leaveType);
    setEFrom(row.from);
    setETo(row.to);
    setEReason(row.reason);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const newRow = {
      id: uid("LR"),
      employeeId: EMP.id,
      employeeName: EMP.name,
      leaveType: cType,
      from: cFrom,
      to: cTo,
      reason: cReason,
      status: "Pending",
      appliedAt: new Date().toISOString(),
      decisionNote: "",
      decidedAt: "",
    };

    setRows((prev) => [newRow, ...prev]);

    setCType("Casual Leave");
    setCFrom("");
    setCTo("");
    setCReason("");
    setCreateOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedEdit) return;
    if (selectedEdit.status !== "Pending") return;

    setRows((prev) =>
      prev.map((r) =>
        r.id === selectedEdit.id
          ? { ...r, leaveType: eType, from: eFrom, to: eTo, reason: eReason }
          : r
      )
    );
    setEditId(null);
  };

  const handleDelete = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (viewId === id) setViewId(null);
    if (editId === id) setEditId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Leave Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              My leave letters • Pending: <span className="font-semibold">{pendingCount}</span>
            </p>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition"
          >
            <Plus size={18} />
            New Leave Letter
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-3">Leave ID</th>
                <th className="py-3 pr-3">Type</th>
                <th className="py-3 pr-3">From</th>
                <th className="py-3 pr-3">To</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>
                    No leave letters yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 font-semibold text-gray-900">{r.id}</td>
                    <td className="py-3 pr-3">{r.leaveType}</td>
                    <td className="py-3 pr-3">{r.from}</td>
                    <td className="py-3 pr-3">{r.to}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          r.status === "Approved"
                            ? "bg-green-50 text-green-700"
                            : r.status === "Rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setViewId(r.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 text-xs font-semibold transition"
                        >
                          <Eye size={16} />
                          View
                        </button>

                        <button
                          onClick={() => openEdit(r)}
                          disabled={r.status !== "Pending"}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                            r.status !== "Pending"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                          }`}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(r.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {createOpen && (
        <ModalShell title="Create New Leave Letter" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-gray-700">Leave Type</label>
                <select
                  value={cType}
                  onChange={(e) => setCType(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                >
                  {leaveTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-gray-700">From</label>
                <input
                  type="date"
                  value={cFrom}
                  onChange={(e) => setCFrom(e.target.value)}
                  required
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-gray-700">To</label>
                <input
                  type="date"
                  value={cTo}
                  onChange={(e) => setCTo(e.target.value)}
                  required
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Reason</label>
              <textarea
                value={cReason}
                onChange={(e) => setCReason(e.target.value)}
                rows={4}
                required
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Type your reason..."
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition"
              >
                <Save size={18} />
                Create
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* VIEW MODAL */}
      {selectedView && (
        <ModalShell title={`Leave Letter • ${selectedView.id}`} onClose={() => setViewId(null)}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Employee</p>
                <p className="font-semibold text-gray-900">
                  {selectedView.employeeName} ({selectedView.employeeId})
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-gray-900">{selectedView.status}</p>
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-xs text-gray-500">Leave Details</p>
              <p className="mt-1">
                <span className="font-semibold">{selectedView.leaveType}</span> •{" "}
                {selectedView.from} → {selectedView.to}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-xs text-gray-500">Reason</p>
              <p className="mt-1 text-gray-900">{selectedView.reason}</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-xs text-gray-500">Applied At</p>
              <p className="mt-1 font-semibold">{fmtDateTime(selectedView.appliedAt)}</p>
            </div>

            {selectedView.decisionNote && (
              <div className="rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Decision Note</p>
                <p className="mt-1 text-gray-900">{selectedView.decisionNote}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Decided At: {fmtDateTime(selectedView.decidedAt)}
                </p>
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {/* EDIT MODAL */}
      {selectedEdit && (
        <ModalShell title={`Edit Leave Letter • ${selectedEdit.id}`} onClose={() => setEditId(null)}>
          {selectedEdit.status !== "Pending" ? (
            <div className="text-sm text-gray-700">
              This leave letter is <span className="font-semibold">{selectedEdit.status}</span>. Only
              <span className="font-semibold"> Pending </span> requests can be edited.
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-700">Leave Type</label>
                  <select
                    value={eType}
                    onChange={(e) => setEType(e.target.value)}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-700">From</label>
                  <input
                    type="date"
                    value={eFrom}
                    onChange={(e) => setEFrom(e.target.value)}
                    required
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-700">To</label>
                  <input
                    type="date"
                    value={eTo}
                    onChange={(e) => setETo(e.target.value)}
                    required
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Reason</label>
                <textarea
                  value={eReason}
                  onChange={(e) => setEReason(e.target.value)}
                  rows={4}
                  required
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      )}
    </div>
  );
}
