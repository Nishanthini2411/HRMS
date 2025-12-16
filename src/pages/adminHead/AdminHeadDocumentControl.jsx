const items = [
  "Verify Employee Documents",
  "Set Document Expiry Rules",
  "Upload Company Policies",
  "Compliance Tracking Dashboard",
];

export default function AdminHeadDocumentControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Control & Compliance</h1>
        <p className="text-sm text-slate-500">Oversight on document verification, expiries, and compliance tracking.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Compliance Actions</h3>
        <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
