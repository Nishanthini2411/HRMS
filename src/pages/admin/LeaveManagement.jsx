import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------- DEMO USERS (replace later with auth) ---------------- */
const currentEmployee = { id: "EMP-001", name: "Priya Sharma" };
const currentAdmin = { id: "ADM-001", name: "Admin User" };

/* ---------------- HELPERS ---------------- */
const diffDaysInclusive = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const ms = b - a;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return Number.isFinite(days) ? Math.max(days, 1) : 1;
};

const pill = (status) => {
  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border";
  if (status === "Approved")
    return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  if (status === "Rejected")
    return `${base} bg-rose-50 text-rose-700 border-rose-200`;
  return `${base} bg-amber-50 text-amber-800 border-amber-200`;
};

const roleBadge = (role) => {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border";
  if (role === "employee")
    return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
};

const fmtDT = (iso) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

const initials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
};

/* ---------------- MAPPER: DB -> UI ---------------- */
const mapDbToUi = (r) => {
  // ownerRole inference (simple)
  const isAdmin = (r.employee_id || "").toUpperCase().startsWith("ADM");
  return {
    id: r.id,
    ownerRole: isAdmin ? "admin" : "employee",
    ownerId: r.employee_id,
    ownerName: r.employee_name,
    leaveType: r.leave_type,
    from: r.from_date,
    to: r.to_date || r.from_date,
    reason: r.reason,
    status: r.status,
    appliedAt: r.applied_at,
    // optional fields (not in table) -> keep for UI safely
    decisionNote: "",
    decidedAt: "",
  };
};

/* ---------------- PAGE ---------------- */
const LeaveManagement = () => {
  const [mode, setMode] = useState("employee"); // "employee" | "admin"

  // ✅ data from Supabase
  const [requests, setRequests] = useState([]);

  // Apply form open/close
  const [showApply, setShowApply] = useState(false);

  // Apply form fields (both roles)
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  // Filters (both)
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // View modal
  const [viewing, setViewing] = useState(null);

  // Summary details modal
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState("All");

  // ESC close for view modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setViewing(null);
    };
    if (viewing) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing]);

  /* ---------------- FETCH FROM SUPABASE ---------------- */
  const fetchRequests = async (activeMode = mode) => {
    try {
      let q = supabase
        .from("employee_leaves")
        .select("*")
        .order("applied_at", { ascending: false });

      // Employee sees only own
      if (activeMode === "employee") {
        q = q.eq("employee_id", currentEmployee.id);
      }

      // Admin sees ALL (employee + admin)
      const { data, error } = await q;
      if (error) throw error;

      setRequests((data || []).map(mapDbToUi));
    } catch (err) {
      alert(err.message || "Failed to load leaves");
    }
  };

  useEffect(() => {
    fetchRequests(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---------------- REALTIME: auto refresh for admin & employee ---------------- */
  useEffect(() => {
    const channel = supabase
      .channel("employee_leaves_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_leaves" },
        () => {
          fetchRequests(mode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---------------- ROLE DATASET ---------------- */
  const dataset = useMemo(() => {
    // Already filtered in query for employee,
    // but keep safe filter here also.
    if (mode === "employee") {
      return requests.filter(
        (r) => r.ownerRole === "employee" && r.ownerId === currentEmployee.id
      );
    }
    // admin mode = show all
    return requests;
  }, [mode, requests]);

  const filtered = useMemo(() => {
    let list = [...dataset];

    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.id || "").toLowerCase().includes(q) ||
          (r.leaveType || "").toLowerCase().includes(q) ||
          (r.reason || "").toLowerCase().includes(q) ||
          (r.ownerName || "").toLowerCase().includes(q) ||
          (r.ownerId || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return list;
  }, [dataset, statusFilter, search]);

  const counts = useMemo(() => {
    const total = dataset.length;
    const pending = dataset.filter((r) => r.status === "Pending").length;
    const approved = dataset.filter((r) => r.status === "Approved").length;
    const rejected = dataset.filter((r) => r.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [dataset]);

  const summaryList = useMemo(() => {
    let list = [...dataset];
    if (summaryStatus !== "All") list = list.filter((r) => r.status === summaryStatus);
    list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return list;
  }, [dataset, summaryStatus]);

  const openSummary = (st) => {
    setSummaryStatus(st);
    setSummaryOpen(true);
  };

  /* ---------------- APPLY (EMPLOYEE + ADMIN) -> SUPABASE INSERT ---------------- */
  const submitLeave = async () => {
    if (!from || !to || !reason.trim()) {
      alert("Please fill From, To and Reason.");
      return;
    }
    if (new Date(to) < new Date(from)) {
      alert("To date cannot be earlier than From date.");
      return;
    }

    const who = mode === "employee" ? currentEmployee : currentAdmin;

    const payload = {
      employee_id: who.id,
      employee_name: who.name,
      leave_type: leaveType,
      mode: "Full Day", // keep simple (you can extend later)
      from_date: from,
      to_date: to,
      time_from: null,
      time_to: null,
      hours: null,
      reason: reason.trim(),
      status: "Pending",
    };

    const { error } = await supabase.from("employee_leaves").insert(payload);
    if (error) {
      alert(error.message);
      return;
    }

    setFrom("");
    setTo("");
    setReason("");
    setShowApply(false);

    // Admin wants instantly -> realtime already refreshes.
    // Still fetch once (safe)
    fetchRequests(mode);

    alert("Leave request submitted!");
  };

  return (
    <section className="space-y-4">
      {/* Header + Toggle + Apply button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave Letters</h1>
          <p className="text-sm text-gray-600">
            {mode === "employee"
              ? "Employee can apply leave and view only their own leave letters."
              : "Admin can view ALL employee leave letters and also apply leave."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
            <button
              type="button"
              onClick={() => {
                setMode("employee");
                setShowApply(false);
                setSearch("");
                setStatusFilter("All");
                setSummaryOpen(false);
                setViewing(null);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                mode === "employee"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Employee
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("admin");
                setSearch("");
                setStatusFilter("All");
                setSummaryOpen(false);
                setViewing(null);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                mode === "admin"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Apply Button (both roles) */}
          <button
            type="button"
            onClick={() => setShowApply((s) => !s)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Apply Leave
          </button>
        </div>
      </div>

      {/* Apply Form (both roles) */}
      {showApply && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Apply Leave ({mode === "employee" ? "Employee" : "Admin"})
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {(mode === "employee" ? currentEmployee.name : currentAdmin.name)} •{" "}
                {(mode === "employee" ? currentEmployee.id : currentAdmin.id)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowApply(false)}
              className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <form
            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div>
              <label className="block mb-1 text-sm text-gray-600">Leave Type</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Annual Leave</option>
                <option>Paid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 md:col-span-1">
              <div>
                <label className="block mb-1 text-sm text-gray-600">From</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-600">To</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1 text-sm text-gray-600">Reason</label>
              <textarea
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Write reason..."
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setReason("");
                }}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={submitLeave}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary (CLICKABLE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => openSummary("All")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-semibold">{counts.total}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
        <button
          onClick={() => openSummary("Pending")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-xl font-semibold">{counts.pending}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
        <button
          onClick={() => openSummary("Approved")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Approved</div>
          <div className="text-xl font-semibold">{counts.approved}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
        <button
          onClick={() => openSummary("Rejected")}
          className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition"
        >
          <div className="text-xs text-gray-500">Rejected</div>
          <div className="text-xl font-semibold">{counts.rejected}</div>
          <div className="text-[11px] text-gray-400 mt-1">Click to view list</div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by request id / name / id / type / reason..."
            className="w-full md:w-96 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Request</th>
              <th className="text-left px-4 py-3 font-medium">Dates</th>
              <th className="text-left px-4 py-3 font-medium">Days</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">View</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                  No leave letters found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const { date, time } = fmtDT(r.appliedAt);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {initials(r.ownerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold">{r.leaveType}</div>
                          <div className="text-xs text-gray-500">
                            #{String(r.id).slice(0, 8)} • Applied: {date} {time}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {r.reason}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {r.from} → {r.to}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {r.ownerName} • {r.ownerId}
                      </div>
                      <div className="mt-1">
                        <span className={roleBadge(r.ownerRole)}>
                          Employment: {r.ownerRole === "employee" ? "Employee" : "Admin"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">{diffDaysInclusive(r.from, r.to)}</td>

                    <td className="px-4 py-3">
                      <span className={pill(r.status)}>{r.status}</span>
                      {r.decidedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Decided: {r.decidedAt}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setViewing(r)}
                          className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                        >
                          View Letter
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Details Modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">
                  {summaryStatus === "All" ? "All Leave Letters" : `${summaryStatus} Leave Letters`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Showing: <span className="font-semibold">{summaryList.length}</span> requests • Mode:{" "}
                  <span className="font-semibold">{mode.toUpperCase()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              {summaryList.length === 0 ? (
                <div className="text-sm text-gray-500 py-10 text-center">No records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Employee Details</th>
                        <th className="text-left px-4 py-3 font-medium">Leave</th>
                        <th className="text-left px-4 py-3 font-medium">Dates</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-right px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {summaryList.map((r) => {
                        const { date, time } = fmtDT(r.appliedAt);
                        return (
                          <tr key={`sum-${r.id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                  {initials(r.ownerName)}
                                </div>
                                <div>
                                  <div className="font-semibold">{r.ownerName}</div>
                                  <div className="text-xs text-gray-500">
                                    ID: <span className="font-semibold">{r.ownerId}</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className={roleBadge(r.ownerRole)}>
                                      Employment: {r.ownerRole === "employee" ? "Employee" : "Admin"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-semibold">{r.leaveType}</div>
                              <div className="text-xs text-gray-500">
                                #{String(r.id).slice(0, 8)} • Applied: {date} {time}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">{r.reason}</div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-gray-700">
                                {r.from} → {r.to}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Days: <span className="font-semibold">{diffDaysInclusive(r.from, r.to)}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className={pill(r.status)}>{r.status}</span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setViewing(r)}
                                  className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Letter Modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewing(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">Leave request</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    #{String(viewing.id).slice(0, 8)}
                  </span>
                  <span className={pill(viewing.status)}>{viewing.status}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="text-white/80 hover:text-white text-sm"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-bold">
                  {initials(viewing.ownerName)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{viewing.ownerName}</p>
                  <p className="text-xs text-slate-500">{viewing.ownerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">From</p>
                  <p className="font-semibold text-slate-900">{viewing.from}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">To</p>
                  <p className="font-semibold text-slate-900">{viewing.to}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">Days</p>
                  <p className="font-semibold text-slate-900">
                    {diffDaysInclusive(viewing.from, viewing.to)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500">Applied</p>
                  <p className="font-semibold text-slate-900">{fmtDT(viewing.appliedAt).date}</p>
                  <p className="text-[11px] text-slate-500">{fmtDT(viewing.appliedAt).time}</p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">Reason</p>
                <p className="mt-1 text-slate-800 leading-relaxed">{viewing.reason || "-"}</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">Decision Note</p>
                <p className="mt-1 text-slate-800 leading-relaxed">
                  {viewing.decisionNote || "No decision yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LeaveManagement;
