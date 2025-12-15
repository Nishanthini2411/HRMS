import { useMemo, useRef, useState } from "react";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const formatDateTime = (d) => {
  const dt = new Date(d);
  const date = dt.toLocaleDateString();
  const time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

const getFileTypeLabel = (file) => {
  const t = file?.type || "";
  if (t.includes("pdf")) return "PDF";
  if (t.includes("image")) return "Image";
  if (t.includes("word")) return "Word";
  if (t.includes("spreadsheet") || t.includes("excel")) return "Excel";
  if (t.includes("zip")) return "ZIP";
  return (file?.name?.split(".").pop() || "FILE").toUpperCase();
};

const badgeClass = (label) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border";
  if (label === "PDF") return `${base} bg-red-50 text-red-700 border-red-200`;
  if (label === "Image") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  if (label === "Word") return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
  if (label === "Excel") return `${base} bg-green-50 text-green-700 border-green-200`;
  return `${base} bg-gray-50 text-gray-700 border-gray-200`;
};

const Documents = () => {
  const fileRef = useRef(null);

  // form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Offer Letter");
  const [pickedFile, setPickedFile] = useState(null);

  // list
  const [docs, setDocs] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filteredDocs = useMemo(() => {
    let list = [...docs];

    if (catFilter !== "All") list = list.filter((d) => d.category === catFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }

    // latest first
    list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    return list;
  }, [docs, search, catFilter]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPickedFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^/.]+$/, "")); // default title from filename
  };

  const clearForm = () => {
    setTitle("");
    setCategory("Offer Letter");
    setPickedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadDoc = () => {
    if (!pickedFile) return alert("Please choose a file to upload.");
    if (!title.trim()) return alert("Please enter a document title.");

    const now = new Date().toISOString();

    const url = URL.createObjectURL(pickedFile); // local preview url

    const newDoc = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `DOC-${Date.now()}`,
      title: title.trim(),
      category,
      fileName: pickedFile.name,
      fileType: pickedFile.type,
      typeLabel: getFileTypeLabel(pickedFile),
      size: pickedFile.size,
      uploadedAt: now,
      url,
    };

    setDocs((prev) => [newDoc, ...prev]);
    clearForm();
  };

  const removeDoc = (id) => {
    setDocs((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((d) => d.id !== id);
    });
  };

  const downloadDoc = (doc) => {
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Document Repository</h1>
        <p className="text-sm text-gray-600">
          Store and manage employee-related documents like offer letters, payslips, and policy files.
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Upload Document</h2>
            <p className="text-xs text-gray-500">Add a title, choose category and upload the file.</p>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white
                       bg-blue-600 hover:bg-blue-700 transition"
          >
            Choose File
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Offer Letter - Priya"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
            >
              <option>Offer Letter</option>
              <option>Payslip</option>
              <option>Appointment Letter</option>
              <option>Confirmation Letter</option>
              <option>HR Policy</option>
              <option>Other</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Selected File</label>
            <div className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 bg-gray-50">
              {pickedFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate">
                    <div className="font-medium truncate">{pickedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatBytes(pickedFile.size)} • {getFileTypeLabel(pickedFile)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                "No file selected"
              )}
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" className="hidden" onChange={onPickFile} />

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2 rounded-xl text-sm border bg-white hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={uploadDoc}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            Upload
          </button>
        </div>
      </div>

      {/* List / Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Uploaded Documents</h2>
            <p className="text-xs text-gray-500">
              View documents with name, date and time. You can download or delete.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
            >
              <option>All</option>
              <option>Offer Letter</option>
              <option>Payslip</option>
              <option>Appointment Letter</option>
              <option>Confirmation Letter</option>
              <option>HR Policy</option>
              <option>Other</option>
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full sm:w-64 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border rounded-2xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Document</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Uploaded</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((d) => {
                  const { date, time } = formatDateTime(d.uploadedAt);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className={badgeClass(d.typeLabel)}>{d.typeLabel}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{d.title}</div>
                            <div className="text-xs text-gray-500 truncate">{d.fileName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {d.category}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-700">{date}</div>
                        <div className="text-xs text-gray-500">{time}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">{formatBytes(d.size)}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadDoc(d)}
                            className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDoc(d.id)}
                            className="px-3 py-1.5 rounded-lg text-xs border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          >
                            Delete
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

        <div className="mt-3 text-xs text-gray-500">
          Note: This is demo (local state). For real project, connect to backend (Supabase storage) so files stay after refresh.
        </div>
      </div>
    </section>
  );
};

export default Documents;
