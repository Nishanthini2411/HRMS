// src/pages/hr/PayslipManagement.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  Filter,
  Mail,
  Printer,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  X,
  FileText,
  Building2,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

/* ---------------- helpers ---------------- */
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

function numberToWords(n) {
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const toWordsBelow100 = (x) => {
    if (x < 20) return ones[x];
    const t = Math.floor(x / 10);
    const o = x % 10;
    return tens[t] + (o ? " " + ones[o] : "");
  };

  const toWordsBelow1000 = (x) => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    if (!h) return toWordsBelow100(r);
    if (!r) return ones[h] + " Hundred";
    return ones[h] + " Hundred " + toWordsBelow100(r);
  };

  const num = Math.floor(Number(n || 0));
  if (Number.isNaN(num)) return "";
  if (num < 1000) return toWordsBelow1000(num);

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  const parts = [];
  if (crore) parts.push(toWordsBelow1000(crore) + " Crore");
  if (lakh) parts.push(toWordsBelow1000(lakh) + " Lakh");
  if (thousand) parts.push(toWordsBelow1000(thousand) + " Thousand");
  if (rest) parts.push(toWordsBelow1000(rest));

  return parts.join(" ");
}

/* ---------------- demo data ---------------- */
const seedPayslips = [
  {
    id: "PS-001",
    employeeId: "EMP-001",
    name: "Priya Sharma",
    dept: "Finance",
    month: "March 2025",
    net: 52800,
    gross: 61000,
    sent: false,
  },
  {
    id: "PS-002",
    employeeId: "EMP-002",
    name: "Kavin Raj",
    dept: "Sales",
    month: "March 2025",
    net: 47200,
    gross: 55000,
    sent: true,
  },
  {
    id: "PS-003",
    employeeId: "EMP-003",
    name: "Nila Devi",
    dept: "HR",
    month: "March 2025",
    net: 43800,
    gross: 52000,
    sent: false,
  },
  {
    id: "PS-004",
    employeeId: "EMP-004",
    name: "Arun Prakash",
    dept: "Design",
    month: "February 2025",
    net: 55900,
    gross: 64000,
    sent: true,
  },
];

/* --------- payslip preview template data (for image UI) ---------- */
const payslipTemplateSeed = {
  "PS-001": {
    company: {
      name: "TechCorp Solutions Pvt. Ltd.",
      address: "Plot 45, Electronic City, Bengaluru, Karnataka - 560100",
    },
    employee: {
      name: "Priya Sharma",
      employeeId: "EMP-001",
      designation: "Senior Software Engineer",
      department: "Finance",
      doj: "15-Mar-2022",
    },
    earnings: [
      ["Basic Salary", 45000],
      ["House Rent Allowance (HRA)", 18000],
      ["Special Allowance", 12000],
      ["Other Allowances", 5000],
      ["Bonus / Incentives", 0],
    ],
    deductions: [
      ["Provident Fund (PF)", 5400],
      ["ESI", 0],
      ["Professional Tax", 200],
      ["Income Tax (TDS)", 4500],
      ["Loan / Advance", 0],
      ["Other Deductions", 0],
    ],
    attendance: { working: 22, present: 21, paidLeave: 1, lop: 0 },
    payment: {
      bank: "HDFC Bank",
      accountMasked: "XXXXXXXXXX8901",
      mode: "Bank Transfer",
      paidOn: "31-Dec-2024",
    },
  },
  "PS-002": {
    company: {
      name: "TechCorp Solutions Pvt. Ltd.",
      address: "Plot 45, Electronic City, Bengaluru, Karnataka - 560100",
    },
    employee: {
      name: "Kavin Raj",
      employeeId: "EMP-002",
      designation: "Sales Executive",
      department: "Sales",
      doj: "02-Jan-2023",
    },
    earnings: [
      ["Basic Salary", 38000],
      ["House Rent Allowance (HRA)", 12000],
      ["Special Allowance", 6000],
      ["Other Allowances", 3000],
      ["Bonus / Incentives", 2000],
    ],
    deductions: [
      ["Provident Fund (PF)", 4200],
      ["ESI", 0],
      ["Professional Tax", 200],
      ["Income Tax (TDS)", 2200],
      ["Loan / Advance", 0],
      ["Other Deductions", 0],
    ],
    attendance: { working: 22, present: 20, paidLeave: 2, lop: 0 },
    payment: {
      bank: "HDFC Bank",
      accountMasked: "XXXXXXXXXX1122",
      mode: "Bank Transfer",
      paidOn: "31-Dec-2024",
    },
  },
  "PS-003": {
    company: {
      name: "TechCorp Solutions Pvt. Ltd.",
      address: "Plot 45, Electronic City, Bengaluru, Karnataka - 560100",
    },
    employee: {
      name: "Nila Devi",
      employeeId: "EMP-003",
      designation: "HR Executive",
      department: "HR",
      doj: "10-Aug-2022",
    },
    earnings: [
      ["Basic Salary", 32000],
      ["House Rent Allowance (HRA)", 11000],
      ["Special Allowance", 5000],
      ["Other Allowances", 2500],
      ["Bonus / Incentives", 1500],
    ],
    deductions: [
      ["Provident Fund (PF)", 3600],
      ["ESI", 0],
      ["Professional Tax", 200],
      ["Income Tax (TDS)", 1800],
      ["Loan / Advance", 2000],
      ["Other Deductions", 0],
    ],
    attendance: { working: 22, present: 19, paidLeave: 1, lop: 2 },
    payment: {
      bank: "HDFC Bank",
      accountMasked: "XXXXXXXXXX7788",
      mode: "Bank Transfer",
      paidOn: "31-Dec-2024",
    },
  },
  "PS-004": {
    company: {
      name: "TechCorp Solutions Pvt. Ltd.",
      address: "Plot 45, Electronic City, Bengaluru, Karnataka - 560100",
    },
    employee: {
      name: "Arun Prakash",
      employeeId: "EMP-004",
      designation: "UI Designer",
      department: "Design",
      doj: "05-May-2021",
    },
    earnings: [
      ["Basic Salary", 42000],
      ["House Rent Allowance (HRA)", 15000],
      ["Special Allowance", 7000],
      ["Other Allowances", 4000],
      ["Bonus / Incentives", 3000],
    ],
    deductions: [
      ["Provident Fund (PF)", 4800],
      ["ESI", 0],
      ["Professional Tax", 200],
      ["Income Tax (TDS)", 2500],
      ["Loan / Advance", 0],
      ["Other Deductions", 0],
    ],
    attendance: { working: 22, present: 21, paidLeave: 1, lop: 0 },
    payment: {
      bank: "HDFC Bank",
      accountMasked: "XXXXXXXXXX3344",
      mode: "Bank Transfer",
      paidOn: "31-Dec-2024",
    },
  },
};

function MiniDetail({ label, value }) {
  return (
    <div className="rounded-2xl border bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

/* ---------------- Payslip Preview Modal (IMAGE UI) ---------------- */
function PayslipPreviewModal({ open, onClose, slip, meta }) {
  if (!open || !slip || !meta) return null;

  const earningsTotal = meta.earnings.reduce((s, [, v]) => s + Number(v || 0), 0);
  const deductionsTotal = meta.deductions.reduce((s, [, v]) => s + Number(v || 0), 0);
  const netPay = Math.max(0, Number(slip.net || earningsTotal - deductionsTotal));
  const monthYear = slip.month || "December 2024";

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 p-4 sm:p-8 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl">
        {/* top bar */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white">
            <FileText size={18} />
            <p className="text-sm font-bold">Payslip Preview</p>
            <span className="text-white/70 text-xs font-semibold">
              ({slip.name} • {monthYear})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              onClick={() => window.print?.()}
            >
              <Printer size={16} />
              Print
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              onClick={() => alert("Download PDF (demo)")}
            >
              <Download size={16} />
              Download
            </button>
            <button
              type="button"
              className="h-10 w-10 rounded-xl bg-white text-slate-900 grid place-items-center hover:bg-slate-100"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* payslip card */}
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden border">
          {/* header */}
          <div className="bg-gradient-to-r from-[#2B4BD8] to-[#21408F] px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center border border-white/10">
                  <FileText size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight">{meta.company.name}</p>
                  <p className="text-[11px] font-semibold text-white/80">{meta.company.address}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-bold text-white/80">Payslip for</p>
                <p className="text-sm font-extrabold">{monthYear}</p>
              </div>
            </div>
          </div>

          {/* content */}
          <div className="p-6 space-y-4">
            {/* employee details */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2">
                <UserRound size={16} className="text-indigo-600" />
                <p className="text-xs font-extrabold text-slate-900 uppercase">Employee Details</p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Employee Name</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.employee.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Employee ID</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.employee.employeeId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Designation</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.employee.designation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Department</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.employee.department}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Date of Joining</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.employee.doj}</p>
                </div>
              </div>
            </div>

            {/* earnings + deductions */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-emerald-50">
                  <p className="text-xs font-extrabold text-emerald-700 uppercase">Earnings</p>
                </div>
                <div className="p-4 space-y-3">
                  {meta.earnings.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <p className="text-slate-600 font-semibold">{k}</p>
                      <p className="text-slate-900 font-extrabold tabular-nums">{money(v)}</p>
                    </div>
                  ))}
                  <div className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 flex items-center justify-between">
                    <p className="text-xs font-extrabold text-emerald-700">Total Earnings (Gross)</p>
                    <p className="text-sm font-extrabold text-emerald-800 tabular-nums">{money(earningsTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-rose-50">
                  <p className="text-xs font-extrabold text-rose-700 uppercase">Deductions</p>
                </div>
                <div className="p-4 space-y-3">
                  {meta.deductions.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <p className="text-slate-600 font-semibold">{k}</p>
                      <p className="text-rose-600 font-extrabold tabular-nums">-{money(v)}</p>
                    </div>
                  ))}
                  <div className="mt-2 rounded-xl bg-rose-50 px-4 py-3 flex items-center justify-between">
                    <p className="text-xs font-extrabold text-rose-700">Total Deductions</p>
                    <p className="text-sm font-extrabold text-rose-800 tabular-nums">-{money(deductionsTotal)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* attendance summary */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-indigo-600" />
                <p className="text-xs font-extrabold text-slate-900 uppercase">Attendance Summary</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniDetail label="Total Working Days" value={meta.attendance.working} />
                <MiniDetail label="Days Present" value={meta.attendance.present} />
                <MiniDetail label="Paid Leave" value={meta.attendance.paidLeave} />
                <MiniDetail label="Loss of Pay (LOP) Days" value={meta.attendance.lop} />
              </div>
            </div>

            {/* net pay summary */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600" />
                <p className="text-xs font-extrabold text-slate-900 uppercase">Net Pay Summary</p>
              </div>

              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600 font-semibold">Total Earnings</p>
                  <p className="text-slate-900 font-extrabold tabular-nums">{money(earningsTotal)}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600 font-semibold">Total Deductions</p>
                  <p className="text-rose-600 font-extrabold tabular-nums">-{money(deductionsTotal)}</p>
                </div>

                <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Net Pay (Take-Home)</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-800 tabular-nums">{money(netPay)}</p>
                  <p className="mt-1 text-[10px] font-semibold text-emerald-700/80 italic">
                    Rupees {numberToWords(netPay)} Only
                  </p>
                </div>
              </div>
            </div>

            {/* payment details */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" />
                <p className="text-xs font-extrabold text-slate-900 uppercase">Payment Details</p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Bank Name</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.payment.bank}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Account Number</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.payment.accountMasked}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Payment Mode</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.payment.mode}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Paid On</p>
                  <p className="text-sm font-extrabold text-slate-900">{meta.payment.paidOn}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500">
                <ShieldCheck size={14} />
                This is a system-generated payslip and does not require a signature.
              </div>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function PayslipManagement({ basePath = "/dashboard" }) {
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [rows, setRows] = useState(seedPayslips);

  // selected row
  const [selectedId, setSelectedId] = useState("PS-001");

  // only "View" opens image UI
  const [previewOpen, setPreviewOpen] = useState(false);

  const selected = rows.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    if (!selected && rows.length) setSelectedId(rows[0].id);
  }, [selected, rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (monthFilter !== "all" && row.month !== monthFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.employeeId.toLowerCase().includes(q) ||
        row.dept.toLowerCase().includes(q) ||
        row.month.toLowerCase().includes(q)
      );
    });
  }, [rows, query, monthFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const sent = rows.filter((r) => r.sent).length;
    const pending = total - sent;
    const months = new Set(rows.map((r) => r.month)).size;
    const totalNet = rows.reduce((s, r) => s + Number(r.net || 0), 0);
    return { total, sent, pending, months, totalNet };
  }, [rows]);

  const send = (id) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, sent: true } : r)));
  };

  const payrollPath = `${basePath}/payroll`;

  const openPreview = (id) => {
    setSelectedId(id);
    setPreviewOpen(true);
  };

  const previewMeta = selected ? payslipTemplateSeed[selected.id] : null;

  return (
    <div className="space-y-6">
      <PayslipPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slip={selected}
        meta={previewMeta}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Payroll / Payslips</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Payslip Management</h1>
          <p className="text-sm text-slate-600">View payslips and send to employee portal/email.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={payrollPath}
            className="inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Payroll
          </a>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
            onClick={() => filtered.forEach((r) => send(r.id))}
          >
            <Send size={16} />
            Send All
          </button>
        </div>
      </div>

      {/* ✅ Stats without Draft/Publish */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Payslips</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Sent</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{stats.sent}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Pending</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Months</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.months}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Net</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{money(stats.totalNet)}</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ID, month..."
                className="w-64 rounded-2xl border bg-white pl-9 pr-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-10 rounded-2xl border bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm"
            >
              <option value="all">All Months</option>
              {[...new Set(rows.map((r) => r.month))].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
              <Filter size={16} />
              Advanced Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border">
          <div className="hidden grid-cols-12 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 md:grid">
            <span className="col-span-4">Employee</span>
            <span className="col-span-2">Department</span>
            <span className="col-span-2">Month</span>
            <span className="col-span-2 text-right">Net Pay</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          <div className="divide-y">
            {filtered.map((row) => (
              <div
                key={row.id}
                className={`grid grid-cols-1 gap-3 px-4 py-3 transition md:grid-cols-12 md:items-center ${
                  row.id === selectedId ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => setSelectedId(row.id)}
                role="button"
                tabIndex={0}
              >
                <div className="md:col-span-4">
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">
                    {row.employeeId} • {row.id}
                  </p>
                </div>
                <div className="md:col-span-2 text-sm font-semibold text-slate-700">{row.dept}</div>
                <div className="md:col-span-2 text-sm font-semibold text-slate-700">{row.month}</div>
                <div className="md:col-span-2 text-right text-sm font-extrabold text-slate-900">
                  {money(row.net)}
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2 text-sm">
                  <button
                    type="button"
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:opacity-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(row.id);
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:opacity-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      send(row.id);
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Konja payslip details (always show for selected) */}
        {selected ? (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Selected Payslip</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {selected.name} • {selected.month}
                  </p>
                  <p className="text-sm text-slate-600">{selected.dept}</p>
                </div>

                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold",
                    selected.sent
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-100",
                  ].join(" ")}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {selected.sent ? "Sent" : "Pending"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniDetail label="Employee ID" value={selected.employeeId} />
                <MiniDetail label="Gross" value={money(selected.gross)} />
                <MiniDetail label="Net Pay" value={money(selected.net)} />
                <MiniDetail label="Delivery" value={selected.sent ? "Sent" : "Not Sent"} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPreview(selected.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50"
                >
                  <FileText size={16} />
                  View Payslip
                </button>
                <button
                  type="button"
                  onClick={() => send(selected.id)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-95"
                >
                  <Mail size={16} />
                  Send to Employee
                </button>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Employee</p>
                  <p className="text-sm font-extrabold text-slate-900">{selected.name}</p>
                  <p className="text-xs text-slate-500">{selected.employeeId}</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Quick Actions</p>
                <p className="text-sm text-slate-700">View preview or send the payslip.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => openPreview(selected.id)}
                  className="inline-flex items-center justify-between rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Open Preview <FileText size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => alert("Download PDF (demo)")}
                  className="inline-flex items-center justify-between rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Download PDF <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => window.print?.()}
                  className="inline-flex items-center justify-between rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Print <Printer size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => send(selected.id)}
                  className="inline-flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-95"
                >
                  Send Now <Send size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500">
                <ShieldCheck size={14} />
                System-generated payslip
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
