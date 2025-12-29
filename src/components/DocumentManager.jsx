// src/components/DocumentManager.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  Download,
  Eye,
  Grid,
  List,
  Search,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { ensureRoleAuthSession } from "../lib/employeeAuthBridge";

/* ===================== CONFIG ===================== */
const DOCS_TABLE = "hrmss_documents";
const BUCKET = "hrmss-documents";
const ALLOWED_ROLES = new Set(["admin", "employee", "hr", "manager"]);
const AUTH_KEY = "HRMSS_AUTH_SESSION";
const LEGACY_EMP_SIGNIN_KEY = "hrmss.employee.signin";

/* ===================== HELPERS ===================== */
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(val >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const getFileType = (file) => {
  const t = (file?.type || "").toLowerCase();
  if (t.includes("pdf")) return "PDF";
  if (t.includes("image")) return "IMAGE";
  if (t.includes("word") || t.includes("doc")) return "WORD";
  if (t.includes("excel") || t.includes("sheet") || t.includes("xls")) return "EXCEL";
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
  blue: {
    solid: "bg-blue-600 text-white",
    hover: "hover:bg-blue-700",
    subtle: "text-blue-700",
    border: "hover:border-blue-500",
  },
  purple: {
    solid: "bg-purple-700 text-white",
    hover: "hover:bg-purple-800",
    subtle: "text-purple-700",
    border: "hover:border-purple-500",
  },
  slate: {
    solid: "bg-slate-900 text-white",
    hover: "hover:bg-black",
    subtle: "text-slate-800",
    border: "hover:border-slate-500",
  },
};

const safeFileName = (name = "file") => {
  const n = name.replace(/[^\w.\-() ]+/g, "_").trim();
  return n.length ? n : "file";
};

const must = (v, msg) => {
  if (!v) throw new Error(msg);
  return v;
};

const readAuthCache = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readLegacyEmployeeSignin = () => {
  try {
    const raw = localStorage.getItem(LEGACY_EMP_SIGNIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const resolveEffectiveRole = ({ roleProp, authCache } = {}) => {
  const r = String(roleProp || authCache?.loginRole || authCache?.role || "").trim().toLowerCase();
  return r || "";
};

const resolveEmployeeId = ({ authCache, legacyEmployeeSignin } = {}) => {
  const empId = String(
    authCache?.employee_id ||
      authCache?.employeeId ||
      authCache?.empId ||
      authCache?.identifier ||
      authCache?.id ||
      legacyEmployeeSignin?.employee_id ||
      legacyEmployeeSignin?.employeeId ||
      legacyEmployeeSignin?.empId ||
      legacyEmployeeSignin?.identifier ||
      legacyEmployeeSignin?.id ||
      ""
  ).trim();
  return empId || "";
};

const resolvePreferredEmail = ({ authCache, legacyEmployeeSignin } = {}) => {
  const email = String(
    authCache?.officialEmail ||
      authCache?.official_email ||
      authCache?.email ||
      legacyEmployeeSignin?.officialEmail ||
      legacyEmployeeSignin?.official_email ||
      legacyEmployeeSignin?.email ||
      ""
  ).trim();
  return email || undefined;
};

/* ===================== COMPONENT ===================== */
/**
 * Props:
 * - title, subtitle, accent
 * - role (optional): "admin" | "employee" | "hr" | "manager"
 * - categoryOptions (optional)
 */
export default function DocumentManager({
  title = "Documents",
  subtitle,
  accent = "blue",
  role,
  categoryOptions = ["Offer Letter", "Payslip", "Appointment Letter", "HR Policy", "Other"],
}) {
  const theme = accentMap[accent] || accentMap.blue;
  const fileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [docTitle, setDocTitle] = useState("");
  const [category, setCategory] = useState(categoryOptions?.[0] || "Other");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  /* ---------- AUTH: ensure Supabase session (employee bridge) ---------- */
  const ensureDocsAuthSession = async () => {
    const { data: sess, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw sessErr;
    if (sess?.session?.user?.id) return sess.session.user;

    const authCache = readAuthCache();
    const legacyEmployeeSignin = readLegacyEmployeeSignin();
    const effectiveRole = resolveEffectiveRole({ roleProp: role, authCache });

    if (!ALLOWED_ROLES.has(effectiveRole)) return null;

    const identifier =
      effectiveRole === "employee"
        ? resolveEmployeeId({ authCache, legacyEmployeeSignin })
        : String(
            authCache?.user_id ||
              authCache?.userId ||
              authCache?.id ||
              authCache?.identifier ||
              authCache?.email ||
              ""
          ).trim();

    if (!identifier) return null;

    const preferredEmail = resolvePreferredEmail({ authCache, legacyEmployeeSignin });
    await ensureRoleAuthSession({ role: effectiveRole, identifier, preferredEmail });

    const { data: sess2, error: sess2Err } = await supabase.auth.getSession();
    if (sess2Err) throw sess2Err;
    return sess2?.session?.user || null;
  };

  /* ---------- AUTH: get current user ---------- */
  const getAuthedUser = async () => {
    const user = await ensureDocsAuthSession();
    if (user?.id) return user;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session?.user || null;
  };

  /* ---------- LOAD DOCS ---------- */
  const loadDocs = async () => {
    try {
      setErrMsg("");
      setLoading(true);

      const user = await getAuthedUser();
      if (!user?.id) {
        setDocs([]);
        setErrMsg("Please login (Supabase Auth) to view documents.");
        return;
      }

      const { data, error } = await supabase
        .from(DOCS_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocs((data || []).map(mapRowToUi));
    } catch (e) {
      console.error("loadDocs error:", e);
      setDocs([]);
      setErrMsg(e?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(() => {
      loadDocs();
    });

    const channel = supabase
      .channel("hrmss_documents_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: DOCS_TABLE }, () => {
        loadDocs();
      })
      .subscribe();

    return () => {
      try {
        authSub?.unsubscribe();
      } catch {
        // noop
      }
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- PICK FILE ---------- */
  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!docTitle) setDocTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  /* ---------- UPLOAD: Storage + DB ---------- */
  const upload = async () => {
    try {
      setErrMsg("");
      if (!file || !docTitle.trim()) return alert("Title & file required");

      setBusy(true);

      const user = await getAuthedUser();
      must(user?.id, "Please login (Supabase Auth) to upload documents.");

      const userId = user.id;
      const fileName = safeFileName(file.name);
      const stamp = Date.now();

      // path must start with auth.uid() folder
      const storagePath = `${userId}/${stamp}_${fileName}`;

      // 1) upload to storage
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;

      // 2) insert to db
      const payload = {
        user_id: userId,
        role: role && ALLOWED_ROLES.has(String(role).toLowerCase()) ? String(role).toLowerCase() : null,
        title: docTitle.trim(),
        category,
        file_name: fileName,
        mime_type: file.type || null,
        size_bytes: file.size ?? null,
        bucket: BUCKET,
        storage_path: storagePath,
      };

      const { data: inserted, error: insErr } = await supabase
        .from(DOCS_TABLE)
        .insert(payload)
        .select("*")
        .single();

      if (insErr) {
        await supabase.storage.from(BUCKET).remove([storagePath]); // rollback
        throw insErr;
      }

      setDocs((p) => [mapRowToUi(inserted), ...p]);

      setDocTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";

      alert("Document uploaded!");
    } catch (e) {
      console.error("upload error:", e);
      setErrMsg(e?.message || "Upload failed");
      alert(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- VIEW / DOWNLOAD: signed url ---------- */
  const openSignedUrl = async (doc, mode = "view") => {
    try {
      setErrMsg("");
      setBusy(true);

      const user = await getAuthedUser();
      must(user?.id, "Please login (Supabase Auth) to access documents.");

      const { data, error } = await supabase.storage
        .from(doc.bucket || BUCKET)
        .createSignedUrl(doc.storagePath, 60 * 10);

      if (error) throw error;

      const url = data?.signedUrl;
      must(url, "Failed to generate URL");

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("signed url error:", e);
      setErrMsg(e?.message || "Failed to open file");
      alert(e?.message || "Failed to open file");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- DELETE: DB + Storage ---------- */
  const remove = async (doc) => {
    const ok = window.confirm("Delete this document?");
    if (!ok) return;

    try {
      setErrMsg("");
      setBusy(true);

      const user = await getAuthedUser();
      must(user?.id, "Please login (Supabase Auth) to delete documents.");

      const { error: delErr } = await supabase.from(DOCS_TABLE).delete().eq("id", doc.id);
      if (delErr) throw delErr;

      const { error: stoErr } = await supabase.storage.from(doc.bucket || BUCKET).remove([doc.storagePath]);
      if (stoErr) console.warn("storage remove error:", stoErr);

      setDocs((p) => p.filter((d) => d.id !== doc.id));
    } catch (e) {
      console.error("remove error:", e);
      setErrMsg(e?.message || "Delete failed");
      alert(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- FILTER ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        (d.title || "").toLowerCase().includes(q) ||
        (d.fileName || "").toLowerCase().includes(q)
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
            type="button"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg border ${view === "grid" ? theme.solid : "bg-white"} ${theme.hover}`}
            aria-label="Grid view"
            type="button"
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {errMsg ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5" />
          <div className="min-w-0">{errMsg}</div>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div
          onClick={() => fileRef.current?.click()}
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
              <div className="text-xs text-gray-500">
                {formatBytes(file.size)} • {getFileType(file)}
              </div>
            </div>
            <button onClick={() => setFile(null)} className="text-xs underline" type="button">
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
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={upload}
            disabled={busy}
            className={`rounded-xl ${theme.solid} font-semibold text-sm ${theme.hover} px-4 py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
            type="button"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Upload Document
          </button>
        </div>

        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={pickFile}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv"
        />
      </div>

      <div className="flex items-center gap-2">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full md:w-72 rounded-xl border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={loadDocs}
          className="ml-auto text-xs px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
          disabled={busy}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading documents...
        </div>
      ) : view === "table" ? (
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(d.type)}`}>
                        {d.type}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold">{d.title}</div>
                        <div className="text-xs text-gray-500 truncate">{d.fileName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{d.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{d.category}</td>
                  <td className="px-4 py-3">{formatBytes(d.size)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openSignedUrl(d, "view")}
                        className="hover:opacity-80"
                        title="View"
                        disabled={busy}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openSignedUrl(d, "download")}
                        className="hover:opacity-80"
                        title="Download"
                        disabled={busy}
                      >
                        <Download size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(d)}
                        className="hover:opacity-80"
                        title="Delete"
                        disabled={busy}
                      >
                        <Trash2 size={16} className="text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500">No documents found</div>
          ) : null}

          {filtered.map((d) => (
            <div key={d.id} className="bg-white border rounded-2xl p-4 shadow-sm">
              <span className={`inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(d.type)}`}>
                {d.type}
              </span>
              <h3 className="font-semibold truncate">{d.title}</h3>
              <p className="text-xs text-gray-500 truncate">{d.fileName}</p>
              <p className="text-xs mt-1">{formatBytes(d.size)}</p>
              <p className="text-[11px] text-gray-400 mt-2">{d.date}</p>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => openSignedUrl(d, "view")} disabled={busy} title="View">
                  <Eye size={16} />
                </button>
                <button type="button" onClick={() => openSignedUrl(d, "download")} disabled={busy} title="Download">
                  <Download size={16} />
                </button>
                <button type="button" onClick={() => remove(d)} disabled={busy} title="Delete">
                  <Trash2 size={16} className="text-rose-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Connected to Supabase (Storage + DB). Users will see only their own documents (RLS).
      </p>
    </section>
  );
}

/* ===================== MAPPER ===================== */
function mapRowToUi(r) {
  const fileName = r.file_name || "";
  const lower = fileName.toLowerCase();

  const type =
    (r.mime_type || "").toLowerCase().includes("pdf")
      ? "PDF"
      : lower.endsWith(".pdf")
      ? "PDF"
      : lower.match(/\.(png|jpg|jpeg|webp|gif)$/)
      ? "IMAGE"
      : lower.match(/\.(doc|docx)$/)
      ? "WORD"
      : lower.match(/\.(xls|xlsx|csv)$/)
      ? "EXCEL"
      : "FILE";

  const dt = r.created_at ? new Date(r.created_at) : null;

  return {
    id: r.id,
    title: r.title,
    category: r.category,
    fileName,
    size: r.size_bytes ?? null,
    type,
    bucket: r.bucket,
    storagePath: r.storage_path,
    date: dt ? dt.toLocaleString() : "-",
  };
}
