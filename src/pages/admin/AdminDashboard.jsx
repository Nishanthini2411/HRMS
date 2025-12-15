// src/pages/Dashboard.jsx
import StatCard from "../../components/StatCard.jsx";

const AdminDashboard = () => {
  const attendanceSummary = [
    { label: "Present", value: 98, color: "bg-emerald-500" },
    { label: "Absent", value: 12, color: "bg-rose-500" },
    { label: "On Leave", value: 10, color: "bg-amber-500" },
  ];

  const pendingLeaves = [
    { name: "Priya Sharma", type: "Casual Leave", days: 2, status: "Waiting for HR" },
    { name: "Kavin Raj", type: "Sick Leave", days: 1, status: "Waiting for Manager" },
    { name: "Anjali Perera", type: "Annual Leave", days: 5, status: "Waiting for HR" },
  ];

  const payrollItems = [
    { label: "This Month Payroll", status: "In Progress", count: 3 },
    { label: "Processed", status: "Completed", count: 117 },
    { label: "On Hold", status: "Pending", count: 3 },
  ];

  const notifications = [
    { type: "Leave", text: "3 new leave requests received today.", time: "10 mins ago" },
    { type: "Attendance", text: "5 employees haven't marked attendance.", time: "30 mins ago" },
    { type: "Payroll", text: "Payroll run scheduled for 25th of this month.", time: "2 hours ago" },
    { type: "Reminder", text: "Update bank details for new employees.", time: "Yesterday" },
  ];

  const quickActions = [
    { label: "Add Employee", description: "Create a new employee record" },
    { label: "Approve Leaves", description: "Review pending leave requests" },
    { label: "Generate Payroll", description: "Run monthly payroll" },
    { label: "View Attendance", description: "Check daily attendance report" },
  ];

  const totalEmployees = 120;
  const presentToday = 98;
  const pendingLeaveRequests = 4;
  const payrollPending = 3;

  const presentPercentage = Math.round((presentToday / totalEmployees) * 100);

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">
          A clean dashboard for HR/Admins to monitor everything easily.
        </p>
      </header>

      {/* Top Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          subtitle="Active employees"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          subtitle="Attendance marked"
        />
        <StatCard
          title="Pending Leave Requests"
          value={pendingLeaveRequests}
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Payroll Pending"
          value={payrollPending}
          subtitle="This month"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Monthly Attendance Summary */}
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Monthly Attendance Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Overview of employee attendance for the current month.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Present {presentPercentage}% 
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${presentPercentage}%` }}
              />
            </div>

            {/* Legend */}
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              {attendanceSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    ></span>
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Leave Approvals */}
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Pending Leave Approvals
              </h2>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              {pendingLeaves.map((leave, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">{leave.name}</p>
                    <p className="text-xs text-slate-500">
                      {leave.type} • {leave.days} day(s)
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payroll Status */}
          {/* <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Payroll Status
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                This month
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {payrollItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.status}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.count} batch(es)
                  </span>
                </div>
              ))}
            </div>
          </div> */}

          {/* Recent Notifications */}
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Notifications
              </h2>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                View all
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {notifications.map((note, index) => (
                <div key={index} className="flex flex-col rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {note.type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {note.time}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Quick Actions
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-indigo-500 hover:bg-indigo-50"
                >
                  <span className="mb-1 text-sm font-medium text-slate-900">
                    {action.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {action.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
