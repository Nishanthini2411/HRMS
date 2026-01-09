// ✅ src/pages/manager/ManagerDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Lock,
  Sparkles,
  Users,
  Workflow,
  ArrowLeft,
  X,
  UserRound,
  FileText,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { getManagerSession } from "./managerData";

/* ===================== CONFIG ===================== */
const EMP_TABLE = "hrmss_profiles";
const LEAVE_TABLE = "hrmss_leave_requests";
const PAYROLL_TABLE = "hrmss_payroll_records";
const PAYROLL_TABLE_FALLBACK = "hrmss_payroll";
const PAYSLIP_TABLE = "hrmss_payslip_records";

/* ===================== HELPERS ===================== */
const safeText = (v) => (v == null ? "" : String(v));
const pick = (row, keys, fallback = "") => {
  for (const k of keys) {
    if (row && row[k] != null && String(row[k]).trim() !== "") return row[k];
  }
  return fallback;
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const formatMonth = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
};

const formatRange = (from, to) => {
  if (!from && !to) return "-";
  if (!to || to === from) return formatDate(from);
  return `${formatDate(from)} - ${formatDate(to)}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const isActiveLeave = (leave) => {
  const status = safeText(leave.status).toLowerCase();
  const approved =
    status === "approved" || status === "on leave" || status.startsWith("approved");
  if (!approved) return false;

  const from = leave.from_date || leave.fromDate;
  const to = leave.to_date || leave.toDate || leave.from_date || leave.fromDate;
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= fromDate && today <= toDate;
};

const normalizeEmployee = (row) => {
  return {
    id: safeText(pick(row, ["employee_id", "user_id", "id", "manager_code"], "")),
    name: safeText(pick(row, ["full_name", "name"], "Unknown")),
    avatar: safeText(pick(row, ["avatar_url", "avatar"], "")),

    personal: {
      dob: safeText(pick(row, ["dob"], "")),
      gender: safeText(pick(row, ["gender"], "")),
      maritalStatus: safeText(pick(row, ["marital_status"], "")),
      bloodGroup: safeText(pick(row, ["blood_group"], "")),
      personalEmail: safeText(pick(row, ["personal_email", "email"], "")),
      officialEmail: safeText(pick(row, ["official_email"], "")),
      mobileNumber: safeText(pick(row, ["mobile_number", "phone"], "")),
      alternateContactNumber: safeText(pick(row, ["alternate_contact_number"], "")),
      currentAddress: safeText(pick(row, ["current_address"], "")),
      permanentAddress: safeText(pick(row, ["permanent_address"], "")),
      address: safeText(pick(row, ["current_address", "address"], "")),
      email: safeText(pick(row, ["official_email", "email"], "")),
      phone: safeText(pick(row, ["mobile_number", "phone"], "")),
    },

    job: {
      employeeId: safeText(pick(row, ["employee_id", "user_id", "id"], "")),
      title: safeText(pick(row, ["designation", "job_title", "role", "position"], "-")),
      department: safeText(pick(row, ["department", "team"], "-")),
      manager: safeText(pick(row, ["reporting_manager", "manager"], "-")),
      joiningDate: safeText(pick(row, ["joining_date"], "-")),
      workMode: safeText(pick(row, ["work_mode"], "-")),
      location: safeText(pick(row, ["work_location", "location"], "-")),
    },

    education: Array.isArray(row.education) ? row.education : [],
    experience: Array.isArray(row.experience) ? row.experience : [],

    skills: {
      primarySkills: safeText(pick(row, ["primary_skills"], "")),
      secondarySkills: safeText(pick(row, ["secondary_skills"], "")),
      toolsTechnologies: safeText(pick(row, ["tools_technologies"], "")),
    },

    bank: {
      accountHolderName: safeText(pick(row, ["account_holder_name"], "")),
      bankName: safeText(pick(row, ["bank_name"], "")),
      accountNumber: safeText(pick(row, ["account_number"], "")),
      ifscCode: safeText(pick(row, ["ifsc_code"], "")),
      branch: safeText(pick(row, ["branch"], "")),
      paymentMode: safeText(pick(row, ["payment_mode"], "")),
    },

    emergencyContacts: row.emergency_name
      ? [
          {
            name: safeText(row.emergency_name),
            relation: safeText(row.emergency_relationship),
            phone: safeText(row.emergency_contact_number),
          },
        ]
      : Array.isArray(row.emergency_contacts)
      ? row.emergency_contacts
      : [],

    idProofs: Array.isArray(row.id_proofs) ? row.id_proofs : [],
  };
};

const normalizeLeave = (row) => {
  const from = pick(row, ["from_date", "from"], "");
  const to = pick(row, ["to_date", "to"], "");
  const dates = pick(row, ["leave_dates", "dates"], "");
  const leaveDates = dates || formatRange(from, to);

  return {
    id: safeText(pick(row, ["id", "req_id", "request_id"], "")),
    employeeId: safeText(pick(row, ["employee_id", "owner_id", "emp_id"], "")),
    employee: safeText(pick(row, ["employee_name", "owner_name", "name"], "Unknown")),
    type: safeText(pick(row, ["leave_type", "type"], "-")),
    dates: safeText(leaveDates || "-"),
    reason: safeText(pick(row, ["reason"], "")),
    status: safeText(pick(row, ["status"], "Pending")),
    handover: safeText(pick(row, ["handover", "handover_to"], "")),
    from_date: from,
    to_date: to,
  };
};

const normalizePayroll = (row) => {
  const month = pick(row, ["month", "period", "payroll_month", "pay_month"], "");
  return {
    month: safeText(month || formatMonth(row.created_at)),
    status: safeText(pick(row, ["status"], "-")),
    remarks: safeText(pick(row, ["remarks", "note", "description", "summary"], "")),
    created_at: row.created_at,
  };
};

const normalizePayslip = (row) => {
  const month = pick(row, ["month", "period", "payroll_month", "pay_month"], "");
  const published =
    row.published ??
    row.is_published ??
    row.payslip_published ??
    row.isPublished ??
    false;
  return {
    month: safeText(month || formatMonth(row.created_at)),
    published: Boolean(published),
    note: safeText(pick(row, ["note", "remarks", "description"], "")),
    created_at: row.created_at,
  };
};

/* ===================== small UI blocks ===================== */
const toneMap = {
  indigo: "bg-indigo-50 text-indigo-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  slate: "bg-slate-100 text-slate-700",
};

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "indigo", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border p-4 bg-white shadow-sm flex gap-3 text-left hover:shadow-md hover:ring-2 hover:ring-indigo-100 transition"
    >
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center ${toneMap[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </button>
  );
}

function ViewHeader({ title, subtitle, onBack, right }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border">
        <div className="p-4 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Details
            </p>
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border bg-white hover:bg-slate-50 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ===================== main ===================== */
export default function ManagerDashboard() {
  const session = getManagerSession();
  const approver = session.role === "approver" || session.access === "approver";

  // ✅ even if managerData has "Alpha squad" / "Alpha — squad", it will remove it
  const teamLabel = (session.team || "")
    .replace(/\s*[-—]?\s*squad\s*$/i, "")
    .trim();

  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payslipRecords, setPayslipRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: empRows, error: empErr } = await supabase
        .from(EMP_TABLE)
        .select("*")
        .order("full_name", { ascending: true });

      if (empErr) throw new Error(`Employees load failed: ${empErr.message}`);
      setEmployees((empRows || []).map(normalizeEmployee));

      const { data: leaveRows, error: leaveErr } = await supabase
        .from(LEAVE_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (leaveErr) {
        setLeaveRequests([]);
      } else {
        setLeaveRequests((leaveRows || []).map(normalizeLeave));
      }

      const payrollPrimary = await supabase
        .from(PAYROLL_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (payrollPrimary.error) {
        const payrollFallback = await supabase
          .from(PAYROLL_TABLE_FALLBACK)
          .select("*")
          .order("created_at", { ascending: false });

        setPayrollRecords((payrollFallback.data || []).map(normalizePayroll));
      } else {
        setPayrollRecords((payrollPrimary.data || []).map(normalizePayroll));
      }

      const { data: payslipRows, error: payslipErr } = await supabase
        .from(PAYSLIP_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (payslipErr) {
        setPayslipRecords([]);
      } else {
        setPayslipRecords((payslipRows || []).map(normalizePayslip));
      }
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState("dashboard");
  const [employeeQuery, setEmployeeQuery] = useState("");

  // ✅ modal
  const [modal, setModal] = useState({ open: false, title: "", payload: null });
  const openModal = (title, payload) =>
    setModal({ open: true, title, payload });
  const closeModal = () => setModal({ open: false, title: "", payload: null });

  const teamMembers = useMemo(() => {
    const activeLeaveMap = new Map();

    for (const leave of leaveRequests) {
      if (!leave.employeeId || activeLeaveMap.has(leave.employeeId)) continue;
      if (isActiveLeave(leave)) activeLeaveMap.set(leave.employeeId, leave);
    }

    return employees.map((e) => {
      const activeLeave = activeLeaveMap.get(e.id);
      return {
        id: e.id,
        name: e.name,
        role: e.job?.title || "-",
        status: activeLeave ? "On Leave" : "Available",
        leaveType: activeLeave?.type || "",
        leaveDates: activeLeave?.dates || "",
        location: e.job?.location || e.personal?.currentAddress || "-",
      };
    });
  }, [employees, leaveRequests]);

  const onLeave = useMemo(
    () => teamMembers.filter((m) => m.status === "On Leave"),
    [teamMembers]
  );

  const pending = useMemo(
    () => leaveRequests.filter((l) => safeText(l.status).toLowerCase() === "pending"),
    [leaveRequests]
  );

  const teamMemberMap = useMemo(() => {
    return new Map(teamMembers.map((m) => [m.id, m]));
  }, [teamMembers]);

  const employeesList = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    return employees
      .map((emp) => {
        const member = teamMemberMap.get(emp.id);
        return {
          ...emp,
          status: member?.status || "Available",
          location: member?.location || emp.job?.location || "-",
          role: member?.role || emp.job?.title || "-",
          leaveType: member?.leaveType || "",
          leaveDates: member?.leaveDates || "",
        };
      })
      .filter((emp) => {
        if (!q) return true;
        const text = `${emp.name} ${emp.id} ${emp.job?.department || ""} ${emp.job?.title || ""}`.toLowerCase();
        return text.includes(q);
      });
  }, [employeeQuery, teamMemberMap, employees]);

  const openProfile = (member, options = {}) => {
    const profile = employees.find((e) => e.id === member.id) || member;
    openModal(profile.name || member.name, {
      kind: "profile",
      profile,
      status: member.status || "Available",
      location: member.location || profile.job?.location || "-",
      role: member.role || profile.job?.title || "-",
      leaveType: member.leaveType || "",
      leaveDates: member.leaveDates || "",
      showLeave: Boolean(options.showLeave),
    });
  };

  const renderStatusPanel = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading data...
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="rounded-2xl border bg-white p-5 text-sm text-rose-600 shadow-sm">
          <div>{errorMsg}</div>
          <button
            type="button"
            onClick={fetchAll}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      );
    }

    return null;
  };

  /* ===================== Views ===================== */
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-600">Welcome back, {session.name}</p>
            <h1 className="text-2xl font-bold text-slate-900">
              Manager Dashboard
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Track team presence, handle leave approvals, and view payroll &
              payslips. Only one manager can approve leaves; the other has
              view-only access.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {/* ✅ removed “— squad” (data-level sanitize) */}
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 font-semibold">
              <Sparkles size={14} /> {teamLabel || "Team"}
            </span>

            {/* ✅ removed “View-only” badge in header (only show if approver) */}
            {approver ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 font-semibold">
                <Workflow size={14} />
                Approver access
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {loading || errorMsg ? renderStatusPanel() : (<>
      {/* ✅ Clickable Stat Cards -> opens view */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Team Members"
          value={teamMembers.length}
          onClick={() => setView("employees")}
        />
        <StatCard
          icon={CalendarClock}
          label="On Leave"
          value={onLeave.length}
          tone="amber"
          onClick={() => setView("leave")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Pending Approvals"
          value={pending.length}
          tone="emerald"
          onClick={() => setView("approvals")}
        />
        <StatCard
          icon={Eye}
          label="Payroll / Payslip"
          value="View"
          tone="slate"
          onClick={() => setView("payroll")}
        />
      </div>

      {/* Quick panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Leave board quick */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Leave Board</h3>
              <button
                type="button"
                onClick={() => setView("leave")}
                className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-semibold hover:bg-amber-200"
              >
                {onLeave.length} on leave now (View)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {onLeave.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => openProfile(m, { showLeave: true })}
                  className="rounded-xl border p-3 bg-amber-50/40 text-left hover:shadow-sm hover:ring-2 hover:ring-amber-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{m.role}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      {m.leaveType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{m.leaveDates}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Location: {m.location}
                  </p>
                </button>
              ))}

              {!onLeave.length && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No one is on leave right now.
                </div>
              )}
            </div>
          </div>

          {/* Approval queue quick */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Approval Queue</h3>
              <button
                type="button"
                onClick={() => setView("approvals")}
                className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full font-semibold hover:bg-indigo-200"
              >
                View
              </button>
            </div>

            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="rounded-xl border p-4">
                  <button
                    type="button"
                    onClick={() =>
                      openModal(`${req.employee} — ${req.type}`, {
                        kind: "leaveRequest",
                        ...req,
                      })
                    }
                    className="w-full text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {req.employee}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{req.type}</p>
                      </div>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                        {req.dates}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">Reason: {req.reason}</p>
                    <p className="text-xs text-slate-500 mt-1">Handover: {req.handover}</p>
                  </button>

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

        {/* Right side */}
        <div className="space-y-4">
          {/* Team roster quick */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Team Roster</h3>
              <button
                type="button"
                onClick={() => setView("employees")}
                className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full font-semibold hover:bg-slate-200"
              >
                View
              </button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => openProfile(member)}
                  className="w-full rounded-xl border p-3 flex items-start justify-between text-left hover:shadow-sm hover:ring-2 hover:ring-slate-100 transition"
                >
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
                </button>
              ))}
            </div>
          </div>

          {/* Payroll quick */}
          <div className="rounded-2xl border bg-slate-900 text-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock size={16} />
                <div className="text-sm font-semibold">Payroll & Payslip</div>
              </div>
              <button
                type="button"
                onClick={() => setView("payroll")}
                className="text-xs bg-white/10 hover:bg-white/15 px-2 py-1 rounded-full font-semibold"
              >
                View
              </button>
            </div>

            <p className="text-xs text-slate-200">
              Both managers have read-only access to payroll snapshots and payslip status.
            </p>

            <div className="bg-black/20 rounded-xl p-3 space-y-2 text-sm">
              {payrollRecords.slice(0, 2).map((p) => (
                <button
                  type="button"
                  key={p.month}
                  onClick={() => openModal(p.month, { kind: "payroll", ...p })}
                  className="w-full flex items-center justify-between text-left hover:bg-white/5 rounded-lg p-2 -m-2 transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.month}</p>
                    <p className="text-xs text-slate-200 truncate">{p.remarks}</p>
                  </div>
                  <span className="text-[11px] bg-white/10 px-2 py-1 rounded-full">{p.status}</span>
                </button>
              ))}
            </div>

            {payslipRecords.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  openModal(`Payslips - ${payslipRecords[0].month}`, {
                    kind: "payslip",
                    ...payslipRecords[0],
                  })
                }
                className="bg-white/10 hover:bg-white/15 rounded-xl p-3 text-xs text-slate-100 flex items-center justify-between transition"
              >
                <span>Payslips published for {payslipRecords[0].month}</span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-full">
                  <Eye size={12} /> View
                </span>
              </button>
            ) : (
              <div className="bg-white/10 rounded-xl p-3 text-xs text-slate-200">
                No payslips found.
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );

  const EmployeesView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Company Employees"
        subtitle="Click an employee to view profile details."
        onBack={() => setView("dashboard")}
        right={
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {employeesList.length} employees
          </span>
        }
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-slate-400" />
          <input
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
            placeholder="Search by name, ID, department, role..."
            className="w-full text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
        {employeesList.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => openProfile(m)}
            className="rounded-2xl border bg-white p-4 shadow-sm text-left hover:shadow-md hover:ring-2 hover:ring-slate-100 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRound size={16} className="text-slate-500" />
                  <p className="font-bold text-slate-900 truncate">{m.name}</p>
                </div>
                <p className="text-sm text-slate-600 mt-1 truncate">{m.role}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Department: {m.job?.department || "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Location: {m.location || "-"}
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                  m.status === "On Leave"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {m.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const LeaveView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Leave Board"
        subtitle="Currently on leave (click a card to view)."
        onBack={() => setView("dashboard")}
        right={
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            {onLeave.length} on leave
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {onLeave.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => openProfile(m, { showLeave: true })}
            className="rounded-2xl border bg-white p-4 shadow-sm text-left hover:shadow-md hover:ring-2 hover:ring-amber-100 transition"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{m.name}</p>
                <p className="text-xs text-slate-500 truncate">{m.role}</p>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                {m.leaveType}
              </span>
            </div>
            <p className="text-sm text-slate-700 mt-2">{m.leaveDates}</p>
            <p className="text-xs text-slate-500 mt-1">Location: {m.location}</p>
          </button>
        ))}

        {!onLeave.length && (
          <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">
            No one is on leave right now.
          </div>
        )}
      </div>
    </div>
  );

  const ApprovalsView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Approval Queue"
        subtitle={
          approver ? "You are the approver." : "View only. Only approver can act."
        }
        onBack={() => setView("dashboard")}
        right={
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              approver
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {pending.length} pending
          </span>
        }
      />

      <div className="space-y-4">
        {pending.map((req) => (
          <div
            key={req.id}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                openModal(`${req.employee} — ${req.type}`, {
                  kind: "leaveRequest",
                  ...req,
                })
              }
              className="w-full text-left hover:bg-slate-50 rounded-xl p-3 -m-3 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{req.employee}</p>
                  <p className="text-sm text-slate-600 truncate">{req.type}</p>
                  <p className="text-xs text-slate-500 mt-1">Reason: {req.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">Handover: {req.handover}</p>
                </div>
                <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {req.dates}
                </span>
              </div>
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
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
              {!approver ? (
                <span className="text-slate-400">(Only approver can act)</span>
              ) : null}
            </div>
          </div>
        ))}

        {!pending.length && (
          <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">
            No pending approvals.
          </div>
        )}
      </div>
    </div>
  );

  const PayrollView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Payroll & Payslip"
        subtitle="Read-only snapshots (click to view details)."
        onBack={() => setView("dashboard")}
        right={
          <span className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-3 py-1 rounded-full">
            <Lock size={14} /> View only
          </span>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Payroll Records</h3>
            <span className="text-xs text-slate-500">{payrollRecords.length} months</span>
          </div>

          <div className="space-y-2">
            {payrollRecords.map((p) => (
              <button
                key={p.month}
                type="button"
                onClick={() => openModal(p.month, { kind: "payroll", ...p })}
                className="w-full rounded-xl border p-4 text-left hover:shadow-sm hover:ring-2 hover:ring-slate-100 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.month}</p>
                    <p className="text-sm text-slate-600 truncate">{p.remarks}</p>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {p.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Payslip Status</h3>
            <span className="text-xs text-slate-500">{payslipRecords.length} records</span>
          </div>

          <div className="space-y-2">
            {payslipRecords.map((ps) => (
              <button
                key={ps.month}
                type="button"
                onClick={() =>
                  openModal(`Payslips — ${ps.month}`, { kind: "payslip", ...ps })
                }
                className="w-full rounded-xl border p-4 text-left hover:shadow-sm hover:ring-2 hover:ring-slate-100 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{ps.month}</p>
                    <p className="text-sm text-slate-600 truncate">
                      Published: {ps.published ? "Yes" : "No"}
                    </p>
                  </div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Eye size={12} /> View
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 border p-4 text-xs text-slate-600 flex gap-2">
            <FileText size={14} className="mt-0.5" />
            <p>
              Manager page is read-only. Publish / approve payroll should be in HR/Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ===================== Modal body ===================== */
  const payload = modal.payload;

  const ModalBody = () => {
    if (!payload) return null;

    if (payload.kind === "profile") {
      const profile = payload.profile || {};
      const personal = profile.personal || {};
      const job = profile.job || {};
      const emergency = Array.isArray(profile.emergencyContacts)
        ? profile.emergencyContacts
        : [];
      const idProofs = Array.isArray(profile.idProofs) ? profile.idProofs : [];
      const education = Array.isArray(profile.education) ? profile.education : [];
      const experience = Array.isArray(profile.experience) ? profile.experience : [];
      const skills = profile.skills || {};
      const bank = profile.bank || {};

      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Employee</p>
            <p className="text-lg font-bold text-slate-900">{profile.name || "-"}</p>
            <p className="text-sm text-slate-600">{payload.role || job.title || "-"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-900">{payload.status || "-"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Location</p>
              <p className="font-semibold text-slate-900">
                {payload.location || job.location || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Personal Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Full Name" value={profile.name} />
              <DetailItem label="DOB" value={personal.dob} />
              <DetailItem label="Gender" value={personal.gender} />
              <DetailItem label="Marital Status" value={personal.maritalStatus} />
              <DetailItem label="Blood Group" value={personal.bloodGroup} />
              <DetailItem label="Personal Email" value={personal.personalEmail || personal.email} />
              <DetailItem label="Official Email" value={personal.officialEmail} />
              <DetailItem label="Mobile Number" value={personal.mobileNumber || personal.phone} />
              <DetailItem label="Alternate Number" value={personal.alternateContactNumber} />
              <DetailItem label="Current Address" value={personal.currentAddress || personal.address} />
              <DetailItem label="Permanent Address" value={personal.permanentAddress} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Job Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Employee ID" value={job.employeeId || profile.id} />
              <DetailItem label="Designation" value={job.title} />
              <DetailItem label="Department" value={job.department} />
              <DetailItem label="Reporting Manager" value={job.manager} />
              <DetailItem label="Date of Joining" value={job.joiningDate} />
              <DetailItem label="Work Mode" value={job.workMode} />
              <DetailItem label="Work Location" value={job.location} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Skills and Expertise</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Primary Skills" value={skills.primarySkills} />
              <DetailItem label="Secondary Skills" value={skills.secondarySkills} />
              <DetailItem label="Tools / Technologies" value={skills.toolsTechnologies} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Bank and Payroll Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Account Holder Name" value={bank.accountHolderName} />
              <DetailItem label="Bank Name" value={bank.bankName} />
              <DetailItem label="Account Number" value={bank.accountNumber} />
              <DetailItem label="IFSC Code" value={bank.ifscCode} />
              <DetailItem label="Branch" value={bank.branch} />
              <DetailItem label="Payment Mode" value={bank.paymentMode} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Emergency Contacts</p>
            {emergency.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emergency.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Name" value={c.name} />
                    <DetailItem label="Relation" value={c.relation} />
                    <DetailItem label="Phone" value={c.phone} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No emergency contacts.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">ID Proofs</p>
            {idProofs.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {idProofs.map((d, i) => (
                  <div key={`${d.type}-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Type" value={d.type} />
                    <DetailItem label="Number" value={d.number} />
                    <DetailItem label="Status" value={d.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No ID proofs.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Education</p>
            {education.length ? (
              <div className="space-y-3">
                {education.map((e, i) => (
                  <div key={`edu-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Qualification" value={e.qualification} />
                    <DetailItem label="Institution" value={e.institution} />
                    <DetailItem label="Year of Passing" value={e.yearOfPassing} />
                    <DetailItem label="Specialization" value={e.specialization} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No education details.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Experience</p>
            {experience.length ? (
              <div className="space-y-3">
                {experience.map((ex, i) => (
                  <div key={`exp-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Organization" value={ex.organization} />
                    <DetailItem label="Designation" value={ex.designation} />
                    <DetailItem label="Duration" value={ex.duration} />
                    <DetailItem label="Reason for Leaving" value={ex.reasonForLeaving} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No experience details.</p>
            )}
          </div>

          {payload.showLeave && payload.leaveType ? (
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Leave Info</p>
              <p className="font-semibold text-slate-900">{payload.leaveType}</p>
              <p className="text-sm text-slate-600 mt-1">{payload.leaveDates}</p>
            </div>
          ) : null}
        </div>
      );
    }

    if (payload.kind === "leaveRequest") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Request</p>
            <p className="text-lg font-bold text-slate-900">{payload.employee}</p>
            <p className="text-sm text-slate-600">{payload.type}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Dates</p>
              <p className="font-semibold text-slate-900">{payload.dates}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-900">{payload.status}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500">Reason</p>
            <p className="text-sm text-slate-700 mt-1">{payload.reason}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500">Handover</p>
            <p className="text-sm text-slate-700 mt-1">{payload.handover}</p>
          </div>
        </div>
      );
    }

    if (payload.kind === "payroll") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Payroll</p>
            <p className="text-lg font-bold text-slate-900">{payload.month}</p>
            <p className="text-sm text-slate-600">{payload.status}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500">Remarks</p>
            <p className="text-sm text-slate-700 mt-1">{payload.remarks}</p>
          </div>
        </div>
      );
    }

    if (payload.kind === "payslip") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Payslips</p>
            <p className="text-lg font-bold text-slate-900">{payload.month}</p>
            <p className="text-sm text-slate-600">
              Published: {payload.published ? "Yes" : "No"}
            </p>
          </div>

          {payload.note ? (
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Note</p>
              <p className="text-sm text-slate-700 mt-1">{payload.note}</p>
            </div>
          ) : null}
        </div>
      );
    }

    return <div className="text-sm text-slate-600">No details available.</div>;
  };

  /* ===================== Render ===================== */
  return (
    <div className="space-y-6">
      {view === "dashboard" && <DashboardView />}
      {view === "employees" && <EmployeesView />}
      {view === "leave" && <LeaveView />}
      {view === "approvals" && <ApprovalsView />}
      {view === "payroll" && <PayrollView />}

      <Modal open={modal.open} title={modal.title} onClose={closeModal}>
        <ModalBody />
      </Modal>
    </div>
  );
}
