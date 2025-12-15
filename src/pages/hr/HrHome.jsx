import { useMemo, useState } from "react";
import {
  Search,
  Users,
  Shield,
  ArrowUpDown,
  X,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Building2,
  Briefcase,
  BadgeCheck,
  Ban,
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

// ---------------- UI HELPERS ----------------
const badgeStatus = (status) => {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border";
  if (status === "Active")
    return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
};

const tagType = (type) => {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border";
  if (type === "employee")
    return `${base} bg-sky-50 text-sky-700 border-sky-200`;
  return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
};

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

export default function HrHome() {
  const [tab, setTab] = useState("all"); // all | employees | admins
  const [statusFilter, setStatusFilter] = useState("all"); // all | Active | Inactive
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name"); // name|id|type|status|joinedOn
  const [sortDir, setSortDir] = useState("asc"); // asc|desc
  const [viewing, setViewing] = useState(null); // selected row

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

  const insights = useMemo(() => {
    const emp = combined.filter((x) => x.type === "employee");
    const female = emp.filter((x) => x.gender === "Female").length;
    const male = emp.filter((x) => x.gender === "Male").length;

    const admins = combined.filter((x) => x.type === "admin");
    const superAdmins = admins.filter((x) => safeLower(x.role).includes("super")).length;

    const topDepts = emp.reduce((acc, e) => {
      const k = e.department || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const topDeptSorted = Object.entries(topDepts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      female,
      male,
      superAdmins,
      topDeptSorted,
      empTotal: emp.length,
      adminTotal: admins.length,
    };
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

  const closeDrawer = () => setViewing(null);

  return (
    <section className="space-y-5">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 opacity-10" />
        <div className="absolute -top-20 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative p-6 sm:p-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-indigo-700">HR CONTROL CENTER</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">HR Dashboard</h1>
           

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Total: {counts.total}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active: {counts.active}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                Inactive: {counts.inactive}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="w-full md:w-[420px]">
            <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-300">
              <Search size={18} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search id / name / email / role / dept / location..."
                className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  statusFilter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Active")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  statusFilter === "Active"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Inactive")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  statusFilter === "Inactive"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SUMMARY CARDS (SMALL) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        <div className="rounded-2xl border bg-white p-4 shadow-sm h-fit">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Employees</div>
            <div className="p-2 rounded-2xl bg-sky-50 border border-sky-100">
              <Users size={18} className="text-sky-700" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{counts.emp}</div>
          <div className="mt-2 text-sm text-slate-500">
            Female {insights.female} • Male {insights.male}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm h-fit">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Admins</div>
            <div className="p-2 rounded-2xl bg-indigo-50 border border-indigo-100">
              <Shield size={18} className="text-indigo-700" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{counts.adm}</div>
          <div className="mt-2 text-sm text-slate-500">Super Admins: {insights.superAdmins}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm h-fit">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">Active Rate</div>
            <div className="p-2 rounded-2xl bg-emerald-50 border border-emerald-100">
              <BadgeCheck size={18} className="text-emerald-700" />
            </div>
          </div>

          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {percent(counts.active, counts.total)}%
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"
              style={{ width: `${percent(counts.active, counts.total)}%` }}
            />
          </div>

          <div className="mt-2 text-sm text-slate-500">
            Active {counts.active} • Inactive {counts.inactive}
          </div>
        </div>
      </div>

      {/* ✅ INSIGHTS CARD (NOW BELOW THE 3 CARDS) */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Insights</div>
            <div className="text-xs text-slate-500 mt-1">Top departments (employees)</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-50 border border-slate-100">
            <Briefcase size={18} className="text-slate-700" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {insights.topDeptSorted.length === 0 ? (
              <div className="text-sm text-slate-500">No department data.</div>
            ) : (
              insights.topDeptSorted.map(([dept, n]) => {
                const pct = percent(n, insights.empTotal);
                return (
                  <div key={dept}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{dept}</span>
                      <span className="text-slate-500">
                        {n} • {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Quick Tip</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              Click any user row to open profile drawer.
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Filters: <span className="font-semibold text-slate-700">{tab}</span> •{" "}
              <span className="font-semibold text-slate-700">{statusFilter}</span>
            </div> */}
          {/* </div> */}
        </div>
      </div>

      {/* TYPE TABS */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All Users" },
          { key: "employees", label: "Employees" },
          { key: "admins", label: "Admins" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition ${
              tab === t.key
                ? "bg-slate-900 text-white border-slate-900 shadow"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-900">User Directory</div>
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
                    User <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
                    Type <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Role / Dept</th>
                <th className="text-left px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
                    Status <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("joinedOn")}
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                  >
                    Joined <ArrowUpDown size={14} />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={`${u.type}-${u.id}`}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setViewing(u)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl border bg-gradient-to-br from-indigo-600/10 via-sky-600/10 to-emerald-500/10 flex items-center justify-center">
                          <span className="text-xs font-extrabold text-slate-800">
                            {initials(u.name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={tagType(u.type)}>
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

                    <td className="px-4 py-3 text-slate-700">{u.email}</td>
                    <td className="px-4 py-3 text-slate-700">{u.phone}</td>

                    <td className="px-4 py-3">
                      {u.type === "employee" ? (
                        <div>
                          <div className="font-semibold text-slate-800">{u.department}</div>
                          <div className="text-xs text-slate-500">{u.designation}</div>
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-800">{u.role}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={badgeStatus(u.status)}>
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

                    <td className="px-4 py-3 text-right text-slate-700">{u.joinedOn}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t text-xs text-slate-500 flex items-center justify-between">
          <div>
            Sort: <span className="font-semibold text-slate-700">{sortKey}</span> •{" "}
            <span className="font-semibold text-slate-700">{sortDir}</span>
          </div>
          <div>Click row to open profile</div>
        </div>
      </div>

      {/* DRAWER */}
      {viewing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl border-l">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-indigo-700">
                  {viewing.type === "employee" ? "EMPLOYEE PROFILE" : "ADMIN PROFILE"}
                </div>
                <div className="mt-1 text-xl font-extrabold text-slate-900">{viewing.name}</div>
                <div className="mt-1 text-sm text-slate-500">{viewing.id}</div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto h-[calc(100%-76px)]">
              <div className="flex flex-wrap gap-2">
                <span className={tagType(viewing.type)}>
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
                <span className={badgeStatus(viewing.status)}>
                  {viewing.status === "Active" ? (
                    <>
                      <BadgeCheck size={14} /> Active
                    </>
                  ) : (
                    <>
                      <Ban size={14} /> Inactive
                    </>
                  )}
                </span>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm font-extrabold text-slate-900">Contact</div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="p-2 rounded-xl bg-slate-50 border">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">Email</div>
                      <div className="font-semibold truncate">{viewing.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="p-2 rounded-xl bg-slate-50 border">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">Phone</div>
                      <div className="font-semibold truncate">{viewing.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="p-2 rounded-xl bg-slate-50 border">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">Location</div>
                      <div className="font-semibold truncate">{viewing.location}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm font-extrabold text-slate-900">Work</div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CalendarDays size={16} />
                      <div className="text-xs text-slate-500">Joined On</div>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">{viewing.joinedOn}</div>
                  </div>

                  <div className="rounded-2xl border bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 size={16} />
                      <div className="text-xs text-slate-500">
                        {viewing.type === "employee" ? "Department" : "Role"}
                      </div>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {viewing.type === "employee" ? viewing.department : viewing.role}
                    </div>
                  </div>
                </div>

                {viewing.type === "employee" && (
                  <div className="mt-3 rounded-2xl border bg-white p-3">
                    <div className="text-xs text-slate-500">Designation</div>
                    <div className="font-semibold text-slate-900">{viewing.designation}</div>
                    <div className="mt-1 text-xs text-slate-500">Gender: {viewing.gender}</div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-gradient-to-r from-indigo-600/10 via-sky-600/10 to-emerald-500/10 p-4">
                <div className="text-sm font-extrabold text-slate-900">Dynamic UI Note</div>
                <div className="mt-1 text-sm text-slate-600">
                  This drawer can later show Attendance, Leave history, Documents for the selected user.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
