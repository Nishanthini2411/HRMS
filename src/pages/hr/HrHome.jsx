// ✅ File: src/pages/hr/HrHome.jsx
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Users,
  Shield,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Building2,
  BadgeCheck,
  Ban,
  Sparkles,
  Filter,
  Hash,
  IdCard,
  Bell,
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarCheck,
} from "lucide-react";

/* ---------------- DEMO DATA ---------------- */
const employeesSeed = [
  {
    id: "EMP-001",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98765 43210",
    department: "Accounts",
    designation: "Accountant",
    status: "Active",
    joinedOn: "2024-06-10",
    location: "Chennai, TN",
    gender: "Female",
  },
  {
    id: "EMP-002",
    name: "Kavin Raj",
    email: "kavin@example.com",
    phone: "+91 91234 56789",
    department: "Sales",
    designation: "Sales Executive",
    status: "Active",
    joinedOn: "2024-09-01",
    location: "Jaffna",
    gender: "Male",
  },
  {
    id: "EMP-003",
    name: "Nila Devi",
    email: "nila@example.com",
    phone: "+94 77 123 4567",
    department: "HR",
    designation: "HR Assistant",
    status: "Inactive",
    joinedOn: "2023-12-20",
    location: "Kilinochchi",
    gender: "Female",
  },
];

const adminsSeed = [
  {
    id: "ADM-001",
    name: "Admin User",
    email: "admin@example.com",
    phone: "+94 77 987 6543",
    role: "Super Admin",
    status: "Active",
    joinedOn: "2023-01-12",
    location: "Kilinochchi",
  },
  {
    id: "ADM-002",
    name: "Ajith Kumar",
    email: "ajith@example.com",
    phone: "+91 90000 11111",
    role: "Admin",
    status: "Active",
    joinedOn: "2023-08-06",
    location: "Chennai, TN",
  },
];

/* ---------------- HELPERS ---------------- */
function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}
function safeLower(x) {
  return (x || "").toString().toLowerCase();
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function formatDate(iso) {
  return iso || "-";
}
function deptBadge(dept = "Unknown") {
  const key = safeLower(dept);
  const options = [
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-lime-50 text-lime-700 border-lime-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  ];
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  const pick = options[sum % options.length];
  return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${pick}`;
}

const pillBase =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm";

const typePill = (type) => {
  if (type === "employee")
    return `${pillBase} bg-emerald-50 text-emerald-700 border-emerald-200`;
  return `${pillBase} bg-violet-50 text-violet-700 border-violet-200`;
};

const statusPill = (status) => {
  if (status === "Active")
    return `${pillBase} bg-sky-50 text-sky-700 border-sky-200`;
  return `${pillBase} bg-rose-50 text-rose-700 border-rose-200`;
};

const dotClass = (status) => (status === "Active" ? "bg-sky-500" : "bg-rose-500");

const SortIcon = ({ active, dir }) => {
  if (!active) return <ArrowUpDown size={14} className="opacity-70" />;
  return dir === "asc" ? (
    <ArrowUp size={14} className="opacity-90" />
  ) : (
    <ArrowDown size={14} className="opacity-90" />
  );
};

const SegButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${
      active
        ? "bg-slate-900 text-white border-slate-900 shadow"
        : "bg-white/70 text-slate-700 border-slate-200 hover:bg-white hover:shadow-sm"
    }`}
  >
    {Icon ? (
      <span
        className={`p-1.5 rounded-xl border transition ${
          active
            ? "bg-white/10 border-white/15"
            : "bg-slate-50 border-slate-200 group-hover:bg-white"
        }`}
      >
        <Icon size={16} />
      </span>
    ) : null}
    {label}
  </button>
);

/* ---------------- SMALL MODAL (SMALLER + SCROLL) ---------------- */
function SmallModal({ open, title, subtitle, children, accent = "indigo", onClose }) {
  if (!open) return null;

  const accentMap = {
    indigo: "from-indigo-500/18 via-sky-500/10 to-emerald-500/10",
    emerald: "from-emerald-500/18 via-cyan-500/10 to-indigo-500/10",
    violet: "from-violet-500/18 via-indigo-500/10 to-cyan-500/10",
    amber: "from-amber-500/18 via-rose-500/10 to-indigo-500/10",
  };
  const bg = accentMap[accent] || accentMap.indigo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      {/* ✅ smaller width */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${bg}`} />

        <div className="relative">
          {/* header */}
          <div className="px-4 py-3 border-b bg-white/75 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
                {subtitle ? <div className="mt-0.5 text-xs text-slate-600 truncate">{subtitle}</div> : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-2xl hover:bg-slate-100 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ✅ content scroll */}
          <div className="p-4 max-h-[72vh] overflow-y-auto">{children}</div>

          {/* footer */}
          <div className="px-4 py-3 border-t bg-white/75 backdrop-blur flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-sm font-semibold border bg-slate-900 text-white border-slate-900 hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- DEMO: Leave / Attendance / Notifications ---------------- */
function makeDemoLeave(userId) {
  const isEmp = userId.startsWith("EMP");
  return [
    {
      id: `${isEmp ? "LR" : "AR"}-${userId}-01`,
      type: isEmp ? "Casual Leave" : "Permission",
      from: "2025-12-14",
      to: "2025-12-15",
      days: 2,
      status: "Pending",
      appliedAt: "2025-12-12",
      reason: isEmp ? "Family function" : "Admin onsite visit",
    },
    {
      id: `${isEmp ? "LR" : "AR"}-${userId}-02`,
      type: isEmp ? "Sick Leave" : "Work From Home",
      from: "2025-12-03",
      to: "2025-12-03",
      days: 1,
      status: "Approved",
      appliedAt: "2025-12-02",
      reason: isEmp ? "Fever" : "Server maintenance follow-up",
    },
  ];
}

function makeDemoAttendance(userId) {
  const base = userId.startsWith("EMP") ? 18 : 20;
  const present = userId.endsWith("3") ? base - 7 : base - 2;
  const absent = base - present;
  return {
    month: "December 2025",
    workingDays: base,
    presentDays: present,
    absentDays: absent,
    lateMarks: userId.endsWith("2") ? 2 : 1,
    logs: [
      { date: "2025-12-16", in: "09:12", out: "18:05", hours: "8h 53m", status: "Present" },
      { date: "2025-12-15", in: "09:05", out: "18:02", hours: "8h 57m", status: "Present" },
      { date: "2025-12-14", in: "-", out: "-", hours: "-", status: userId.endsWith("3") ? "Absent" : "Weekend" },
    ],
  };
}

function makeDemoNotifs(userId) {
  const tone = [
    { type: "success", icon: CheckCircle2 },
    { type: "warning", icon: AlertTriangle },
    { type: "info", icon: Info },
  ];
  const pick = (i) => tone[i % tone.length];
  return [
    {
      id: `NT-${userId}-01`,
      at: "2025-12-17 10:30",
      title: "Policy update",
      message: "Leave policy updated. Please review the changes.",
      ...pick(2),
      read: false,
    },
    {
      id: `NT-${userId}-02`,
      at: "2025-12-15 09:10",
      title: "Attendance reminder",
      message: "Don’t forget to check-in on time.",
      ...pick(1),
      read: true,
    },
    {
      id: `NT-${userId}-03`,
      at: "2025-12-12 16:40",
      title: "Request status",
      message: "Your latest request has been processed.",
      ...pick(0),
      read: true,
    },
  ];
}

/* ---------------- SMALL UI: Modal Tabs ---------------- */
const ModalTabBtn = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold border transition ${
      active
        ? "bg-slate-900 text-white border-slate-900 shadow"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
    }`}
  >
    {Icon ? <Icon size={16} /> : null}
    {label}
  </button>
);

const tonePill = (t) => {
  if (t === "Approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (t === "Rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  if (t === "Pending") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

/* ---------------- PAGE ---------------- */
export default function HrHome() {
  const [tab, setTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const [viewing, setViewing] = useState(null);
  const [modalTab, setModalTab] = useState("personal");

  const combined = useMemo(() => {
    const employees = employeesSeed.map((e) => ({ type: "employee", ...e }));
    const admins = adminsSeed.map((a) => ({ type: "admin", ...a }));
    return [...employees, ...admins];
  }, []);

  const counts = useMemo(() => {
    const emp = employeesSeed.length;
    const adm = adminsSeed.length;
    const total = emp + adm;
    const active = combined.filter((x) => x.status === "Active").length;
    const inactive = total - active;
    return { emp, adm, total, active, inactive };
  }, [combined]);

  const filtered = useMemo(() => {
    let list = [...combined];

    if (tab === "employees") list = list.filter((x) => x.type === "employee");
    if (tab === "admins") list = list.filter((x) => x.type === "admin");

    if (statusFilter !== "all") list = list.filter((x) => x.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((x) => {
        const roleOrDept = x.type === "employee" ? `${x.department} ${x.designation}` : x.role;
        return (
          safeLower(x.id).includes(q) ||
          safeLower(x.name).includes(q) ||
          safeLower(x.email).includes(q) ||
          safeLower(x.phone).includes(q) ||
          safeLower(roleOrDept).includes(q) ||
          safeLower(x.location).includes(q)
        );
      });
    }

    const get = (x) => {
      switch (sortKey) {
        case "id":
          return x.id || "";
        case "type":
          return x.type || "";
        case "status":
          return x.status || "";
        case "joinedOn":
          return x.joinedOn || "";
        case "name":
        default:
          return x.name || "";
      }
    };

    list.sort((a, b) => {
      const A = get(a);
      const B = get(b);
      if (A === B) return 0;
      const res = A > B ? 1 : -1;
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [combined, tab, statusFilter, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const openProfile = (u) => {
    setViewing(u);
    setModalTab("personal");
  };
  const closeProfile = () => setViewing(null);

  const searchHint = useMemo(() => {
    if (!search.trim()) return "Search by name, id, email, role/department...";
    return `Searching: "${search.trim()}"`;
  }, [search]);

  const leaveData = useMemo(() => (viewing ? makeDemoLeave(viewing.id) : []), [viewing]);
  const attendanceData = useMemo(() => (viewing ? makeDemoAttendance(viewing.id) : null), [viewing]);
  const notifData = useMemo(() => (viewing ? makeDemoNotifs(viewing.id) : []), [viewing]);

  useEffect(() => {
    if (viewing) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [viewing]);

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-emerald-500 to-amber-500 opacity-[0.10]" />
          <div className="absolute -top-16 -left-16 w-[320px] h-[320px] rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="absolute -bottom-20 -right-20 w-[380px] h-[380px] rounded-full bg-emerald-500/10 blur-2xl" />
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                HR Dashboard
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-xs font-semibold text-slate-700">
                  <Hash size={14} className="opacity-80" />
                  Total: {counts.total}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-xs font-semibold text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${dotClass("Active")}`} />
                  Active: {counts.active}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-xs font-semibold text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${dotClass("Inactive")}`} />
                  Inactive: {counts.inactive}
                </span>
              </div>
            </div>

            {/* SEARCH + STATUS */}
            <div className="w-full md:w-[460px]">
              <div className="rounded-3xl border bg-white/80 backdrop-blur-md p-3 shadow-sm">
                <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition">
                  <Search size={18} className="text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search id / name / email / role / dept / location..."
                    className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="p-1.5 rounded-xl hover:bg-slate-100 transition"
                      aria-label="Clear search"
                    >
                      <X size={16} className="text-slate-500" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Filter size={14} /> Status:
                  </span>

                  {["all", "Active", "Inactive"].map((s) => {
                    const active = statusFilter === s;
                    const label = s === "all" ? "All" : s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 text-[11px] text-slate-500">{searchHint}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-2">
        <SegButton active={tab === "all"} onClick={() => setTab("all")} icon={Sparkles} label="All Users" />
        <SegButton active={tab === "admins"} onClick={() => setTab("admins")} icon={Shield} label="Admins" />
        <SegButton active={tab === "employees"} onClick={() => setTab("employees")} icon={Users} label="Employees" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[28px] border shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">User Directory</div>
            <div className="text-xs text-slate-500 mt-0.5">Click any row → opens compact modal</div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> results
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-2 hover:text-slate-900">
                    User <SortIcon active={sortKey === "name"} dir={sortDir} />
                  </button>
                </th>

                <th className="text-left px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("type")} className="inline-flex items-center gap-2 hover:text-slate-900">
                    Type <SortIcon active={sortKey === "type"} dir={sortDir} />
                  </button>
                </th>

                <th className="text-left px-4 py-3 font-semibold">Contact</th>
                <th className="text-left px-4 py-3 font-semibold">Role / Dept</th>

                <th className="text-left px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-2 hover:text-slate-900">
                    Status <SortIcon active={sortKey === "status"} dir={sortDir} />
                  </button>
                </th>

                <th className="text-right px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("joinedOn")} className="inline-flex items-center gap-2 hover:text-slate-900">
                    Joined <SortIcon active={sortKey === "joinedOn"} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={`${u.type}-${u.id}`}
                    className="hover:bg-slate-50/70 cursor-pointer transition"
                    onClick={() => openProfile(u)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-2xl border bg-white overflow-hidden shadow-sm">
                          <div
                            className={`absolute inset-0 ${
                              u.type === "employee"
                                ? "bg-gradient-to-br from-emerald-500/25 to-cyan-500/25"
                                : "bg-gradient-to-br from-violet-500/25 to-indigo-500/25"
                            }`}
                          />
                          <div className="relative h-full w-full flex items-center justify-center">
                            <span className="text-xs font-extrabold text-slate-800">{initials(u.name)}</span>
                          </div>
                          <span
                            className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${dotClass(u.status)}`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={typePill(u.type)}>
                        {u.type === "employee" ? (
                          <>
                            <Users size={14} /> Employee
                          </>
                        ) : (
                          <>
                            <Shield size={14} /> Admin
                          </>
                        )}
                      </span>
                    </td>

                    {/* ✅ IMPORTANT: clicking email/phone should NOT open modal */}
                    <td className="px-4 py-3">
                      <div
                        className="space-y-1 cursor-text select-text"
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        <div className="text-slate-800 font-semibold truncate">{u.email}</div>
                        <div className="text-xs text-slate-500 truncate">{u.phone}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {u.type === "employee" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={deptBadge(u.department)}>{u.department}</span>
                          <span className="text-xs text-slate-600 font-semibold">{u.designation}</span>
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-800">{u.role}</div>
                      )}
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        <MapPin size={12} className="inline-block mr-1 -mt-0.5" />
                        {u.location}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={statusPill(u.status)}>
                        <span className={`w-2 h-2 rounded-full ${dotClass(u.status)}`} />
                        {u.status === "Active" ? (
                          <>
                            <BadgeCheck size={14} /> Active
                          </>
                        ) : (
                          <>
                            <Ban size={14} /> Inactive
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-slate-700 font-semibold">{formatDate(u.joinedOn)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div>
            Sort: <span className="font-semibold text-slate-700">{sortKey}</span> •{" "}
            <span className="font-semibold text-slate-700">{sortDir}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            Modal opens on row click
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      <SmallModal
        open={!!viewing}
        accent={viewing?.type === "employee" ? "emerald" : "violet"}
        title={viewing?.name || ""}
        subtitle={viewing ? `${viewing.id} • ${viewing.type === "employee" ? "Employee" : "Admin"}` : ""}
        onClose={closeProfile}
      >
        {viewing ? (
          <div className="space-y-4">
            {/* chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={typePill(viewing.type)}>
                {viewing.type === "employee" ? (
                  <>
                    <Users size={14} /> Employee
                  </>
                ) : (
                  <>
                    <Shield size={14} /> Admin
                  </>
                )}
              </span>

              <span className={statusPill(viewing.status)}>
                <span className={`w-2 h-2 rounded-full ${dotClass(viewing.status)}`} />
                {viewing.status}
              </span>

              {viewing.type === "employee" ? <span className={deptBadge(viewing.department)}>{viewing.department}</span> : null}
            </div>

            {/* tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <ModalTabBtn active={modalTab === "personal"} onClick={() => setModalTab("personal")} icon={IdCard} label="Personal" />
              <ModalTabBtn active={modalTab === "leave"} onClick={() => setModalTab("leave")} icon={ClipboardList} label="Leave" />
              <ModalTabBtn active={modalTab === "attendance"} onClick={() => setModalTab("attendance")} icon={CalendarCheck} label="Attendance" />
              <ModalTabBtn active={modalTab === "notifications"} onClick={() => setModalTab("notifications")} icon={Bell} label="Notifications" />
            </div>

            {/* PERSONAL */}
            {modalTab === "personal" ? (
              <div className="space-y-3">
                {/* compact identity */}
                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-2xl border bg-white overflow-hidden shadow-sm">
                      <div
                        className={`absolute inset-0 ${
                          viewing.type === "employee"
                            ? "bg-gradient-to-br from-emerald-500/25 to-indigo-500/25"
                            : "bg-gradient-to-br from-violet-500/25 to-indigo-500/25"
                        }`}
                      />
                      <div className="relative h-full w-full flex items-center justify-center">
                        <span className="text-sm font-extrabold text-slate-900">{initials(viewing.name)}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500">
                        {viewing.type === "employee" ? "Employee ID" : "Admin ID"}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 inline-flex items-center gap-2">
                        <IdCard size={16} className="text-slate-500" />
                        {viewing.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Email/Phone cards: NOT clickable (no mailto/tel) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border bg-white p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Mail size={16} /> Email
                    </div>
                    <div className="mt-1 text-xs text-slate-500 truncate select-text cursor-text">{viewing.email}</div>
                  </div>

                  <div className="rounded-2xl border bg-white p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Phone size={16} /> Phone
                    </div>
                    <div className="mt-1 text-xs text-slate-500 truncate select-text cursor-text">{viewing.phone}</div>
                  </div>
                </div>

                {/* details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin size={16} />
                      <div className="text-xs text-slate-500">Location</div>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900 truncate">{viewing.location}</div>
                  </div>

                  <div className="rounded-2xl border bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CalendarDays size={16} />
                      <div className="text-xs text-slate-500">Joined On</div>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">{formatDate(viewing.joinedOn)}</div>
                  </div>

                  <div className="rounded-2xl border bg-white p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 size={16} />
                      <div className="text-xs text-slate-500">
                        {viewing.type === "employee" ? "Department / Designation" : "Role"}
                      </div>
                    </div>

                    {viewing.type === "employee" ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={deptBadge(viewing.department)}>{viewing.department}</span>
                        <span className="text-sm font-semibold text-slate-900">{viewing.designation}</span>
                        <span className="text-xs text-slate-500">
                          • Gender: <span className="font-semibold text-slate-700">{viewing.gender}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm font-semibold text-slate-900">{viewing.role}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* LEAVE */}
            {modalTab === "leave" ? (
              <div className="rounded-2xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                  <div className="text-sm font-extrabold text-slate-900">Leave Requests</div>
                  <div className="text-xs text-slate-500">{leaveData.length} items</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white text-slate-600">
                      <tr className="border-b">
                        <th className="text-left px-4 py-3 font-semibold">Request</th>
                        <th className="text-left px-4 py-3 font-semibold">Duration</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 font-semibold">Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leaveData.map((lr) => (
                        <tr key={lr.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{lr.type}</div>
                            <div className="text-xs text-slate-500 truncate">{lr.reason}</div>
                            <div className="mt-1 text-[11px] text-slate-500">{lr.id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-900 font-semibold">
                              {lr.from} → {lr.to}
                            </div>
                            <div className="text-xs text-slate-500">{lr.days} day(s)</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${tonePill(lr.status)}`}>
                              <Clock3 size={14} className="opacity-80" />
                              {lr.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 font-semibold">{lr.appliedAt}</td>
                        </tr>
                      ))}
                      {leaveData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                            No leave requests.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* ATTENDANCE */}
            {modalTab === "attendance" ? (
              <div className="space-y-3">
                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Attendance</div>
                      <div className="text-xs text-slate-500">{attendanceData?.month}</div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <CalendarDays size={14} />
                      Working Days: {attendanceData?.workingDays ?? 0}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Present</div>
                      <div className="mt-1 text-xl font-extrabold text-slate-900">{attendanceData?.presentDays ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Absent</div>
                      <div className="mt-1 text-xl font-extrabold text-slate-900">{attendanceData?.absentDays ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Late Marks</div>
                      <div className="mt-1 text-xl font-extrabold text-slate-900">{attendanceData?.lateMarks ?? 0}</div>
                    </div>
                  </div>

                  {attendanceData ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-slate-600 mb-2">Present Rate</div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"
                          style={{
                            width: `${clamp(
                              Math.round((attendanceData.presentDays / attendanceData.workingDays) * 100),
                              0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                    <div className="text-sm font-extrabold text-slate-900">Recent Logs</div>
                    <div className="text-xs text-slate-500">{attendanceData?.logs?.length ?? 0} rows</div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left px-4 py-3 font-semibold">Date</th>
                          <th className="text-left px-4 py-3 font-semibold">In</th>
                          <th className="text-left px-4 py-3 font-semibold">Out</th>
                          <th className="text-left px-4 py-3 font-semibold">Hours</th>
                          <th className="text-right px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {attendanceData?.logs?.map((l, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">{l.date}</td>
                            <td className="px-4 py-3 text-slate-700">{l.in}</td>
                            <td className="px-4 py-3 text-slate-700">{l.out}</td>
                            <td className="px-4 py-3 text-slate-700">{l.hours}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">
                                <Clock3 size={14} className="opacity-80" />
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!attendanceData?.logs?.length ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                              No logs.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {/* NOTIFICATIONS */}
            {modalTab === "notifications" ? (
              <div className="rounded-2xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                  <div className="text-sm font-extrabold text-slate-900">Notifications</div>
                  <div className="text-xs text-slate-500">{notifData.length} items</div>
                </div>

                <div className="p-4 space-y-3">
                  {notifData.map((n) => {
                    const Icon = n.icon || Bell;
                    const toneCls =
                      n.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : n.type === "warning"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-sky-50 border-sky-200 text-sky-800";

                    return (
                      <div key={n.id} className={`rounded-2xl border p-3 flex gap-3 ${toneCls}`}>
                        <div className="shrink-0 w-10 h-10 rounded-2xl border bg-white/70 flex items-center justify-center">
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-extrabold truncate">{n.title}</div>
                              <div className="text-sm opacity-90 mt-0.5">{n.message}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[11px] opacity-80">{n.at}</div>
                              <div
                                className={`mt-1 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  n.read ? "bg-white/70 border-white/60" : "bg-slate-900 text-white border-slate-900"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${n.read ? "bg-slate-300" : "bg-emerald-400"}`} />
                                {n.read ? "Read" : "New"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {notifData.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-6">No notifications.</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SmallModal>
    </section>
  );
}
