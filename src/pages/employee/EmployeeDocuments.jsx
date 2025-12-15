import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Eye, Download, Trash2, FileText } from "lucide-react";

const EMP = { id: "EMP-001", name: "Priya Sharma" };
const LS_KEY = (empId) => `HRMS_EMP_DOCS_${empId}`;

function loadDocs(empId) {
  try {
    const raw = localStorage.getItem(LS_KEY(empId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(empId, rows) {
  localStorage.setItem(LS_KEY(empId), JSON.stringify(rows));
}

function uid(prefix = "DOC") {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function fmtBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const sizes = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < sizes.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default function EmployeeDocuments() {
  const fileRef = useRef(null);
  const [rows, setRows] = useState(() => loadDocs(EMP.id));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    saveDocs(EMP.id, rows);
  }, [rows]);

  const totalSize = useMemo(() => rows.reduce((sum, r) => sum + (r.size || 0), 0), [rows]);

  const handlePick = () => fileRef.current?.click();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      // store as base64 (demo). For real app, upload to server/Supabase Storage.
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const doc = {
        id: uid("DOC"),
        employeeId: EMP.id,
        employeeName: EMP.name,
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      setRows((prev) => [doc, ...prev]);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleView = (doc) => {
    if (!doc.dataUrl) return;
    window.open(doc.dataUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (doc) => {
    if (!doc.dataUrl) return;

    const a = document.createElement("a");
    a.href = doc.dataUrl;
    a.download = doc.name || "document";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload & view your documents • Total:{" "}
              <span className="font-semibold">{rows.length}</span> • Size:{" "}
              <span className="font-semibold">{fmtBytes(totalSize)}</span>
            </p>
          </div>

          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <button
              onClick={handlePick}
              disabled={busy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                busy
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-purple-700 text-white hover:bg-purple-800"
              }`}
            >
              <Upload size={18} />
              {busy ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 p-6 text-gray-500 text-sm">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-gray-800">Document Repository</p>
              <p className="mt-1">
                Offer letters • Payslips • Appointment/confirmation letters • HR policies •
                Download & view • Role-based access (later)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <h3 className="text-lg font-extrabold text-gray-900">Uploaded Files</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-3">File Name</th>
                <th className="py-3 pr-3">Type</th>
                <th className="py-3 pr-3">Size</th>
                <th className="py-3 pr-3">Uploaded</th>
                <th className="py-3 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={5}>
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 font-semibold text-gray-900">{d.name}</td>
                    <td className="py-3 pr-3">{d.type}</td>
                    <td className="py-3 pr-3">{fmtBytes(d.size)}</td>
                    <td className="py-3 pr-3">{new Date(d.uploadedAt).toLocaleString()}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleView(d)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 text-xs font-semibold transition"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(d)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
                        >
                          <Download size={16} />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Note: This demo stores files as base64 in localStorage (ok for small files only).
        </p>
      </div>
    </div>
  );
}
