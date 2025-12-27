import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ===================== CONFIG ===================== */
const APPROVERS_TABLE = "hrmss_approvers";
const LEAVES_TABLE = "hrmss_leave_requests";

// ✅ demo HR (later read from auth/session)
const currentHR = { id: "HR-001", name: "HR" };

const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Annual Leave",
  "Work From Home",
  "Paid Leave",
  "Other",
];

const leaveModes = ["Full Day", "Half Day", "Permission"];

/* ===================== HELPERS ===================== */
const normMode = (m) =>
  String(m || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isHalfDay = (m) => normMode(m) === "half day";
const isPermission = (m) => normMode(m) === "permission";
const isFullDay = (m) => normMode(m) === "full day";
const needsTime = (m) => isHalfDay(m) || isPermission(m);

const shortTime = (t) => {
  if (!t) return "";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
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

const diffDaysInclusive = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const ms = b - a;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return Number.isFinite(days) ? Math.max(days, 1) : 1;
};

const pill = (status) => {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border";
  if (status === "Approved")
    return `${base} bg-green-50 text-green-700 border-green-200`;
  if (status === "Rejected")
    return `${base} bg-red-50 text-red-700 border-red-200`;
  return `${base} bg-yellow-50 text-yellow-800 border-yellow-200`;
};

const pillDark = () =>
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border border-white/20 bg-white/15 text-white";

const roleBadge = (role) => {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border";
  if (role === "employee")
    return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  if (role === "admin")
    return `${base} bg-purple-50 text-purple-700 border-purple-200`;
  return `${base} bg-gray-50 text-gray-700 border-gray-200`; // hr
};

const fmtDT = (iso) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

const initials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
};

/* ===================== UI bits ===================== */
const TimePreset = ({ onMorning, onAfternoon }) => (
  <div className="flex gap-2 flex-wrap">
    <button
      type="button"
      onClick={onMorning}
      className="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50"
    >
      Morning (09:00 - 13:00)
    </button>
    <button
      type="button"
      onClick={onAfternoon}
      className="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50"
    >
      Afternoon (13:00 - 17:00)
    </button>
  </div>
);

/* ===================== PAGE ===================== */
export default function LeaveManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [managers, setManagers] = useState([]);
  const [mgrError, setMgrError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [search, setSearch] = useState("");

  // View modal
  const [viewing, setViewing] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");

  // Apply modal
  const [showApply, setShowApply] = useState(false);

  // Apply fields
  const [applyLeaveType, setApplyLeaveType] = useState("Casual Leave");
  const [applyMode, setApplyMode] = useState("Full Day");
  const [applyFrom, setApplyFrom] = useState("");
  const [applyTo, setApplyTo] = useState("");
  const [applyFromTime, setApplyFromTime] = useState("");
  const [applyToTime, setApplyToTime] = useState("");
  const [applyReason, setApplyReason] = useState("");

  /* ---------------- FETCH MANAGERS ---------------- */
  const fetchManagers = async () => {
    setMgrError("");
    const { data, error } = await supabase
      .from(APPROVERS_TABLE)
      .select("id,name,email,role,access,active")
      .eq("active", true)
      .eq("role", "manager")
      .order("name", { ascending: true });

    if (error) {
      setManagers([]);
      setMgrError(error.message);
      return;
    }

    const list = (data || []).map((r) => ({
      id: String(r.id),
      name: String(r.name || ""),
      email: r.email ? String(r.email) : "",
      access: String(r.access || ""), // approver / viewer
    }));

    setManagers(list);
  };

  /* ---------------- FETCH REQUESTS ---------------- */
  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(LEAVES_TABLE)
      .select("*")
      .order("applied_at", { ascending: false });

    if (error) {
      console.warn(error.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((r) => {
      const mode = (r.mode ?? "").toString();
      const fromDate = r.from_date;
      const toDate = r.to_date || r.from_date; // ✅ safe fallback

      // NOTE: time_from/time_to might come as "09:00:00" or "09:00:00+00"
      const tf = shortTime(r.time_from);
      const tt = shortTime(r.time_to);

      return {
        id: r.id,
        ownerRole: r.owner_role,
        ownerId: r.owner_id,
        ownerName: r.owner_name,

        requestToId: r.request_to_id,
        requestToName: r.request_to_name || "",
        requestToRole: r.request_to_role || "",

        leaveType: r.leave_type,
        mode,
        from: fromDate,
        to: toDate,
        timeFrom: tf,
        timeTo: tt,
        hours: r.hours || (needsTime(mode) ? calcDuration(tf, tt) : null),

        reason: r.reason,
        status: r.status,
        appliedAt: r.applied_at,

        decisionNote: r.decision_note || "",
        decidedAt: r.decided_at || "",
        decidedBy: r.decided_by_name || "",
      };
    });

    setRequests(mapped);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchManagers();
      await fetchRequests();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setViewing(null);
        setShowApply(false);
      }
    };
    if (viewing || showApply) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing, showApply]);

  /* ✅ IMPORTANT: keep To = From when Half Day / Permission */
  useEffect(() => {
    if (needsTime(applyMode) && applyFrom) {
      setApplyTo(applyFrom);
    }
  }, [applyMode, applyFrom]);

  /* ---------------- Derived ---------------- */
  const filtered = useMemo(() => {
    let list = [...requests];

    if (sourceFilter !== "All") list = list.filter((r) => r.ownerRole === sourceFilter);
    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          String(r.id).toLowerCase().includes(q) ||
          (r.ownerName || "").toLowerCase().includes(q) ||
          (r.ownerId || "").toLowerCase().includes(q) ||
          (r.leaveType || "").toLowerCase().includes(q) ||
          (r.reason || "").toLowerCase().includes(q) ||
          (r.requestToName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, statusFilter, sourceFilter, search]);

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Pending").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const rejected = requests.filter((r) => r.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const managerLabel = useMemo(() => {
    if (managers.length === 0) return "Manager";
    return managers
      .map((m) => `${m.name}${m.access === "viewer" ? " (viewer)" : " (approver)"}`)
      .join(", ");
  }, [managers]);

  /* ---------------- Actions ---------------- */
  const openView = (req) => {
    setViewing(req);
    setDecisionNote(req.decisionNote || "");
  };

  const closeView = () => {
    setViewing(null);
    setDecisionNote("");
  };

  const updateStatus = async (row, nextStatus) => {
    const payload = {
      status: nextStatus,
      decision_note: decisionNote?.trim() || "",
      decided_at: new Date().toISOString().slice(0, 10),
      decided_by_id: currentHR.id,
      decided_by_name: currentHR.name,
    };

    const { error } = await supabase.from(LEAVES_TABLE).update(payload).eq("id", row.id);
    if (error) return alert(error.message);

    closeView();
    fetchRequests();
  };

  /* ---------------- APPLY ---------------- */
  const submitApply = async () => {
    if (!applyLeaveType) return alert("Leave Type required.");
    if (!applyFrom) return alert("From date required.");
    if (!applyReason.trim()) return alert("Reason required.");

    // ✅ Full day needs To, Half/Permission => To = From (auto)
    const uiTo = needsTime(applyMode) ? applyFrom : applyTo;
    if (!uiTo) return alert("To date required.");
    if (!needsTime(applyMode) && new Date(uiTo) < new Date(applyFrom))
      return alert("To date cannot be earlier than From date.");

    if (needsTime(applyMode)) {
      if (!applyFromTime || !applyToTime)
        return alert("Time From/To required for Half Day / Permission.");
      const dur = calcDuration(applyFromTime, applyToTime);
      if (!dur) return alert("Invalid time range.");
    }

    if (managers.length === 0) {
      return alert("Managers list empty. Add managers in hrmss_approvers table (role=manager).");
    }

    const approverMgr = managers.find((m) => m.access === "approver");
    const viewerMgrs = managers.filter((m) => m.access === "viewer");
    if (!approverMgr) return alert("No approver manager found. Set Arun as access='approver'.");

    const toDateForDB = isFullDay(applyMode) ? uiTo : applyFrom;

    const tf = needsTime(applyMode) ? shortTime(applyFromTime) : null;
    const tt = needsTime(applyMode) ? shortTime(applyToTime) : null;

    const common = {
      owner_role: "hr",
      owner_id: currentHR.id,
      owner_name: currentHR.name,

      request_to_role: "manager",

      leave_type: applyLeaveType,
      mode: applyMode,

      from_date: applyFrom,
      to_date: toDateForDB,

      time_from: tf,
      time_to: tt,
      hours: needsTime(applyMode) ? calcDuration(tf, tt) : null,

      reason: applyReason.trim(),
      status: "Pending",
    };

    // ✅ send to BOTH (approver + viewer) -> 2 rows
    const rowsToInsert = [
      { ...common, request_to_id: approverMgr.id, request_to_name: approverMgr.name },
      ...viewerMgrs.map((v) => ({ ...common, request_to_id: v.id, request_to_name: v.name })),
    ];

    const { error } = await supabase.from(LEAVES_TABLE).insert(rowsToInsert);
    if (error) return alert(error.message);

    setApplyLeaveType("Casual Leave");
    setApplyMode("Full Day");
    setApplyFrom("");
    setApplyTo("");
    setApplyFromTime("");
    setApplyToTime("");
    setApplyReason("");
    setShowApply(false);

    fetchRequests();
    alert("Leave request sent to Managers!");
  };

  /* ===================== UI ===================== */
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-600">
            HR can view all leave requests and approve/reject them. HR can also apply leave to Managers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApply(true)}
          className="self-start md:self-auto px-4 py-2 rounded-xl text-sm font-semibold bg-purple-700 text-white hover:bg-purple-800 transition"
        >
          Apply Leave
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-semibold">{counts.total}</div>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-xl font-semibold">{counts.pending}</div>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Approved</div>
          <div className="text-xl font-semibold">{counts.approved}</div>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Rejected</div>
          <div className="text-xl font-semibold">{counts.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Source</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search id / name / type / reason..."
            className="w-full md:w-80 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Request</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Mode</th>
              <th className="text-left px-4 py-3 font-medium">Dates / Time</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={6}>
                  No leave requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const { date, time } = fmtDT(r.appliedAt);

                const tf = shortTime(r.timeFrom);
                const tt = shortTime(r.timeTo);

                // ✅ If Half Day / Permission -> always show time row (with placeholder)
                const showTimeForThis = needsTime(r.mode);

                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.leaveType}</div>
                      <div className="text-xs text-gray-500">
                        #{String(r.id).slice(0, 8)} • Applied: {date} {time}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{r.reason}</div>

                      <div className="text-xs text-gray-500 mt-2">
                        <span className="font-semibold text-gray-700">Request To:</span>{" "}
                        <span className="font-semibold">Manager</span>{" "}
                        <span className="text-gray-500">• {r.requestToName || "-"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{r.ownerName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <span className={roleBadge(r.ownerRole)}>
                          {r.ownerRole === "employee"
                            ? "Employee"
                            : r.ownerRole === "admin"
                            ? "Admin"
                            : "HR"}
                        </span>
                        <span>{r.ownerId}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{r.mode}</div>
                      {r.hours ? (
                        <div className="text-xs text-gray-500 mt-1">⏱ {r.hours}</div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {r.from} → {r.to}
                      </div>

                      {showTimeForThis ? (
                        <div className="text-xs text-gray-700 mt-1">
                          Time: <span className="font-semibold">{tf || "--:--"}</span> →{" "}
                          <span className="font-semibold">{tt || "--:--"}</span>
                        </div>
                      ) : null}

                      <div className="text-xs text-gray-500 mt-1">
                        Days: {diffDaysInclusive(r.from, r.to)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={pill(r.status)}>{r.status}</span>
                      {r.decidedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Decided: {r.decidedAt} {r.decidedBy ? `• By: ${r.decidedBy}` : ""}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openView(r)}
                          className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== Apply Leave Modal ===================== */}
      {showApply && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowApply(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="shrink-0 bg-gradient-to-r from-purple-700 via-indigo-600 to-sky-500 text-white px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">Apply Leave</p>
                <div className="mt-1 text-lg font-semibold">Request To: Manager</div>
                <div className="text-xs text-white/80 mt-1">Will be sent to approver + viewer</div>
              </div>

              <button
                type="button"
                onClick={() => setShowApply(false)}
                className="rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/15"
                aria-label="Close"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div className="text-xs text-slate-500">Request To</div>
                <div className="font-semibold text-slate-900">Manager</div>
                <div className="text-xs text-slate-700 mt-1">
                  {managers.length ? managerLabel : "No managers found"}
                </div>
                {mgrError ? (
                  <div className="text-xs text-rose-600 mt-2">Managers fetch error: {mgrError}</div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Leave Type</label>
                <select
                  value={applyLeaveType}
                  onChange={(e) => setApplyLeaveType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                >
                  {leaveTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Mode</label>
                <select
                  value={applyMode}
                  onChange={(e) => {
                    const next = e.target.value;
                    setApplyMode(next);

                    // ✅ Full Day -> clear time, Half/Permission -> keep time section
                    if (!needsTime(next)) {
                      setApplyFromTime("");
                      setApplyToTime("");
                    } else {
                      // ✅ Half/Permission -> To always equals From
                      if (applyFrom) setApplyTo(applyFrom);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                >
                  {leaveModes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* From & To calendar always */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">From</label>
                  <input
                    type="date"
                    value={applyFrom}
                    onChange={(e) => {
                      const v = e.target.value;
                      setApplyFrom(v);
                      if (needsTime(applyMode)) setApplyTo(v); // ✅ auto sync
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">To</label>
                  <input
                    type="date"
                    value={applyTo}
                    onChange={(e) => setApplyTo(e.target.value)}
                    disabled={needsTime(applyMode)} // ✅ still visible, but locked
                    className={`w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 ${
                      needsTime(applyMode) ? "bg-slate-100 cursor-not-allowed" : ""
                    }`}
                  />
                  {needsTime(applyMode) ? (
                    <div className="text-[11px] text-slate-500 mt-1">
                      Half Day / Permission: To date is same as From date.
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ✅ Half Day / Permission -> time MUST show */}
              {needsTime(applyMode) && (
                <div className="space-y-2">
                  <TimePreset
                    onMorning={() => {
                      setApplyFromTime("09:00");
                      setApplyToTime("13:00");
                    }}
                    onAfternoon={() => {
                      setApplyFromTime("13:00");
                      setApplyToTime("17:00");
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Time From</label>
                      <input
                        type="time"
                        value={applyFromTime}
                        onChange={(e) => setApplyFromTime(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Time To</label>
                      <input
                        type="time"
                        value={applyToTime}
                        onChange={(e) => setApplyToTime(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {calcDuration(shortTime(applyFromTime), shortTime(applyToTime)) ? (
                    <div className="text-sm bg-slate-50 border border-slate-200 rounded-xl p-2">
                      ⏱ Duration:{" "}
                      <b>{calcDuration(shortTime(applyFromTime), shortTime(applyToTime))}</b>
                    </div>
                  ) : null}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-600 mb-1">Reason</label>
                <textarea
                  rows={4}
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  placeholder="Write reason..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t bg-white px-5 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApply(false)}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApply}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-purple-700 text-white hover:bg-purple-800"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== View Modal ===================== */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeView();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-sky-500 text-white px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">Leave request</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold">#{String(viewing.id).slice(0, 8)}</span>
                  <span className={pillDark()}>{viewing.status}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeView}
                className="rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/15"
                aria-label="Close"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-bold">
                  {initials(viewing.ownerName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{viewing.ownerName}</p>
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className={roleBadge(viewing.ownerRole)}>
                      {viewing.ownerRole === "employee"
                        ? "Employee"
                        : viewing.ownerRole === "admin"
                        ? "Admin"
                        : "HR"}
                    </span>
                    <span className="text-xs text-slate-500">{viewing.ownerId}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">Request To</p>
                <p className="mt-1 font-semibold text-slate-900">Manager • {viewing.requestToName || "-"}</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">Leave</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {viewing.leaveType} • {viewing.mode}
                </p>
                <p className="mt-2 text-slate-800">
                  {viewing.from} → {viewing.to}{" "}
                  <span className="text-xs text-slate-500 ml-2">
                    ({diffDaysInclusive(viewing.from, viewing.to)} day(s))
                  </span>
                </p>

                {/* ✅ Half Day/Permission -> always show time line */}
                {needsTime(viewing.mode) ? (
                  <p className="text-xs text-slate-700 mt-1">
                    Time: <span className="font-semibold">{shortTime(viewing.timeFrom) || "--:--"}</span> →{" "}
                    <span className="font-semibold">{shortTime(viewing.timeTo) || "--:--"}</span>
                    {viewing.hours ? <span className="text-slate-500"> • {viewing.hours}</span> : null}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">Reason</p>
                <p className="mt-1 text-slate-800 leading-relaxed">{viewing.reason || "-"}</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">HR Note (optional)</p>
                <textarea
                  rows={3}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  placeholder="Add note..."
                />
              </div>

              {viewing.decidedAt && (
                <div className="rounded-xl bg-white border border-slate-100 p-3">
                  <p className="text-[11px] text-slate-500">Decision</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {viewing.status} • {viewing.decidedAt} {viewing.decidedBy ? `• ${viewing.decidedBy}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">Note: {viewing.decisionNote || "-"}</p>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={closeView}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Close
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={viewing.status !== "Pending"}
                  onClick={() => updateStatus(viewing, "Rejected")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    viewing.status !== "Pending"
                      ? "opacity-50 cursor-not-allowed bg-white text-gray-500"
                      : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                  }`}
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={viewing.status !== "Pending"}
                  onClick={() => updateStatus(viewing, "Approved")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    viewing.status !== "Pending"
                      ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-600"
                      : "bg-purple-700 text-white hover:bg-purple-800"
                  }`}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
