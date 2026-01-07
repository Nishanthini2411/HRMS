import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

import { useEmployeeDashboard } from "./shared/employeeStore";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  Badge,
  SectionCard,
  PrimaryButton,
  GhostButton,
  Modal,
} from "./shared/ui.jsx";

const toneChip = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Cancelled: "neutral",
};

const AUTH_KEY = "HRMSS_AUTH_SESSION";
const PROFILE_CACHE_PREFIX = "hrmss.profile.cache.employee.";
const EMPLOYEE_TABLE = "hrmss_employees";
const EMPLOYEE_PROFILE_TABLE = "hrmss_employee_profiles";
const LEAVES_TABLE = "hrmss_leave_requests";

const absenceGroups = [
  {
    id: "casual",
    title: "Casual Leave",
    items: [
      { type: "Casual Leave", code: "CL", deduction: "1" },
      { type: "Casual Leave (morning)", code: "C1", deduction: "0.5" },
      { type: "Casual Leave (afternoon)", code: "C2", deduction: "0.5" },
    ],
  },
  {
    id: "sick",
    title: "Sick Leave",
    items: [
      { type: "Sick Leave", code: "S", deduction: "1" },
      { type: "Sick Leave1 (morning)", code: "S1", deduction: "0.5" },
      { type: "Sick Leave2 (afternoon)", code: "S2", deduction: "0.5" },
    ],
  },
  {
    id: "other",
    title: "Other Absence Types",
    items: [
      { type: "Maternity/Paternity", code: "MP", deduction: "1" },
      { type: "Paid Leave", code: "PL", deduction: "1" },
      { type: "Work from home", code: "WFH", deduction: "1" },
      { type: "Holidays", code: "H", deduction: "1" },
      { type: "Permissions", code: "PER", deduction: "0.5" },
      { type: "Special Leave", code: "SP", deduction: "1" },
      { type: "Bereavement Leave", code: "BER", deduction: "1" },
    ],
  },
];

function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readEmployeeIdFromAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  const session = safeJsonParse(raw);
  return String(
    session?.employee_id || session?.identifier || session?.id || ""
  ).trim();
}

function readCachedEmployeeProfile(empId) {
  if (!empId) return null;
  return safeJsonParse(
    localStorage.getItem(`${PROFILE_CACHE_PREFIX}${empId}`)
  );
}

function calcLeaveDays(from, to) {
  if (!from || !to) return 1;
  const f = new Date(from);
  const t = new Date(to);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return 1;
  const diff = Math.round((t - f) / 86400000) + 1;
  return diff > 0 ? diff : 1;
}

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { view, actions, activeAction } = useEmployeeDashboard();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  const recentLeaves = useMemo(
    () => (leaveRequests || []).slice(0, 4),
    [leaveRequests]
  );

  const [employeeInfo, setEmployeeInfo] = useState({
    id: "",
    name: "",
    role: "",
    dept: "",
  });

  const [selectedAbsenceGroup, setSelectedAbsenceGroup] = useState(null);

  const openApplyLeave = () => {
    navigate("/employee-dashboard/leave");
  };

  const handleCancelLeave = async (leaveId) => {
    const empId = readEmployeeIdFromAuth();
    if (!leaveId || !empId || !isSupabaseConfigured) return;

    setLeaveError("");

    const { error: cancelErr } = await supabase
      .from(LEAVES_TABLE)
      .update({ status: "Cancelled" })
      .eq("id", leaveId)
      .eq("owner_role", "employee")
      .eq("owner_id", empId);

    if (cancelErr) {
      setLeaveError(cancelErr.message || "Failed to cancel leave");
      return;
    }

    setLeaveRequests((prev) =>
      (prev || []).map((req) =>
        req.id === leaveId ? { ...req, status: "Cancelled" } : req
      )
    );
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const empId = readEmployeeIdFromAuth();
      const cached = readCachedEmployeeProfile(empId);

      if (!empId) {
        if (cached?.fullName || cached?.employeeId) {
          setEmployeeInfo((prev) => ({
            ...prev,
            name: cached.fullName || "",
            id: cached.employeeId || "",
          }));
        }
        return;
      }

      if (!isSupabaseConfigured) {
        setEmployeeInfo((prev) => ({
          ...prev,
          name: cached?.fullName || prev.name || "",
          id: cached?.employeeId || empId,
        }));
        return;
      }

      try {
        const [empRes, profileRes] = await Promise.all([
          supabase
            .from(EMPLOYEE_TABLE)
            .select("employee_id, full_name, role, department")
            .eq("employee_id", empId)
            .maybeSingle(),
          supabase
            .from(EMPLOYEE_PROFILE_TABLE)
            .select("employee_id, full_name, location")
            .eq("employee_id", empId)
            .maybeSingle(),
        ]);

        if (!mounted) return;

        const empRow = empRes?.data || null;
        const profileRow = profileRes?.data || null;

        setEmployeeInfo({
          name:
            empRow?.full_name ||
            profileRow?.full_name ||
            cached?.fullName ||
            "",
          id: empRow?.employee_id || profileRow?.employee_id || empId || "",
          role: empRow?.role || "",
          dept: empRow?.department || profileRow?.location || "",
        });
      } catch {
        if (!mounted) return;
        setEmployeeInfo((prev) => ({
          ...prev,
          name: cached?.fullName || prev.name || "",
          id: cached?.employeeId || empId,
        }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const empId = readEmployeeIdFromAuth();
      if (!empId || !isSupabaseConfigured) {
        if (mounted) setLeaveRequests([]);
        return;
      }

      try {
        setLeaveLoading(true);
        setLeaveError("");

        const { data: rows, error: fetchErr } = await supabase
          .from(LEAVES_TABLE)
          .select(
            "id, leave_type, from_date, to_date, status, reason, applied_at"
          )
          .eq("owner_role", "employee")
          .eq("owner_id", empId)
          .order("applied_at", { ascending: false });

        if (fetchErr) throw fetchErr;
        if (!mounted) return;

        const mapped = (rows || []).map((row) => {
          const from = row.from_date ? String(row.from_date) : "";
          const to = row.to_date ? String(row.to_date) : from;
          return {
            id: row.id,
            type: row.leave_type || "-",
            from,
            to,
            days: calcLeaveDays(from, to),
            status: row.status || "Pending",
            reason: row.reason || "-",
          };
        });

        setLeaveRequests(mapped);
      } catch (fetchError) {
        if (!mounted) return;
        setLeaveError(fetchError?.message || "Failed to load leave data");
        setLeaveRequests([]);
      } finally {
        if (mounted) setLeaveLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Employee Dashboard
            </h1>
            {/* <Badge tone="purple">Self Service</Badge> */}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {employeeInfo.name || "-"} • {employeeInfo.id || "-"} •{" "}
            {employeeInfo.role || "-"} • {employeeInfo.dept || "-"}
          </p>

          {view?.expiringCount ? (
            <p className="mt-1 text-xs text-amber-700">
              <AlertTriangle className="inline -mt-0.5 mr-1" size={14} />
              {view.expiringCount} document(s) expiring within 30 days
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              <CheckCircle2 className="inline -mt-0.5 mr-1" size={14} />
              Welcome 
            </p>
          )}

          {leaveLoading ? (
            <p className="mt-2 text-xs text-slate-500">Loading leave data</p>
          ) : leaveError ? (
            <p className="mt-2 text-xs text-rose-600">
              {String(leaveError)}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2" />
      </div>

      {/* ONLY 1 card: LEAVE */}
      <div className="grid grid-cols-1 gap-4">
        <SectionCard
          title="Leave Details"
          subtitle="Absence types + recent requests"
          action={<Badge tone="info">Leave</Badge>}
        >
          {/* Absence type cards */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {absenceGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedAbsenceGroup(group)}
                className="rounded-2xl border bg-slate-50 px-4 py-6 text-center transition hover:bg-white hover:shadow-sm"
              >
                <div className="text-base font-extrabold text-slate-900">
                  {group.title}
                </div>
              </button>
            ))}
          </div>

          {/* Recent requests */}
          <div className="mt-4 rounded-2xl border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
              Recent Requests
            </div>
            <div className="divide-y">
              {recentLeaves.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">
                  No leave requests yet.
                </div>
              ) : (
                recentLeaves.map((r) => (
                  <div
                    key={r.id}
                    className="px-4 py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">
                        {r.type}{" "}
                        <span className="text-slate-400 font-semibold">
                          ({r.days} day{r.days > 1 ? "s" : ""})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(r.from)} → {fmtDate(r.to)} • {r.id}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {r.reason}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Badge tone={toneChip[r.status] || "neutral"}>
                        {r.status}
                      </Badge>

                      {r.status === "Pending" ? (
                        <button
                          className="text-xs font-bold text-rose-600 hover:underline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCancelLeave(r.id);
                          }}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <PrimaryButton onClick={openApplyLeave}>
              <CalendarCheck size={16} className="mr-2" />
              Apply Leave
            </PrimaryButton>

            <GhostButton
              onClick={() =>
                actions.openAction({
                  kind: "VIEW_ALL_LEAVES",
                  title: "All Leave Requests",
                  desc: "View your full leave history",
                })
              }
            >
              View all
            </GhostButton>

          </div>
        </SectionCard>
      </div>

      {/* Absence details */}
      <Modal
        open={!!selectedAbsenceGroup}
        title={selectedAbsenceGroup?.title || "Absence Details"}
        // subtitle="Type / Code / Deduction"
        onClose={() => setSelectedAbsenceGroup(null)}
      >
        <div className="rounded-2xl border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">
                  Code
                </th>
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">
                  Deduction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(selectedAbsenceGroup?.items || []).map((item) => (
                <tr key={`${selectedAbsenceGroup?.id}-${item.code}`}>
                  <td className="px-4 py-2 text-slate-700">{item.type}</td>
                  <td className="px-4 py-2 font-semibold text-slate-900">
                    {item.code}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {item.deduction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* <div className="mt-3 text-xs font-semibold text-slate-500">
          Click to view details
        </div> */}
      </Modal>

      {/* Modal */}
      <Modal
        open={!!activeAction}
        title={activeAction?.title || "Action"}
        subtitle={activeAction?.desc || ""}
        onClose={actions.closeAction}
      >
        {/* VIEW ALL LEAVES */}
        {activeAction?.kind === "VIEW_ALL_LEAVES" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
                Leave History
              </div>
              <div className="divide-y max-h-[420px] overflow-auto">
                {leaveRequests.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No leave requests yet.
                  </div>
                ) : (
                  leaveRequests.map((r) => (
                    <div
                      key={r.id}
                      className="px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-900">
                          {r.type}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fmtDate(r.from)} → {fmtDate(r.to)} • {r.id} • {r.days}{" "}
                          day(s)
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.reason}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <Badge tone={toneChip[r.status] || "neutral"}>
                          {r.status}
                        </Badge>

                        {r.status === "Pending" ? (
                          <button
                            className="text-xs font-bold text-rose-600 hover:underline"
                            onClick={() => handleCancelLeave(r.id)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <GhostButton onClick={actions.closeAction}>Close</GhostButton>
              <PrimaryButton onClick={openApplyLeave}>Apply Leave</PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* Default */}
        {!activeAction?.kind ? (
          <div className="flex justify-end">
            <GhostButton onClick={actions.closeAction}>Close</GhostButton>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
