import { useEffect, useMemo, useState } from "react";
import { MapPin, ShieldCheck, Users } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const EMP_TABLE = "hrmss_profiles";
const LEAVE_TABLE = "hrmss_leave_requests";

const safeText = (v) => (v == null ? "" : String(v));
const pick = (row, keys, fallback = "") => {
  for (const k of keys) {
    if (row && row[k] != null && String(row[k]).trim() !== "") return row[k];
  }
  return fallback;
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const formatRange = (from, to) => {
  if (!from && !to) return "-";
  if (!to || to === from) return formatDate(from);
  return `${formatDate(from)} - ${formatDate(to)}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const isActiveLeave = (leave) => {
  const status = safeText(leave.status).toLowerCase();
  const approved =
    status === "approved" || status === "on leave" || status.startsWith("approved");
  if (!approved) return false;

  const from = leave.from_date || leave.fromDate;
  const to = leave.to_date || leave.toDate || leave.from_date || leave.fromDate;
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= fromDate && today <= toDate;
};

const normalizeEmployee = (row) => {
  return {
    id: safeText(pick(row, ["employee_id", "user_id", "id"], "")),
    name: safeText(pick(row, ["full_name", "name"], "Unknown")),
    role: safeText(pick(row, ["designation", "job_title", "role", "position"], "-")),
    location: safeText(pick(row, ["work_location", "location", "current_address"], "-")),
  };
};

const normalizeLeave = (row) => {
  const from = pick(row, ["from_date", "from"], "");
  const to = pick(row, ["to_date", "to"], "");
  const dates = pick(row, ["leave_dates", "dates"], "");
  const leaveDates = dates || formatRange(from, to);

  return {
    employeeId: safeText(pick(row, ["employee_id", "owner_id", "emp_id"], "")),
    type: safeText(pick(row, ["leave_type", "type"], "-")),
    dates: safeText(leaveDates || "-"),
    status: safeText(pick(row, ["status"], "Pending")),
    from_date: from,
    to_date: to,
  };
};

export default function ManagerTeam() {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTeam = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: empRows, error: empErr } = await supabase
        .from(EMP_TABLE)
        .select("*")
        .order("full_name", { ascending: true });

      if (empErr) throw new Error(`Employees load failed: ${empErr.message}`);
      setEmployees((empRows || []).map(normalizeEmployee));

      const { data: leaveRows, error: leaveErr } = await supabase
        .from(LEAVE_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (leaveErr) {
        setLeaveRequests([]);
      } else {
        setLeaveRequests((leaveRows || []).map(normalizeLeave));
      }
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamMembers = useMemo(() => {
    const activeLeaveMap = new Map();

    for (const leave of leaveRequests) {
      if (!leave.employeeId || activeLeaveMap.has(leave.employeeId)) continue;
      if (isActiveLeave(leave)) activeLeaveMap.set(leave.employeeId, leave);
    }

    return employees.map((e) => {
      const activeLeave = activeLeaveMap.get(e.id);
      return {
        id: e.id,
        name: e.name,
        role: e.role,
        status: activeLeave ? "On Leave" : "Available",
        leaveType: activeLeave?.type || "",
        leaveDates: activeLeave?.dates || "",
        location: e.location,
      };
    });
  }, [employees, leaveRequests]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
        </div>
        <p className="text-sm text-slate-600">
          Live view of your squad with leave status. Approval actions stay in the approvals page; here you get a
          quick roster with locations.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading team...
        </div>
      ) : errorMsg ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-rose-600 shadow-sm">
          {errorMsg}
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          No team members found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
          {teamMembers.map((member) => (
            <div key={member.id} className="rounded-2xl border p-4 bg-white shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                  <p className="text-[11px] text-slate-500 mt-1">ID: {member.id}</p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                    member.status === "On Leave"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {member.status}
                </span>
              </div>

              {member.status === "On Leave" && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold">{member.leaveType}</div>
                  <div>{member.leaveDates}</div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin size={14} />
                {member.location}
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <ShieldCheck size={14} /> Payroll / payslip: view only
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
