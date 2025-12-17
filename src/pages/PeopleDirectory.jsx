import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Mail,
  Phone,
  UserRound,
  Gift,
  Search,
} from "lucide-react";

/* ---------------- DATA ---------------- */
const employees = [
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
    id: "EMP-002",
    name: "Rohan Verma",
    position: "Engineering Manager",
    department: "Engineering",
    dob: "1990-12-21",
    joined: "2019-03-02",
    email: "rohan.verma@example.com",
    phone: "+91 98200 12345",
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
];

/* ---------------- HELPERS ---------------- */
function daysUntilBirthday(dob) {
  const today = new Date();
  const birth = new Date(dob);
  const target = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function Avatar({ name }) {
  return (
    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">
      {name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

/* ---------------- MAIN ---------------- */
export default function PeopleDirectory() {
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return employees
      .map((e) => ({ ...e, days: daysUntilBirthday(e.dob) }))
      .filter((e) =>
        `${e.name} ${e.department}`.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => a.days - b.days || a.name.localeCompare(b.name));
  }, [query]);

  const [selected, setSelected] = useState(() => list[0]);

  useEffect(() => {
    if (!list.length) return;
    const stillVisible = selected && list.find((e) => e.id === selected.id);
    if (!stillVisible) {
      setSelected(list[0]);
    }
  }, [list, selected]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">People Directory</h1>
            <p className="text-sm text-slate-500">
              Company-wide employee directory (HR / Admin / Employee)
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Gift size={14} /> Birthday alerts (7 days)
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT – LIST */}
          <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm">
            <div className="p-4 border-b flex items-center gap-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employee..."
                className="w-full text-sm outline-none"
              />
            </div>

            <div className="divide-y">
              {list.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelected(emp)}
                  className={`w-full text-left p-4 flex items-center gap-4 hover:bg-slate-50 transition ${
                    emp.days <= 7 ? "bg-amber-50/40" : ""
                  }`}
                >
                  <Avatar name={emp.name} />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {emp.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {emp.position} · {emp.department}
                    </div>
                  </div>
                  {emp.days <= 7 && (
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <Gift size={14} /> {emp.days}d
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT – PROFILE */}
          <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} />
              <div>
                <h3 className="font-bold text-lg">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.position}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <Info icon={UserRound} label="Employee ID" value={selected.id} />
              <Info icon={CalendarDays} label="Date of Birth" value={selected.dob} />
              <Info icon={Mail} label="Email" value={selected.email} />
              <Info icon={Phone} label="Phone" value={selected.phone} />
            </div>

            {daysUntilBirthday(selected.dob) <= 7 && (
              <div className="rounded-xl bg-amber-50 text-amber-800 px-3 py-2 text-sm font-semibold flex items-center gap-2">
                <Gift size={16} />
                Birthday in {daysUntilBirthday(selected.dob)} day(s)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */
function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-slate-400" />
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-medium text-slate-800">{value}</div>
      </div>
    </div>
  );
}
