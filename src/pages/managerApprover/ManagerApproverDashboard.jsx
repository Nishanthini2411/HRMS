// src/pages/managerApprover/ManagerApproverDashboard.jsx
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
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { getManagerSession } from "./managerApproverData";

/* ===================== CONFIG ===================== */
const EMP_TABLE = "hrmss_profiles"; // ✅ your real table
const LEAVE_TABLE = "hrmss_leave_requests"; // change if different
const PAYROLL_TABLE = "hrmss_payroll_records"; // change if different
const PAYSLIP_TABLE = "hrmss_payslip_records"; // change if different

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
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
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
          {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
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
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/40" aria-label="Close" />
      <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border">
        <div className="p-4 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Details</p>
            <h3 className="text-lg font-bold text-slate-900 truncate">{title}</h3>
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

function LoadingPanel({ label = "Loading..." }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm flex items-center gap-3">
      <Loader2 className="animate-spin" size={18} />
      <p className="text-sm text-slate-700">{label}</p>
    </div>
  );
}

function ErrorPanel({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600 mt-1 break-words">{message || "Unknown error"}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <RefreshCw size={16} /> Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ===================== Helpers ===================== */
const safeText = (v) => (v == null ? "" : String(v));
const safeObj = (v) => (v && typeof v === "object" ? v : {});

function normalizeEmployeeFromProfileRow(row) {
  // ✅ ONLY columns that your screenshot shows / most likely exist
  return {
    id: safeText(row.employee_id),
    name: safeText(row.full_name),
    avatar: safeText(row.avatar_url || row.avatar || ""),

    personal: {
      dob: safeText(row.dob),
      gender: safeText(row.gender),
      maritalStatus: safeText(row.marital_status),
      bloodGroup: safeText(row.blood_group),
      personalEmail: safeText(row.personal_email),
      officialEmail: safeText(row.official_email),
      mobileNumber: safeText(row.mobile_number),
      alternateContactNumber: safeText(row.alternate_contact_number),
      currentAddress: safeText(row.current_address),
      permanentAddress: safeText(row.permanent_address),
    },

    // ✅ job fields are NOT requested now (avoid missing columns crash)
    job: {
      employeeId: safeText(row.employee_id),
      title: safeText(row.job_title || row.role || row.position || "-"),
      department: safeText(row.department || "-"),
      manager: safeText(row.reporting_manager || "-"),
      joiningDate: safeText(row.joining_date || "-"),
      workMode: safeText(row.work_mode || "-"),
      location: safeText(row.work_location || row.location || "-"),
    },
  };
}

function normalizeLeave(row) {
  return {
    id: safeText(row.id),
    employeeId: safeText(row.employee_id),
    employee: safeText(row.employee_name || row.employee || ""),
    type: safeText(row.type || row.leave_type || ""),
    dates: safeText(row.dates || row.leave_dates || ""),
    reason: safeText(row.reason || ""),
    handover: safeText(row.handover || row.handover_to || ""),
    status: safeText(row.status || "Pending"),
    created_at: row.created_at,
  };
}

/* ===================== main ===================== */
export default function ManagerDashboard() {
  const session = getManagerSession();
  const approver = session.role === "approver";
  const teamLabel = (session.team || "").replace(/\s*[-—]?\s*squad\s*$/i, "").trim();

  const [view, setView] = useState("dashboard");
  const [employeeQuery, setEmployeeQuery] = useState("");

  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payslipRecords, setPayslipRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [modal, setModal] = useState({ open: false, title: "", payload: null });
  const openModal = (title, payload) => setModal({ open: true, title, payload });
  const closeModal = () => setModal({ open: false, title: "", payload: null });

  const fetchAll = async () => {
    setLoading(true);
    setErr("");

    try {
      // ✅ Employees: ONLY safe columns (no designation)
      const { data: empRows, error: empErr } = await supabase
        .from(EMP_TABLE)
        .select(
          `
          employee_id,
          full_name,
          dob,
          gender,
          marital_status,
          blood_group,
          personal_email,
          official_email,
          mobile_number,
          alternate_contact_number,
          current_address,
          permanent_address,
          avatar_url
        `
        )
        .order("full_name", { ascending: true });

      if (empErr) throw new Error(`Employees load failed: ${empErr.message}`);

      setEmployees((empRows || []).map(normalizeEmployeeFromProfileRow));

      // ✅ Leaves (optional tables)
      const { data: leaveRows, error: leaveErr } = await supabase
        .from(LEAVE_TABLE)
        .select("id, employee_id, employee_name, type, leave_type, dates, leave_dates, reason, handover, handover_to, status, created_at")
        .order("created_at", { ascending: false });

      if (leaveErr) {
        // not fatal: keep leave empty but show dashboard
        setLeaveRequests([]);
      } else {
        setLeaveRequests((leaveRows || []).map(normalizeLeave));
      }

      // ✅ Payroll (optional)
      const { data: payrollRows } = await supabase
        .from(PAYROLL_TABLE)
        .select("month, status, remarks, created_at")
        .order("created_at", { ascending: false });

      setPayrollRecords(payrollRows || []);

      // ✅ Payslips (optional)
      const { data: payslipRows } = await supabase
        .from(PAYSLIP_TABLE)
        .select("month, published, note, created_at")
        .order("created_at", { ascending: false });

      setPayslipRecords(payslipRows || []);
    } catch (e) {
      setErr(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamMembers = useMemo(() => {
    return employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.job?.title || "-",
      status: "Available",
      location: e.job?.location || "-",
      leaveType: "",
      leaveDates: "",
    }));
  }, [employees]);

  const pending = useMemo(
    () => leaveRequests.filter((l) => safeText(l.status).toLowerCase() === "pending"),
    [leaveRequests]
  );

  const employeesList = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      if (!q) return true;
      const job = safeObj(emp.job);
      const text = `${emp.name} ${emp.id} ${job.department || ""} ${job.title || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [employeeQuery, employees]);

  const openProfile = (emp) => {
    openModal(emp.name || "Employee", { kind: "profile", profile: emp, role: emp.job?.title || "-" });
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-600">Welcome back, {session.name}</p>
            <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Now loading employees from Supabase (hrmss_profiles).
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 font-semibold">
              <Sparkles size={14} /> {teamLabel || "Team"}
            </span>
            {approver ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 font-semibold">
                <Workflow size={14} /> Approver access
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Team Members" value={teamMembers.length} onClick={() => setView("employees")} />
        <StatCard icon={CalendarClock} label="On Leave" value={0} tone="amber" onClick={() => setView("leave")} />
        <StatCard icon={CheckCircle2} label="Pending Approvals" value={pending.length} tone="emerald" onClick={() => setView("approvals")} />
        <StatCard icon={Eye} label="Payroll / Payslip" value="View" tone="slate" onClick={() => setView("payroll")} />
      </div>
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
            placeholder="Search by name, ID..."
            className="w-full text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                <p className="text-xs text-slate-500 mt-1 truncate">ID: {m.id}</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                Active
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const LeaveView = () => (
    <div className="space-y-4">
      <ViewHeader title="Leave Board" subtitle="(Connect leave status table later)" onBack={() => setView("dashboard")} />
      <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">
        Your profiles table doesn’t have “leave status”.  
        If you tell me your leave table columns, I will show real “On Leave”.
      </div>
    </div>
  );

  const ApprovalsView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Approval Queue"
        subtitle={approver ? "You are the approver." : "View only. Only approver can act."}
        onBack={() => setView("dashboard")}
        right={
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {pending.length} pending
          </span>
        }
      />
      <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
        Leave approvals will show after your `{LEAVE_TABLE}` table is ready with correct columns.
      </div>
    </div>
  );

  const PayrollView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Payroll & Payslip"
        subtitle="Read-only snapshots."
        onBack={() => setView("dashboard")}
        right={
          <span className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-3 py-1 rounded-full">
            <Lock size={14} /> View only
          </span>
        }
      />
      <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600 flex items-start gap-2">
        <FileText size={16} className="mt-0.5" />
        Payroll/Payslip tables are optional. If table name differs, change config at top.
      </div>
    </div>
  );

  const ModalBody = () => {
    const payload = modal.payload;
    if (!payload) return null;

    if (payload.kind === "profile") {
      const profile = payload.profile || {};
      const personal = safeObj(profile.personal);

      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Employee</p>
            <p className="text-lg font-bold text-slate-900">{profile.name || "-"}</p>
            <p className="text-sm text-slate-600">Employee ID: {profile.id || "-"}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Personal Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="DOB" value={personal.dob} />
              <DetailItem label="Gender" value={personal.gender} />
              <DetailItem label="Marital Status" value={personal.maritalStatus} />
              <DetailItem label="Blood Group" value={personal.bloodGroup} />
              <DetailItem label="Personal Email" value={personal.personalEmail} />
              <DetailItem label="Official Email" value={personal.officialEmail} />
              <DetailItem label="Mobile Number" value={personal.mobileNumber} />
              <DetailItem label="Alternate Number" value={personal.alternateContactNumber} />
              <DetailItem label="Current Address" value={personal.currentAddress} />
              <DetailItem label="Permanent Address" value={personal.permanentAddress} />
            </div>
          </div>
        </div>
      );
    }

    return <div className="text-sm text-slate-600">No details available.</div>;
  };

  if (loading) return <LoadingPanel label="Loading manager dashboard data from Supabase..." />;
  if (err) return <ErrorPanel title="Failed to load true data" message={err} onRetry={fetchAll} />;

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
