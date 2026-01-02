import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------- DEMO USERS (replace later with auth) ---------------- */
/* ✅ FIX: get current logged-in user from localStorage (fallback to demo) */
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
    obj.admin_id ||
    obj.adminId ||
    obj.user_id ||
    obj.userId ||
    obj.identifier ||
    obj.empId ||
    fallback.id;

  const name =
    obj.name ||
    obj.employee_name ||
    obj.employeeName ||
    obj.admin_name ||
    obj.adminName ||
    obj.full_name ||
    obj.fullName ||
    obj.username ||
    obj.user_name ||
    fallback.name;

  return { id: String(id || fallback.id), name: String(name || fallback.name) };
};

const getUserFromStorage = (wantedRole, fallback) => {
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
    "hrmss.admin",
    "hrmss.admin.session",
    "admin_session",
    "adminSession",
    "ADMIN_SESSION",
  ];

  const matchesRole = (o) => {
    const role =
      (o?.role || o?.userRole || o?.type || o?.user_type || o?.userType || "")
        .toString()
        .toLowerCase();
    if (!role) return null;
    if (wantedRole === "employee" && role.includes("employee")) return true;
    if (wantedRole === "admin" && role.includes("admin")) return true;
    return false;
  };

  // 1) try common keys
  for (const k of likelyKeys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    const parsed = safeJson(raw);

    // sometimes session is nested: { user: {...}, role: ... } or { profile: {...} }
    const candidates = [parsed, parsed?.user, parsed?.profile, parsed?.data];

    for (const c of candidates) {
      if (!c) continue;
      const mr = matchesRole(c);
      if (mr === true) return normalizeUser(c, fallback);
    }

    // if no explicit role, still allow if id prefix matches
    if (parsed && typeof parsed === "object") {
      const u = normalizeUser(parsed?.user || parsed, fallback);
      const up = (u.id || "").toUpperCase();
      if (wantedRole === "employee" && up.startsWith("EMP")) return u;
      if (wantedRole === "admin" && up.startsWith("ADM")) return u;
    }
  }

  // 2) scan all localStorage entries (best-effort)
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const raw = window.localStorage.getItem(key);
      const parsed = safeJson(raw);
      if (!parsed || typeof parsed !== "object") continue;

      const candidates = [parsed, parsed?.user, parsed?.profile, parsed?.data];
      for (const c of candidates) {
        const mr = matchesRole(c);
        if (mr === true) return normalizeUser(c, fallback);
      }

      const u = normalizeUser(parsed?.user || parsed, fallback);
      const up = (u.id || "").toUpperCase();
      if (wantedRole === "employee" && up.startsWith("EMP")) return u;
      if (wantedRole === "admin" && up.startsWith("ADM")) return u;
    }
  } catch {
    // ignore
  }

  return fallback;
};

const currentEmployee = getUserFromStorage("employee", {
  id: "EMP-001",
  name: "Priya Sharma",
});

const currentAdmin = getUserFromStorage("admin", {
  id: "ADM-001",
  name: "Admin User",
});

/* ---------------- TABLE NAMES ---------------- */
const EMP_TABLE = "employee_leaves";
const ADM_TABLE = "admin_leaves";

/* ---------------- HELPERS ---------------- */
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
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border";
  if (status === "Approved")
    return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  if (status === "Rejected")
    return `${base} bg-rose-50 text-rose-700 border-rose-200`;
  return `${base} bg-amber-50 text-amber-800 border-amber-200`;
};

const roleBadge = (role) => {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border";
  if (role === "employee")
    return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
};

// ✅ Date format: DD-MM-YYYY (display only)
const pad2 = (n) => String(n).padStart(2, "0");
const fmtDMY = (v) => {
  if (!v) return "-";
  const s = String(v);

  // if "YYYY-MM-DD" (avoid timezone issues)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yy, mm, dd] = s.split("-");
    return `${dd}-${mm}-${yy}`;
  }

  // if ISO datetime
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return s;

  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const fmtDT = (iso) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  const date = Number.isFinite(d.getTime()) ? fmtDMY(d.toISOString()) : "-";
  const time = Number.isFinite(d.getTime())
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "-";
  return { date, time };
};

const initials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
};

const computeHoursText = (tFrom, tTo) => {
  // expects "HH:MM"
  if (!tFrom || !tTo) return "";
  const [fh, fm] = tFrom.split(":").map(Number);
  const [th, tm] = tTo.split(":").map(Number);
  if (![fh, fm, th, tm].every((n) => Number.isFinite(n))) return "";
  const fromMin = fh * 60 + fm;
  const toMin = th * 60 + tm;
  const diff = toMin - fromMin;
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

/* ---------------- MAPPER: DB -> UI ---------------- */
const mapEmployeeDbToUi = (r) => ({
  id: r.id,
  ownerRole: "employee",
  ownerId: r.employee_id,
  ownerName: r.employee_name,
  leaveType: r.leave_type,
  leaveMode: r.mode || "Full Day",
  from: r.from_date,
  to: r.to_date || r.from_date,
  timeFrom: r.time_from || "",
  timeTo: r.time_to || "",
  hours: r.hours || "",
  reason: r.reason,
  status: r.status,
  appliedAt: r.applied_at,
  decisionNote: "",
  decidedAt: "",
  // ✅ optional (if you add in employee table later)
  requestedTo: r.requested_to || r.request_to || r.requestedTo || [],
  halfSession: r.half_session || r.halfSession || "",
});

const mapAdminDbToUi = (r) => ({
  id: r.id,
  ownerRole: "admin",
  ownerId: r.admin_id,
  ownerName: r.admin_name,
  leaveType: r.leave_type,
  leaveMode: r.mode || "Full Day",
  from: r.from_date,
  to: r.to_date || r.from_date,
  timeFrom: r.time_from || "",
  timeTo: r.time_to || "",
  hours: r.hours || "",
  reason: r.reason,
  status: r.status,
  appliedAt: r.applied_at,
  decisionNote: "",
  decidedAt: "",
  // ✅ NEW: who this request is sent to (HR/Manager)
  requestedTo: r.requested_to || r.request_to || r.requestedTo || [],
  // ✅ NEW: half session (First/Second)
  halfSession: r.half_session || r.halfSession || "",
});

const showTimeLine = (r) => {
  const mode = r.leaveMode;
  if (mode !== "Permission" && mode !== "Half Day") return null;
  if (!r.timeFrom && !r.timeTo && !r.hours) return null;
  return (
    <>
      {" "}
      • {r.timeFrom || "-"} → {r.timeTo || "-"}
      {r.hours ? <> • {r.hours}</> : null}
    </>
  );
};

const calcDaysDisplay = (r) => {
  if (r.leaveMode === "Half Day") return 0.5;
  if (r.leaveMode === "Permission") return 1;
  return diffDaysInclusive(r.from, r.to);
};

/* ---------------- PAGE ---------------- */
const LeaveManagement = () => {
  const [mode, setMode] = useState("employee"); // "employee" | "admin"

  // ✅ data from Supabase
  const [requests, setRequests] = useState([]);

  // Apply modal open/close
  const [showApply, setShowApply] = useState(false);

  // Apply form fields (Admin)
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [leaveMode, setLeaveMode] = useState("Full Day"); // Full Day | Half Day | Permission
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");

  // ✅ NEW: Request To (HR/Manager) multiple select
  const APPROVER_OPTIONS = ["HR", "Manager"];
  const [requestedTo, setRequestedTo] = useState(["HR", "Manager"]);

  // ✅ NEW: Half Day session (First/Second)
  const [halfSession, setHalfSession] = useState("First Half");

  // Filters (both)
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // View modal
  const [viewing, setViewing] = useState(null);

  // Summary details modal
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState("All");

  const resetApplyForm = () => {
    setLeaveType("Casual Leave");
    setLeaveMode("Full Day");
    setFrom("");
    setTo("");
    setTimeFrom("");
    setTimeTo("");
    setHours("");
    setReason("");
    // ✅ default both selected
    setRequestedTo(["HR", "Manager"]);
    setHalfSession("First Half");
  };

  // close apply fields when switching mode
  useEffect(() => {
    if (mode === "employee") {
      setShowApply(false);
      resetApplyForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // when leaveMode changes, clean irrelevant fields (but KEEP time for Half Day now)
  useEffect(() => {
    if (leaveMode === "Full Day") {
      setTimeFrom("");
      setTimeTo("");
      setHours("");
    }
    if (leaveMode === "Half Day") {
      setTo("");
      // ✅ show First/Second half options and auto time
      setHalfSession("First Half");
      setTimeFrom("09:00");
      setTimeTo("13:30");
    }
    if (leaveMode === "Permission") {
      setTo("");
      // time stays (needed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveMode]);

  // ✅ auto set time for Half Day based on session
  useEffect(() => {
    if (leaveMode !== "Half Day") return;
    if (halfSession === "First Half") {
      setTimeFrom("09:00");
      setTimeTo("13:30");
      return;
    }
    setTimeFrom("14:00");
    setTimeTo("17:30");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halfSession, leaveMode]);

  // auto compute hours when time changes (Permission + Half Day)
  useEffect(() => {
    if (leaveMode !== "Permission" && leaveMode !== "Half Day") return;
    const h = computeHoursText(timeFrom, timeTo);
    if (h) setHours(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFrom, timeTo, leaveMode]);

  // ESC close for view/apply modal
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

  /* ---------------- FETCH FROM SUPABASE ---------------- */
  const fetchRequests = async (activeMode = mode) => {
    try {
      if (activeMode === "employee") {
        const { data, error } = await supabase
          .from(EMP_TABLE)
          .select("*")
          .eq("employee_id", currentEmployee.id)
          .order("applied_at", { ascending: false });

        if (error) throw error;
        setRequests((data || []).map(mapEmployeeDbToUi));
        return;
      }

      const { data, error } = await supabase
        .from(ADM_TABLE)
        .select("*")
        .eq("admin_id", currentAdmin.id)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []).map(mapAdminDbToUi));
    } catch (err) {
      alert(err.message || "Failed to load leaves");
    }
  };

  useEffect(() => {
    fetchRequests(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---------------- REALTIME: auto refresh ---------------- */
  useEffect(() => {
    const tableName = mode === "employee" ? EMP_TABLE : ADM_TABLE;

    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => fetchRequests(mode)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---------------- ROLE DATASET ---------------- */
  const dataset = useMemo(() => {
    if (mode === "employee") {
      return requests.filter(
        (r) => r.ownerRole === "employee" && r.ownerId === currentEmployee.id
      );
    }
    return requests.filter(
      (r) => r.ownerRole === "admin" && r.ownerId === currentAdmin.id
    );
  }, [mode, requests]);

  const filtered = useMemo(() => {
    let list = [...dataset];

    if (statusFilter !== "All")
      list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.id || "").toLowerCase().includes(q) ||
          (r.leaveType || "").toLowerCase().includes(q) ||
          (r.leaveMode || "").toLowerCase().includes(q) ||
          (r.reason || "").toLowerCase().includes(q) ||
          (r.ownerName || "").toLowerCase().includes(q) ||
          (r.ownerId || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return list;
  }, [dataset, statusFilter, search]);

  const counts = useMemo(() => {
    const total = dataset.length;
    const pending = dataset.filter((r) => r.status === "Pending").length;
    const approved = dataset.filter((r) => r.status === "Approved").length;
    const rejected = dataset.filter((r) => r.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [dataset]);

  const summaryList = useMemo(() => {
    let list = [...dataset];
    if (summaryStatus !== "All")
      list = list.filter((r) => r.status === summaryStatus);
    list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return list;
  }, [dataset, summaryStatus]);

  const openSummary = (st) => {
    setSummaryStatus(st);
    setSummaryOpen(true);
  };

  // ✅ NEW: toggle approvers (max 2)
  const toggleRequestedTo = (role) => {
    setRequestedTo((prev) => {
      const has = prev.includes(role);
      if (has) return prev.filter((x) => x !== role);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, role];
    });
  };

  /* ---------------- APPLY (ADMIN ONLY) -> SUPABASE INSERT ---------------- */
  const submitLeave = async () => {
    if (mode !== "admin") return;

    // ✅ validate requestedTo
    if (!requestedTo || requestedTo.length === 0) {
      alert("Please choose Request To (HR / Manager).");
      return;
    }

    if (!reason.trim()) {
      alert("Please fill Reason.");
      return;
    }

    if (!from) {
      alert("Please select Date.");
      return;
    }

    if (leaveMode === "Full Day") {
      if (!to) {
        alert("Please select To date.");
        return;
      }
      if (new Date(to) < new Date(from)) {
        alert("To date cannot be earlier than From date.");
        return;
      }
    }

    if (leaveMode === "Permission" || leaveMode === "Half Day") {
      if (!timeFrom || !timeTo) {
        alert("Please select Time From and Time To.");
        return;
      }
      const hText = computeHoursText(timeFrom, timeTo);
      if (!hText) {
        alert("Time To must be later than Time From.");
        return;
      }
    }

    const payload = {
      admin_id: currentAdmin.id,
      admin_name: currentAdmin.name,
      leave_type: leaveType,
      mode: leaveMode,
      from_date: from,
      to_date: leaveMode === "Full Day" ? to : from,
      time_from:
        leaveMode === "Permission" || leaveMode === "Half Day" ? timeFrom : null,
      time_to:
        leaveMode === "Permission" || leaveMode === "Half Day" ? timeTo : null,
      hours:
        leaveMode === "Permission" || leaveMode === "Half Day"
          ? hours || computeHoursText(timeFrom, timeTo)
          : null,
      reason: reason.trim(),
      status: "Pending",

      // ✅ NEW fields (make sure these columns exist in admin_leaves)
      requested_to: requestedTo, // Postgres: text[] (recommended) or jsonb
      half_session: leaveMode === "Half Day" ? halfSession : null,
    };

    const { error } = await supabase.from(ADM_TABLE).insert(payload);
    if (error) {
      alert(error.message);
      return;
    }

    resetApplyForm();
    setShowApply(false);
    fetchRequests(mode);
    alert("Leave request submitted!");
  };

  return (
    <section className="space-y-4">
      {/* Header + Toggle + Apply button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave Letters</h1>
          <p className="text-sm text-gray-600">
            {mode === "employee"
              ? "Employee can view only their own leave letters."
              : "Admin can apply leave and view only their own leave letters."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
            <button
              type="button"
              onClick={() => {
                setMode("employee");
                setShowApply(false);
                setSearch("");
                setStatusFilter("All");
                setSummaryOpen(false);
                setViewing(null);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                mode === "employee"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Employee
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("admin");
                setSearch("");
                setStatusFilter("All");
                setSummaryOpen(false);
                setViewing(null);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                mode === "admin"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Admin
            </button>
          </div>

          {/* ✅ Apply Button ONLY for Admin */}
          {mode === "admin" && (
            <button
              type="button"
              onClick={() => setShowApply(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* ✅ ADMIN APPLY LEAVE MODAL (SMALL) */}
      {mode === "admin" && showApply && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowApply(false);
          }}
        >
          {/* ✅ smaller width + scroll inside */}
          <div className="w-full max-w-[620px] bg-white rounded-2xl shadow-2xl border overflow-hidden">
            {/* header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Apply Leave</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {currentAdmin.name} • {currentAdmin.id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowApply(false)}
                className="w-9 h-9 rounded-xl border bg-white hover:bg-gray-50 text-xl leading-none flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* body (scroll if height small) */}
            <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {/* ✅ NEW: Request To (HR/Manager) */}
                <div className="border border-gray-200 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-2">Request To</div>
                  <div className="flex flex-wrap gap-2">
                    {APPROVER_OPTIONS.map((opt) => {
                      const active = requestedTo.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleRequestedTo(opt)}
                          className={`px-3 py-2 rounded-xl text-sm border transition ${
                            active
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    Selected:{" "}
                    <span className="font-semibold">
                      {requestedTo.length ? requestedTo.join(", ") : "None"}
                    </span>{" "}
                    (max 2)
                  </div>
                </div>

                {/* Leave Type */}
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Annual Leave</option>
                  <option>Paid Leave</option>
                </select>

                {/* Mode */}
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                  value={leaveMode}
                  onChange={(e) => setLeaveMode(e.target.value)}
                >
                  <option>Full Day</option>
                  <option>Half Day</option>
                  <option>Permission</option>
                </select>

                {/* Full Day dates */}
                {leaveMode === "Full Day" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* ✅ Half Day: Date + First/Second Half (with fixed time) */}
                {leaveMode === "Half Day" && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>

                    {/* ✅ NEW: first half / second half */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHalfSession("First Half")}
                        className={`text-left border rounded-xl p-3 transition ${
                          halfSession === "First Half"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-semibold">First Half</div>
                        <div
                          className={`text-xs mt-1 ${
                            halfSession === "First Half"
                              ? "text-white/80"
                              : "text-gray-500"
                          }`}
                        >
                          09:00 → 13:30
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHalfSession("Second Half")}
                        className={`text-left border rounded-xl p-3 transition ${
                          halfSession === "Second Half"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-semibold">Second Half</div>
                        <div
                          className={`text-xs mt-1 ${
                            halfSession === "Second Half"
                              ? "text-white/80"
                              : "text-gray-500"
                          }`}
                        >
                          14:00 → 17:30
                        </div>
                      </button>
                    </div>

                    {/* show fixed time (readonly) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Time From
                        </label>
                        <input
                          type="time"
                          readOnly
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none bg-gray-50"
                          value={timeFrom}
                          onChange={(e) => setTimeFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Time To
                        </label>
                        <input
                          type="time"
                          readOnly
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none bg-gray-50"
                          value={timeTo}
                          onChange={(e) => setTimeTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Permission date + time */}
                {leaveMode === "Permission" && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Time From
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                          value={timeFrom}
                          onChange={(e) => setTimeFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Time To
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                          value={timeTo}
                          onChange={(e) => setTimeTo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Hours (optional)
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="Eg: 2 hr / 1 hr 30 min"
                      />
                    </div>
                  </>
                )}

                {/* Reason */}
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason"
                />
              </div>
            </div>

            {/* footer buttons */}
            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetApplyForm();
                  setShowApply(false);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitLeave}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary (CLICKABLE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => openSummary("All")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-semibold">{counts.total}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
        <button
          onClick={() => openSummary("Pending")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-xl font-semibold">{counts.pending}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
        <button
          onClick={() => openSummary("Approved")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Approved</div>
          <div className="text-xl font-semibold">{counts.approved}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
        <button
          onClick={() => openSummary("Rejected")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Rejected</div>
          <div className="text-xl font-semibold">{counts.rejected}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by request id / name / id / type / reason..."
            className="w-full md:w-96 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Request</th>
              <th className="text-left px-4 py-3 font-medium">Dates</th>
              <th className="text-left px-4 py-3 font-medium">Days</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">View</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                  No leave letters found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const { date, time } = fmtDT(r.appliedAt);
                const days = calcDaysDisplay(r);

                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {initials(r.ownerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold">{r.leaveType}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Mode:{" "}
                            <span className="font-semibold">{r.leaveMode}</span>
                            {r.leaveMode === "Half Day" && r.halfSession ? (
                              <>
                                {" "}
                                • <span className="font-semibold">{r.halfSession}</span>
                              </>
                            ) : null}
                            {showTimeLine(r)}
                          </div>

                          {/* ✅ show requested to */}
                          {Array.isArray(r.requestedTo) && r.requestedTo.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Request To:{" "}
                              <span className="font-semibold">
                                {r.requestedTo.join(", ")}
                              </span>
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            #{String(r.id).slice(0, 8)} • Applied: {date} {time}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {r.reason}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {fmtDMY(r.from)} → {fmtDMY(r.to)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {r.ownerName} • {r.ownerId}
                      </div>
                      <div className="mt-1">
                        <span className={roleBadge(r.ownerRole)}>
                          Employment:{" "}
                          {r.ownerRole === "employee" ? "Employee" : "Admin"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">{days}</td>

                    <td className="px-4 py-3">
                      <span className={pill(r.status)}>{r.status}</span>
                      {r.decidedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Decided: {r.decidedAt}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setViewing(r)}
                          className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                        >
                          View Letter
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

      {/* Summary Details Modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">
                  {summaryStatus === "All"
                    ? "All Leave Letters"
                    : `${summaryStatus} Leave Letters`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Showing:{" "}
                  <span className="font-semibold">{summaryList.length}</span>{" "}
                  requests • Mode:{" "}
                  <span className="font-semibold">{mode.toUpperCase()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              {summaryList.length === 0 ? (
                <div className="text-sm text-gray-500 py-10 text-center">
                  No records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">
                          Employee Details
                        </th>
                        <th className="text-left px-4 py-3 font-medium">Leave</th>
                        <th className="text-left px-4 py-3 font-medium">Dates</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-right px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {summaryList.map((r) => {
                        const { date, time } = fmtDT(r.appliedAt);
                        const days = calcDaysDisplay(r);

                        return (
                          <tr key={`sum-${r.id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                  {initials(r.ownerName)}
                                </div>
                                <div>
                                  <div className="font-semibold">{r.ownerName}</div>
                                  <div className="text-xs text-gray-500">
                                    ID:{" "}
                                    <span className="font-semibold">{r.ownerId}</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className={roleBadge(r.ownerRole)}>
                                      Employment:{" "}
                                      {r.ownerRole === "employee"
                                        ? "Employee"
                                        : "Admin"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-semibold">{r.leaveType}</div>
                              <div className="text-xs text-gray-500">
                                Mode:{" "}
                                <span className="font-semibold">{r.leaveMode}</span>
                                {r.leaveMode === "Half Day" && r.halfSession ? (
                                  <>
                                    {" "}
                                    •{" "}
                                    <span className="font-semibold">{r.halfSession}</span>
                                  </>
                                ) : null}
                                {showTimeLine(r)}
                              </div>

                              {/* ✅ show request to */}
                              {Array.isArray(r.requestedTo) && r.requestedTo.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Request To:{" "}
                                  <span className="font-semibold">
                                    {r.requestedTo.join(", ")}
                                  </span>
                                </div>
                              )}

                              <div className="text-xs text-gray-500">
                                #{String(r.id).slice(0, 8)} • Applied: {date} {time}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {r.reason}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-gray-700">
                                {fmtDMY(r.from)} → {fmtDMY(r.to)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Days: <span className="font-semibold">{days}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className={pill(r.status)}>{r.status}</span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setViewing(r)}
                                  className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Letter Modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewing(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">
                  Leave request
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    #{String(viewing.id).slice(0, 8)}
                  </span>
                  <span className={pill(viewing.status)}>{viewing.status}</span>
                </div>
                <p className="text-xs text-white/80 mt-1">
                  {viewing.leaveType} • {viewing.leaveMode}
                  {viewing.leaveMode === "Half Day" && viewing.halfSession ? (
                    <>
                      {" "}
                      • <span className="font-semibold">{viewing.halfSession}</span>
                    </>
                  ) : null}
                  {showTimeLine(viewing)}
                </p>

                {/* ✅ show request to */}
                {Array.isArray(viewing.requestedTo) && viewing.requestedTo.length > 0 && (
                  <p className="text-xs text-white/80 mt-1">
                    Request To:{" "}
                    <span className="font-semibold">
                      {viewing.requestedTo.join(", ")}
                    </span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="text-white/80 hover:text-white text-sm"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-bold">
                  {initials(viewing.ownerName)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{viewing.ownerName}</p>
                  <p className="text-xs text-slate-500">{viewing.ownerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">From</p>
                  <p className="font-semibold text-slate-900">{fmtDMY(viewing.from)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">To</p>
                  <p className="font-semibold text-slate-900">{fmtDMY(viewing.to)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">Days</p>
                  <p className="font-semibold text-slate-900">
                    {calcDaysDisplay(viewing)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">Applied</p>
                  <p className="font-semibold text-slate-900">
                    {fmtDT(viewing.appliedAt).date}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fmtDT(viewing.appliedAt).time}
                  </p>
                </div>
              </div>

              {(viewing.leaveMode === "Permission" ||
                viewing.leaveMode === "Half Day") && (
                <div className="rounded-xl bg-white border border-slate-100 p-3">
                  <p className="text-[11px] text-slate-500">Time</p>
                  <p className="mt-1 text-slate-800">
                    {viewing.timeFrom || "-"} → {viewing.timeTo || "-"}
                    {viewing.hours ? (
                      <span className="text-slate-500"> • {viewing.hours}</span>
                    ) : null}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">Reason</p>
                <p className="mt-1 text-slate-800 leading-relaxed">
                  {viewing.reason || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LeaveManagement;
