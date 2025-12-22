import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CheckSquare,
  Home,
  LayoutPanelTop,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { getManagerSession } from "./managerApproverData";

const navItems = [
  { to: "/manager-approver-dashboard", end: true, label: "Dashboard", icon: Home },
  { to: "/manager-approver-dashboard/approvals", label: "Leave Approvals", icon: CheckSquare },
  { to: "/manager-approver-dashboard/team", label: "Team Members", icon: Users },
  { to: "/manager-approver-dashboard/payroll", label: "Payroll & Payslips", icon: LayoutPanelTop },
  { to: "/manager-approver-dashboard/notifications", label: "Notifications", icon: Bell },
];

const NavItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
        isActive
          ? "bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          : "text-slate-200 hover:bg-white/10 hover:text-white"
      }`
    }
  >
    <Icon size={18} />
    <span className="truncate">{label}</span>
  </NavLink>
);

export default function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(getManagerSession());

  useEffect(() => {
    if (localStorage.getItem("hrmss.signin.completed.manager") !== "true") {
      navigate("/sign-in", { state: { role: "manager" } });
    }
  }, [navigate]);

  useEffect(() => {
    setSession(getManagerSession());
  }, [location.pathname]);

  useEffect(() => {
    if (session.role && session.role !== "approver") {
      navigate("/manager-dashboard");
    }
  }, [session.role, navigate]);

  const approver = session.role === "approver";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-[280px] bg-gradient-to-b from-slate-900 to-indigo-900 text-white sticky top-0 h-screen">
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-white/10">
            <div className="text-xl font-extrabold">Manager</div>
            <div className="text-xs text-indigo-100/90 mt-1 flex items-center gap-2">
              <Shield size={14} />
              {approver ? "Can approve leaves" : "View-only"}
            </div>
            <div className="mt-2 rounded-xl bg-white/10 p-3 text-sm space-y-1">
              <p className="font-semibold">{session.name}</p>
              <p className="text-indigo-100">{session.email || session.id}</p>
              <p className="text-[11px] uppercase tracking-wide text-indigo-200">Team: {session.team || "—"}</p>
            </div>
          </div>

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => navigate("/login")}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="px-6 py-4 flex flex-col gap-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Manager Portal</div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-bold text-slate-900">Control Center</p>
              <span className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                <BarChart3 size={14} /> Real-time overview
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                Role: {approver ? "Approver" : "Viewer"}
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
