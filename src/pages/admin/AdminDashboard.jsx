import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CalendarDays, ClipboardList, Wallet, Clock3, ArrowRight, X } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // ✅ counts change
  const totalEmployees = 5; // was 120
  const presentToday = 6; // was 98
  const pendingLeaveRequests = 4;
  const payrollPending = 3;

  // ✅ keep same flow, just clamp % so UI won't break when present > total
  const presentPercentage = Math.min(100, Math.round((presentToday / totalEmployees) * 100));

  // ✅ demo lists for modal (5 employees, 6 present, etc.)
  const employeesList = useMemo(
    () => [
      { id: "EMP-001", name: "Priya Sharma", role: "HR Executive", department: "HR", status: "Active" },
      { id: "EMP-002", name: "Kavin Raj", role: "Sales Executive", department: "Sales", status: "Active" },
      { id: "EMP-003", name: "Anjali Perera", role: "Accountant", department: "Accounts", status: "Active" },
      { id: "EMP-004", name: "Nila Devi", role: "Developer", department: "IT", status: "Active" },
      { id: "EMP-005", name: "Ajith Kumar", role: "Support Officer", department: "Support", status: "Inactive" },
    ],
    []
  );

  const presentList = useMemo(
    () => [
      { id: "EMP-010", name: "Sahan Fernando", role: "Designer", department: "Creative", status: "Present" },
      { id: "EMP-011", name: "Maha Lakshmi", role: "QA Engineer", department: "IT", status: "Present" },
      { id: "EMP-012", name: "Kumaravel", role: "DevOps", department: "IT", status: "Present" },
      { id: "EMP-013", name: "Shalini", role: "HR Assistant", department: "HR", status: "Present" },
      { id: "EMP-014", name: "Ramesh", role: "Sales Rep", department: "Sales", status: "Present" },
      { id: "EMP-015", name: "Tharushi", role: "Account Trainee", department: "Accounts", status: "Present" },
    ],
    []
  );

  const leaveRequestsList = useMemo(
    () => [
      { reqId: "LR-3001", id: "EMP-021", name: "Ishan", role: "Engineer", department: "IT", status: "Pending" },
      { reqId: "LR-3002", id: "EMP-022", name: "Nivetha", role: "HR", department: "HR", status: "Pending" },
      { reqId: "LR-3003", id: "EMP-023", name: "Arjun", role: "Sales", department: "Sales", status: "Pending" },
      { reqId: "LR-3004", id: "EMP-024", name: "Meera", role: "Accountant", department: "Accounts", status: "Pending" },
    ],
    []
  );

  const payrollPendingList = useMemo(
    () => [
      { id: "EMP-031", name: "Siva", role: "Engineer", department: "IT", status: "Payroll Pending" },
      { id: "EMP-032", name: "Divya", role: "HR Exec", department: "HR", status: "Payroll Pending" },
      { id: "EMP-033", name: "Nuwan", role: "Sales", department: "Sales", status: "Payroll Pending" },
    ],
    []
  );

  // ✅ attendance summary (kept same flow)
  const attendanceSummary = useMemo(
    () => [
      { label: "Present", value: presentToday, color: "bg-emerald-500" },
      { label: "Absent", value: Math.max(0, totalEmployees - presentToday), color: "bg-rose-500" },
      { label: "On Leave", value: 0, color: "bg-amber-500" },
    ],
    [presentToday, totalEmployees]
  );

  const pendingLeaves = useMemo(
    () => [
      { reqId: "LR-2001", name: "Priya Sharma", type: "Casual Leave", days: 2, status: "Waiting for HR" },
      { reqId: "LR-2002", name: "Kavin Raj", type: "Sick Leave", days: 1, status: "Waiting for Manager" },
      { reqId: "LR-2003", name: "Anjali Perera", type: "Annual Leave", days: 5, status: "Waiting for HR" },
    ],
    []
  );

  const notifications = useMemo(
    () => [
      { id: "NT-1", type: "Leave", text: "3 new leave requests received today.", time: "10 mins ago" },
      { id: "NT-2", type: "Attendance", text: "5 employees haven't marked attendance.", time: "30 mins ago" },
      { id: "NT-3", type: "Payroll", text: "Payroll run scheduled for 25th.", time: "2 hours ago" },
      { id: "NT-4", type: "Reminder", text: "Update bank details for new employees.", time: "Yesterday" },
    ],
    []
  );

  const quickActions = [
    { label: "Add Employee", description: "Create a new employee record", path: "/dashboard/employees" },
    { label: "Approve Leaves", description: "Review pending leave requests", path: "/dashboard/leave" },
    { label: "Generate Payroll", description: "Run monthly payroll", path: "/dashboard/payroll" },
    { label: "View Attendance", description: "Check daily attendance report", path: "/dashboard/attendance" },
  ];

  const statCards = [
    {
      id: "employees",
      title: "Total Employees",
      value: totalEmployees, // ✅ 5
      subtitle: "Active",
      gradient: "from-indigo-500 via-indigo-400 to-sky-400",
      icon: Users,
    },
    {
      id: "present",
      title: "Present Today",
      value: presentToday, // ✅ 6
      subtitle: "Attendance marked",
      gradient: "from-emerald-500 via-emerald-400 to-teal-400",
      icon: CalendarDays,
    },
    {
      id: "leave",
      title: "Pending Leave",
      value: pendingLeaveRequests,
      subtitle: "Awaiting approval",
      gradient: "from-amber-500 via-orange-400 to-yellow-400",
      icon: ClipboardList,
    },
    {
      id: "payroll",
      title: "Payroll Pending",
      value: payrollPending,
      subtitle: "This month",
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
      icon: Wallet,
    },
  ];

  // ✅ small view modal (for ALL clicks)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState("");
  const [viewType, setViewType] = useState(""); // "people" | "leaves" | "notifications"
  const [viewRows, setViewRows] = useState([]);

  const openView = (title, type, rows) => {
    setViewTitle(title);
    setViewType(type);
    setViewRows(rows);
    setViewOpen(true);
  };

  const onStatClick = (cardId) => {
    if (cardId === "employees") {
      openView("Employees (5)", "people", employeesList);
      return;
    }
    if (cardId === "present") {
      openView("Present Today (6)", "people", presentList);
      return;
    }
    if (cardId === "leave") {
      openView("Pending Leave (4)", "leaves", leaveRequestsList);
      return;
    }
    if (cardId === "payroll") {
      openView("Payroll Pending (3)", "people", payrollPendingList);
      return;
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <header className="mb-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400 p-5 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ stat cards click -> small aligned modal */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        {statCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onStatClick(card.id)}
            className={`text-left rounded-xl bg-gradient-to-r ${card.gradient} text-white p-3 shadow-md hover:-translate-y-1 hover:shadow-lg transition`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/80">{card.subtitle}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{card.value}</span>
                  <span className="text-xs text-white/80">{card.title}</span>
                </div>
              </div>
              {card.icon ? <card.icon size={18} /> : null}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Attendance */}
          <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Monthly Attendance Summary</h2>
                <p className="text-xs text-slate-500">Overview of employee attendance for the current month.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Present {presentPercentage}%
              </span>
            </div>

            <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${presentPercentage}%` }} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              {attendanceSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-white to-slate-50 px-3 py-2 ring-1 ring-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Leaves (click -> small aligned modal) */}
          <div
            className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100 cursor-pointer"
            onClick={() => openView("Pending Leave Approvals", "leaves", pendingLeaves)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openView("Pending Leave Approvals", "leaves", pendingLeaves)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Pending Leave Approvals</h2>
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                onClick={(e) => {
                  e.stopPropagation();
                  openView("Pending Leave Approvals", "leaves", pendingLeaves);
                }}
              >
                View all
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {pendingLeaves.map((leave) => (
                <button
                  key={leave.reqId}
                  type="button"
                  className="w-full text-left flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 hover:bg-indigo-50 hover:ring-indigo-200 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    openView(`Leave Request • ${leave.reqId}`, "leaves", [leave]);
                  }}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{leave.name}</p>
                    <p className="text-xs text-slate-500">
                      {leave.type} - {leave.days} day(s)
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">{leave.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Recent Notifications (click -> small aligned modal) */}
          <div
            className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100 cursor-pointer"
            onClick={() => openView("Recent Notifications", "notifications", notifications)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openView("Recent Notifications", "notifications", notifications)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Notifications</h2>
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                onClick={(e) => {
                  e.stopPropagation();
                  openView("Recent Notifications", "notifications", notifications);
                }}
              >
                View all
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {notifications.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="w-full text-left rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 hover:bg-indigo-50 hover:ring-indigo-200 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    openView(`Notification • ${note.type}`, "notifications", [note]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{note.type}</span>
                    <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                      <Clock3 size={12} /> {note.time}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{note.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions (unchanged) */}
          <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick Actions</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-indigo-500 hover:bg-indigo-50 transition"
                  onClick={() => navigate(action.path)}
                >
                  <span className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-900">
                    {action.label}
                    <ArrowRight size={14} className="text-slate-400" />
                  </span>
                  <span className="text-[11px] text-slate-500">{action.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SMALL, GOOD ALIGN VIEW CARD (modal) */}
      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setViewOpen(false)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <h3 className="text-sm font-semibold text-slate-900">{viewTitle}</h3>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 max-h-[70vh] overflow-auto space-y-2">
              {viewType === "people" &&
                viewRows.map((p, idx) => (
                  <div key={p.id || idx} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      ID: <span className="font-medium text-slate-700">{p.id}</span> • {p.role} • {p.department}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{p.status}</p>
                  </div>
                ))}

              {viewType === "leaves" &&
                viewRows.map((l, idx) => (
                  <div key={l.reqId || idx} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{l.name}</p>
                        <p className="text-xs text-slate-500">
                          {l.reqId ? `Req: ${l.reqId} • ` : ""}
                          {l.type ? `${l.type} • ` : ""}
                          {typeof l.days === "number" ? `${l.days} day(s)` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                        {l.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}

              {viewType === "notifications" &&
                viewRows.map((n) => (
                  <div key={n.id} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{n.type}</span>
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <Clock3 size={12} /> {n.time}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{n.text}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
