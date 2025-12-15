import { useEffect, useMemo, useState } from "react";
import { Plus, Eye, Pencil, X, Save, Trash2 } from "lucide-react";

const EMP = { id: "EMP-001", name: "Priya Sharma" };
const LS_KEY = (empId) => `HRMS_EMP_LEAVES_${empId}`;

const leaveTypes = ["Casual Leave", "Sick Leave", "Annual Leave", "Work From Home", "Other"];

const tone = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const uid = () => `LR-${Math.floor(1000 + Math.random() * 9000)}`;

const loadLeaves = (id) => {
  try {
    const raw = localStorage.getItem(LS_KEY(id));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLeaves = (id, rows) =>
  localStorage.setItem(LS_KEY(id), JSON.stringify(rows));

const fmt = (iso) => new Date(iso).toLocaleString();

/* ---------------- Modal ---------------- */
const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

/* ---------------- Component ---------------- */
export default function EmployeeLeaveManagement() {
  const [rows, setRows] = useState(() => loadLeaves(EMP.id));
  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [cType, setCType] = useState("Casual Leave");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [cReason, setCReason] = useState("");

  const [eType, setEType] = useState("");
  const [eFrom, setEFrom] = useState("");
  const [eTo, setETo] = useState("");
  const [eReason, setEReason] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    saveLeaves(EMP.id, rows);
  }, [rows]);

  const stats = useMemo(() => ({
    Pending: rows.filter((r) => r.status === "Pending").length,
    Approved: rows.filter((r) => r.status === "Approved").length,
    Rejected: rows.filter((r) => r.status === "Rejected").length,
    All: rows.length,
  }), [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);
    if (search)
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(search.toLowerCase()) ||
          r.leaveType.toLowerCase().includes(search.toLowerCase())
      );
    return list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  }, [rows, statusFilter, search]);

  const selectedView = rows.find((r) => r.id === viewId);
  const selectedEdit = rows.find((r) => r.id === editId);

  /* ---------------- Actions ---------------- */
  const createLeave = (e) => {
    e.preventDefault();
    setRows((p) => [
      {
        id: uid(),
        employeeId: EMP.id,
        employeeName: EMP.name,
        leaveType: cType,
        from: cFrom,
        to: cTo,
        reason: cReason,
        status: "Pending",
        appliedAt: new Date().toISOString(),
      },
      ...p,
    ]);
    setCreateOpen(false);
    setCFrom(""); setCTo(""); setCReason("");
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setEType(r.leaveType);
    setEFrom(r.from);
    setETo(r.to);
    setEReason(r.reason);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    setRows((p) =>
      p.map((r) => (r.id === editId ? { ...r, leaveType: eType, from: eFrom, to: eTo, reason: eReason } : r))
    );
    setEditId(null);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-slate-800 text-white rounded-2xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Leave Management</h2>
            <p className="text-sm text-slate-300">Employee self service</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-800 font-semibold hover:bg-slate-100"
          >
            <Plus size={16} /> New Leave
          </button>
        </div>

        {/* STATUS FILTER */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {Object.keys(stats).map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`px-3 py-1 rounded-full border transition ${
                statusFilter === k
                  ? "bg-white text-slate-800"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {k}: {stats[k]}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white border rounded-xl p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leave requests..."
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Leave</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.leaveType}</div>
                  <div className="text-xs text-slate-500">#{r.id}</div>
                </td>
                <td className="px-4 py-3">{r.from} → {r.to}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${tone[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setViewId(r.id)} className="p-2 hover:bg-slate-100 rounded-lg"><Eye size={16} /></button>
                    <button onClick={() => openEdit(r)} disabled={r.status !== "Pending"} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-40"><Pencil size={16} /></button>
                    <button onClick={() => setRows(rows.filter(x => x.id !== r.id))} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL – CLEAN CARD */}
      {selectedView && (
        <ModalShell title="Leave Details" onClose={() => setViewId(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-slate-500">Employee</p>
                <p className="font-semibold">{EMP.name}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-slate-500">Status</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full border text-xs font-semibold ${tone[selectedView.status]}`}>
                  {selectedView.status}
                </span>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-slate-500">Leave Type</p>
              <p className="font-semibold">{selectedView.leaveType}</p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-slate-500">Duration</p>
              <p className="font-semibold">{selectedView.from} → {selectedView.to}</p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-slate-500">Reason</p>
              <p>{selectedView.reason}</p>
            </div>

            <p className="text-xs text-slate-400">Applied at {fmt(selectedView.appliedAt)}</p>
          </div>
        </ModalShell>
      )}

      {/* CREATE & EDIT MODALS (UNCHANGED STRUCTURE) */}
      {createOpen && (
        <ModalShell title="Create Leave" onClose={() => setCreateOpen(false)}>
          <form onSubmit={createLeave} className="space-y-3">
            <select value={cType} onChange={(e) => setCType(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              {leaveTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={cFrom} onChange={(e) => setCFrom(e.target.value)} required className="w-full border rounded-lg px-3 py-2" />
            <input type="date" value={cTo} onChange={(e) => setCTo(e.target.value)} required className="w-full border rounded-lg px-3 py-2" />
            <textarea value={cReason} onChange={(e) => setCReason(e.target.value)} required rows={3} className="w-full border rounded-lg px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg">Create</button>
            </div>
          </form>
        </ModalShell>
      )}

      {selectedEdit && (
        <ModalShell title="Edit Leave" onClose={() => setEditId(null)}>
          <form onSubmit={saveEdit} className="space-y-3">
            <select value={eType} onChange={(e) => setEType(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              {leaveTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={eFrom} onChange={(e) => setEFrom(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            <input type="date" value={eTo} onChange={(e) => setETo(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            <textarea value={eReason} onChange={(e) => setEReason(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg">Save</button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
