import { NavLink } from "react-router-dom";
import { Bell, UserRound } from "lucide-react";

const linkClasses = ({ isActive }) =>
  `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
    isActive
      ? "bg-blue-600 text-white shadow"
      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
  }`;

const Navbar = () => {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">HRMS Dashboard</h2>
      <div className="flex items-center gap-3 text-sm">
        <NavLink to="/dashboard/notifications" className={linkClasses}>
          <Bell size={16} />
          Notifications
        </NavLink>
        <NavLink to="/dashboard/profile" className={linkClasses}>
          <UserRound size={16} />
          My Profile
        </NavLink>
        <span className="text-gray-500">Welcome, Admin</span>
        <button className="px-3 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-100">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
