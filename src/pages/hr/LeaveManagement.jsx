import { useEffect, useMemo, useState } from "react";

// ---------------- DEMO DATA (Employee + Admin Requests) ----------------
const seedRequests = [
  {
    id: "LR-2001",
    ownerRole: "employee",
    ownerId: "EMP-001",
    ownerName: "Priya Sharma",
    leaveType: "Casual Leave",
    from: "2025-12-15",
    to: "2025-12-16",
    reason: "Family function",
    status: "Pending",
    appliedAt: "2025-12-12T09:10:00",
    decisionNote: "",
    decidedAt: "",
    decidedBy: "",
  },
  {
    id: "LR-2002",
    ownerRole: "employee",
    ownerId: "EMP-002",
    ownerName: "Kavin Raj",
    leaveType: "Sick Leave",
    from: "2025-12-10",
    to: "2025-12-10",
    reason: "Fever",
    status: "Approved",
    appliedAt: "2025-12-10T11:30:00",
    decisionNote: "Take rest.",
    decidedAt: "2025-12-10",
    decidedBy: "HR",
  },
  {
    id: "LR-9001",
    ownerRole: "admin",
    ownerId: "ADM-001",
    ownerName: "Admin User",
    leaveType: "Paid Leave",
    from: "2025-12-20",
    to: "2025-12-21",
    reason: "Personal work",
    status: "Pending",
    appliedAt: "2025-12-12T08:20:00",
    decisionNote: "",
    decidedAt: "",
    decidedBy: "",
  },
];

const LS_KEY = "hr_leave_requests_v1";

// ---------------- HELPERS ----------------
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
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border";
  if (status === "Approved") return `${base} bg-green-50 text-green-700 border-green-200`;
  if (status === "Rejected") return `${base} bg-red-50 text-red-700 border-red-200`;
  return `${base} bg-yellow-50 text-yellow-800 border-yellow-200`;
};

const roleBadge = (role) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border";
  if (role === "employee") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  if (role === "admin") return `${base} bg-purple-50 text-purple-700 border-purple-200`;
  return `${base} bg-gray-50 text-gray-700 border-gray-200`; // hr
};

const fmtDT = (iso) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

// ---------------- PAGE (HR VIEW) ----------------
export default function LeaveManagement() {
  // ✅ HR user (demo)
  const currentHR = { id: "HR-001", name: "HR Manager" };

  const [requests, setRequests] = useState(seedRequests);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All"); // All | employee | admin | hr
  const [search, setSearch] = useState("");

  // View modal
  const [viewing, setViewing] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");

  // Apply Leave (HR) modal
  const [showApply, setShowApply] = useState(false);
  const [applyForRole, setApplyForRole] = useState("employee"); // create request for employee/admin/hr (demo)
  const [applyOwnerId, setApplyOwnerId] = useState("EMP-003");
  const [applyOwnerName, setApplyOwnerName] = useState("New Employee");
  const [applyLeaveType, setApplyLeaveType] = useState("Casual Leave");
  const [applyFrom, setApplyFrom] = useState("");
  const [applyTo, setApplyTo] = useState("");
  const [applyReason, setApplyReason] = useState("");

  // ---------------- LocalStorage ----------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setRequests(JSON.parse(saved));
      else localStorage.setItem(LS_KEY, JSON.stringify(seedRequests));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(requests));
    } catch {}
  }, [requests]);

  // ---------------- Derived Lists ----------------
  const filtered = useMemo(() => {
    let list = [...requests];

    if (sourceFilter !== "All") list = list.filter((r) => r.ownerRole === sourceFilter);
    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.ownerId.toLowerCase().includes(q) ||
          r.leaveType.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return list;
  }, [requests, statusFilter, sourceFilter, search]);

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Pending").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const rejected = requests.filter((r) => r.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // ---------------- Actions ----------------
  const openView = (req) => {
    setViewing(req);
    setDecisionNote(req.decisionNote || "");
  };

  const closeView = () => {
    setViewing(null);
    setDecisionNote("");
  };

  const updateStatus = (id, nextStatus) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: nextStatus,
          decisionNote: decisionNote?.trim() || "",
          decidedAt: new Date().toISOString().slice(0, 10),
          decidedBy: currentHR.name,
        };
      })
    );
    closeView();
  };

  const closeApply = () => {
    setShowApply(false);
  };

  const submitApply = () => {
    if (!applyOwnerName.trim() || !applyOwnerId.trim()) {
      alert("Owner Name and Owner ID required.");
      return;
    }
    if (!applyFrom || !applyTo || !applyReason.trim()) {
      alert("Please fill From, To and Reason.");
      return;
    }
    if (new Date(applyTo) < new Date(applyFrom)) {
      alert("To date cannot be earlier than From date.");
      return;
    }

    const newReq = {
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      ownerRole: applyForRole, // employee/admin/hr
      ownerId: applyOwnerId.trim(),
      ownerName: applyOwnerName.trim(),
      leaveType: applyLeaveType,
      from: applyFrom,
      to: applyTo,
      reason: applyReason.trim(),
      status: "Pending",
      appliedAt: new Date().toISOString(),
      decisionNote: "",
      decidedAt: "",
      decidedBy: "",
    };

    setRequests((prev) => [newReq, ...prev]);

    // reset fields (keep role)
    setApplyLeaveType("Casual Leave");
    setApplyFrom("");
    setApplyTo("");
    setApplyReason("");
    setShowApply(false);

    alert("Leave request submitted!");
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-600">
            HR can view all leave requests and approve/reject them.
          </p>
        </div>

        {/* ✅ Apply Leave Button */}
        <button
          type="button"
          onClick={() => setShowApply(true)}
          className="self-start md:self-auto px-4 py-2 rounded-xl text-sm font-semibold bg-purple-700 text-white hover:bg-purple-800 transition"
        >
          Apply Leave
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-semibold">{counts.total}</div>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-xl font-semibold">{counts.pending}</div>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Approved</div>
          <div className="text-xl font-semibold">{counts.approved}</div>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <div className="text-xs text-gray-500">Rejected</div>
          <div className="text-xl font-semibold">{counts.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Source</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search id / name / type / reason..."
            className="w-full md:w-80 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Request</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Dates</th>
              <th className="text-left px-4 py-3 font-medium">Days</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={6}>
                  No leave requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const { date, time } = fmtDT(r.appliedAt);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.leaveType}</div>
                      <div className="text-xs text-gray-500">
                        #{r.id} • Applied: {date} {time}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{r.reason}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{r.ownerName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <span className={roleBadge(r.ownerRole)}>
                          {r.ownerRole === "employee"
                            ? "Employee"
                            : r.ownerRole === "admin"
                            ? "Admin"
                            : "HR"}
                        </span>
                        <span>{r.ownerId}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {r.from} → {r.to}
                      </div>
                    </td>

                    <td className="px-4 py-3">{diffDaysInclusive(r.from, r.to)}</td>

                    <td className="px-4 py-3">
                      <span className={pill(r.status)}>{r.status}</span>
                      {r.decidedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Decided: {r.decidedAt} {r.decidedBy ? `• By: ${r.decidedBy}` : ""}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openView(r)}
                          className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                        >
                          View
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

      {/* Apply Leave Modal */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Apply Leave</div>
                <div className="text-xs text-gray-500 mt-1">
                  Create a leave request (demo)
                </div>
              </div>
              <button
                type="button"
                onClick={closeApply}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Request For</label>
                  <select
                    value={applyForRole}
                    onChange={(e) => setApplyForRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Leave Type</label>
                  <select
                    value={applyLeaveType}
                    onChange={(e) => setApplyLeaveType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  >
                    <option>Casual Leave</option>
                    <option>Sick Leave</option>
                    <option>Paid Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Owner Name</label>
                  <input
                    value={applyOwnerName}
                    onChange={(e) => setApplyOwnerName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                    placeholder="Name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Owner ID</label>
                  <input
                    value={applyOwnerId}
                    onChange={(e) => setApplyOwnerId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                    placeholder="EMP-xxx / ADM-xxx / HR-xxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={applyFrom}
                    onChange={(e) => setApplyFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={applyTo}
                    onChange={(e) => setApplyTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason</label>
                <textarea
                  rows={4}
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  placeholder="Write reason..."
                />
              </div>

              <div className="rounded-xl border p-3 bg-gray-50">
                <div className="text-xs text-gray-500">Logged in HR</div>
                <div className="font-semibold text-gray-800">
                  {currentHR.name} • {currentHR.id}
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeApply}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApply}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-700 text-white hover:bg-purple-800"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View / Approve / Reject Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Leave Request</div>
                <div className="text-xs text-gray-500 mt-1">#{viewing.id}</div>
              </div>
              <button
                type="button"
                onClick={closeView}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  {viewing.leaveType}
                </span>
                <span className={roleBadge(viewing.ownerRole)}>
                  {viewing.ownerRole === "employee"
                    ? "Employee"
                    : viewing.ownerRole === "admin"
                    ? "Admin"
                    : "HR"}
                </span>
                <span className={pill(viewing.status)}>{viewing.status}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Owner</div>
                  <div className="font-semibold">{viewing.ownerName}</div>
                  <div className="text-xs text-gray-500 mt-1">{viewing.ownerId}</div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Days</div>
                  <div className="font-semibold">
                    {diffDaysInclusive(viewing.from, viewing.to)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">From</div>
                  <div className="font-semibold">{viewing.from}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">To</div>
                  <div className="font-semibold">{viewing.to}</div>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Reason</div>
                <div className="text-gray-800 mt-1">{viewing.reason}</div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">HR Note (optional)</div>
                <textarea
                  rows={3}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400"
                  placeholder="Add note..."
                />
              </div>

              {viewing.decidedAt && (
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Decision</div>
                  <div className="font-semibold">
                    {viewing.status} • {viewing.decidedAt}{" "}
                    {viewing.decidedBy ? `• ${viewing.decidedBy}` : ""}
                  </div>
                  <div className="text-gray-700 mt-1 text-sm">
                    Note: {viewing.decisionNote || "-"}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={closeView}
                className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
              >
                Close
              </button>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  disabled={viewing.status !== "Pending"}
                  onClick={() => updateStatus(viewing.id, "Rejected")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    viewing.status !== "Pending"
                      ? "opacity-50 cursor-not-allowed bg-white text-gray-500"
                      : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                  }`}
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={viewing.status !== "Pending"}
                  onClick={() => updateStatus(viewing.id, "Approved")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    viewing.status !== "Pending"
                      ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-600"
                      : "bg-purple-700 text-white hover:bg-purple-800"
                  }`}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
