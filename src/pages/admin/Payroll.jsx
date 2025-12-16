import { useMemo, useState } from "react";
import {
  Search,
  Bell,
  Filter,
  Plus,
  Wallet,
  HandCoins,
  ReceiptText,
  ChevronDown,
  ArrowUpRight,
  Percent,
  Download,
  X,
  Pencil,
  Check,
} from "lucide-react";

const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const pillTone = {
  Paid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
};

function IconCircle({ icon: Icon }) {
  return (
    <div className="h-11 w-11 rounded-2xl grid place-items-center border bg-white shadow-sm text-slate-900">
      <Icon size={20} />
    </div>
  );
}

function StatCard({ icon, title, value, desc, tint }) {
  return (
    <div className={`rounded-3xl p-6 border ${tint}`}>
      <div className="flex items-start gap-4">
        <IconCircle icon={icon} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-5 py-1.5 text-xs font-semibold ring-1 whitespace-nowrap ${
        pillTone[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function Avatar({ name, tone = "bg-slate-200" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div className={`h-10 w-10 rounded-full grid place-items-center ${tone}`}>
      <span className="text-sm font-extrabold text-slate-800">{initials}</span>
    </div>
  );
}

const seedEmployees = [
  { id: "EMP-001", name: "Wade Warren", position: "Network Administrator", department: "IT", status: "Pending", base: 5000, overtime: 150, deduction: 1650, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-sky-200" },
  { id: "EMP-002", name: "Floyd Miles", position: "Recruitment Specialist", department: "HR", status: "Pending", base: 5000, overtime: 200, deduction: 1700, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-indigo-200" },
  { id: "EMP-003", name: "John Doe", position: "Product Designer", department: "IT", status: "Paid", base: 5000, overtime: 200, deduction: 450, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-emerald-200" },
  { id: "EMP-004", name: "Jane Cooper", position: "Chief Financial Officer", department: "Finance", status: "Pending", base: 5000, overtime: 120, deduction: 1620, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-rose-200" },
  { id: "EMP-005", name: "Jenny Wilson", position: "Accountant", department: "Finance", status: "Pending", base: 5000, overtime: 80, deduction: 1580, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-amber-200" },
  { id: "EMP-006", name: "Guy Hawkins", position: "HR Manager", department: "HR", status: "Paid", base: 5000, overtime: 150, deduction: 1650, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-lime-200" },
  { id: "EMP-007", name: "Jerome Bell", position: "Product Designer", department: "Design", status: "Paid", base: 5000, overtime: 220, deduction: 1720, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-purple-200" },
  { id: "EMP-008", name: "Arlene McCoy", position: "Payroll Specialist", department: "Finance", status: "Pending", base: 5000, overtime: 100, deduction: 1600, date: "Mar 12, 2025", bank: "ABC Bank", avatarTone: "bg-teal-200" },
];

export default function Payroll() {
  const dates = ["Mar 12, 2025", "Mar 10, 2025", "Mar 08, 2025"];
  const [activeDate, setActiveDate] = useState(dates[0]);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(() => seedEmployees);

  const [selectedId, setSelectedId] = useState(null);

  // edit status
  const [editId, setEditId] = useState(null);
  const [draftStatus, setDraftStatus] = useState("Pending");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const computed = useMemo(() => {
    const list = filtered.map((e) => ({ ...e, net: e.base + e.overtime - e.deduction }));
    const totalPayroll = list.reduce((a, b) => a + b.net, 0);
    const overtimeTotal = list.reduce((a, b) => a + b.overtime, 0);
    const deductionsTotal = list.reduce((a, b) => a + b.deduction, 0);
    return { list, totalPayroll, overtimeTotal, deductionsTotal };
  }, [filtered]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return computed.list.find((x) => x.id === selectedId) || null;
  }, [computed.list, selectedId]);

  const detailOpen = !!selected;

  // ✅ NEW GRID: Name(4) Position(3) Dept(2) Amount(1) Status+Edit(2)
  // Total = 12
  const headerCols = "md:grid-cols-12";
  const amountSpan = "md:col-span-1";
  const statusSpan = "md:col-span-2";

  const startEdit = (emp) => {
    setEditId(emp.id);
    setDraftStatus(emp.status);
  };
  const cancelEdit = () => setEditId(null);
  const saveEdit = () => {
    setRows((prev) => prev.map((r) => (r.id === editId ? { ...r, status: draftStatus } : r)));
    setEditId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Payroll - Mar 2025
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search now"
                className="w-full rounded-full border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <button className="h-11 w-11 rounded-full border bg-white grid place-items-center hover:bg-slate-50">
              <Bell size={18} className="text-slate-700" />
            </button>

            <div className="h-11 w-11 rounded-full bg-slate-200 border grid place-items-center">
              <span className="text-sm font-bold text-slate-700">JD</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatCard
            icon={Wallet}
            title="Total Payroll Processed"
            value={money(computed.totalPayroll)}
            desc="Total workforce registered, with payroll processing on track."
            tint="bg-purple-50/70"
          />
          <StatCard
            icon={HandCoins}
            title="Overtime and Bonuses"
            value={money(computed.overtimeTotal)}
            desc="Employees currently working, receiving payroll and benefits."
            tint="bg-emerald-50/70"
          />
          <StatCard
            icon={ReceiptText}
            title="Deduction and Taxes"
            value={money(computed.deductionsTotal)}
            desc="Employees on leave or inactive, with payroll adjustments."
            tint="bg-rose-50/70"
          />
        </div>

        {/* Layout */}
        <div className={`grid grid-cols-1 gap-6 ${detailOpen ? "lg:grid-cols-3" : ""}`}>
          {/* Payroll Activities */}
          <div className={`${detailOpen ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Payroll Activities</h2>
                  <p className="text-sm text-slate-500">
                    Here’s employee payroll information for this month
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={activeDate}
                      onChange={(e) => setActiveDate(e.target.value)}
                      className="h-10 appearance-none rounded-full border bg-white pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-200"
                    >
                      {dates.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  <button className="h-10 w-10 rounded-full border bg-white grid place-items-center hover:bg-slate-50">
                    <Filter size={18} className="text-slate-700" />
                  </button>

                  <button className="h-10 w-10 rounded-full border bg-white grid place-items-center hover:bg-slate-50">
                    <Plus size={18} className="text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Column labels (desktop) */}
              <div className={`hidden md:grid ${headerCols} px-6 py-3 text-xs font-bold text-slate-400`}>
                <div className="md:col-span-4">Employee Name</div>
                <div className="md:col-span-3">Position</div>
                <div className="md:col-span-2">Department</div>
                <div className={`${amountSpan} text-right`}>Amount</div>
                <div className={`${statusSpan} text-right`}>Status</div>
              </div>

              {/* Rows */}
              <div className="divide-y">
                {computed.list.map((e) => {
                  const isActive = e.id === selectedId;
                  const isEditing = editId === e.id;

                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className={`w-full text-left px-6 py-4 transition ${
                        isActive ? "bg-purple-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className={`grid grid-cols-1 md:grid ${headerCols} gap-y-2 md:items-center`}>
                        {/* Name */}
                        <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                          <Avatar name={e.name} tone={e.avatarTone} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-slate-900">
                              {e.name}
                            </div>
                            <div className="md:hidden text-xs text-slate-500 truncate">
                              {e.position} • {e.department}
                            </div>
                          </div>
                        </div>

                        {/* Position */}
                        <div className="hidden md:block md:col-span-3 text-sm text-slate-700 truncate pr-4">
                          {e.position}
                        </div>

                        {/* Department */}
                        <div className="hidden md:block md:col-span-2 text-sm text-slate-700 truncate pr-4">
                          {e.department}
                        </div>

                        {/* ✅ Amount right after Department */}
                        <div className={`${amountSpan} text-right text-sm font-extrabold text-slate-900 tabular-nums`}>
                          {money(e.net)}
                        </div>

                        {/* ✅ Status right after Amount + Edit */}
                        <div className={`${statusSpan}`}>
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {!isEditing ? (
                              <>
                                <StatusPill status={e.status} />
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    startEdit(e);
                                  }}
                                  className="h-9 w-9 rounded-full border bg-white grid place-items-center hover:bg-slate-50"
                                  title="Edit status"
                                >
                                  <Pencil size={16} className="text-slate-700" />
                                </button>
                              </>
                            ) : (
                              <div
                                className="flex items-center gap-2 flex-nowrap"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <select
                                  value={draftStatus}
                                  onChange={(ev) => setDraftStatus(ev.target.value)}
                                  className="h-9 rounded-full border bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-200"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Paid">Paid</option>
                                </select>

                                <button
                                  onClick={saveEdit}
                                  className="h-9 w-9 rounded-full bg-purple-700 grid place-items-center hover:bg-purple-800"
                                  title="Save"
                                >
                                  <Check size={16} className="text-white" />
                                </button>

                                <button
                                  onClick={cancelEdit}
                                  className="h-9 w-9 rounded-full border bg-white grid place-items-center hover:bg-slate-50"
                                  title="Cancel"
                                >
                                  <X size={16} className="text-slate-700" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail card (only after click) */}
          {detailOpen ? (
            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="relative h-28 bg-gradient-to-r from-purple-500 via-pink-400 to-amber-200">
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/90 grid place-items-center hover:bg-white"
                  title="Close"
                >
                  <X size={18} className="text-slate-800" />
                </button>
              </div>

              <div className="px-6 pb-6 -mt-10">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-200 grid place-items-center shadow-sm">
                    <span className="text-2xl font-extrabold text-slate-700">
                      {selected.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-2xl font-extrabold text-slate-900">{selected.name}</div>
                  <div className="text-sm text-slate-500">{selected.position}</div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-900">{selected.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <StatusPill status={selected.status} />
                  </div>

                  <div className="my-4 h-px bg-slate-200" />

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-semibold text-slate-900">{money(selected.base || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Overtime & Bonuses</span>
                    <span className="font-semibold text-slate-900">{money(selected.overtime || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Deduction</span>
                    <span className="font-semibold text-slate-900">{money(selected.deduction || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Net salary</span>
                    <span className="font-extrabold text-purple-700">{money(selected.net || 0)}</span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 border px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Bank Details</span>
                    <button className="inline-flex items-center gap-2 font-extrabold text-slate-900 hover:text-purple-700">
                      {selected.bank || "ABC Bank"} <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                    <Percent size={16} className="inline mr-2" />
                    Tax Summary
                  </button>
                  <button className="flex-1 rounded-2xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-800">
                    <Download size={16} className="inline mr-2" />
                    Download Slip
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Mobile Search */}
        <div className="md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-full border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
