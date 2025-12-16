const checklist = [
  "Daily Attendance Sheet",
  "Manual Punch Corrections",
  "Shift Assignment",
  "Overtime Rules",
  "Attendance Policy Setup",
  "Workforce Attendance Analytics",
];

export default function AdminHeadAttendanceControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Control</h1>
        <p className="text-sm text-slate-500">Control sheets, corrections, shift assignments, overtime and policy setup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
          <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Daily Attendance Sheet (summary)</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <p>Present: 2,110</p>
            <p>Late: 120</p>
            <p>Absent: 200</p>
            <p>Missing Punch: 45</p>
          </div>
        </div>
      </div>
    </div>
  );
}
