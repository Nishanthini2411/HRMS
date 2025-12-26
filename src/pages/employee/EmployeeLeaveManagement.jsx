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

const fmt = (iso) => new Date(iso).toLocaleString();

const calcDuration = (from, to) => {
  if (!from || !to) return "";
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const diff = th * 60 + tm - (fh * 60 + fm);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h ? `${h} Hour${h > 1 ? "s" : ""}` : ""}${h && m ? " " : ""}${m ? `${m} Minutes` : ""}`;
};

const needsTime = (mode) => mode === "Permission" || mode === "Half Day";

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

/* ---------------- MAIN ---------------- */
export default function EmployeeLeaveManagement() {
  const [rows, setRows] = useState([]);

  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  /* CREATE */
  const [cType, setCType] = useState("Casual Leave");
  const [cMode, setCMode] = useState("Full Day");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [cFromTime, setCFromTime] = useState("");
  const [cToTime, setCToTime] = useState("");
  const [cReason, setCReason] = useState("");

  /* EDIT */
  const [eType, setEType] = useState("");
  const [eMode, setEMode] = useState("");
  const [eFrom, setEFrom] = useState("");
  const [eTo, setETo] = useState("");
  const [eFromTime, setEFromTime] = useState("");
  const [eToTime, setEToTime] = useState("");
  const [eReason, setEReason] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  /* ---------------- FETCH ---------------- */
  const fetchLeaves = async () => {
    const { data, error } = await supabase
      .from("employee_leaves")
      .select("*")
      .eq("employee_id", EMP.id)
      .order("applied_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setRows(
      data.map((r) => ({
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
      }))
    );
  };

  useEffect(() => {
    fetchLeaves();
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
          r.leaveType.toLowerCase().includes(q) ||
          r.mode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, statusFilter, search]);

  const selectedView = rows.find((r) => r.id === viewId);
  const selectedEdit = rows.find((r) => r.id === editId);

  /* ---------------- CREATE ---------------- */
  const createLeave = async (e) => {
    e.preventDefault();

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
    };

    const { error } = await supabase.from("employee_leaves").insert(payload);
    if (error) return alert(error.message);

    setCreateOpen(false);
    setCFrom(""); setCTo(""); setCFromTime(""); setCToTime(""); setCReason("");
    fetchLeaves();
  };

  /* ---------------- EDIT ---------------- */
  const openEdit = (r) => {
    setEditId(r.id);
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

    const { error } = await supabase
      .from("employee_leaves")
      .update({
        leave_type: eType,
        mode: eMode,
        from_date: eFrom,
        to_date: eMode === "Full Day" ? eTo : eFrom,
        time_from: needsTime(eMode) ? eFromTime : null,
        time_to: needsTime(eMode) ? eToTime : null,
        hours: needsTime(eMode) ? calcDuration(eFromTime, eToTime) : null,
        reason: eReason,
      })
      .eq("id", editId);

    if (error) return alert(error.message);

    setEditId(null);
    fetchLeaves();
  };

  const TimePreset = ({ onMorning, onAfternoon }) => (
    <div className="flex gap-2">
      <button type="button" onClick={onMorning} className="px-3 py-1 text-xs border rounded">
        Morning (09:00 - 13:00)
      </button>
      <button type="button" onClick={onAfternoon} className="px-3 py-1 text-xs border rounded">
        Afternoon (13:00 - 17:00)
      </button>
    </div>
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="bg-slate-800 text-white rounded-2xl p-5">
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold">Leave Management</h2>
            <p className="text-sm text-slate-300">
              Full Day · Half Day · Permission
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-white text-slate-800 px-4 py-2 rounded-lg flex gap-2"
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
          placeholder="Search leave..."
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
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
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
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
                  className={`inline-block mt-1 px-2 py-1 rounded-full border text-xs font-semibold ${tone[selectedView.status]}`}
                >
                  {selectedView.status}
                </span>
              </div>
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

                // Full day -> date range, clear times
                if (next === "Full Day") {
                  setCFromTime("");
                  setCToTime("");
                } else {
                  // Half Day / Permission -> single date
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

            {/* ✅ Half Day + Permission -> time */}
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

            {/* ✅ Half Day + Permission -> time */}
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
