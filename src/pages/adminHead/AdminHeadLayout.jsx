import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckSquare,
  FileSpreadsheet,
  Home,
  Layers,
  Settings,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";

const SideItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
        isActive
          ? "bg-indigo-700 text-white shadow"
          : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
      }`
    }
  >
    <Icon size={18} />
    <span className="truncate">{label}</span>
  </NavLink>
);

const items = [
  { to: "/admin-head", end: true, icon: Home, label: "Master Dashboard" },
  { to: "/admin-head/approvals", icon: CheckSquare, label: "Approvals" },
  { to: "/admin-head/attendance", icon: Activity, label: "Attendance Control" },
  { to: "/admin-head/leave", icon: Layers, label: "Leave Control" },
  { to: "/admin-head/documents", icon: ShieldCheck, label: "Document Control" },
  { to: "/admin-head/payroll", icon: FileSpreadsheet, label: "Payroll Admin" },
  { to: "/admin-head/settings", icon: Settings, label: "System Settings" },
  { to: "/admin-head/reports", icon: BarChart3, label: "Reports" },
  { to: "/admin-head/notifications", icon: Bell, label: "Notifications" },
  { to: "/people", icon: UserRound, label: "Birthday" },
];

export default function AdminHeadLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-[280px] bg-white border-r sticky top-0 h-screen">
        <div className="h-full flex flex-col">
          <div className="p-5 border-b">
            <div className="text-xl font-extrabold text-slate-900">Admin Head</div>
            <div className="text-xs text-slate-500 mt-1">Oversight & Controls</div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {items.map((item) => (
              <SideItem key={item.to} {...item} />
            ))}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={() => navigate("/login")}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black transition"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Admin Head</div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-bold text-slate-900">Control Center</p>
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                <AlertTriangle size={14} /> High-level access
              </span>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
