import { useMemo, useState } from "react";
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
  Briefcase,
  BadgeCheck,
  Ban,
  Sparkles,
  Filter,
  Star,
  Hash,
  ExternalLink,
  IdCard,
  Dot,
} from "lucide-react";

// ---------------- DEMO DATA ----------------
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

// ---------------- HELPERS ----------------
function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}
function safeLower(x) {
  return (x || "").toString().toLowerCase();
}
function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
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

/** clickable stat card */
const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
  accent = "from-fuchsia-500 to-amber-500",
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left w-full relative overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-[0.08]`} />
    <div className="relative p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </div>
          {sub ? <div className="mt-2 text-sm text-slate-600">{sub}</div> : null}
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            Click to view
          </div>
        </div>
        <div className="p-2.5 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
          <Icon size={18} className="text-slate-800" />
        </div>
      </div>
    </div>
  </button>
);

// ---------------- MODAL (SMALL + ATTRACTIVE) ----------------
function SmallModal({ open, title, subtitle, children, accent = "indigo", onClose }) {
  if (!open) return null;

  const accentMap = {
    indigo: "from-indigo-500/20 via-sky-500/10 to-emerald-500/10",
    emerald: "from-emerald-500/20 via-cyan-500/10 to-indigo-500/10",
    violet: "from-violet-500/22 via-indigo-500/10 to-cyan-500/10",
    amber: "from-amber-500/22 via-rose-500/10 to-indigo-500/10",
  };
  const bg = accentMap[accent] || accentMap.indigo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-white shadow-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${bg}`} />
        <div className="relative">
          <div className="px-5 py-4 border-b bg-white/65 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
                {subtitle ? (
                  <div className="mt-0.5 text-xs text-slate-600 truncate">{subtitle}</div>
                ) : null}
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

          <div className="p-5">{children}</div>

          <div className="px-5 py-4 border-t bg-white/65 backdrop-blur flex items-center justify-end">
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

function MiniUserCard({ u, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(u)}
      className="w-full text-left rounded-2xl border bg-white hover:bg-slate-50 transition p-3"
    >
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
            className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${dotClass(
              u.status
            )}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-900 truncate">{u.name}</div>
            <span className={statusPill(u.status)}>
              <span className={`w-2 h-2 rounded-full ${dotClass(u.status)}`} />
              {u.status}
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-500 truncate">{u.id}</div>
          <div className="mt-1 text-xs text-slate-600 truncate">
            {u.type === "employee" ? `${u.department} • ${u.designation}` : u.role}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function HrHome() {
  const [tab, setTab] = useState("all"); // all | employees | admins
  const [statusFilter, setStatusFilter] = useState("all"); // all | Active | Inactive
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name"); // name|id|type|status|joinedOn
  const [sortDir, setSortDir] = useState("asc"); // asc|desc

  const [viewing, setViewing] = useState(null); // profile modal
  const [statModal, setStatModal] = useState(null); // "employees" | "admins" | "activeRate" | null

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
        const roleOrDept =
          x.type === "employee" ? `${x.department} ${x.designation}` : x.role;
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

  const closeProfile = () => setViewing(null);
  const closeStatModal = () => setStatModal(null);

  const activeRate = percent(counts.active, counts.total);
  const progress = clamp(activeRate, 0, 100);

  const searchHint = useMemo(() => {
    if (!search.trim()) return "Search by name, id, email, role/department...";
    return `Searching: "${search.trim()}"`;
  }, [search]);

  // --------- STAT MODAL LISTS ----------
  const employeesList = useMemo(
    () => combined.filter((x) => x.type === "employee"),
    [combined]
  );
  const adminsList = useMemo(
    () => combined.filter((x) => x.type === "admin"),
    [combined]
  );
  const activeList = useMemo(
    () => combined.filter((x) => x.status === "Active"),
    [combined]
  );
  const inactiveList = useMemo(
    () => combined.filter((x) => x.status === "Inactive"),
    [combined]
  );

  const statModalConfig = useMemo(() => {
    if (!statModal) return null;

    if (statModal === "employees") {
      return {
        accent: "emerald",
        title: "Employees",
        subtitle: `Total: ${counts.emp} • Click any card to view profile`,
        list: employeesList,
      };
    }
    if (statModal === "admins") {
      return {
        accent: "violet",
        title: "Admins",
        subtitle: `Total: ${counts.adm} • Click any card to view profile`,
        list: adminsList,
      };
    }
    // active rate
    return {
      accent: "amber",
      title: "Active Rate Details",
      subtitle: `Active ${counts.active} • Inactive ${counts.inactive} • Total ${counts.total}`,
      list: null,
    };
  }, [statModal, counts, employeesList, adminsList]);

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[28px] border bg-white shadow-sm">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-emerald-500 to-amber-500 opacity-[0.10]" />
          <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-slate-700 text-xs font-semibold">
                <Sparkles size={14} className="text-indigo-600" />
                HR Workspace • People Directory
              </div> */}

              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
               HR Dashboard
              </h1>
              {/* <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Click Stats to view details • Click table row to open small profile modal.
              </p> */}

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

      {/* STATS (CLICKABLE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Employees"
          value={counts.emp}
          sub="Click to see employee list"
          icon={Users}
          accent="from-emerald-500 to-cyan-500"
          onClick={() => setStatModal("employees")}
        />
        <StatCard
          title="Admins"
          value={counts.adm}
          sub="Click to see admin list"
          icon={Shield}
          accent="from-violet-500 to-indigo-500"
          onClick={() => setStatModal("admins")}
        />
        <button
          type="button"
          onClick={() => setStatModal("activeRate")}
          className="text-left w-full relative overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-rose-500 opacity-[0.08]" />
          <div className="relative p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Active Rate</div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                  {progress}%
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Active {counts.active} • Inactive {counts.inactive}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Click to view
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
                <Star size={18} className="text-slate-800" />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Click to see Active/Inactive list.
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-2">
        <SegButton active={tab === "all"} onClick={() => setTab("all")} icon={Sparkles} label="All Users" />
        <SegButton active={tab === "employees"} onClick={() => setTab("employees")} icon={Users} label="Employees" />
        <SegButton active={tab === "admins"} onClick={() => setTab("admins")} icon={Shield} label="Admins" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[28px] border shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">User Directory</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Click any row to open small profile modal
            </div>
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
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
                    User <SortIcon active={sortKey === "name"} dir={sortDir} />
                  </button>
                </th>

                <th className="text-left px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
                    Type <SortIcon active={sortKey === "type"} dir={sortDir} />
                  </button>
                </th>

                <th className="text-left px-4 py-3 font-semibold">Contact</th>
                <th className="text-left px-4 py-3 font-semibold">Role / Dept</th>

                <th className="text-left px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
                    Status <SortIcon active={sortKey === "status"} dir={sortDir} />
                  </button>
                </th>

                <th className="text-right px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("joinedOn")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
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
                    onClick={() => setViewing(u)}
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
                            <span className="text-xs font-extrabold text-slate-800">
                              {initials(u.name)}
                            </span>
                          </div>
                          <span
                            className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${dotClass(
                              u.status
                            )}`}
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

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-slate-800 font-semibold truncate">{u.email}</div>
                        <div className="text-xs text-slate-500 truncate">{u.phone}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {u.type === "employee" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={deptBadge(u.department)}>{u.department}</span>
                          <span className="text-xs text-slate-600 font-semibold">
                            {u.designation}
                          </span>
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

                    <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                      {formatDate(u.joinedOn)}
                    </td>
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
            Small modal opens on click
          </div>
        </div>
      </div>

      {/* STAT MODAL */}
      <SmallModal
        open={!!statModal}
        accent={statModalConfig?.accent || "indigo"}
        title={statModalConfig?.title || ""}
        subtitle={statModalConfig?.subtitle || ""}
        onClose={closeStatModal}
      >
        {statModal === "activeRate" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-slate-900">Rate</div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Dot className="text-slate-400" />
                  Total {counts.total}
                </span>
              </div>

              <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Active</div>
                  <div className="mt-1 text-xl font-extrabold text-slate-900">{counts.active}</div>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Inactive</div>
                  <div className="mt-1 text-xl font-extrabold text-slate-900">{counts.inactive}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Active Users</div>
                <div className="space-y-2">
                  {activeList.map((u) => (
                    <MiniUserCard
                      key={`${u.type}-${u.id}`}
                      u={u}
                      onOpen={(user) => {
                        closeStatModal();
                        setViewing(user);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-2 mt-3">Inactive Users</div>
                <div className="space-y-2">
                  {inactiveList.map((u) => (
                    <MiniUserCard
                      key={`${u.type}-${u.id}`}
                      u={u}
                      onOpen={(user) => {
                        closeStatModal();
                        setViewing(user);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {statModalConfig?.list?.length ? (
              statModalConfig.list.map((u) => (
                <MiniUserCard
                  key={`${u.type}-${u.id}`}
                  u={u}
                  onOpen={(user) => {
                    closeStatModal();
                    setViewing(user);
                  }}
                />
              ))
            ) : (
              <div className="text-sm text-slate-500">No users.</div>
            )}
          </div>
        )}
      </SmallModal>

      {/* PROFILE MODAL (SMALLER + CLEAN) */}
      <SmallModal
        open={!!viewing}
        accent={viewing?.type === "employee" ? "emerald" : "violet"}
        title={viewing?.name || ""}
        subtitle={viewing ? `${viewing.id} • ${viewing.type === "employee" ? "Employee" : "Admin"}` : ""}
        onClose={closeProfile}
      >
        {viewing ? (
          <div className="space-y-4">
            {/* top chips */}
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

              {viewing.type === "employee" ? (
                <span className={deptBadge(viewing.department)}>{viewing.department}</span>
              ) : null}
            </div>

            {/* identity row */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl border bg-white overflow-hidden shadow-sm">
                  <div
                    className={`absolute inset-0 ${
                      viewing.type === "employee"
                        ? "bg-gradient-to-br from-emerald-500/25 to-indigo-500/25"
                        : "bg-gradient-to-br from-violet-500/25 to-indigo-500/25"
                    }`}
                  />
                  <div className="relative h-full w-full flex items-center justify-center">
                    <span className="text-sm font-extrabold text-slate-900">
                      {initials(viewing.name)}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Employee ID</div>
                  <div className="text-sm font-extrabold text-slate-900 inline-flex items-center gap-2">
                    <IdCard size={16} className="text-slate-500" />
                    {viewing.id}
                  </div>
                </div>
              </div>
            </div>

            {/* quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`mailto:${viewing.email}`}
                className="group rounded-2xl border bg-white hover:bg-slate-50 transition p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Mail size={16} /> Email
                  </div>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                </div>
                <div className="mt-1 text-xs text-slate-500 truncate">{viewing.email}</div>
              </a>

              <a
                href={`tel:${(viewing.phone || "").replace(/\s+/g, "")}`}
                className="group rounded-2xl border bg-white hover:bg-slate-50 transition p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Phone size={16} /> Call
                  </div>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                </div>
                <div className="mt-1 text-xs text-slate-500 truncate">{viewing.phone}</div>
              </a>
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
                    <span className="text-sm font-semibold text-slate-900">
                      {viewing.designation}
                    </span>
                    <span className="text-xs text-slate-500">
                      • Gender:{" "}
                      <span className="font-semibold text-slate-700">{viewing.gender}</span>
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-sm font-semibold text-slate-900">{viewing.role}</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-slate-900/5 via-indigo-600/5 to-emerald-500/5 p-4">
              <div className="text-sm font-extrabold text-slate-900">Upgrade Idea</div>
              <div className="mt-1 text-sm text-slate-600">
                Add mini tabs here: Attendance • Leaves • Documents • Payroll (per user).
              </div>
            </div>
          </div>
        ) : null}
      </SmallModal>
    </section>
  );
}
