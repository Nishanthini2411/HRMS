import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ClipboardCheck, FileText, CalendarDays, LogOut } from "lucide-react";

const Tab = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
        isActive
          ? "bg-purple-700 text-white shadow"
          : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
      }`
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export default function EmployeeLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
              Employee Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Attendance • Leave • Documents
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-4 flex flex-wrap gap-2">
          <Tab to="attendance" icon={ClipboardCheck} label="Attendance" end={false} />
          <Tab to="leave" icon={CalendarDays} label="LeaveManagement" end={false} />
          <Tab to="documents" icon={FileText} label="Documents" end={false} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
