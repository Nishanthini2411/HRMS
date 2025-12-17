import { useMemo, useRef, useState } from "react";
import { UploadCloud, Download, Eye, Grid, List, Search, Trash2 } from "lucide-react";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(val >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const getFileType = (file) => {
  const t = file?.type || "";
  if (t.includes("pdf")) return "PDF";
  if (t.includes("image")) return "IMAGE";
  if (t.includes("word")) return "WORD";
  if (t.includes("excel")) return "EXCEL";
  return "FILE";
};

const badgeColor = (type) => {
  if (type === "PDF") return "bg-rose-50 text-rose-700";
  if (type === "IMAGE") return "bg-blue-50 text-blue-700";
  if (type === "WORD") return "bg-indigo-50 text-indigo-700";
  if (type === "EXCEL") return "bg-emerald-50 text-emerald-700";
  return "bg-gray-100 text-gray-700";
};

const accentMap = {
  blue: { solid: "bg-blue-600 text-white", hover: "hover:bg-blue-700", subtle: "text-blue-700", border: "hover:border-blue-500" },
  purple: { solid: "bg-purple-700 text-white", hover: "hover:bg-purple-800", subtle: "text-purple-700", border: "hover:border-purple-500" },
  slate: { solid: "bg-slate-900 text-white", hover: "hover:bg-black", subtle: "text-slate-800", border: "hover:border-slate-500" },
};

export default function DocumentManager({ title = "Documents", subtitle, accent = "blue" }) {
  const theme = accentMap[accent] || accentMap.blue;
  const fileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [docTitle, setDocTitle] = useState("");
  const [category, setCategory] = useState("Offer Letter");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!docTitle) setDocTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const upload = () => {
    if (!file || !docTitle) return alert("Title & file required");
    const doc = {
      id: crypto.randomUUID(),
      title: docTitle,
      category,
      fileName: file.name,
      size: file.size,
      type: getFileType(file),
      url: URL.createObjectURL(file),
      date: new Date().toLocaleString(),
    };
    setDocs((p) => [doc, ...p]);
    setDocTitle("");
    setFile(null);
    fileRef.current.value = "";
  };

  const remove = (id) => setDocs((p) => p.filter((d) => d.id !== id));

  const filtered = useMemo(() => {
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.fileName.toLowerCase().includes(search.toLowerCase())
    );
  }, [docs, search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded-lg border ${view === "table" ? theme.solid : "bg-white"} ${theme.hover}`}
            aria-label="Table view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg border ${view === "grid" ? theme.solid : "bg-white"} ${theme.hover}`}
            aria-label="Grid view"
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${theme.border}`}
        >
          <UploadCloud className={`mx-auto ${theme.subtle}`} />
          <p className="font-semibold mt-2">Click to upload document</p>
          <p className="text-xs text-gray-500">PDF, Image, Word, Excel</p>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-xl">
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
            </div>
            <button onClick={() => setFile(null)} className="text-xs underline">
              Remove
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <input
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Document title"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option>Offer Letter</option>
            <option>Payslip</option>
            <option>Appointment Letter</option>
            <option>HR Policy</option>
            <option>Other</option>
          </select>
          <button
            onClick={upload}
            className={`rounded-xl ${theme.solid} font-semibold text-sm ${theme.hover}`}
          >
            Upload Document
          </button>
        </div>

        <input type="file" ref={fileRef} className="hidden" onChange={pickFile} />
      </div>

      <div className="flex items-center gap-2">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full md:w-72 rounded-xl border px-3 py-2 text-sm"
        />
      </div>

      {view === "table" && (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    No documents found
                  </td>
                </tr>
              )}
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(
                          d.type
                        )}`}
                      >
                        {d.type}
                      </span>
                      <div>
                        <div className="font-semibold">{d.title}</div>
                        <div className="text-xs text-gray-500">{d.fileName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{d.category}</td>
                  <td className="px-4 py-3">{formatBytes(d.size)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a href={d.url} target="_blank" rel="noreferrer">
                        <Eye size={16} />
                      </a>
                      <a href={d.url} download>
                        <Download size={16} />
                      </a>
                      <button onClick={() => remove(d.id)}>
                        <Trash2 size={16} className="text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white border rounded-2xl p-4 shadow-sm">
              <span
                className={`inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(
                  d.type
                )}`}
              >
                {d.type}
              </span>
              <h3 className="font-semibold truncate">{d.title}</h3>
              <p className="text-xs text-gray-500 truncate">{d.fileName}</p>
              <p className="text-xs mt-1">{formatBytes(d.size)}</p>

              <div className="flex justify-end gap-3 mt-4">
                <a href={d.url} target="_blank" rel="noreferrer">
                  <Eye size={16} />
                </a>
                <a href={d.url} download>
                  <Download size={16} />
                </a>
                <button onClick={() => remove(d.id)}>
                  <Trash2 size={16} className="text-rose-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Demo only — connect storage/back-end for persistence.
      </p>
    </section>
  );
}
