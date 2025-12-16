const items = [
  "Leave Policy Setup",
  "Leave Balance Editing",
  "Holiday Calendar Setup",
  "Leave Reports",
  "Team Leave Insights",
];

export default function AdminHeadLeaveControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Control</h1>
        <p className="text-sm text-slate-500">Configure leave policies, balances, holidays, and insights.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Controls</h3>
        <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
