import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Save,
  IdCard,
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Home,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ImagePlus,
} from "lucide-react";

const LS_KEY = "hrmss.employee.signin";

export default function EmployeeSignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const empIdFromLogin = location.state?.empId || "";

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      employeeId: empIdFromLogin,
      fullName: "",
      dob: "",
      email: "",
      phone: "",
      address: "",
      location: "",
      avatar: "", // ✅ default image removed (no pravatar)
    };
  });

  // keep employeeId from login (if user comes from login)
  useEffect(() => {
    if (!empIdFromLogin) return;
    setForm((p) => ({ ...p, employeeId: empIdFromLogin }));
  }, [empIdFromLogin]);

  const completeness = useMemo(() => {
    const must = [
      form.employeeId,
      form.fullName,
      form.dob,
      form.email,
      form.phone,
      form.address,
    ];
    const filled = must.filter((v) => String(v || "").trim().length > 0).length;
    return Math.round((filled / must.length) * 100);
  }, [form]);

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const changeAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange("avatar", URL.createObjectURL(file));
  };

  const saveAndContinue = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
    navigate("/employee-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(LS_KEY, JSON.stringify(form));
                navigate(-1);
              }}
              className="mt-0.5 inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              title="Back"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Employee Sign In
              </h1>
              <p className="text-sm text-slate-500">
                Personal details fill pannunga •{" "}
                <span className="font-semibold text-slate-800">
                  {completeness}%
                </span>{" "}
                completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(LS_KEY);
                setForm({
                  employeeId: empIdFromLogin,
                  fullName: "",
                  dob: "",
                  email: "",
                  phone: "",
                  address: "",
                  location: "",
                  avatar: "", // ✅ reset avatar empty
                });
              }}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 shadow-sm"
            >
              Clear
            </button>

            <button
              onClick={saveAndContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 shadow"
            >
              <Save size={16} /> Save & Continue
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: FORM */}
          <div className="lg:col-span-2 space-y-6">
            {/* HEADER CARD */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/80">
                      First Time Setup
                    </p>
                    <h2 className="text-lg md:text-xl font-bold leading-tight">
                      Complete your profile to continue
                    </h2>
                  </div>

                  <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <ShieldCheck size={16} />
                    <span className="text-sm font-semibold">Secure</span>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Profile Completion</span>
                    <span className="font-semibold text-white">
                      {completeness}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* PROFILE ROW */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  {/* ✅ IMAGE UPLOAD (no default image) */}
                  <div className="relative w-fit">
                    {form.avatar ? (
                      <img
                        src={form.avatar}
                        alt="avatar"
                        className="h-24 w-24 md:h-28 md:w-28 rounded-2xl border object-cover shadow-sm"
                      />
                    ) : (
                      <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shadow-sm">
                        <div className="text-center">
                          <ImagePlus className="mx-auto text-slate-500" size={20} />
                          <p className="mt-1 text-[11px] font-semibold text-slate-600">
                            Add Photo
                          </p>
                        </div>
                      </div>
                    )}

                    <label className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow cursor-pointer border hover:bg-slate-50">
                      <Camera size={16} className="text-slate-700" />
                      <input hidden type="file" accept="image/*" onChange={changeAvatar} />
                    </label>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      icon={IdCard}
                      label="EMPLOYEE ID"
                      value={form.employeeId}
                      onChange={(v) => onChange("employeeId", v)}
                      placeholder="EMP-001"
                    />
                    <Input
                      icon={User}
                      label="FULL NAME"
                      value={form.fullName}
                      onChange={(v) => onChange("fullName", v)}
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* PERSONAL DETAILS */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={CalendarDays}
                    label="DATE OF BIRTH"
                    value={form.dob}
                    onChange={(v) => onChange("dob", v)}
                    placeholder="YYYY-MM-DD"
                  />
                  <Input
                    icon={Mail}
                    label="EMAIL"
                    value={form.email}
                    onChange={(v) => onChange("email", v)}
                    placeholder="name@email.com"
                  />
                  <Input
                    icon={Phone}
                    label="PHONE"
                    value={form.phone}
                    onChange={(v) => onChange("phone", v)}
                    placeholder="+94 / +91 ..."
                  />
                  <Input
                    icon={MapPin}
                    label="WORK LOCATION"
                    value={form.location}
                    onChange={(v) => onChange("location", v)}
                    placeholder="Colombo / Chennai"
                  />

                  <Textarea
                    icon={Home}
                    label="ADDRESS"
                    value={form.address}
                    onChange={(v) => onChange("address", v)}
                    placeholder="Enter address"
                  />
                </div>

                {/* ACTIONS BOTTOM */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Tip: Save pannitu dashboard ku poidum. Next time open panna details auto fill aagum.
                  </div>

                  <button
                    type="button"
                    onClick={saveAndContinue}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950 shadow"
                  >
                    <Sparkles size={16} /> Finish Setup
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: PREVIEW / SUMMARY */}
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b">
                <h3 className="text-sm font-bold text-slate-900">Preview</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This is how your profile will look
                </p>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3">
                  {/* ✅ preview image placeholder too */}
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="preview"
                      className="h-12 w-12 rounded-xl border object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                      <ImagePlus size={16} className="text-slate-500" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {form.fullName || "Your Name"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {form.employeeId || "EMP-XXX"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <MiniRow label="Email" value={form.email} />
                  <MiniRow label="Phone" value={form.phone} />
                  <MiniRow label="DOB" value={form.dob} />
                  <MiniRow label="Location" value={form.location} />
                  <MiniRow label="Address" value={form.address} multiline />
                </div>

                <div className="mt-5 rounded-xl bg-purple-50 border border-purple-100 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 text-purple-700" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900">
                        Completion Score
                      </p>
                      <p className="text-xs text-purple-800/80 mt-1">
                        Fill remaining fields to reach 100% and unlock all features.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-purple-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-700"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE FIXED SAVE */}
        <div className="lg:hidden sticky bottom-3">
          <button
            onClick={saveAndContinue}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-800 shadow-lg"
          >
            <Save size={16} /> Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function Input({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="group flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 transition">
        {Icon ? (
          <Icon
            size={16}
            className="text-slate-400 group-focus-within:text-purple-700 transition"
          />
        ) : null}
        <input
          className="w-full outline-none text-sm text-slate-900 placeholder:text-slate-400"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function Textarea({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div className="md:col-span-2 space-y-1.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="group flex items-start gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 transition">
        {Icon ? (
          <Icon
            size={16}
            className="mt-0.5 text-slate-400 group-focus-within:text-purple-700 transition"
          />
        ) : null}
        <textarea
          className="w-full outline-none text-sm text-slate-900 placeholder:text-slate-400 min-h-[110px] resize-none"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function MiniRow({ label, value, multiline }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`text-sm font-semibold text-slate-900 text-right ${
          multiline ? "whitespace-pre-wrap" : "truncate"
        }`}
        title={value || "-"}
      >
        {value || "-"}
      </p>
    </div>
  );
}
