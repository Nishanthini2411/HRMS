// src/pages/hr/Payroll.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  ListChecks,
  MoreHorizontal,
  Percent,
  Play,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  BadgeIndianRupee,
  Banknote,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------- CONFIG ---------------- */
const EMP_TABLE = "hrmss_employees";
const PAYROLL_TABLE = "hrmss_payroll"; // ✅ change if your table name differs
const PROFILE_TABLE = "hrmss_profiles"; // optional (bank details)
const ATT_TABLE = "employee_attendance"; // optional
const LEAVE_TABLE = "hrmss_leave_requests"; // optional (if exists)

/* ---------------- helpers ---------------- */
const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const monthMap = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

const monthKey = (monthName, year) => {
  const mm = monthMap[monthName] || "01";
  return `${year}-${mm}`; // "2025-01"
};

const monthRange = (monthName, year) => {
  const mm = Number(monthMap[monthName] || "01");
  const yy = Number(year);
  const start = new Date(yy, mm - 1, 1);
  const end = new Date(yy, mm, 1); // next month 1st (exclusive)
  const toISODate = (d) => d.toISOString().slice(0, 10);
  return { startDate: toISODate(start), endDate: toISODate(end) };
};

const maskAccount = (v) => {
  const s = String(v || "").replace(/\s+/g, "");
  if (!s) return "-";
  if (s.length <= 4) return `XXXX`;
  return `XXXX XXXX ${s.slice(-4)}`;
};

/* ---------------- small UI bits ---------------- */
function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border transition",
        active
          ? "bg-white shadow-sm border-slate-200 text-slate-900"
          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white",
      ].join(" ")}
    >
      <Icon size={14} className={active ? "text-slate-900" : "text-slate-500"} />
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  const isProcessed = status === "Processed";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold",
        isProcessed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", isProcessed ? "bg-emerald-500" : "bg-amber-500"].join(" ")} />
      {status}
    </span>
  );
}

function StatCard({ variant, title, value, sub, icon: Icon }) {
  const map = {
    white: "bg-white border-slate-200",
    navy: "bg-[#1C2648] border-[#1C2648] text-white",
    yellow: "bg-[#FFF7D6] border-[#F3E4A8]",
    green: "bg-[#02A88A] border-[#02A88A] text-white",
  };

  const iconWrap = {
    white: "bg-slate-50 border-slate-200",
    navy: "bg-white/10 border-white/10",
    yellow: "bg-[#FFF1B8] border-[#F3E4A8]",
    green: "bg-white/10 border-white/10",
  };

  const titleCls = variant === "navy" || variant === "green" ? "text-white/80" : "text-slate-500";
  const subCls = variant === "navy" || variant === "green" ? "text-white/70" : "text-slate-500";

  return (
    <div className={`rounded-xl border p-4 ${map[variant]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${titleCls}`}>{title}</p>
          <p
            className={[
              "mt-2 text-2xl font-extrabold tracking-tight tabular-nums",
              variant === "navy" || variant === "green" ? "text-white" : "text-slate-900",
            ].join(" ")}
          >
            {value}
          </p>
          {sub ? <p className={`mt-1 text-[11px] ${subCls}`}>{sub}</p> : null}
        </div>

        <div className={["h-9 w-9 rounded-lg border grid place-items-center shrink-0", iconWrap[variant]].join(" ")}>
          <Icon
            size={16}
            className={variant === "navy" || variant === "green" ? "text-white" : "text-slate-700"}
          />
        </div>
      </div>
    </div>
  );
}

function ActionTile({ tone = "white", icon: Icon, disabled, title, onClick }) {
  const map = {
    navy: "bg-[#1C2648] text-white border-[#1C2648] hover:opacity-95",
    blue: "bg-[#3F49E0] text-white border-[#3F49E0] hover:opacity-95",
    mint: "bg-[#7ED7C1] text-[#0B3B33] border-[#7ED7C1] hover:opacity-95",
    white: "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
    disabled: "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed",
  };

  const cls = disabled ? map.disabled : map[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={["h-14 rounded-xl border px-4 flex items-center justify-center gap-2 text-xs font-semibold", cls].join(
        " "
      )}
    >
      <Icon size={16} className={disabled ? "text-slate-400" : ""} />
      {title}
    </button>
  );
}

/* ---------------- page ---------------- */
export default function PayrollPage() {
  const [month, setMonth] = useState("December");
  const [year, setYear] = useState("2024");
  const [tab, setTab] = useState("overview"); // overview | list | details
  const [query, setQuery] = useState("");

  const [batchStatus, setBatchStatus] = useState("Draft"); // Draft / Approved / Paid

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // ✅ no fake seed
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedEmpId, setSelectedEmpId] = useState("");

  // details helpers
  const [bankInfo, setBankInfo] = useState(null);
  const [attSummary, setAttSummary] = useState(null); // { workingDays, presentDays, rate }
  const [leaveSummary, setLeaveSummary] = useState(null); // { paidLeave, lopDays } (optional)

  const periodKey = useMemo(() => monthKey(month, year), [month, year]);
  const periodRange = useMemo(() => monthRange(month, year), [month, year]);

  /* ---------------- FETCH: employees + payroll ---------------- */
  const fetchPayrollData = async () => {
    setLoading(true);
    setErrorMsg("");

    // 1) employees
    const empRes = await supabase
      .from(EMP_TABLE)
      .select("employee_id, full_name, role, department, status")
      .order("employee_id", { ascending: true });

    if (empRes.error) {
      setRows([]);
      setLoading(false);
      setErrorMsg(`Employees fetch failed: ${empRes.error.message}`);
      return;
    }

    const employees = (empRes.data || [])
      .filter((e) => String(e.status || "Active") !== "Inactive")
      .map((e) => ({
        empId: String(e.employee_id),
        name: String(e.full_name || ""),
        role: String(e.role || "Employee"),
        department: String(e.department || "-"),
      }));

    // 2) payroll for month
    const payRes = await supabase
      .from(PAYROLL_TABLE)
      .select("id, employee_id, month, basic_salary, hra, allowances, deductions, net_salary, created_at")
      .eq("month", periodKey);

    if (payRes.error) {
      setRows([]);
      setLoading(false);
      setErrorMsg(`Payroll fetch failed: ${payRes.error.message}`);
      return;
    }

    const payrollByEmp = new Map();
    for (const p of payRes.data || []) {
      payrollByEmp.set(String(p.employee_id), p);
    }

    const merged = employees.map((e) => {
      const p = payrollByEmp.get(e.empId);

      const basic = Number(p?.basic_salary || 0);
      const hra = Number(p?.hra || 0);
      const allowances = Number(p?.allowances || 0);
      const deductions = Number(p?.deductions || 0);

      const gross = basic + hra + allowances;
      const net = Number(p?.net_salary ?? Math.max(gross - deductions, 0));

      return {
        empId: e.empId,
        name: e.name,
        role: e.role,
        department: e.department,

        payrollId: p?.id || null,
        basic,
        hra,
        allowances,
        deductions,
        gross,
        net,

        status: p?.id ? "Processed" : "Pending",
        createdAt: p?.created_at || null,
      };
    });

    setRows(merged);

    // select first employee auto
    if (!selectedEmpId && merged.length) {
      setSelectedEmpId(merged[0].empId);
    } else if (selectedEmpId && !merged.some((r) => r.empId === selectedEmpId)) {
      setSelectedEmpId(merged[0]?.empId || "");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPayrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey]);

  /* ---------------- FILTERED LIST ---------------- */
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.empId.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        String(r.role || "").toLowerCase().includes(q) ||
        String(r.department || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  /* ---------------- HEADER STATS (true from rows) ---------------- */
  const headerStats = useMemo(() => {
    const totalEmployees = rows.length;
    const grossTotal = rows.reduce((a, r) => a + Number(r.gross || 0), 0);
    const deductionsTotal = rows.reduce((a, r) => a + Number(r.deductions || 0), 0);
    const netTotal = rows.reduce((a, r) => a + Number(r.net || 0), 0);
    return { totalEmployees, grossTotal, deductionsTotal, netTotal };
  }, [rows]);

  /* ---------------- CLICK EMPLOYEE -> DETAILS ---------------- */
  const openEmployeeDetails = (empId) => {
    setSelectedEmpId(empId);
    setTab("details");
  };

  const selectedRow = useMemo(() => rows.find((r) => r.empId === selectedEmpId) || null, [rows, selectedEmpId]);

  /* ---------------- DETAILS: bank + attendance + leaves (optional) ---------------- */
  const fetchDetailsForEmployee = async (empId) => {
    if (!empId) return;

    // bank profile (optional)
    const profRes = await supabase
      .from(PROFILE_TABLE)
      .select("employee_id, bank_name, account_number, ifsc_code, branch")
      .eq("employee_id", empId)
      .maybeSingle();

    if (!profRes.error) {
      setBankInfo(profRes.data || null);
    } else {
      // if table not exists / policy -> ignore
      setBankInfo(null);
    }

    // attendance (optional)
    try {
      const { startDate, endDate } = periodRange;
      const attRes = await supabase
        .from(ATT_TABLE)
        .select("attendance_date, status")
        .eq("employee_id", empId)
        .gte("attendance_date", startDate)
        .lt("attendance_date", endDate);

      if (!attRes.error) {
        const rows = attRes.data || [];
        const presentDays = rows.filter((x) => x.status === "Present").length;
        // working days = recorded days (since no holiday table)
        const workingDays = rows.length || 0;
        const rate = workingDays ? Math.round((presentDays / workingDays) * 100) : 0;
        setAttSummary({ workingDays, presentDays, rate });
      } else {
        setAttSummary(null);
      }
    } catch {
      setAttSummary(null);
    }

    // leaves (optional) - best-effort
    try {
      const { startDate, endDate } = periodRange;

      const leaveRes = await supabase
        .from(LEAVE_TABLE)
        .select("id, owner_id, owner_role, status, from_date, to_date, mode")
        .eq("owner_role", "employee")
        .eq("owner_id", empId)
        .eq("status", "Approved")
        .gte("from_date", startDate)
        .lt("from_date", endDate);

      if (!leaveRes.error) {
        // simple count (not day calculation)
        const paidLeave = (leaveRes.data || []).length;
        setLeaveSummary({ paidLeave, lopDays: 0 });
      } else {
        setLeaveSummary(null);
      }
    } catch {
      setLeaveSummary(null);
    }
  };

  useEffect(() => {
    if (tab === "details" && selectedEmpId) fetchDetailsForEmployee(selectedEmpId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedEmpId, periodKey]);

  /* ---------------- ACTIONS ---------------- */
  const onApprove = () => setBatchStatus("Approved");
  const onRunPayroll = () => setBatchStatus("Paid");

  // ✅ Calculate: only recompute net_salary for existing payroll rows (safe)
  const onCalculate = async () => {
    if (!rows.length) return;

    // Recompute net = (basic+hra+allowances)-deductions for rows that already exist in payroll table
    const toUpdate = rows
      .filter((r) => r.payrollId)
      .map((r) => ({
        id: r.payrollId,
        net_salary: Math.max(Number(r.basic || 0) + Number(r.hra || 0) + Number(r.allowances || 0) - Number(r.deductions || 0), 0),
      }));

    if (!toUpdate.length) {
      alert("No payroll rows to calculate for this month. Create payroll entries first.");
      return;
    }

    const updRes = await supabase.from(PAYROLL_TABLE).upsert(toUpdate, { onConflict: "id" });
    if (updRes.error) return alert(updRes.error.message);

    setBatchStatus("Draft");
    fetchPayrollData();
  };

  const downloadCSV = () => {
    const header = ["Emp ID", "Employee", "Role", "Department", "Gross", "Deductions", "Net", "Status"];
    const lines = [header.join(",")];

    for (const r of filteredRows) {
      const row = [
        r.empId,
        `"${String(r.name || "").replaceAll('"', '""')}"`,
        `"${String(r.role || "").replaceAll('"', '""')}"`,
        `"${String(r.department || "").replaceAll('"', '""')}"`,
        String(Number(r.gross || 0)),
        String(Number(r.deductions || 0)),
        String(Number(r.net || 0)),
        r.status,
      ];
      lines.push(row.join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${periodKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-[#1F2A4D] to-[#2E3A66] text-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/10 grid place-items-center">
                <FileText size={18} className="text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-base font-bold leading-tight">Payroll Dashboard</p>
                <p className="mt-1 text-[11px] text-white/70">Manage employee salaries and payments</p>
              </div>
            </div>

            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-900">
              {batchStatus === "Paid" ? "Paid" : batchStatus === "Approved" ? "Approved" : "Draft"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-white/70">
            <div className="inline-flex items-center gap-2">
              <CalendarDays size={14} className="text-white/70" />
              <span className="font-semibold">Payroll Period:</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-8 appearance-none rounded-md border border-white/10 bg-white/10 pl-3 pr-8 text-[11px] font-semibold text-white outline-none"
                >
                  {Object.keys(monthMap).map((m) => (
                    <option key={m} value={m} className="text-slate-900">
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/70" />
              </div>

              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-8 appearance-none rounded-md border border-white/10 bg-white/10 pl-3 pr-8 text-[11px] font-semibold text-white outline-none"
                >
                  {["2023", "2024", "2025", "2026"].map((y) => (
                    <option key={y} value={y} className="text-slate-900">
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/70" />
              </div>
            </div>

            <div className="ml-auto text-[11px] text-white/70">
              Month Key: <span className="font-semibold text-white">{periodKey}</span>
            </div>
          </div>
        </div>

        {/* error / loading */}
        {errorMsg ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMsg}
          </div>
        ) : null}

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            variant="white"
            title="Total Employees"
            value={loading ? "…" : headerStats.totalEmployees}
            sub="Active this month"
            icon={UserRound}
          />
          <StatCard
            variant="navy"
            title="Total Gross Salary"
            value={loading ? "…" : inr(headerStats.grossTotal)}
            sub="Before deductions"
            icon={ReceiptIndianRupee}
          />
          <StatCard
            variant="yellow"
            title="Total Deductions"
            value={loading ? "…" : inr(headerStats.deductionsTotal)}
            sub="PF, ESI, Tax & more"
            icon={Percent}
          />
          <StatCard
            variant="green"
            title="Total Net Pay"
            value={loading ? "…" : inr(headerStats.netTotal)}
            sub="Take-home salary"
            icon={Wallet}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "overview"} icon={LayoutGrid} onClick={() => setTab("overview")}>
            Overview
          </TabButton>
          <TabButton active={tab === "list"} icon={ListChecks} onClick={() => setTab("list")}>
            Employee List
          </TabButton>
          <TabButton active={tab === "details"} icon={BadgeIndianRupee} onClick={() => setTab("details")}>
            Salary Details
          </TabButton>
        </div>

        {/* Employee Salary List (shown for Overview + Employee List) */}
        {(tab === "overview" || tab === "list") && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Employee Salary List</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {loading ? "Loading…" : `${filteredRows.length} employee(s)`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search employees..."
                      className="h-9 w-64 max-w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <Eye size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  <button
                    type="button"
                    onClick={downloadCSV}
                    className="h-9 w-9 rounded-lg border border-slate-200 bg-white grid place-items-center hover:bg-slate-50"
                    title="Download CSV"
                  >
                    <Download size={16} className="text-slate-700" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 text-left">Emp ID</th>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Gross Salary</th>
                      <th className="px-4 py-3 text-left">Deductions</th>
                      <th className="px-4 py-3 text-left">Net Pay</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr className="border-t border-slate-100">
                        <td className="px-4 py-6 text-slate-500" colSpan={8}>
                          Loading payroll…
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr className="border-t border-slate-100">
                        <td className="px-4 py-6 text-slate-500" colSpan={8}>
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr key={r.empId} className="border-t border-slate-100">
                          <td className="px-4 py-4 font-semibold text-slate-500">{r.empId}</td>

                          {/* ✅ employee click => open Salary Details */}
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => openEmployeeDetails(r.empId)}
                              className="text-left w-full"
                              title="Open Salary Details"
                            >
                              <div className="font-bold text-slate-900">{r.name || "-"}</div>
                              <div className="text-[10px] font-semibold text-slate-400">{r.role || "-"}</div>
                            </button>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-600">{r.department || "-"}</td>

                          <td className="px-4 py-4 font-semibold text-slate-900 tabular-nums">{inr(r.gross)}</td>

                          <td className="px-4 py-4 font-semibold text-rose-500 tabular-nums">{inr(r.deductions)}</td>

                          <td className="px-4 py-4 font-semibold text-slate-900 tabular-nums">{inr(r.net)}</td>

                          <td className="px-4 py-4">
                            <StatusPill status={r.status} />
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => alert(`Actions - ${r.empId}\n(You can add edit modal here)`)}
                              className="h-8 w-10 rounded-lg hover:bg-slate-50 grid place-items-center"
                              title="Actions"
                            >
                              <MoreHorizontal size={16} className="text-slate-500" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4" />
            </div>

            {/* ✅ Payroll Actions ONLY in Overview */}
            {tab === "overview" && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-slate-600" />
                  <p className="text-sm font-bold text-slate-900">Payroll Actions</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <ActionTile tone="navy" icon={ReceiptIndianRupee} title="Calculate Payroll" onClick={onCalculate} />
                  <ActionTile tone="white" icon={Eye} title="Preview Salary" onClick={() => setTab("details")} />
                  <ActionTile tone="blue" icon={ShieldCheck} title="Approve Payroll" onClick={onApprove} />
                  <ActionTile tone="mint" icon={Play} title="Run Payroll" onClick={onRunPayroll} />
                  <ActionTile tone="white" icon={FileText} title="Generate Payslip" onClick={() => alert("Add payslip generation flow")} />
                  <ActionTile tone="white" icon={Download} title="Download Reports" onClick={downloadCSV} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Salary Details */}
        {tab === "details" && (
          <div className="space-y-4">
            {!selectedRow ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Select an employee to view salary details.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedRow.name || "-"}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedRow.empId} • {selectedRow.role || "-"} • {selectedRow.department || "-"}
                    </p>
                  </div>
                  <StatusPill status={selectedRow.status} />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Salary Structure */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Salary Structure</p>
                      <button
                        type="button"
                        onClick={() => alert("Add salary edit modal here (optional)")}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FileText size={14} />
                        Edit
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {[
                        ["Basic Salary", selectedRow.basic],
                        ["HRA", selectedRow.hra],
                        ["Allowances", selectedRow.allowances],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-slate-500">{k}</p>
                          <p className="text-xs font-bold text-slate-900 tabular-nums">{inr(v)}</p>
                        </div>
                      ))}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">Gross Salary</p>
                        <p className="text-sm font-extrabold text-emerald-600 tabular-nums">{inr(selectedRow.gross)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-rose-500" />
                      <p className="text-sm font-bold text-slate-900">Deductions</p>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">Total Deductions</p>
                        <p className="text-sm font-extrabold text-rose-500 tabular-nums">-{inr(selectedRow.deductions)}</p>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                        Note: This screen shows the stored payroll row for <b>{periodKey}</b>.
                        <br />
                        If you want PF/ESI/Tax breakdown, add extra columns or a payroll_items table.
                      </div>
                    </div>
                  </div>

                  {/* Net Salary Calculation */}
                  <div className="rounded-xl border border-slate-200 bg-[#F5FAFA] p-4">
                    <div className="flex items-center gap-2">
                      <Banknote size={16} className="text-slate-700" />
                      <p className="text-sm font-bold text-slate-900">Net Salary Calculation</p>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">Gross Salary</p>
                        <p className="text-xs font-bold text-slate-900 tabular-nums">{inr(selectedRow.gross)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">Total Deductions</p>
                        <p className="text-xs font-bold text-rose-500 tabular-nums">-{inr(selectedRow.deductions)}</p>
                      </div>

                      <div className="py-4 border-y border-slate-200 flex items-center justify-center">
                        <span className="text-slate-500 text-sm">→</span>
                      </div>

                      <div className="rounded-xl bg-[#EAF1F1] p-4">
                        <p className="text-[11px] font-semibold text-slate-500">
                          Take-home Salary <span className="text-slate-400">(Net Pay)</span>
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{inr(selectedRow.net)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Attendance & Leave (optional real data) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-emerald-600" />
                      <p className="text-sm font-bold text-slate-900">Attendance & Leave</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-500">Attendance Rate</p>
                      <p className="text-[11px] font-bold text-slate-900">
                        {attSummary ? `${attSummary.rate}%` : "-"}
                      </p>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full" style={{ width: `${attSummary?.rate || 0}%` }} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold text-slate-500">Working Days</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {attSummary ? attSummary.workingDays : "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-[10px] font-semibold text-emerald-700">Days Present</p>
                        <p className="mt-1 text-sm font-extrabold text-emerald-900">
                          {attSummary ? attSummary.presentDays : "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                        <p className="text-[10px] font-semibold text-indigo-700">Paid Leave</p>
                        <p className="mt-1 text-sm font-extrabold text-indigo-900">
                          {leaveSummary ? leaveSummary.paidLeave : "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-[10px] font-semibold text-amber-700">LOP Days</p>
                        <p className="mt-1 text-sm font-extrabold text-amber-900">
                          {leaveSummary ? leaveSummary.lopDays : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-500">Overtime Hours</p>
                      <p className="text-xs font-bold text-emerald-700">-</p>
                    </div>
                  </div>

                  {/* Bonus & Incentives (no columns in table -> show 0) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <p className="text-sm font-bold text-slate-900">Bonus & Incentives</p>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">Performance Bonus</p>
                        <p className="text-xs font-bold text-emerald-600 tabular-nums">+{inr(0)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">Incentives</p>
                        <p className="text-xs font-bold text-emerald-600 tabular-nums">+{inr(0)}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-600">Total Additions</p>
                        <p className="text-sm font-extrabold text-emerald-600 tabular-nums">+{inr(0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank & Payment Details (from hrmss_profiles if available) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CreditIcon />
                        <p className="text-sm font-bold text-slate-900">Bank & Payment Details</p>
                      </div>

                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">
                        {selectedRow.status === "Processed" ? "Ready" : "Pending"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 grid place-items-center">
                          <Building2 size={16} className="text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-500">Bank Name</p>
                          <p className="text-xs font-bold text-slate-900">{bankInfo?.bank_name || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 grid place-items-center">
                          <Wallet size={16} className="text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-500">Account Number</p>
                          <p className="text-xs font-bold text-slate-900">{maskAccount(bankInfo?.account_number)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 grid place-items-center">
                          <ShieldCheck size={16} className="text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-500">IFSC Code</p>
                          <p className="text-xs font-bold text-slate-900">{bankInfo?.ifsc_code || "-"}</p>
                          {bankInfo?.branch ? <p className="text-[10px] text-slate-500 mt-1">Branch: {bankInfo.branch}</p> : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-500">Payment Mode</p>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-700 border border-slate-200">
                          Bank Transfer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <input type="hidden" value={selectedEmpId} readOnly />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* small icon component */
function CreditIcon() {
  return (
    <span className="h-5 w-5 inline-flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M4 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
