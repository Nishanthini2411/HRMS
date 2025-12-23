// ✅ src/pages/employee/EmployeeSignIn.jsx
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
  Plus,
  Trash2,
  Building2,
  GraduationCap,
  Briefcase,
  CreditCard,
  HeartPulse,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";

/* ===================== CONFIG ===================== */

const ROLE_LABELS = {
  employee: "Employee",
  hr: "HR",
  admin: "Admin",
  manager: "Manager",
};

const ROLE_REDIRECTS = {
  employee: "/employee-dashboard",
  hr: "/hr-dashboard",
  admin: "/dashboard",
  manager: "/manager-dashboard",
};

const COMPLETION_KEY = (role) => `hrmss.signin.completed.${role}`;
const AUTH_KEY = "HRMSS_AUTH_SESSION";

/* ===================== HELPERS ===================== */

const emptyForm = (empIdFromLogin = "", userEmail = "") => ({
  employeeId: empIdFromLogin,
  fullName: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  bloodGroup: "",

  personalEmail: "",
  officialEmail: userEmail || "",
  mobileNumber: "",
  alternateContactNumber: "",

  currentAddress: "",
  permanentAddress: "",

  education: [{ qualification: "", institution: "", yearOfPassing: "", specialization: "" }],
  experience: [{ organization: "", designation: "", duration: "", reasonForLeaving: "" }],

  primarySkills: "",
  secondarySkills: "",
  toolsTechnologies: "",

  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",

  emergencyName: "",
  emergencyRelationship: "",
  emergencyContactNumber: "",

  location: "",
  avatar: "",
});

function mapDbToForm(row, empIdFromLogin = "", userEmail = "") {
  const form = emptyForm(empIdFromLogin, userEmail);

  return {
    ...form,
    employeeId: row.employee_id ?? empIdFromLogin ?? "",
    fullName: row.full_name ?? "",
    dob: row.dob ?? "",
    gender: row.gender ?? "",
    maritalStatus: row.marital_status ?? "",
    bloodGroup: row.blood_group ?? "",

    personalEmail: row.personal_email ?? "",
    officialEmail: row.official_email ?? userEmail ?? "",
    mobileNumber: row.mobile_number ?? "",
    alternateContactNumber: row.alternate_contact_number ?? "",

    currentAddress: row.current_address ?? "",
    permanentAddress: row.permanent_address ?? "",

    education: Array.isArray(row.education) && row.education.length ? row.education : form.education,
    experience: Array.isArray(row.experience) && row.experience.length ? row.experience : form.experience,

    primarySkills: row.primary_skills ?? "",
    secondarySkills: row.secondary_skills ?? "",
    toolsTechnologies: row.tools_technologies ?? "",

    accountHolderName: row.account_holder_name ?? "",
    bankName: row.bank_name ?? "",
    accountNumber: row.account_number ?? "",
    ifscCode: row.ifsc_code ?? "",
    branch: row.branch ?? "",

    emergencyName: row.emergency_name ?? "",
    emergencyRelationship: row.emergency_relationship ?? "",
    emergencyContactNumber: row.emergency_contact_number ?? "",

    location: row.location ?? "",
    avatar: row.avatar_url ?? "",
  };
}

function computeProfileKey({ role, form, userEmail }) {
  if (role === "employee") return (form.employeeId || "").trim();
  if (role === "hr" || role === "manager") return (form.officialEmail || userEmail || "").trim();
  return (form.employeeId || form.officialEmail || userEmail || "").trim(); // admin fallback
}

function readAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function uploadAvatar({ userId, file }) {
  const cleanName = (file.name || "avatar").replace(/\s+/g, "-");
  const path = `profiles/${userId}/${Date.now()}-${cleanName}`;

  const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl || "";
}

/* ===================== COMPONENT ===================== */

export default function EmployeeSignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const roleFromState = location.state?.role || "";
  const roleFromStorage = localStorage.getItem("hrmss.lastRole") || "";
  const role = roleFromState || roleFromStorage || "employee";

  const roleLabel = ROLE_LABELS[role] || "User";
  const redirectTo = location.state?.redirectTo || ROLE_REDIRECTS[role] || "/login";
  const empIdFromLogin = location.state?.empId || "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [form, setForm] = useState(() => emptyForm(empIdFromLogin, ""));

  useEffect(() => {
    if (role) localStorage.setItem("hrmss.lastRole", role);
  }, [role]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const authCache = readAuthSession();

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user || null;

        const userId = user?.id || authCache?.id || null;

        const userEmail =
          user?.email ||
          authCache?.email ||
          authCache?.official_email ||
          authCache?.identifier ||
          "";

        if (!userId) {
          navigate("/login", { replace: true, state: { redirectTo: "/sign-in", role } });
          return;
        }

        const { data: row, error: selErr } = await supabase
          .from("hrmss_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (selErr) throw selErr;
        if (!mounted) return;

        if (row) setForm(mapDbToForm(row, empIdFromLogin, userEmail));
        else setForm(emptyForm(empIdFromLogin, userEmail));
      } catch (e) {
        console.error(e);
        if (mounted) setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [empIdFromLogin, navigate, role]);

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const updateEducation = (index, key, value) => {
    setForm((p) => {
      const next = [...p.education];
      next[index] = { ...next[index], [key]: value };
      return { ...p, education: next };
    });
  };

  const addEducation = () => {
    setForm((p) => ({
      ...p,
      education: [...p.education, { qualification: "", institution: "", yearOfPassing: "", specialization: "" }],
    }));
  };

  const removeEducation = (index) => {
    setForm((p) => {
      const next = p.education.filter((_, i) => i !== index);
      return { ...p, education: next.length ? next : p.education };
    });
  };

  const updateExperience = (index, key, value) => {
    setForm((p) => {
      const next = [...p.experience];
      next[index] = { ...next[index], [key]: value };
      return { ...p, experience: next };
    });
  };

  const addExperience = () => {
    setForm((p) => ({
      ...p,
      experience: [...p.experience, { organization: "", designation: "", duration: "", reasonForLeaving: "" }],
    }));
  };

  const removeExperience = (index) => {
    setForm((p) => {
      const next = p.experience.filter((_, i) => i !== index);
      return { ...p, experience: next.length ? next : p.experience };
    });
  };

  const changeAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (form.avatar && String(form.avatar).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(form.avatar);
      } catch {}
    }

    setAvatarFile(file);
    setAvatarRemoved(false);
    onChange("avatar", URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    if (form.avatar && String(form.avatar).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(form.avatar);
      } catch {}
    }
    setAvatarFile(null);
    setAvatarRemoved(true);
    onChange("avatar", "");
  };

  const completeness = useMemo(() => {
    const must = [
      form.employeeId,
      form.fullName,
      form.dob,
      form.gender,
      form.personalEmail,
      form.mobileNumber,
      form.currentAddress,
      form.accountHolderName,
      form.bankName,
      form.accountNumber,
      form.ifscCode,
      form.emergencyName,
      form.emergencyContactNumber,
    ];
    const filled = must.filter((v) => String(v || "").trim().length > 0).length;
    return Math.round((filled / must.length) * 100);
  }, [form]);

  const saveAndContinue = async () => {
    try {
      setSaving(true);
      setError("");

      const requiredFields = [
        { key: "fullName", label: "Full Name" },
        { key: "personalEmail", label: "Personal Email" },
        { key: "mobileNumber", label: "Mobile Number" },
      ];

      if (role === "employee" || empIdFromLogin) {
        requiredFields.push({ key: "employeeId", label: "Employee ID" });
      }

      const missing = requiredFields.filter((f) => !String(form[f.key] || "").trim());
      if (missing.length) {
        setError("Please fill the required fields to continue.");
        return;
      }

      const authCache = readAuthSession();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user || null;

      const userId = user?.id || authCache?.id || null;
      const userEmail =
        user?.email ||
        authCache?.email ||
        authCache?.official_email ||
        authCache?.identifier ||
        "";

      if (!userId) {
        navigate("/login", { replace: true, state: { redirectTo: "/sign-in", role } });
        return;
      }

      const profile_key = computeProfileKey({ role, form, userEmail });
      if (!profile_key) {
        setError("Profile Key missing. (employeeId / officialEmail required)");
        return;
      }

      let avatar_url = form.avatar || "";
      if (avatarRemoved) {
        avatar_url = null;
      } else if (avatarFile) {
        avatar_url = await uploadAvatar({ userId, file: avatarFile });
      } else {
        if (String(avatar_url).startsWith("blob:")) avatar_url = null;
      }

      const payload = {
        user_id: userId,
        role,
        profile_key,

        employee_id: form.employeeId || null,
        full_name: form.fullName || null,
        dob: form.dob || null,
        gender: form.gender || null,
        marital_status: form.maritalStatus || null,
        blood_group: form.bloodGroup || null,

        personal_email: form.personalEmail || null,
        official_email: form.officialEmail || userEmail || null,
        mobile_number: form.mobileNumber || null,
        alternate_contact_number: form.alternateContactNumber || null,

        current_address: form.currentAddress || null,
        permanent_address: form.permanentAddress || null,

        education: Array.isArray(form.education) ? form.education : [],
        experience: Array.isArray(form.experience) ? form.experience : [],

        primary_skills: form.primarySkills || null,
        secondary_skills: form.secondarySkills || null,
        tools_technologies: form.toolsTechnologies || null,

        account_holder_name: form.accountHolderName || null,
        bank_name: form.bankName || null,
        account_number: form.accountNumber || null,
        ifsc_code: form.ifscCode || null,
        branch: form.branch || null,

        emergency_name: form.emergencyName || null,
        emergency_relationship: form.emergencyRelationship || null,
        emergency_contact_number: form.emergencyContactNumber || null,

        location: form.location || null,
        avatar_url: avatar_url || null,
      };

      const { error: upErr } = await supabase.from("hrmss_profiles").upsert(payload, { onConflict: "user_id" });
      if (upErr) throw upErr;

      if (avatar_url && String(form.avatar).startsWith("blob:")) {
        const old = form.avatar;
        onChange("avatar", avatar_url);
        try {
          URL.revokeObjectURL(old);
        } catch {}
      }

      localStorage.setItem(COMPLETION_KEY(role), "true");

      // ✅ This is the important part:
      // From Login "Sign In" button we pass redirectTo="/login"
      // so after save it comes back to Login page.
      navigate(redirectTo, { replace: true });
    } catch (e) {
      console.error(e);
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm text-sm font-semibold text-slate-700">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-0.5 inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              title="Back"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {roleLabel} Sign In
              </h1>
              <p className="text-sm text-slate-500">
                Personal details fill pannunga •{" "}
                <span className="font-semibold text-slate-800">{completeness}%</span>{" "}
                completed
              </p>

              {error ? (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (form.avatar && String(form.avatar).startsWith("blob:")) {
                  try {
                    URL.revokeObjectURL(form.avatar);
                  } catch {}
                }
                setAvatarFile(null);
                setAvatarRemoved(false);
                setForm((p) => emptyForm(empIdFromLogin, p.officialEmail || ""));
              }}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 shadow-sm"
            >
              Clear
            </button>

            <button
              onClick={saveAndContinue}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 shadow disabled:opacity-60"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: FORM */}
          <div className="lg:col-span-2 space-y-6">
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

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Profile Completion</span>
                    <span className="font-semibold text-white">{completeness}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full rounded-full bg-white" style={{ width: `${completeness}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                <SectionHeader icon={User} title="Personal Information" subtitle="Basic personal details" />

                <div className="flex flex-col md:flex-row gap-6 md:items-center">
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
                          <p className="mt-1 text-[11px] font-semibold text-slate-600">Add Photo</p>
                        </div>
                      </div>
                    )}

                    <label className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow cursor-pointer border hover:bg-slate-50">
                      <Camera size={16} className="text-slate-700" />
                      <input hidden type="file" accept="image/*" onChange={changeAvatar} />
                    </label>

                    {form.avatar && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-2 -left-2 rounded-xl border bg-white px-2 py-1 text-xs font-semibold text-rose-600 shadow hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input icon={User} label="EMPLOYEE FULL NAME" value={form.fullName} onChange={(v) => onChange("fullName", v)} placeholder="Enter full name" />
                    <Input icon={IdCard} label="EMPLOYEE ID (IF APPLICABLE)" value={form.employeeId} onChange={(v) => onChange("employeeId", v)} placeholder="EMP-001" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input icon={CalendarDays} label="DATE OF BIRTH" type="date" value={form.dob} onChange={(v) => onChange("dob", v)} />
                  <Select icon={User} label="GENDER" value={form.gender} onChange={(v) => onChange("gender", v)} options={["Male", "Female", "Other"]} placeholder="Select Gender" />
                  <Select icon={HeartPulse} label="MARITAL STATUS" value={form.maritalStatus} onChange={(v) => onChange("maritalStatus", v)} options={["Single", "Married", "Other"]} placeholder="Select Status" />
                  <Select icon={HeartPulse} label="BLOOD GROUP" value={form.bloodGroup} onChange={(v) => onChange("bloodGroup", v)} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} placeholder="Select Blood Group" />
                </div>

                <Divider />
                <SectionHeader icon={Phone} title="Contact Details" subtitle="Email & phone numbers" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input icon={Mail} label="PERSONAL EMAIL ID" value={form.personalEmail} onChange={(v) => onChange("personalEmail", v)} placeholder="name@gmail.com" />
                  <Input icon={Mail} label="OFFICIAL EMAIL ID" value={form.officialEmail} onChange={(v) => onChange("officialEmail", v)} placeholder="name@company.com" />
                  <Input icon={Phone} label="MOBILE NUMBER" value={form.mobileNumber} onChange={(v) => onChange("mobileNumber", v)} placeholder="+94 / +91 ..." />
                  <Input icon={Phone} label="ALTERNATE CONTACT NUMBER" value={form.alternateContactNumber} onChange={(v) => onChange("alternateContactNumber", v)} placeholder="+94 / +91 ..." />
                </div>

                <Divider />
                <SectionHeader icon={Home} title="Address Information" subtitle="Current & permanent address" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textarea icon={Home} label="CURRENT ADDRESS" value={form.currentAddress} onChange={(v) => onChange("currentAddress", v)} placeholder="Enter current address" />
                  <Textarea icon={Home} label="PERMANENT ADDRESS" value={form.permanentAddress} onChange={(v) => onChange("permanentAddress", v)} placeholder="Enter permanent address" />
                </div>

                <Divider />
                <SectionHeader
                  icon={GraduationCap}
                  title="Educational Qualifications"
                  subtitle="Add your education details"
                  right={
                    <button
                      type="button"
                      onClick={addEducation}
                      className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={14} /> Add Qualification
                    </button>
                  }
                />

                <div className="space-y-4">
                  {form.education.map((row, idx) => (
                    <div key={idx} className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-bold text-slate-900">Qualification #{idx + 1}</p>
                        {form.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducation(idx)}
                            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input icon={GraduationCap} label="QUALIFICATION" value={row.qualification} onChange={(v) => updateEducation(idx, "qualification", v)} placeholder="BSc / MSc / Diploma" />
                        <Input icon={Building2} label="INSTITUTION / UNIVERSITY" value={row.institution} onChange={(v) => updateEducation(idx, "institution", v)} placeholder="University name" />
                        <Input icon={CalendarDays} label="YEAR OF PASSING" value={row.yearOfPassing} onChange={(v) => updateEducation(idx, "yearOfPassing", v)} placeholder="2022" />
                        <Input icon={Sparkles} label="SPECIALIZATION" value={row.specialization} onChange={(v) => updateEducation(idx, "specialization", v)} placeholder="Computer Science" />
                      </div>
                    </div>
                  ))}
                </div>

                <Divider />
                <SectionHeader
                  icon={Briefcase}
                  title="Professional Experience"
                  subtitle="If applicable, add your past experience"
                  right={
                    <button
                      type="button"
                      onClick={addExperience}
                      className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={14} /> Add Experience
                    </button>
                  }
                />

                <div className="space-y-4">
                  {form.experience.map((row, idx) => (
                    <div key={idx} className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-bold text-slate-900">Experience #{idx + 1}</p>
                        {form.experience.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExperience(idx)}
                            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input icon={Building2} label="ORGANIZATION" value={row.organization} onChange={(v) => updateExperience(idx, "organization", v)} placeholder="Company name" />
                        <Input icon={Briefcase} label="DESIGNATION" value={row.designation} onChange={(v) => updateExperience(idx, "designation", v)} placeholder="Software Engineer" />
                        <Input icon={CalendarDays} label="DURATION" value={row.duration} onChange={(v) => updateExperience(idx, "duration", v)} placeholder="2021 - 2023" />
                        <Input icon={Sparkles} label="REASON FOR LEAVING" value={row.reasonForLeaving} onChange={(v) => updateExperience(idx, "reasonForLeaving", v)} placeholder="Better opportunity" />
                      </div>
                    </div>
                  ))}
                </div>

                <Divider />
                <SectionHeader icon={Sparkles} title="Skills & Expertise" subtitle="Mention your skills & tools" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input icon={Sparkles} label="PRIMARY SKILLS" value={form.primarySkills} onChange={(v) => onChange("primarySkills", v)} placeholder="React, Node, ..." />
                  <Input icon={Sparkles} label="SECONDARY SKILLS" value={form.secondarySkills} onChange={(v) => onChange("secondarySkills", v)} placeholder="UI/UX, Testing, ..." />
                  <Textarea icon={Sparkles} label="TOOLS / TECHNOLOGIES KNOWN" value={form.toolsTechnologies} onChange={(v) => onChange("toolsTechnologies", v)} placeholder="Git, Docker, Figma, Postman..." />
                </div>

                <Divider />
                <SectionHeader icon={CreditCard} title="Bank & Payroll Details" subtitle="Salary credit details" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input icon={User} label="ACCOUNT HOLDER NAME" value={form.accountHolderName} onChange={(v) => onChange("accountHolderName", v)} placeholder="Name as per bank" />
                  <Input icon={Building2} label="BANK NAME" value={form.bankName} onChange={(v) => onChange("bankName", v)} placeholder="Bank name" />
                  <Input icon={CreditCard} label="ACCOUNT NUMBER" value={form.accountNumber} onChange={(v) => onChange("accountNumber", v)} placeholder="XXXXXXXXXXXX" />
                  <Input icon={IdCard} label="IFSC CODE" value={form.ifscCode} onChange={(v) => onChange("ifscCode", v)} placeholder="IFSC0001234" />
                  <Input icon={MapPin} label="BRANCH" value={form.branch} onChange={(v) => onChange("branch", v)} placeholder="Branch name" />
                  <Input icon={MapPin} label="WORK LOCATION (OPTIONAL)" value={form.location} onChange={(v) => onChange("location", v)} placeholder="Colombo / Chennai" />
                </div>

                <Divider />
                <SectionHeader icon={HeartPulse} title="Emergency Contact Details" subtitle="Who to contact in emergency" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input icon={User} label="NAME" value={form.emergencyName} onChange={(v) => onChange("emergencyName", v)} placeholder="Contact person name" />
                  <Input icon={HeartPulse} label="RELATIONSHIP" value={form.emergencyRelationship} onChange={(v) => onChange("emergencyRelationship", v)} placeholder="Father / Mother / Spouse..." />
                  <Input icon={Phone} label="CONTACT NUMBER" value={form.emergencyContactNumber} onChange={(v) => onChange("emergencyContactNumber", v)} placeholder="+94 / +91 ..." />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Tip: Save pannitu dashboard ku poidum. Next time open panna details auto fill aagum.
                  </div>

                  <button
                    type="button"
                    onClick={saveAndContinue}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950 shadow disabled:opacity-60"
                  >
                    <Sparkles size={16} /> {saving ? "Saving..." : "Finish Setup"}
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
                <p className="text-xs text-slate-500 mt-1">This is how your profile will look</p>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3">
                  {form.avatar ? (
                    <img src={form.avatar} alt="preview" className="h-12 w-12 rounded-xl border object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                      <ImagePlus size={16} className="text-slate-500" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{form.fullName || "Your Name"}</p>
                    <p className="text-xs text-slate-500 truncate">{form.employeeId || "EMP-XXX"}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <MiniRow label="Personal Email" value={form.personalEmail} />
                  <MiniRow label="Official Email" value={form.officialEmail} />
                  <MiniRow label="Mobile" value={form.mobileNumber} />
                  <MiniRow label="DOB" value={form.dob} />
                  <MiniRow label="Gender" value={form.gender} />
                  <MiniRow label="Marital" value={form.maritalStatus} />
                  <MiniRow label="Blood Group" value={form.bloodGroup} />
                  <MiniRow label="Education Rows" value={String(form.education?.length || 0)} />
                  <MiniRow label="Experience Rows" value={String(form.experience?.length || 0)} />
                </div>

                <div className="mt-5 rounded-xl bg-purple-50 border border-purple-100 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 text-purple-700" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Completion Score</p>
                      <p className="text-xs text-purple-800/80 mt-1">
                        Fill remaining fields to reach 100% and unlock all features.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-purple-200 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-700" style={{ width: `${completeness}%` }} />
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
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-800 shadow-lg disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {Icon ? (
          <div className="mt-0.5 rounded-xl border bg-white p-2 shadow-sm">
            <Icon size={16} className="text-slate-700" />
          </div>
        ) : null}
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-slate-200" />;
}

function Input({ icon: Icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="group flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 transition">
        {Icon ? (
          <Icon size={16} className="text-slate-400 group-focus-within:text-purple-700 transition" />
        ) : null}

        <input
          type={type}
          className="w-full outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-transparent"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function Select({ icon: Icon, label, value, onChange, options, placeholder }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="group flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 transition">
        {Icon ? <Icon size={16} className="text-slate-400 group-focus-within:text-purple-700 transition" /> : null}
        <select
          className="w-full bg-transparent outline-none text-sm text-slate-900"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder || "Select"}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Textarea({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="group flex items-start gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 transition">
        {Icon ? <Icon size={16} className="mt-0.5 text-slate-400 group-focus-within:text-purple-700 transition" /> : null}
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

function MiniRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 text-right" title={value || "-"}>
        {value || "-"}
      </p>
    </div>
  );
}
