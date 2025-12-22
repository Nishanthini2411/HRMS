import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Gift,
  CalendarDays,
  Sparkles,
  Search,
  Mail,
  Phone,
  UserRound,
  Building2,
  IdCard,
  CalendarCheck2,
} from "lucide-react";

/* ---------------- DEMO DATA ---------------- */
const employees = [
  {
    id: "EMP-004",
    name: "Vikram Singh",
    position: "Product Designer",
    department: "Design",
    dob: "1992-12-25",
    joined: "2020-04-10",
    email: "vikram.singh@example.com",
    phone: "+91 98222 55667",
  },
  {
    id: "EMP-005",
    name: "Meera Patel",
    position: "Marketing Lead",
    department: "Marketing",
    dob: "1991-12-22",
    joined: "2019-08-12",
    email: "meera.patel@example.com",
    phone: "+91 98711 22334",
  },
  {
    id: "EMP-001",
    name: "Priya Sharma",
    position: "Senior HR Executive",
    department: "HR",
    dob: "1994-08-20",
    joined: "2021-06-14",
    email: "priya.sharma@example.com",
    phone: "+91 98765 43210",
  },
  {
    id: "EMP-003",
    name: "Anita Iyer",
    position: "Finance Lead",
    department: "Finance",
    dob: "1988-12-18",
    joined: "2018-10-19",
    email: "anita.iyer@example.com",
    phone: "+91 98111 22334",
  },
  {
    id: "EMP-002",
    name: "Rohan Verma",
    position: "Engineering Manager",
    department: "Engineering",
    dob: "1990-12-21",
    joined: "2019-03-02",
    email: "rohan.verma@example.com",
    phone: "+91 98200 12345",
  },
];

/* ---------------- HELPERS ---------------- */
function fmtDateLong(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function daysUntilBirthday(dob) {
  const today = new Date();
  const birth = new Date(dob);
  const target = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  target.setHours(0, 0, 0, 0);

  const t = new Date(today);
  t.setHours(0, 0, 0, 0);

  if (target < t) target.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((target - t) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : 9999;
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function monthIndexFromDob(dob) {
  const d = new Date(dob);
  return d.getMonth(); // 0-11
}

function isBirthdayThisMonth(dob) {
  const now = new Date();
  return monthIndexFromDob(dob) === now.getMonth();
}

function celebratedThisYear(dob) {
  const now = new Date();
  const b = new Date(dob);
  const thisYearBDay = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  thisYearBDay.setHours(0, 0, 0, 0);

  const t = new Date(now);
  t.setHours(0, 0, 0, 0);

  return thisYearBDay < t; // already passed this year
}

/* ---------------- SMALL UI ---------------- */
function StatCard({ icon: Icon, label, value, tone = "purple" }) {
  const tones = {
    purple: "bg-[#7C3AED]/10 text-[#7C3AED]",
    orange: "bg-[#FB923C]/15 text-[#F97316]",
    violet: "bg-[#8B5CF6]/10 text-[#7C3AED]",
    amber: "bg-[#F59E0B]/15 text-[#D97706]",
  };
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur border border-white shadow-sm px-6 py-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function IconBadge({ children }) {
  return (
    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
      {children}
    </div>
  );
}

/* ---------------- MAIN ---------------- */
export default function PeopleDirectory() {
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();

    return employees
      .map((e) => ({ ...e, days: daysUntilBirthday(e.dob) }))
      .filter((e) => `${e.name} ${e.department}`.toLowerCase().includes(q))
      .sort((a, b) => a.days - b.days || a.name.localeCompare(b.name));
  }, [query]);

  const [selected, setSelected] = useState(() => {
    const first = employees
      .map((e) => ({ ...e, days: daysUntilBirthday(e.dob) }))
      .sort((a, b) => a.days - b.days)[0];
    return first || employees[0];
  });

  useEffect(() => {
    if (!list.length) return;
    const still = selected && list.find((x) => x.id === selected.id);
    if (!still) setSelected(list[0]);
  }, [list, selected]);

  const stats = useMemo(() => {
    const total = employees.length;
    const week = employees.filter((e) => daysUntilBirthday(e.dob) <= 7).length;
    const month = employees.filter((e) => isBirthdayThisMonth(e.dob)).length;
    const celebrated = employees.filter((e) => isBirthdayThisMonth(e.dob) && celebratedThisYear(e.dob)).length;
    return { total, week, month, celebrated };
  }, []);

  const birthdaySoon = daysUntilBirthday(selected.dob);

  return (
    <div className="min-h-screen px-6 py-7 bg-gradient-to-b from-[#f6efff] via-[#fbf6ff] to-[#ffffff]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <StatCard icon={Users} label="Total Employees" value={stats.total} tone="purple" />
          <StatCard icon={Gift} label="This Week" value={stats.week} tone="orange" />
          <StatCard icon={CalendarDays} label="This Month" value={stats.month} tone="violet" />
          <StatCard icon={Sparkles} label="Celebrated" value={stats.celebrated} tone="amber" />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2">
            <div className="rounded-[32px] bg-white/70 backdrop-blur border border-white shadow-sm overflow-hidden">
              {/* Search */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm">
                  <Search className="text-slate-400" size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or department..."
                    className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100">
                {list.map((emp) => {
                  const active = selected?.id === emp.id;
                  const soon = emp.days <= 7;

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelected(emp)}
                      className={`w-full text-left px-5 py-4 flex items-center gap-4 transition relative
                        ${active ? "bg-gradient-to-r from-[#FAD2D9] to-[#F8C7C9]" : "hover:bg-white"}
                      `}
                    >
                      {/* left accent when selected */}
                      {active ? (
                        <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#7C3AED]" />
                      ) : null}

                      {/* Avatar */}
                      <div
                        className={`h-12 w-12 rounded-full grid place-items-center font-bold text-sm
                        ${active ? "bg-orange-200 text-orange-800" : "bg-[#7C3AED] text-white"}
                      `}
                      >
                        {initials(emp.name)}
                      </div>

                      {/* Name + meta */}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">{emp.name}</div>
                        <div className="text-sm text-slate-500 truncate">
                          {emp.position} · {emp.department}
                        </div>
                      </div>

                      {/* days badge */}
                      {soon ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                          <Gift size={14} />
                          {emp.days}d
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">{emp.days}d</div>
                      )}
                    </button>
                  );
                })}

                {!list.length ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">No employees found.</div>
                ) : null}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rounded-[32px] overflow-hidden bg-white/70 backdrop-blur border border-white shadow-sm">
            {/* Orange header */}
            <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-[#FB923C] to-[#F97316]">
              {/* bubbles */}
              <span className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-white/15" />
              <span className="absolute top-7 right-10 h-10 w-10 rounded-full bg-white/15" />
              <span className="absolute top-14 left-28 h-4 w-4 rounded-full bg-white/30" />
              <span className="absolute top-10 right-28 h-6 w-6 rounded-full bg-white/20" />

              <div className="relative flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 grid place-items-center text-white font-extrabold text-lg">
                  {initials(selected.name)}
                </div>
                <div className="text-white min-w-0">
                  <div className="text-xl font-bold truncate">{selected.name}</div>
                  <div className="text-white/90 text-sm truncate">{selected.position}</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Birthday chip */}
              <div className="rounded-2xl bg-[#FDEBD9] text-[#B45309] px-4 py-3 flex items-center gap-2 font-semibold">
                <CalendarDays size={18} />
                Birthday in {birthdaySoon} day{birthdaySoon === 1 ? "" : "s"}
              </div>

              {/* Details list */}
              <div className="space-y-4">
                <DetailRow icon={<IdCard size={18} />} label="EMPLOYEE ID" value={selected.id} />
                <DetailRow icon={<Building2 size={18} />} label="DEPARTMENT" value={selected.department} />
                <DetailRow icon={<CalendarDays size={18} />} label="DATE OF BIRTH" value={fmtDateLong(selected.dob)} />
                <DetailRow icon={<CalendarCheck2 size={18} />} label="JOINED" value={fmtDateLong(selected.joined)} />
                <DetailRow icon={<Mail size={18} />} label="EMAIL" value={selected.email} />
                <DetailRow icon={<Phone size={18} />} label="PHONE" value={selected.phone} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- DETAILS ROW ---------------- */
function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <IconBadge>{icon}</IconBadge>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-1 font-semibold text-slate-800 break-words">{value || "-"}</div>
      </div>
    </div>
  );
}
