// src/pages/admin/AdminNotifications.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Check,
  Trash2,
  ShieldCheck,
  Clock3,
  MailOpen,
} from "lucide-react";

/* ===================== CONFIG ===================== */
const ALLOWED_SOURCES = [
  "Employees",
  "Attendance",
  "LeaveManagement",
  "Payroll",
  "Documents",
  "My Profile",
  "Birthday",
];

const SOURCE_ROUTE = {
  Employees: "/admin/employees",
  Attendance: "/admin/attendance",
  LeaveManagement: "/admin/leave",
  Payroll: "/admin/payroll",
  Documents: "/admin/documents",
  "My Profile": "/admin/profile",
  Birthday: "/admin/birthday",
};

const tone = {
  success: {
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: "text-emerald-600",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/60",
  },
  warning: {
    pill: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: "text-amber-600",
    border: "border-amber-100",
    dot: "bg-amber-500",
    bg: "bg-amber-50/60",
  },
  info: {
    pill: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: "text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-500",
    bg: "bg-blue-50/60",
  },
};

const typeIcon = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const seed = [
  {
    id: "NTF-1001",
    title: "New employee added",
    detail: "EMP-014 (Anita) added to Engineering department.",
    type: "info",
    time: "Just now",
    source: "Employees",
    unread: true,
  },
  {
    id: "NTF-1002",
    title: "Attendance correction request",
    detail: "EMP-002 requested correction for 2025-12-16 (Missing punch).",
    type: "warning",
    time: "15m ago",
    source: "Attendance",
    unread: true,
  },
  {
    id: "NTF-1003",
    title: "Leave request approved",
    detail: "EMP-001 leave approved for 2025-12-18 to 2025-12-19.",
    type: "success",
    time: "Today, 10:00 AM",
    source: "LeaveManagement",
    unread: false,
  },
  {
    id: "NTF-1004",
    title: "Payroll batch completed",
    detail: "December salaries processed successfully.",
    type: "success",
    time: "Today, 9:05 AM",
    source: "Payroll",
    unread: true,
  },
  {
    id: "NTF-1005",
    title: "Document expiry alert",
    detail: "EMP-006 ID proof expires in 7 days. Please update.",
    type: "warning",
    time: "Yesterday",
    source: "Documents",
    unread: false,
  },
  {
    id: "NTF-1006",
    title: "Profile update pending",
    detail: "EMP-003 updated bank details — review required.",
    type: "info",
    time: "Yesterday",
    source: "My Profile",
    unread: true,
  },
  {
    id: "NTF-1007",
    title: "Upcoming birthday",
    detail: "Kavin Raj’s birthday is in 3 days — schedule announcement.",
    type: "info",
    time: "2d ago",
    source: "Birthday",
    unread: false,
  },
];

/* ===================== HELPERS ===================== */
function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border transition",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 rounded-2xl border bg-slate-50 grid place-items-center">
        <Bell className="text-slate-700" size={20} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">No notifications</p>
      <p className="mt-1 text-xs text-slate-500">Try changing filters or search.</p>
    </div>
  );
}

/** ✅ Stat cards unchanged (original) */
function StatCard({ icon: Icon, label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-3xl border p-4 shadow-sm transition",
        active
          ? "bg-white/15 border-white/25 ring-2 ring-white/20"
          : "bg-white/10 border-white/15 hover:bg-white/15"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-11 w-11 rounded-2xl grid place-items-center border",
            active ? "bg-white/10 border-white/20" : "bg-white/10 border-white/15"
          )}
        >
          <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-white/70">{label}</p>
          <p className="text-lg font-bold leading-tight text-white">{value}</p>
        </div>
      </div>
    </button>
  );
}

/* ===================== ROW (original) ===================== */
function NotificationRow({
  n,
  selected,
  onToggleSelect,
  onMarkRead,
  onDelete,
  onGoToSource,
}) {
  const Icon = typeIcon[n.type] ?? Info;
  const t = tone[n.type] ?? tone.info;

  return (
    <div
      className={cn(
        "group rounded-3xl border bg-white p-4 shadow-sm transition",
        selected ? "ring-2 ring-slate-900/10" : "hover:shadow-md",
        n.unread ? "border-slate-200" : "border-slate-100"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleSelect}
          className={cn(
            "mt-1 h-5 w-5 rounded-md border grid place-items-center",
            selected ? "bg-slate-900 border-slate-900" : "bg-white"
          )}
          title="Select"
        >
          {selected ? <Check size={14} className="text-white" /> : null}
        </button>

        <div className={cn("mt-1 h-10 w-10 rounded-2xl border grid place-items-center", t.bg, t.border)}>
          <Icon size={18} className={t.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[11px] font-semibold rounded-full px-3 py-1 ring-1", t.pill)}>
                  {n.type.toUpperCase()}
                </span>

                <span className="text-[11px] text-slate-500 rounded-full border px-2.5 py-1">
                  {n.source}
                </span>

                {n.unread ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                    <span className={cn("h-2 w-2 rounded-full", t.dot)} />
                    Unread
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Read</span>
                )}
              </div>

              <p className="mt-2 text-sm font-bold text-slate-900">{n.title}</p>
              <p className="mt-1 text-sm text-slate-600">{n.detail}</p>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck size={14} />
                Admin Notifications
                <span className="mx-1 text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={12} />
                  {n.time}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToSource}
                  className="text-[11px] font-semibold rounded-full border px-3 py-1 hover:bg-slate-50"
                  title={`Go to ${n.source}`}
                >
                  Go to {n.source}
                </button>

                {n.unread ? (
                  <button
                    onClick={onMarkRead}
                    className="text-[11px] font-semibold rounded-full border px-3 py-1 hover:bg-slate-50 inline-flex items-center gap-1"
                    title="Mark as read"
                  >
                    <MailOpen size={12} />
                    Mark read
                  </button>
                ) : null}

                <button
                  onClick={onDelete}
                  className="text-[11px] font-semibold rounded-full border px-3 py-1 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== PAGE ===================== */
export default function AdminNotifications() {
  const navigate = useNavigate();

  const initial = useMemo(() => seed.filter((x) => ALLOWED_SOURCES.includes(x.source)), []);
  const [items, setItems] = useState(initial);

  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [source, setSource] = useState("All");
  const [status, setStatus] = useState("All");

  const [selected, setSelected] = useState(() => new Set());

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((n) => ALLOWED_SOURCES.includes(n.source))
      .filter((n) => {
        const typeOk = type === "All" ? true : n.type === type;
        const sourceOk = source === "All" ? true : n.source === source;
        const statusOk =
          status === "All"
            ? true
            : status === "Unread"
            ? n.unread === true
            : n.unread === false;

        const text = `${n.title} ${n.detail} ${n.source} ${n.time}`.toLowerCase();
        const qOk = !query ? true : text.includes(query);

        return typeOk && sourceOk && statusOk && qOk;
      });
  }, [items, q, type, source, status]);

  const counts = useMemo(() => {
    const allowed = items.filter((x) => ALLOWED_SOURCES.includes(x.source));
    const total = allowed.length;
    const unread = allowed.filter((x) => x.unread).length;
    const read = allowed.filter((x) => !x.unread).length;
    const success = allowed.filter((x) => x.type === "success").length;
    const warning = allowed.filter((x) => x.type === "warning").length;
    const info = allowed.filter((x) => x.type === "info").length;
    return { total, unread, read, success, warning, info };
  }, [items]);

  const selectedCount = selected.size;

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());
  const selectAllFiltered = () => setSelected(() => new Set(filtered.map((x) => x.id)));

  const markRead = (ids) => {
    if (!ids?.length) return;
    setItems((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, unread: false } : x)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const remove = (ids) => {
    if (!ids?.length) return;
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const goToSource = (n) => {
    const route = n.route || SOURCE_ROUTE[n.source] || "/admin";
    navigate(route, { state: { fromNotification: n, notifId: n.id } });
  };

  return (
    <div className="space-y-6">
      {/* ✅ HEADER BIG CARD color changed to image color */}
 <div className="rounded-3xl border bg-[#464975] text-white p-6 shadow-sm relative overflow-hidden">        {/* subtle glow like your sample */}
        <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/85">Admin Console</p>
            <h1 className="text-2xl font-bold mt-1">Notifications</h1>
            <p className="text-sm text-white/85 mt-1">
              Shows only: Employees, Attendance, LeaveManagement, Payroll, Documents, My Profile, Birthday.
            </p>
          </div>
        </div>

        {/* ✅ 3 stat cards unchanged */}
        <div className="relative mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            icon={Bell}
            label="Total"
            value={counts.total}
            active={status === "All"}
            onClick={() => setStatus("All")}
          />
          <StatCard
            icon={AlertTriangle}
            label="Unread"
            value={counts.unread}
            active={status === "Unread"}
            onClick={() => setStatus("Unread")}
          />
          <StatCard
            icon={ShieldCheck}
            label="Read"
            value={counts.read}
            active={status === "Read"}
            onClick={() => setStatus("Read")}
          />
        </div>
      </div>

      {/* CONTROLS + LIST */}
      <div className="space-y-4">
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search notifications (title, detail, source, time...)"
                  className="w-full rounded-2xl border bg-slate-50 pl-9 pr-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Filter size={16} className="text-slate-500" />
                <span className="text-xs text-slate-500">Filters</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip active={type === "All"} onClick={() => setType("All")}>
                All ({counts.total})
              </Chip>
              <Chip active={type === "success"} onClick={() => setType("success")}>
                Success ({counts.success})
              </Chip>
              <Chip active={type === "warning"} onClick={() => setType("warning")}>
                Warning ({counts.warning})
              </Chip>
              <Chip active={type === "info"} onClick={() => setType("info")}>
                Info ({counts.info})
              </Chip>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip active={source === "All"} onClick={() => setSource("All")}>
              All Modules
            </Chip>
            {ALLOWED_SOURCES.map((s) => (
              <Chip key={s} active={source === s} onClick={() => setSource(s)}>
                {s}
              </Chip>
            ))}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(() => new Set(filtered.map((x) => x.id)))}
                className="text-xs font-semibold rounded-full border px-3 py-1.5 hover:bg-slate-50"
              >
                Select all (filtered)
              </button>
              <button
                onClick={clearSelection}
                className="text-xs font-semibold rounded-full border px-3 py-1.5 hover:bg-slate-50"
              >
                Clear
              </button>
              {selectedCount > 0 ? (
                <span className="text-xs text-slate-500">{selectedCount} selected</span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={selectedCount === 0}
                onClick={() => markRead([...selected])}
                className={cn(
                  "text-xs font-semibold rounded-full border px-3 py-1.5",
                  selectedCount === 0
                    ? "text-slate-400 bg-slate-50 cursor-not-allowed"
                    : "hover:bg-slate-50"
                )}
              >
                Mark read
              </button>
              <button
                disabled={selectedCount === 0}
                onClick={() => remove([...selected])}
                className={cn(
                  "text-xs font-semibold rounded-full border px-3 py-1.5 inline-flex items-center gap-2",
                  selectedCount === 0
                    ? "text-slate-400 bg-slate-50 cursor-not-allowed"
                    : "hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                )}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                selected={selected.has(n.id)}
                onToggleSelect={() => toggleSelect(n.id)}
                onMarkRead={() => markRead([n.id])}
                onDelete={() => remove([n.id])}
                onGoToSource={() => goToSource(n)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
