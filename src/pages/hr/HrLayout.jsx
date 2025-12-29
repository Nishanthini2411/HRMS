import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ClipboardList, LogOut, UserRound, Bell, WalletCards, FileText, Menu } from "lucide-react";

const SideItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
        isActive
          ? "bg-purple-700 text-white shadow"
          : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
      }`
    }
  >
    <Icon size={18} />
    <span className="truncate">{label}</span>
  </NavLink>
);

export default function HrLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("hrmss.signin.completed.hr") !== "true") {
      navigate("/sign-in", { state: { role: "hr" } });
    }
  }, [navigate]);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside
        className={`bg-white border-r sticky top-0 h-screen overflow-hidden transition-all duration-200 ${
          isSidebarOpen ? "w-[280px]" : "w-0 border-r-0"
        }`}
      >
        <div
          className={`h-full flex flex-col transition-opacity duration-200 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Brand */}
          <div className="p-5 border-b flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold text-gray-900">TWITE HRMS</div>
              <div className="text-xs text-gray-500 mt-1">
                Human Resource Management System
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            <SideItem to="/hr-dashboard" end icon={LayoutDashboard} label="Dashboard" />
            <SideItem to="/hr-dashboard/leave" icon={CalendarDays} label="Leave Management" />
            <SideItem to="/hr-dashboard/attendance" icon={ClipboardList} label="Attendance" />
            <SideItem to="/hr-dashboard/payroll" icon={WalletCards} label="Payroll" />
            <SideItem to="/hr-dashboard/payslips" icon={FileText} label="Payslips" />
            <SideItem to="/hr-dashboard/documents" icon={FileText} label="Documents" />
            <SideItem to="/hr-dashboard/people" icon={UserRound} label="Birthday" />
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* Optional: top bar in content area */}
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <Menu size={18} />
              </button>
              <div className="text-sm text-gray-500">HR Dashboard</div>
            </div>
            <div className="flex items-center gap-2">
              <NavLink
                to="/hr-dashboard/notifications"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-purple-700 text-white shadow"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  }`
                }
              >
                <Bell size={16} />
                Notifications
              </NavLink>
              <NavLink
                to="/hr-dashboard/profile"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-purple-700 text-white shadow"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  }`
                }
              >
                <UserRound size={16} />
                My Profile
              </NavLink>
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
