import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckCheck,
  AlertTriangle,
  FileText,
  Megaphone,
  Calendar,
  Mail,
} from "lucide-react";
import { Badge } from "../shared/ui.jsx";

/* ---------------- DEMO DATA ---------------- */
const seedNotifications = [
  {
    id: 1,
    type: "warning",
    category: "alerts",
    title: "Document Expiry Warning",
    message: "Your passport details are set to expire in 30 days.",
    time: "Today, 10:23 AM",
    unread: true,
    priority: "HIGH PRIORITY",
    route: "/employee-dashboard/profile",
  },
  {
    id: 2,
    type: "action",
    category: "approvals",
    title: "Leave Request #1024",
    message: "Your leave request requires action.",
    time: "Yesterday, 4:15 PM",
    unread: true,
    priority: "ACTION REQUIRED",
    route: "/employee-dashboard/leave",
  },
  {
    id: 3,
    type: "announcement",
    category: "announcements",
    title: "New WFH Policy Update",
    message: "Remote work policy updated effective Nov 1st.",
    time: "Oct 24, 2023",
    unread: false,
    priority: "ANNOUNCEMENT",
    route: "/employee-dashboard/dashboard",
  },
  {
    id: 4,
    type: "info",
    category: "alerts",
    title: "October Payslip Available",
    message: "Your payslip is ready for download.",
    time: "Oct 20, 2023",
    unread: false,
    route: "/employee-dashboard/payroll",
  },
];

/* -------------------------------------------------- */
export default function EmployeeNotifications() {
  const navigate = useNavigate();
  const [list, setList] = useState(seedNotifications);
  const [activeTab, setActiveTab] = useState("alerts");
  const [search, setSearch] = useState("");

  const unreadCount = (cat) =>
    list.filter((n) => n.category === cat && n.unread).length;

  const markAllRead = () => {
    setList((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const openNotification = (item) => {
    setList((prev) =>
      prev.map((n) =>
        n.id === item.id ? { ...n, unread: false } : n
      )
    );
    navigate(item.route);
  };

  const filtered = list.filter(
    (n) =>
      n.category === activeTab &&
      (n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex gap-6">

      {/* LEFT SIDE → NOTIFICATIONS LIST */}
      <div className="flex-1 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
            </h1>
            <p className="text-sm text-slate-500">
              Employee alerts & updates
            </p>
          </div>

          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            className="w-full text-sm outline-none"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              No notifications
            </p>
          )}

          {filtered.map((n) => (
            <NotificationCard
              key={n.id}
              data={n}
              onClick={() => openNotification(n)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT SIDE → CATEGORIES */}
      <div className="w-64 space-y-3">
        <Category
          label="All Alerts"
          count={unreadCount("alerts")}
          active={activeTab === "alerts"}
          onClick={() => setActiveTab("alerts")}
        />
        <Category
          label="Approvals"
          count={unreadCount("approvals")}
          active={activeTab === "approvals"}
          onClick={() => setActiveTab("approvals")}
        />
        <Category
          label="Announcements"
          count={unreadCount("announcements")}
          active={activeTab === "announcements"}
          onClick={() => setActiveTab("announcements")}
        />
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Category({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm ${
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span>{label}</span>
      <span className="rounded-full bg-blue-600 text-white text-xs px-2">
        {count}
      </span>
    </button>
  );
}

function NotificationCard({ data, onClick }) {
  const iconMap = {
    warning: AlertTriangle,
    action: FileText,
    announcement: Megaphone,
    info: Calendar,
  };

  const Icon = iconMap[data.type] || Mail;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border bg-white p-5 flex gap-4 hover:shadow transition ${
        data.unread ? "border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div className="rounded-full bg-slate-100 p-3">
        <Icon size={20} />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">
            {data.title}
          </h3>
          {data.priority && (
            <Badge tone="warning">{data.priority}</Badge>
          )}
        </div>

        <p className="text-sm text-slate-600 mt-1">
          {data.message}
        </p>

        <p className="text-xs text-slate-400 mt-2">
          {data.time}
        </p>
      </div>

      {data.unread && (
        <span className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
      )}
    </div>
  );
}
