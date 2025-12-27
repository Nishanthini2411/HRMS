import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------- CONSTANTS ---------------- */
const EMP = { id: "EMP-001", name: "Priya Sharma" };

const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Annual Leave",
  "Work From Home",
  "Other",
];

const leaveModes = ["Full Day", "Half Day", "Permission"];

const tone = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const fmt = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
};

const calcDuration = (from, to) => {
  if (!from || !to) return "";
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const diff = th * 60 + tm - (fh * 60 + fm);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h ? `${h} Hour${h > 1 ? "s" : ""}` : ""}${h && m ? " " : ""}${
    m ? `${m} Minutes` : ""
  }`;
};

const needsTime = (mode) => mode === "Permission" || mode === "Half Day";

/* ---------------- APPROVER TABLE (Request To) ----------------
  ✅ We will fetch approvers ONLY from this table:
  public.hrmss_approvers
  Columns expected: id, name, role, access, active
  We show only: access='approver' AND active=true
*/
const APPROVER_TABLE = "hrmss_approvers";

/* ---------------- MODAL ---------------- */
const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl">
      <div className="px-5 py-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const TimePreset = ({ onMorning, onAfternoon }) => (
  <div className="flex gap-2">
    <button
      type="button"
      onClick={onMorning}
      className="px-3 py-1 text-xs border rounded"
    >
      Morning (09:00 - 13:00)
    </button>
    <button
      type="button"
      onClick={onAfternoon}
      className="px-3 py-1 text-xs border rounded"
    >
      Afternoon (13:00 - 17:00)
    </button>
  </div>
);

/* ---------------- MAIN ---------------- */
export default function EmployeeLeaveManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // approvers (request-to)
  const [approvers, setApprovers] = useState([]);
  const [approverError, setApproverError] = useState("");

  /* CREATE */
  const [cRequestToId, setCRequestToId] = useState("");
  const [cType, setCType] = useState("Casual Leave");
  const [cMode, setCMode] = useState("Full Day");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [cFromTime, setCFromTime] = useState("");
  const [cToTime, setCToTime] = useState("");
  const [cReason, setCReason] = useState("");

  /* EDIT */
  const [eRequestToId, setERequestToId] = useState("");
  const [eType, setEType] = useState("");
  const [eMode, setEMode] = useState("");
  const [eFrom, setEFrom] = useState("");
  const [eTo, setETo] = useState("");
  const [eFromTime, setEFromTime] = useState("");
  const [eToTime, setEToTime] = useState("");
  const [eReason, setEReason] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  /* ---------------- FETCH APPROVERS ---------------- */
  const fetchApprovers = async () => {
    setApproverError("");

    const { data, error } = await supabase
      .from(APPROVER_TABLE)
      .select("id,name,role,access,active")
      .eq("active", true)
      .eq("access", "approver")
      .order("name", { ascending: true });

    if (error) {
      console.warn("Approver fetch error:", error.message);
      setApprovers([]);
      setApproverError(error.message);
      return;
    }

    const list = (data || [])
      .map((r) => ({
        id: String(r.id),
        name: String(r.name),
        role: String(r.role || ""),
      }))
      .filter((x) => x.id && x.name);

    setApprovers(list);
  };

  /* ---------------- FETCH LEAVES ---------------- */
  const fetchLeaves = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("employee_leaves")
      .select("*")
      .eq("employee_id", EMP.id)
      .order("applied_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setRows(
      (data || []).map((r) => ({
        id: r.id,
        leaveType: r.leave_type,
        mode: r.mode,
        from: r.from_date,
        to: r.to_date,
        timeFrom: r.time_from,
        timeTo: r.time_to,
        hours: r.hours,
        reason: r.reason,
        status: r.status,
        appliedAt: r.applied_at,

        // request-to / approver
        requestToId: r.request_to_id,
        requestToName: r.request_to_name,
        requestToRole: r.request_to_role,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchApprovers();
      await fetchLeaves();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- STATS ---------------- */
  const stats = useMemo(
    () => ({
      Pending: rows.filter((r) => r.status === "Pending").length,
      Approved: rows.filter((r) => r.status === "Approved").length,
      Rejected: rows.filter((r) => r.status === "Rejected").length,
      All: rows.length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    let list = [...rows];
    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.leaveType || "").toLowerCase().includes(q) ||
          (r.mode || "").toLowerCase().includes(q) ||
          (r.requestToName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, statusFilter, search]);

  const selectedView = rows.find((r) => r.id === viewId);
  const selectedEdit = rows.find((r) => r.id === editId);

  const selectedCreateApprover = useMemo(
    () => approvers.find((a) => a.id === cRequestToId),
    [approvers, cRequestToId]
  );
  const selectedEditApprover = useMemo(
    () => approvers.find((a) => a.id === eRequestToId),
    [approvers, eRequestToId]
  );

  /* ---------------- CREATE ---------------- */
  const createLeave = async (e) => {
    e.preventDefault();

    if (!cRequestToId) {
      alert("Please select Request To (approver).");
      return;
    }

    const payload = {
      employee_id: EMP.id,
      employee_name: EMP.name,

      leave_type: cType,
      mode: cMode,
      from_date: cFrom,
      to_date: cMode === "Full Day" ? cTo : cFrom,

      time_from: needsTime(cMode) ? cFromTime : null,
      time_to: needsTime(cMode) ? cToTime : null,
      hours: needsTime(cMode) ? calcDuration(cFromTime, cToTime) : null,

      reason: cReason,
      status: "Pending",

      // ✅ request-to saved in DB
      request_to_id: selectedCreateApprover?.id ?? cRequestToId,
      request_to_name: selectedCreateApprover?.name ?? null,
      request_to_role: selectedCreateApprover?.role ?? null,
    };

    const { error } = await supabase.from("employee_leaves").insert(payload);
    if (error) return alert(error.message);

    setCreateOpen(false);
    setCRequestToId("");
    setCFrom("");
    setCTo("");
    setCFromTime("");
    setCToTime("");
    setCReason("");
    fetchLeaves();
  };

  /* ---------------- EDIT ---------------- */
  const openEdit = (r) => {
    setEditId(r.id);

    setERequestToId(r.requestToId ? String(r.requestToId) : "");
    setEType(r.leaveType);
    setEMode(r.mode);
    setEFrom(r.from);
    setETo(r.to);
    setEFromTime(r.timeFrom || "");
    setEToTime(r.timeTo || "");
    setEReason(r.reason || "");
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    if (!eRequestToId) {
      alert("Please select Request To (approver).");
      return;
    }

    const updatePayload = {
      leave_type: eType,
      mode: eMode,
      from_date: eFrom,
      to_date: eMode === "Full Day" ? eTo : eFrom,

      time_from: needsTime(eMode) ? eFromTime : null,
      time_to: needsTime(eMode) ? eToTime : null,
      hours: needsTime(eMode) ? calcDuration(eFromTime, eToTime) : null,

      reason: eReason,

      // ✅ allow change approver while Pending
      request_to_id: selectedEditApprover?.id ?? eRequestToId,
      request_to_name: selectedEditApprover?.name ?? null,
      request_to_role: selectedEditApprover?.role ?? null,
    };

    const { error } = await supabase
      .from("employee_leaves")
      .update(updatePayload)
      .eq("id", editId);

    if (error) return alert(error.message);

    setEditId(null);
    fetchLeaves();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-slate-800 text-white rounded-2xl p-5">
        <div className="flex justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Leave Management</h2>
            <p className="text-sm text-slate-300">Full Day · Half Day · Permission</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-white text-slate-800 px-4 py-2 rounded-lg flex gap-2 items-center"
          >
            <Plus size={16} /> New Leave
          </button>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap text-xs">
          {Object.keys(stats).map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`px-3 py-1 rounded-full border ${
                statusFilter === k ? "bg-white text-slate-800" : "bg-white/10 text-white"
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
          placeholder="Search leave / mode / request to..."
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Leave</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Request To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No leave requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.leaveType}</div>
                    <div className="text-xs text-slate-500">
                      {r.mode} {r.hours ? `• ${r.hours}` : ""}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {r.from} {r.to && `→ ${r.to}`}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {r.requestToName || "-"}
                      {r.requestToRole ? (
                        <span className="ml-2 px-2 py-0.5 border rounded-full">
                          {r.requestToRole}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full border text-xs ${tone[r.status]}`}>
                      {r.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewId(r.id)} className="p-2">
                      <Eye size={16} />
                    </button>

                    <button
                      disabled={r.status !== "Pending"}
                      onClick={() => openEdit(r)}
                      className="p-2 disabled:opacity-40"
                      title={r.status !== "Pending" ? "Only Pending can be edited" : "Edit"}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {selectedView && (
        <ModalShell title="Leave Details" onClose={() => setViewId(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-slate-500">Employee</p>
                <p className="font-semibold">{EMP.name}</p>
                <p className="text-xs text-slate-500 mt-1">{EMP.id}</p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-xs text-slate-500">Status</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded-full border text-xs font-semibold ${
                    tone[selectedView.status]
                  }`}
                >
                  {selectedView.status}
                </span>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-slate-500">Request To</p>
              <p className="font-semibold">{selectedView.requestToName || "-"}</p>
              {selectedView.requestToId ? (
                <p className="text-xs text-slate-500 mt-1">{selectedView.requestToId}</p>
              ) : null}
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-slate-500">Leave Type</p>
              <p className="font-semibold">{selectedView.leaveType}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-slate-500">Mode</p>
                <p className="font-semibold">{selectedView.mode}</p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-xs text-slate-500">Duration</p>
                <p className="font-semibold">
                  {selectedView.from}
                  {selectedView.mode === "Full Day" ? ` → ${selectedView.to}` : ""}
                </p>

                {needsTime(selectedView.mode) &&
                  selectedView.timeFrom &&
                  selectedView.timeTo && (
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedView.timeFrom} → {selectedView.timeTo}
                      {selectedView.hours ? ` • ${selectedView.hours}` : ""}
                    </p>
                  )}
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-slate-500">Reason</p>
              <p>{selectedView.reason || "-"}</p>
            </div>

            <p className="text-xs text-slate-400">Applied at {fmt(selectedView.appliedAt)}</p>
          </div>
        </ModalShell>
      )}

      {/* CREATE MODAL */}
      {createOpen && (
        <ModalShell title="Apply Leave" onClose={() => setCreateOpen(false)}>
          <form onSubmit={createLeave} className="space-y-3">
            {/* Request To */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Request To</label>
              <select
                value={cRequestToId}
                onChange={(e) => setCRequestToId(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Approver</option>
                {approvers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.role ? `(${a.role})` : ""}
                  </option>
                ))}
              </select>

              {approvers.length === 0 ? (
                <p className="text-xs text-rose-600 mt-1">
                  Approver list empty.
                  {approverError ? (
                    <span className="block mt-1">Error: {approverError}</span>
                  ) : (
                    <span className="block mt-1">
                      Check `hrmss_approvers` table data (active=true, access='approver') and RLS SELECT policy.
                    </span>
                  )}
                </p>
              ) : null}
            </div>

            <select
              value={cType}
              onChange={(e) => setCType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {leaveTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              value={cMode}
              onChange={(e) => {
                const next = e.target.value;
                setCMode(next);

                if (next === "Full Day") {
                  setCFromTime("");
                  setCToTime("");
                } else {
                  setCTo("");
                }
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              {leaveModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <input
              type="date"
              value={cFrom}
              onChange={(e) => setCFrom(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />

            {cMode === "Full Day" && (
              <input
                type="date"
                value={cTo}
                onChange={(e) => setCTo(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            )}

            {needsTime(cMode) && (
              <>
                <TimePreset
                  onMorning={() => {
                    setCFromTime("09:00");
                    setCToTime("13:00");
                  }}
                  onAfternoon={() => {
                    setCFromTime("13:00");
                    setCToTime("17:00");
                  }}
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={cFromTime}
                    onChange={(e) => setCFromTime(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <input
                    type="time"
                    value={cToTime}
                    onChange={(e) => setCToTime(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                {calcDuration(cFromTime, cToTime) && (
                  <div className="text-sm bg-slate-50 border rounded-lg p-2">
                    ⏱ Duration: <b>{calcDuration(cFromTime, cToTime)}</b>
                  </div>
                )}
              </>
            )}

            <textarea
              value={cReason}
              onChange={(e) => setCReason(e.target.value)}
              rows={3}
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Reason"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg">
                Apply
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* EDIT MODAL */}
      {selectedEdit && (
        <ModalShell title="Edit Leave" onClose={() => setEditId(null)}>
          <form onSubmit={saveEdit} className="space-y-3">
            {/* Request To */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Request To</label>
              <select
                value={eRequestToId}
                onChange={(e) => setERequestToId(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Approver</option>
                {approvers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.role ? `(${a.role})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={eType}
              onChange={(e) => setEType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {leaveTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              value={eMode}
              onChange={(e) => {
                const next = e.target.value;
                setEMode(next);
                if (next !== "Full Day") setETo("");
                if (next === "Full Day") {
                  setEFromTime("");
                  setEToTime("");
                }
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              {leaveModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <input
              type="date"
              value={eFrom}
              onChange={(e) => setEFrom(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />

            {eMode === "Full Day" && (
              <input
                type="date"
                value={eTo}
                onChange={(e) => setETo(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            )}

            {needsTime(eMode) && (
              <>
                <TimePreset
                  onMorning={() => {
                    setEFromTime("09:00");
                    setEToTime("13:00");
                  }}
                  onAfternoon={() => {
                    setEFromTime("13:00");
                    setEToTime("17:00");
                  }}
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={eFromTime}
                    onChange={(e) => setEFromTime(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <input
                    type="time"
                    value={eToTime}
                    onChange={(e) => setEToTime(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                {calcDuration(eFromTime, eToTime) && (
                  <div className="text-sm bg-slate-50 border rounded-lg p-2">
                    ⏱ Duration: <b>{calcDuration(eFromTime, eToTime)}</b>
                  </div>
                )}
              </>
            )}

            <textarea
              value={eReason}
              onChange={(e) => setEReason(e.target.value)}
              rows={3}
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Reason"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="px-4 py-2 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg">
                Save
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

/*
✅ DB REQUIRED:
employee_leaves must have:
- request_to_id (text)
- request_to_name (text)
- request_to_role (text)

✅ Approver dropdown source:
hrmss_approvers must have:
- id, name, role, access, active
And data like:
access='approver', active=true
*/
