import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const TABLE = "hrmss_notifications";
const ALLOWED_SOURCES = [
  "Employees",
  "Attendance",
  "LeaveManagement",
  "Payroll",
  "Documents",
  "My Profile",
  "Birthday",
];
const AUDIENCE = ["admin_head", "admin", "all"];

const formatTimeLabel = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export default function AdminHeadNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from(TABLE)
      .select("id,title,detail,type,source,created_at")
      .in("source", ALLOWED_SOURCES)
      .in("audience", AUDIENCE)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notifications fetch error:", error);
      setItems([]);
      setErrorMsg(error.message || "Failed to load notifications");
    } else {
      const mapped = (data || []).map((n) => ({
        id: n.id,
        title: n.title || n.source || "Notification",
        detail: n.detail || "",
        timeLabel: formatTimeLabel(n.created_at),
        source: n.source || "-",
        type: n.type || "info",
      }));
      setItems(mapped);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">Monitor approval alerts, attendance issues, compliance failures, and escalations.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent</h3>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
              Loading notifications...
            </div>
          ) : errorMsg ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-rose-600 shadow-sm">
              {errorMsg}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
              No notifications found.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <span className="text-[11px] text-slate-500 rounded-full border px-2.5 py-0.5">
                      {item.source}
                    </span>
                  </div>
                  {item.detail ? <p className="text-sm text-slate-600">{item.detail}</p> : null}
                  <p className="text-xs text-slate-400 mt-1">{item.timeLabel}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
