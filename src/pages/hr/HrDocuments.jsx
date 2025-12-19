import { useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  Download,
  Trash2,
  Eye,
  Search,
  Grid,
  List,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";

// Helpers
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
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

export default function HrDocuments() {
  const fileRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Offer Letter");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table"); // table | grid
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const bucketName = "hr-documents";
  const tableName = "hr_documents";

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const logSupabase = (action, payload, result) => {
    const status = result?.error?.status ?? result?.status ?? "ok";
    console.log("[supabase]", action, {
      table: tableName,
      payload,
      data: result?.data,
      error: result?.error,
      status,
    });
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const upload = async () => {
    if (!file || !title) return alert("Title & file required");
    if (!isSupabaseConfigured) return alert("Supabase is not configured");

    setBusy(true);
    setError("");
    const filePath = `${crypto.randomUUID()}-${file.name}`;

    const uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    logSupabase(
      "storage.upload",
      { bucket: bucketName, filePath, size: file.size, type: file.type },
      uploadResult
    );

    if (uploadResult.error) {
      setError(uploadResult.error.message);
      showToast(`Supabase failed: ${uploadResult.error.message}`);
      setBusy(false);
      return;
    }

    const insertPayload = {
      title,
      category,
      file_name: file.name,
      size: file.size,
      mime_type: file.type,
      storage_path: filePath,
    };

    const insertResult = await supabase
      .from(tableName)
      .insert([insertPayload])
      .select()
      .single();

    logSupabase("table.insert", insertPayload, insertResult);

    if (insertResult.error) {
      setError(insertResult.error.message);
      showToast(`Supabase failed: ${insertResult.error.message}`);
      setBusy(false);
      return;
    }

    const publicResult = supabase.storage.from(bucketName).getPublicUrl(filePath);
    logSupabase("storage.getPublicUrl", { bucket: bucketName, filePath }, publicResult);

    const doc = {
      id: insertResult.data.id,
      title: insertResult.data.title,
      category: insertResult.data.category,
      fileName: insertResult.data.file_name,
      size: insertResult.data.size,
      type: getFileType({ type: insertResult.data.mime_type }),
      url: publicResult?.data?.publicUrl || "",
      storagePath: insertResult.data.storage_path,
      date: insertResult.data.created_at
        ? new Date(insertResult.data.created_at).toLocaleString()
        : new Date().toLocaleString(),
    };

    setDocs((p) => [doc, ...p]);
    setTitle("");
    setFile(null);
    fileRef.current.value = "";
    setBusy(false);
  };

  const remove = async (doc) => {
    if (!isSupabaseConfigured) return;
    setBusy(true);
    setError("");

    const deleteResult = await supabase
      .from(tableName)
      .delete()
      .eq("id", doc.id);

    logSupabase("table.delete", { id: doc.id }, deleteResult);

    if (deleteResult.error) {
      setError(deleteResult.error.message);
      showToast(`Supabase failed: ${deleteResult.error.message}`);
      setBusy(false);
      return;
    }

    if (doc.storagePath) {
      const storageRemoveResult = await supabase.storage
        .from(bucketName)
        .remove([doc.storagePath]);

      logSupabase(
        "storage.remove",
        { bucket: bucketName, storagePath: doc.storagePath },
        storageRemoveResult
      );

      if (storageRemoveResult.error) {
        setError(storageRemoveResult.error.message);
        showToast(`Supabase failed: ${storageRemoveResult.error.message}`);
      }
    }

    setDocs((p) => p.filter((d) => d.id !== doc.id));
    setBusy(false);
  };

  const filtered = useMemo(() => {
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.fileName.toLowerCase().includes(search.toLowerCase())
    );
  }, [docs, search]);

  useEffect(() => {
    console.log("[env] VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log(
      "[env] VITE_SUPABASE_ANON_KEY (first 20):",
      import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20)
    );
  }, []);

  useEffect(() => {
    const loadDocs = async () => {
      if (!isSupabaseConfigured) return;
      setLoading(true);
      setError("");

      const loadResult = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      logSupabase("table.select", { order: "created_at desc" }, loadResult);

      if (loadResult.error) {
        setError(loadResult.error.message);
        showToast(`Supabase failed: ${loadResult.error.message}`);
        setLoading(false);
        return;
      }

      const mapped = loadResult.data.map((row) => {
        const publicResult = supabase.storage
          .from(bucketName)
          .getPublicUrl(row.storage_path);

        logSupabase(
          "storage.getPublicUrl",
          { bucket: bucketName, filePath: row.storage_path },
          publicResult
        );

        return {
          id: row.id,
          title: row.title,
          category: row.category,
          fileName: row.file_name,
          size: row.size,
          type: getFileType({ type: row.mime_type }),
          url: publicResult?.data?.publicUrl || "",
          storagePath: row.storage_path,
          date: row.created_at
            ? new Date(row.created_at).toLocaleString()
            : new Date().toLocaleString(),
        };
      });

      setDocs(mapped);
      setLoading(false);
    };

    loadDocs();
  }, []);

  return (
    <section className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast.message}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Documents</h1>
          <p className="text-sm text-slate-500">
            Upload, track and share HR-facing documents securely
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded-lg border ${
              view === "table" ? "bg-purple-700 text-white" : "bg-white text-slate-700"
            }`}
            aria-label="Table view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg border ${
              view === "grid" ? "bg-purple-700 text-white" : "bg-white text-slate-700"
            }`}
            aria-label="Grid view"
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 transition"
        >
          <UploadCloud className="mx-auto text-purple-600" />
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            disabled={busy}
            className="rounded-xl bg-purple-700 text-white font-semibold text-sm hover:bg-purple-800 disabled:opacity-60"
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

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase is not configured. Add `VITE_SUPABASE_URL` and
          `VITE_SUPABASE_ANON_KEY` in your `.env` file.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

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
              {loading && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    Loading documents...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
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
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className={d.url ? "" : "pointer-events-none opacity-50"}
                        aria-disabled={!d.url}
                      >
                        <Eye size={16} />
                      </a>
                      <a
                        href={d.url}
                        download
                        className={d.url ? "" : "pointer-events-none opacity-50"}
                        aria-disabled={!d.url}
                      >
                        <Download size={16} />
                      </a>
                      <button onClick={() => remove(d)} disabled={busy}>
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
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className={d.url ? "" : "pointer-events-none opacity-50"}
                  aria-disabled={!d.url}
                >
                  <Eye size={16} />
                </a>
                <a
                  href={d.url}
                  download
                  className={d.url ? "" : "pointer-events-none opacity-50"}
                  aria-disabled={!d.url}
                >
                  <Download size={16} />
                </a>
                <button onClick={() => remove(d)} disabled={busy}>
                  <Trash2 size={16} className="text-rose-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Supabase-connected storage for HR documents.
      </p>
    </section>
  );
}
