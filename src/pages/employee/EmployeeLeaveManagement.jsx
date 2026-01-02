import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, X, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------- CONSTANTS ---------------- */
const LEAVES_TABLE = "hrmss_leave_requests";
const APPROVER_TABLE = "hrmss_approvers";

/**
 * ✅ If you want to force-hide specific approver IDs from "Request To",
 * add their ids here. Example: new Set(["APP-002"])
 */
const EXCLUDE_APPROVER_IDS = new Set([]);

/* ---------------- LISTS ---------------- */
const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Annual Leave",
  "Work From Home",
  "Other",
];

const leaveModes = ["Full Day", "Half Day", "Permission"];

/* ---------------- UI helpers ---------------- */
const tone = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const needsTime = (mode) => mode === "Permission" || mode === "Half Day";

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

/* ✅ DD-MM-YYYY format for display */
const toDMY = (v) => {
  if (!v) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
    const [y, m, d] = String(v).split("-");
    return `${d}-${m}-${y}`;
  }
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    return `${dd}-${mm}-${yy}`;
  } catch {
    return String(v);
  }
};

const fmtDateTimeDMY = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${hh}:${mi}`;
  } catch {
    return String(iso);
  }
};

/* ---------------- ✅ CURRENT EMPLOYEE FROM STORAGE ---------------- */
const safeJson = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const normalizeUser = (obj, fallback) => {
  if (!obj || typeof obj !== "object") return fallback;

  const id =
    obj.id ||
    obj.employee_id ||
    obj.employeeId ||
    obj.emp_id ||
    obj.empId ||
    obj.user_id ||
    obj.userId ||
    obj.identifier ||
    fallback.id;

  const name =
    obj.name ||
    obj.employee_name ||
    obj.employeeName ||
    obj.full_name ||
    obj.fullName ||
    obj.username ||
    obj.user_name ||
    fallback.name;

  return { id: String(id || fallback.id), name: String(name || fallback.name) };
};

const getEmployeeFromStorage = (fallback) => {
  if (typeof window === "undefined") return fallback;

  const likelyKeys = [
    "hrmss.session",
    "hrmss.auth",
    "hrmss.user",
    "hrmss.employee",
    "hrmss.employee.session",
    "employee_session",
    "employeeSession",
    "EMPLOYEE_SESSION",
    "HRMSS_AUTH_SESSION",
  ];

  const matchesEmployeeRole = (o) => {
    const role =
      (o?.role || o?.userRole || o?.type || o?.user_type || o?.userType || "")
        .toString()
        .toLowerCase();
    if (!role) return null;
    if (role.includes("employee")) return true;
    return null;
  };

  for (const k of likelyKeys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    const parsed = safeJson(raw);

    const candidates = [parsed, parsed?.user, parsed?.profile, parsed?.data];
    for (const c of candidates) {
      if (!c) continue;
      if (matchesEmployeeRole(c) === true) return normalizeUser(c, fallback);
    }

    if (parsed && typeof parsed === "object") {
      const u = normalizeUser(parsed?.user || parsed, fallback);
      if ((u.id || "").toUpperCase().startsWith("EMP")) return u;
    }
  }

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      if (key.startsWith("hrmss.profile.cache.employee.")) {
        const raw = window.localStorage.getItem(key);
        const parsed = safeJson(raw);
        if (parsed && typeof parsed === "object") {
          const u = normalizeUser(parsed, fallback);
          if ((u.id || "").toUpperCase().startsWith("EMP")) return u;
        }
      }

      const raw = window.localStorage.getItem(key);
      const parsed = safeJson(raw);
      if (!parsed || typeof parsed !== "object") continue;

      const candidates = [parsed, parsed?.user, parsed?.profile, parsed?.data];
      for (const c of candidates) {
        if (!c) continue;
        if (matchesEmployeeRole(c) === true) return normalizeUser(c, fallback);
      }

      const u = normalizeUser(parsed?.user || parsed, fallback);
      if ((u.id || "").toUpperCase().startsWith("EMP")) return u;
    }
  } catch {
    // ignore
  }

  return fallback;
};

/* ---------------- MODALS ---------------- */
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

/* ✅ Apply modal (screenshot size + scroll + new color) */
const ApplyModal = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
        <div className="shrink-0 bg-gradient-to-r from-fuchsia-700 via-indigo-700 to-sky-600 text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">
              Apply Leave
            </p> */}
            <div className="mt-1 text-lg font-semibold">Apply Leave</div>
            {/* <div className="text-xs text-white/80 mt-1">
              Will be sent to approver + viewer
            </div> */}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/15"
            aria-label="Close"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

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

/* ---------------- MULTI SELECT (checkbox list) ---------------- */
const MultiApproverSelect = ({
  items,
  valueIds,
  setValueIds,
  errorText,
}) => {
  const toggle = (id) => {
    setValueIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const selectedNames = useMemo(() => {
    const map = new Map(items.map((x) => [x.id, x]));
    return valueIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((x) => x.name);
  }, [items, valueIds]);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
        <div className="text-xs text-slate-500">Request To</div>
        <div className="font-semibold text-slate-900">
          {selectedNames.length ? selectedNames.join(", ") : "No one selected"}
        </div>
        <div className="text-[11px] text-slate-600 mt-1">
          {selectedNames.length
            ? `${selectedNames.length} selected`
            : "Select at least 1 approver"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-white border-b text-xs font-semibold text-slate-700">
         Approvers (Manager / Admin / HR)
        </div>

        <div className="max-h-44 overflow-y-auto bg-white">
          {items.length === 0 ? (
            <div className="p-3 text-xs text-rose-600">
              Approver list empty.
              {errorText ? (
                <div className="mt-1">Error: {errorText}</div>
              ) : (
                <div className="mt-1">
                  Check <b>hrmss_approvers</b> table + RLS SELECT policy.
                </div>
              )}
            </div>
          ) : (
            items.map((a) => {
              const checked = valueIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {a.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {a.id}
                      {a.role ? ` • ${a.role}` : ""}
                      {a.access ? ` • ${a.access}` : ""}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center ${
                      checked
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-200 text-transparent"
                    }`}
                  >
                    <Check size={14} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN ---------------- */
export default function EmployeeLeaveManagement() {
  // ✅ dynamic employee (so each employee sees only their own)
  const EMP = useMemo(
    () =>
      getEmployeeFromStorage({
        id: "EMP-001",
        name: "Priya Sharma",
      }),
    []
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // approvers (request-to)
  const [approvers, setApprovers] = useState([]);
  const [approverError, setApproverError] = useState("");

  /* CREATE */
  const [cRequestToIds, setCRequestToIds] = useState([]); // ✅ multi
  const [cType, setCType] = useState("Casual Leave");
  const [cMode, setCMode] = useState("Full Day");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [cFromTime, setCFromTime] = useState("");
  const [cToTime, setCToTime] = useState("");
  const [cReason, setCReason] = useState("");

  /* EDIT (single, same as your logic) */
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

  /* ---------------- FETCH APPROVERS (✅ Manager + Admin + HR) ---------------- */
  const fetchApprovers = async () => {
    setApproverError("");

    const { data, error } = await supabase
      .from(APPROVER_TABLE)
      .select("id,name,role,access,active")
      .eq("active", true)
      .eq("access", "approver")
      .in("role", ["hr", "manager", "admin"]) // ✅ now all 3 roles
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.warn("Approver fetch error:", error.message);
      setApprovers([]);
      setApproverError(error.message);
      return;
    }

    // ✅ dedupe by (role + name) so same HR duplicates removed
    const seen = new Set();
    const list = (data || [])
      .map((r) => ({
        id: String(r.id),
        name: String(r.name || ""),
        role: String(r.role || ""),
        access: String(r.access || ""),
      }))
      .filter((x) => x.id && x.name)
      .filter((x) => !EXCLUDE_APPROVER_IDS.has(x.id))
      .filter((x) => {
        const key = `${x.role}:${x.name.trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    setApprovers(list);
  };

  /* ---------------- FETCH LEAVES ---------------- */
  const fetchLeaves = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from(LEAVES_TABLE)
      .select("*")
      .eq("owner_role", "employee")
      .eq("owner_id", EMP.id)
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
        timeFrom: shortTime(r.time_from),
        timeTo: shortTime(r.time_to),
        hours: r.hours,
        reason: r.reason,
        status: r.status,
        appliedAt: r.applied_at,

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
  }, [EMP.id]);

  useEffect(() => {
    if (needsTime(cMode) && cFrom) setCTo(cFrom);
  }, [cMode, cFrom]);

  useEffect(() => {
    if (needsTime(eMode) && eFrom) setETo(eFrom);
  }, [eMode, eFrom]);

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
          (r.requestToName || "").toLowerCase().includes(q) ||
          (r.requestToRole || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, statusFilter, search]);

  const selectedView = rows.find((r) => r.id === viewId);
  const selectedEdit = rows.find((r) => r.id === editId);

  const approverById = useMemo(() => {
    const m = new Map();
    for (const a of approvers) m.set(a.id, a);
    return m;
  }, [approvers]);

  /* ---------------- CREATE (multi insert) ---------------- */
  const createLeave = async (e) => {
    e.preventDefault();

    if (!cRequestToIds.length) {
      alert("Please select at least 1 Request To (approver).");
      return;
    }

    const toDateForDB = cMode === "Full Day" ? cTo : cFrom;
    if (!cFrom) return alert("From date required.");
    if (!toDateForDB) return alert("To date required.");
    if (!cReason.trim()) return alert("Reason required.");

    if (needsTime(cMode)) {
      if (!cFromTime || !cToTime) return alert("Time From/To required.");
      const dur = calcDuration(cFromTime, cToTime);
      if (!dur) return alert("Invalid time range.");
    }

    const common = {
      owner_role: "employee",
      owner_id: EMP.id,
      owner_name: EMP.name,

      leave_type: cType,
      mode: cMode,
      from_date: cFrom,
      to_date: toDateForDB,

      time_from: needsTime(cMode) ? cFromTime : null,
      time_to: needsTime(cMode) ? cToTime : null,
      hours: needsTime(cMode) ? calcDuration(cFromTime, cToTime) : null,

      reason: cReason.trim(),
      status: "Pending",
    };

    // ✅ insert 1 row per selected approver
    const rowsToInsert = cRequestToIds.map((id) => {
      const a = approverById.get(id);
      return {
        ...common,
        request_to_id: a?.id ?? id,
        request_to_name: a?.name ?? null,
        request_to_role: a?.role ?? null, // ✅ saves manager/admin/hr
      };
    });

    const { error } = await supabase.from(LEAVES_TABLE).insert(rowsToInsert);
    if (error) return alert(error.message);

    setCreateOpen(false);
    setCRequestToIds([]);
    setCType("Casual Leave");
    setCMode("Full Day");
    setCFrom("");
    setCTo("");
    setCFromTime("");
    setCToTime("");
    setCReason("");

    fetchLeaves();
  };

  /* ---------------- EDIT (single) ---------------- */
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

    const a = approverById.get(eRequestToId);

    const updatePayload = {
      leave_type: eType,
      mode: eMode,
      from_date: eFrom,
      to_date: eMode === "Full Day" ? eTo : eFrom,

      time_from: needsTime(eMode) ? eFromTime : null,
      time_to: needsTime(eMode) ? eToTime : null,
      hours: needsTime(eMode) ? calcDuration(eFromTime, eToTime) : null,

      reason: eReason,

      request_to_id: a?.id ?? eRequestToId,
      request_to_name: a?.name ?? null,
      request_to_role: a?.role ?? null,
    };

    const { error } = await supabase
      .from(LEAVES_TABLE)
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
            <p className="text-xs text-slate-300 mt-1">
              Logged in: <span className="font-semibold">{EMP.name}</span> • {EMP.id}
            </p>
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
                    <div className="text-[11px] text-slate-400 mt-1">
                      Applied: {fmtDateTimeDMY(r.appliedAt)}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {toDMY(r.from)} {r.to ? `→ ${toDMY(r.to)}` : ""}
                    </div>
                    {needsTime(r.mode) && r.timeFrom && r.timeTo ? (
                      <div className="text-xs text-slate-500 mt-1">
                        Time: {r.timeFrom} → {r.timeTo}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-700 font-semibold">
                      {r.requestToName || "-"}
                      {r.requestToRole ? (
                        <span className="ml-2 px-2 py-0.5 border rounded-full text-[11px] font-semibold">
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
              {selectedView.requestToRole ? (
                <p className="text-xs text-slate-500 mt-1">Role: {selectedView.requestToRole}</p>
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
                  {toDMY(selectedView.from)}
                  {selectedView.mode === "Full Day" ? ` → ${toDMY(selectedView.to)}` : ""}
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

            <p className="text-xs text-slate-400">
              Applied at {fmtDateTimeDMY(selectedView.appliedAt)}
            </p>
          </div>
        </ModalShell>
      )}

      {/* CREATE MODAL */}
      <ApplyModal open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={createLeave} className="space-y-4 text-sm">
          <MultiApproverSelect
            items={approvers}
            valueIds={cRequestToIds}
            setValueIds={setCRequestToIds}
            errorText={approverError}
          />

          <div>
            <label className="block text-xs text-slate-600 mb-1">Leave Type</label>
            <select
              value={cType}
              onChange={(e) => setCType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
            >
              {leaveTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Mode</label>
            <select
              value={cMode}
              onChange={(e) => {
                const next = e.target.value;
                setCMode(next);

                if (!needsTime(next)) {
                  setCFromTime("");
                  setCToTime("");
                } else {
                  if (cFrom) setCTo(cFrom);
                }
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
            >
              {leaveModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">From</label>
              <input
                type="date"
                value={cFrom}
                onChange={(e) => {
                  const v = e.target.value;
                  setCFrom(v);
                  if (needsTime(cMode)) setCTo(v);
                }}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
              />
              {cFrom ? (
                <div className="text-[11px] text-slate-500 mt-1">
                  Showing: <b>{toDMY(cFrom)}</b>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">To</label>
              <input
                type="date"
                value={cTo}
                onChange={(e) => setCTo(e.target.value)}
                disabled={needsTime(cMode)}
                required
                className={`w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 ${
                  needsTime(cMode) ? "bg-slate-100 cursor-not-allowed" : ""
                }`}
              />
              {needsTime(cMode) ? (
                <div className="text-[11px] text-slate-500 mt-1">
                  Half Day / Permission: To date is same as From date.
                </div>
              ) : cTo ? (
                <div className="text-[11px] text-slate-500 mt-1">
                  Showing: <b>{toDMY(cTo)}</b>
                </div>
              ) : null}
            </div>
          </div>

          {needsTime(cMode) && (
            <div className="space-y-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Time From</label>
                  <input
                    type="time"
                    value={cFromTime}
                    onChange={(e) => setCFromTime(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Time To</label>
                  <input
                    type="time"
                    value={cToTime}
                    onChange={(e) => setCToTime(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>
              </div>

              {calcDuration(shortTime(cFromTime), shortTime(cToTime)) ? (
                <div className="text-sm bg-slate-50 border border-slate-200 rounded-xl p-2">
                  ⏱ Duration:{" "}
                  <b>{calcDuration(shortTime(cFromTime), shortTime(cToTime))}</b>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-600 mb-1">Reason</label>
            <textarea
              value={cReason}
              onChange={(e) => setCReason(e.target.value)}
              rows={4}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
              placeholder="Write reason..."
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </form>
      </ApplyModal>

      {/* EDIT MODAL (unchanged logic) */}
      {selectedEdit && (
        <ModalShell title="Edit Leave" onClose={() => setEditId(null)}>
          <form onSubmit={saveEdit} className="space-y-3">
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
                if (needsTime(next)) setETo(eFrom);
                if (!needsTime(next)) {
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
              onChange={(e) => {
                const v = e.target.value;
                setEFrom(v);
                if (needsTime(eMode)) setETo(v);
              }}
              required
              className="w-full border rounded-lg px-3 py-2"
            />

            {eMode === "Full Day" ? (
              <input
                type="date"
                value={eTo}
                onChange={(e) => setETo(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            ) : null}

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
