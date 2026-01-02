import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCircle2,
  FileText,
} from "lucide-react";

const DOCS_AUTH_KEY = "HRMSS_DOCS_AUTH";

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

const tabs = [
  { to: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "leave", icon: CalendarDays, label: "Leave" },
  { to: "documents", icon: FileText, label: "Documents" },
  { to: "payslips", icon: FileText, label: "Payslips" },
  { to: "settings", icon: Settings, label: "Settings" },
  // { to: "/employee-dashboard/people", icon: UserRound, label: "People Directory" },
];

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("hrmss.signin.completed.employee") !== "true") {
      navigate("/sign-in", { state: { role: "employee" } });
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(DOCS_AUTH_KEY);
    } catch {}
    localStorage.removeItem(DOCS_AUTH_KEY);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          <div className="p-5 border-b flex items-center justify-between gap-3">
            <div className="text-xl font-extrabold text-gray-900">TWITE HRMS</div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <Menu size={18} />
            </button>
            {/* <div className="text-xs text-gray-500 mt-1">Self Service Workspace</div> */}
          </div>

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {tabs.map((item) => (
              <SideItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                end={item.to === "dashboard"}
              />
            ))}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
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
              <div className="text-sm text-gray-500">Employee Workspace</div>
            </div>
            <div className="flex items-center gap-2">
              <NavLink
                to="notifications"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gray-900 text-white shadow"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Bell size={16} />
                Notifications
              </NavLink>
              <NavLink
                to="profile"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gray-900 text-white shadow"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <UserCircle2 size={16} />
                My Profile
              </NavLink>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
