import { useMemo, useState } from "react";

// ---------------- DEMO DATA ----------------
const seedRequests = [
  // Employee leaves
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
  },
  {
    id: "LR-2002",
    ownerRole: "employee",
    ownerId: "EMP-001",
    ownerName: "Priya Sharma",
    leaveType: "Sick Leave",
    from: "2025-12-10",
    to: "2025-12-10",
    reason: "Fever",
    status: "Approved",
    appliedAt: "2025-12-10T11:30:00",
    decisionNote: "Take rest. Get well soon.",
    decidedAt: "2025-12-10",
  },

  // Admin leaves
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
  },
];

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

const fmtDT = (iso) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

// ---------------- PAGE ----------------
const LeaveManagement = () => {
  // ✅ Demo user (replace with real auth user)
  const currentEmployee = { id: "EMP-001", name: "Priya Sharma" };
  const currentAdmin = { id: "ADM-001", name: "Admin User" };

  // ✅ Toggle like image
  const [mode, setMode] = useState("employee"); // "employee" | "admin"

  const [requests, setRequests] = useState(seedRequests);

  // Admin apply form open/close
  const [showApply, setShowApply] = useState(false);

  // Apply form fields (admin only)
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  // Filters (both)
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // View modal
  const [viewing, setViewing] = useState(null);

  // ✅ Only show own letters depending on role
  const dataset = useMemo(() => {
    if (mode === "employee") {
      return requests.filter(
        (r) => r.ownerRole === "employee" && r.ownerId === currentEmployee.id
      );
    }
    // admin
    return requests.filter((r) => r.ownerRole === "admin" && r.ownerId === currentAdmin.id);
  }, [mode, requests, currentEmployee.id, currentAdmin.id]);

  const filtered = useMemo(() => {
    let list = [...dataset];

    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.leaveType.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
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

  const submitAdminLeave = () => {
    if (!from || !to || !reason.trim()) {
      alert("Please fill From, To and Reason.");
      return;
    }
    if (new Date(to) < new Date(from)) {
      alert("To date cannot be earlier than From date.");
      return;
    }

    const newReq = {
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      ownerRole: "admin",
      ownerId: currentAdmin.id,
      ownerName: currentAdmin.name,
      leaveType,
      from,
      to,
      reason: reason.trim(),
      status: "Pending",
      appliedAt: new Date().toISOString(),
      decisionNote: "",
      decidedAt: "",
    };

    setRequests((prev) => [newReq, ...prev]);
    setFrom("");
    setTo("");
    setReason("");
    setShowApply(false);
    alert("Leave letter submitted!");
  };

  return (
    <section className="space-y-4">
      {/* Header + Toggle + Admin Apply button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave Letters</h1>
          <p className="text-sm text-gray-600">
            {mode === "employee"
              ? "Employee can view only their own leave letters (no approval)."
              : "HR/Admin can view their own leave letters and apply new leave (no approval)."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle like screenshot */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
            <button
              type="button"
              onClick={() => {
                setMode("employee");
                setShowApply(false);
                setSearch("");
                setStatusFilter("All");
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

          {/* Admin Apply Button */}
          {mode === "admin" && (
            <button
              type="button"
              onClick={() => setShowApply((s) => !s)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* Admin Apply Form (ONLY when button clicked) */}
      {mode === "admin" && showApply && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Apply Leave (Admin)</h2>
              <p className="text-xs text-gray-500 mt-1">
                {currentAdmin.name} • {currentAdmin.id}
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

          <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block mb-1 text-sm text-gray-600">Leave Type</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option>Casual Leave</option>
                <option>Sick Leave</option>
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
                onClick={submitAdminLeave}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

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
            placeholder="Search by request id / type / reason..."
            className="w-full md:w-80 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
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
                      <div className="font-semibold">{r.leaveType}</div>
                      <div className="text-xs text-gray-500">
                        #{r.id} • Applied: {date} {time}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{r.reason}</div>
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
                        <div className="text-xs text-gray-500 mt-1">Decided: {r.decidedAt}</div>
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

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Leave Letter Details</div>
                <div className="text-xs text-gray-500 mt-1">#{viewing.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {viewing.leaveType}
                </span>
                <span className={pill(viewing.status)}>{viewing.status}</span>
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
                <div className="text-xs text-gray-500">Total Days</div>
                <div className="font-semibold">
                  {diffDaysInclusive(viewing.from, viewing.to)}
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Reason</div>
                <div className="text-gray-800 mt-1">{viewing.reason}</div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Applied</div>
                <div className="font-semibold">
                  {fmtDT(viewing.appliedAt).date} {fmtDT(viewing.appliedAt).time}
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">Decision Note</div>
                <div className="text-gray-800 mt-1">{viewing.decisionNote || "-"}</div>
              </div>
            </div>

            <div className="p-5 border-t flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="px-4 py-2 rounded-md text-sm border bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LeaveManagement;
