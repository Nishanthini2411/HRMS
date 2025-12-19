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

const PROFILE_KEYS = {
  employee: "hrmss.employee.signin",
  hr: "hrmss.hr.signin",
  admin: "hrmss.admin.signin",
  manager: "hrmss.manager.signin",
};

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

export default function EmployeeSignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const roleFromState = location.state?.role || "";
  const roleFromStorage = localStorage.getItem("hrmss.lastRole") || "";
  const role = roleFromState || roleFromStorage || "employee";
  const roleLabel = ROLE_LABELS[role] || "User";
  const redirectTo = location.state?.redirectTo || ROLE_REDIRECTS[role] || "/login";
  const profileKey = PROFILE_KEYS[role] || PROFILE_KEYS.employee;

  const empIdFromLogin = location.state?.empId || "";

  const [error, setError] = useState("");

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(profileKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          // keep backward compatibility if old saved object exists
          employeeId: parsed.employeeId ?? empIdFromLogin,
          fullName: parsed.fullName ?? "",
          dob: parsed.dob ?? "",
          gender: parsed.gender ?? "",
          maritalStatus: parsed.maritalStatus ?? "",
          bloodGroup: parsed.bloodGroup ?? "",

          personalEmail: parsed.personalEmail ?? "",
          officialEmail: parsed.officialEmail ?? "",
          mobileNumber: parsed.mobileNumber ?? "",
          alternateContactNumber: parsed.alternateContactNumber ?? "",

          currentAddress: parsed.currentAddress ?? "",
          permanentAddress: parsed.permanentAddress ?? "",

          education:
            Array.isArray(parsed.education) && parsed.education.length > 0
              ? parsed.education
              : [
                  {
                    qualification: "",
                    institution: "",
                    yearOfPassing: "",
                    specialization: "",
                  },
                ],

          experience:
            Array.isArray(parsed.experience) && parsed.experience.length > 0
              ? parsed.experience
              : [
                  {
                    organization: "",
                    designation: "",
                    duration: "",
                    reasonForLeaving: "",
                  },
                ],

          primarySkills: parsed.primarySkills ?? "",
          secondarySkills: parsed.secondarySkills ?? "",
          toolsTechnologies: parsed.toolsTechnologies ?? "",

          accountHolderName: parsed.accountHolderName ?? "",
          bankName: parsed.bankName ?? "",
          accountNumber: parsed.accountNumber ?? "",
          ifscCode: parsed.ifscCode ?? "",
          branch: parsed.branch ?? "",

          emergencyName: parsed.emergencyName ?? "",
          emergencyRelationship: parsed.emergencyRelationship ?? "",
          emergencyContactNumber: parsed.emergencyContactNumber ?? "",

          location: parsed.location ?? "",

          avatar: parsed.avatar ?? "", // ✅ default image removed (empty)
        };
      } catch {
        // ignore
      }
    }

    return {
      // Personal Information
      employeeId: empIdFromLogin,
      fullName: "",
      dob: "", // DD/MM/YYYY
      gender: "",
      maritalStatus: "",
      bloodGroup: "",

      // Contact Details
      personalEmail: "",
      officialEmail: "",
      mobileNumber: "",
      alternateContactNumber: "",

      // Address Information
      currentAddress: "",
      permanentAddress: "",

      // Educational Qualifications (repeatable)
      education: [
        { qualification: "", institution: "", yearOfPassing: "", specialization: "" },
      ],

      // Professional Experience (repeatable)
      experience: [
        { organization: "", designation: "", duration: "", reasonForLeaving: "" },
      ],

      // Skills & Expertise
      primarySkills: "",
      secondarySkills: "",
      toolsTechnologies: "",

      // Bank & Payroll Details
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",

      // Emergency Contact Details
      emergencyName: "",
      emergencyRelationship: "",
      emergencyContactNumber: "",

      // Optional work location
      location: "",

      // Image
      avatar: "", // ✅ empty by default
    };
  });

  // keep employeeId from login (if user comes from login)
  useEffect(() => {
    if (!empIdFromLogin) return;
    setForm((p) => ({ ...p, employeeId: empIdFromLogin }));
  }, [empIdFromLogin]);

  useEffect(() => {
    if (role) localStorage.setItem("hrmss.lastRole", role);
  }, [role]);

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
      education: [
        ...p.education,
        { qualification: "", institution: "", yearOfPassing: "", specialization: "" },
      ],
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
      experience: [
        ...p.experience,
        { organization: "", designation: "", duration: "", reasonForLeaving: "" },
      ],
    }));
  };

  const removeExperience = (index) => {
    setForm((p) => {
      const next = p.experience.filter((_, i) => i !== index);
      return { ...p, experience: next.length ? next : p.experience };
    });
  };

  // image upload
  const changeAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // revoke old URL (if any)
    if (form.avatar && String(form.avatar).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(form.avatar);
      } catch {
        // ignore
      }
    }

    onChange("avatar", URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    if (form.avatar && String(form.avatar).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(form.avatar);
      } catch {
        // ignore
      }
    }
    onChange("avatar", "");
  };

  const completeness = useMemo(() => {
    // you can decide what is mandatory; I included key fields as must
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

  const saveAndContinue = () => {
    const requiredFields = [
      { key: "fullName", label: "Full Name" },
      { key: "personalEmail", label: "Personal Email" },
      { key: "mobileNumber", label: "Mobile Number" },
    ];

    if (role === "employee" || empIdFromLogin) {
      requiredFields.push({ key: "employeeId", label: "Employee ID" });
    }

    const missing = requiredFields.filter(
      (field) => !String(form[field.key] || "").trim()
    );

    if (missing.length) {
      setError("Please fill the required fields to continue.");
      return;
    }

    setError("");
    localStorage.setItem(profileKey, JSON.stringify(form));
    localStorage.setItem(COMPLETION_KEY(role), "true");
    navigate(redirectTo);
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
                localStorage.setItem(profileKey, JSON.stringify(form));
                navigate(-1);
              }}
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
                localStorage.removeItem(profileKey);

                // revoke old avatar URL if blob
                if (form.avatar && String(form.avatar).startsWith("blob:")) {
                  try {
                    URL.revokeObjectURL(form.avatar);
                  } catch {
                    // ignore
                  }
                }

                setForm({
                  employeeId: empIdFromLogin,
                  fullName: "",
                  dob: "",
                  gender: "",
                  maritalStatus: "",
                  bloodGroup: "",

                  personalEmail: "",
                  officialEmail: "",
                  mobileNumber: "",
                  alternateContactNumber: "",

                  currentAddress: "",
                  permanentAddress: "",

                  education: [
                    { qualification: "", institution: "", yearOfPassing: "", specialization: "" },
                  ],
                  experience: [
                    { organization: "", designation: "", duration: "", reasonForLeaving: "" },
                  ],

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
                    <span className="font-semibold text-white">{completeness}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6 md:p-8 space-y-8">
                {/* PHOTO + BASIC */}
                <SectionHeader
                  icon={User}
                  title="Personal Information"
                  subtitle="Basic personal details"
                />

                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                  {/* IMAGE UPLOAD (empty by default) */}
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
                    <Input
                      icon={User}
                      label="EMPLOYEE FULL NAME"
                      value={form.fullName}
                      onChange={(v) => onChange("fullName", v)}
                      placeholder="Enter full name"
                    />
                    <Input
                      icon={IdCard}
                      label="EMPLOYEE ID (IF APPLICABLE)"
                      value={form.employeeId}
                      onChange={(v) => onChange("employeeId", v)}
                      placeholder="EMP-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={CalendarDays}
                    label="DATE OF BIRTH (DD/MM/YYYY)"
                    value={form.dob}
                    onChange={(v) => onChange("dob", v)}
                    placeholder="DD/MM/YYYY"
                  />

                  <Select
                    icon={User}
                    label="GENDER"
                    value={form.gender}
                    onChange={(v) => onChange("gender", v)}
                    options={["Male", "Female", "Other"]}
                    placeholder="Select Gender"
                  />

                  <Select
                    icon={HeartPulse}
                    label="MARITAL STATUS"
                    value={form.maritalStatus}
                    onChange={(v) => onChange("maritalStatus", v)}
                    options={["Single", "Married", "Other"]}
                    placeholder="Select Status"
                  />

                  <Select
                    icon={HeartPulse}
                    label="BLOOD GROUP"
                    value={form.bloodGroup}
                    onChange={(v) => onChange("bloodGroup", v)}
                    options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                    placeholder="Select Blood Group"
                  />
                </div>

                {/* CONTACT */}
                <Divider />
                <SectionHeader
                  icon={Phone}
                  title="Contact Details"
                  subtitle="Email & phone numbers"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={Mail}
                    label="PERSONAL EMAIL ID"
                    value={form.personalEmail}
                    onChange={(v) => onChange("personalEmail", v)}
                    placeholder="name@gmail.com"
                  />
                  <Input
                    icon={Mail}
                    label="OFFICIAL EMAIL ID"
                    value={form.officialEmail}
                    onChange={(v) => onChange("officialEmail", v)}
                    placeholder="name@company.com"
                  />
                  <Input
                    icon={Phone}
                    label="MOBILE NUMBER"
                    value={form.mobileNumber}
                    onChange={(v) => onChange("mobileNumber", v)}
                    placeholder="+94 / +91 ..."
                  />
                  <Input
                    icon={Phone}
                    label="ALTERNATE CONTACT NUMBER"
                    value={form.alternateContactNumber}
                    onChange={(v) => onChange("alternateContactNumber", v)}
                    placeholder="+94 / +91 ..."
                  />
                </div>

                {/* ADDRESS */}
                <Divider />
                <SectionHeader
                  icon={Home}
                  title="Address Information"
                  subtitle="Current & permanent address"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textarea
                    icon={Home}
                    label="CURRENT ADDRESS"
                    value={form.currentAddress}
                    onChange={(v) => onChange("currentAddress", v)}
                    placeholder="Enter current address"
                  />
                  <Textarea
                    icon={Home}
                    label="PERMANENT ADDRESS"
                    value={form.permanentAddress}
                    onChange={(v) => onChange("permanentAddress", v)}
                    placeholder="Enter permanent address"
                  />
                </div>

                {/* EDUCATION */}
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
                        <p className="text-sm font-bold text-slate-900">
                          Qualification #{idx + 1}
                        </p>
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
                        <Input
                          icon={GraduationCap}
                          label="QUALIFICATION"
                          value={row.qualification}
                          onChange={(v) => updateEducation(idx, "qualification", v)}
                          placeholder="BSc / MSc / Diploma"
                        />
                        <Input
                          icon={Building2}
                          label="INSTITUTION / UNIVERSITY"
                          value={row.institution}
                          onChange={(v) => updateEducation(idx, "institution", v)}
                          placeholder="University name"
                        />
                        <Input
                          icon={CalendarDays}
                          label="YEAR OF PASSING"
                          value={row.yearOfPassing}
                          onChange={(v) => updateEducation(idx, "yearOfPassing", v)}
                          placeholder="2022"
                        />
                        <Input
                          icon={Sparkles}
                          label="SPECIALIZATION"
                          value={row.specialization}
                          onChange={(v) => updateEducation(idx, "specialization", v)}
                          placeholder="Computer Science"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* EXPERIENCE */}
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
                        <p className="text-sm font-bold text-slate-900">
                          Experience #{idx + 1}
                        </p>
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
                        <Input
                          icon={Building2}
                          label="ORGANIZATION"
                          value={row.organization}
                          onChange={(v) => updateExperience(idx, "organization", v)}
                          placeholder="Company name"
                        />
                        <Input
                          icon={Briefcase}
                          label="DESIGNATION"
                          value={row.designation}
                          onChange={(v) => updateExperience(idx, "designation", v)}
                          placeholder="Software Engineer"
                        />
                        <Input
                          icon={CalendarDays}
                          label="DURATION"
                          value={row.duration}
                          onChange={(v) => updateExperience(idx, "duration", v)}
                          placeholder="2021 - 2023"
                        />
                        <Input
                          icon={Sparkles}
                          label="REASON FOR LEAVING"
                          value={row.reasonForLeaving}
                          onChange={(v) => updateExperience(idx, "reasonForLeaving", v)}
                          placeholder="Better opportunity"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* SKILLS */}
                <Divider />
                <SectionHeader
                  icon={Sparkles}
                  title="Skills & Expertise"
                  subtitle="Mention your skills & tools"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={Sparkles}
                    label="PRIMARY SKILLS"
                    value={form.primarySkills}
                    onChange={(v) => onChange("primarySkills", v)}
                    placeholder="React, Node, ..."
                  />
                  <Input
                    icon={Sparkles}
                    label="SECONDARY SKILLS"
                    value={form.secondarySkills}
                    onChange={(v) => onChange("secondarySkills", v)}
                    placeholder="UI/UX, Testing, ..."
                  />
                  <Textarea
                    icon={Sparkles}
                    label="TOOLS / TECHNOLOGIES KNOWN"
                    value={form.toolsTechnologies}
                    onChange={(v) => onChange("toolsTechnologies", v)}
                    placeholder="Git, Docker, Figma, Postman..."
                  />
                </div>

                {/* BANK */}
                <Divider />
                <SectionHeader
                  icon={CreditCard}
                  title="Bank & Payroll Details"
                  subtitle="Salary credit details"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={User}
                    label="ACCOUNT HOLDER NAME"
                    value={form.accountHolderName}
                    onChange={(v) => onChange("accountHolderName", v)}
                    placeholder="Name as per bank"
                  />
                  <Input
                    icon={Building2}
                    label="BANK NAME"
                    value={form.bankName}
                    onChange={(v) => onChange("bankName", v)}
                    placeholder="Bank name"
                  />
                  <Input
                    icon={CreditCard}
                    label="ACCOUNT NUMBER"
                    value={form.accountNumber}
                    onChange={(v) => onChange("accountNumber", v)}
                    placeholder="XXXXXXXXXXXX"
                  />
                  <Input
                    icon={IdCard}
                    label="IFSC CODE"
                    value={form.ifscCode}
                    onChange={(v) => onChange("ifscCode", v)}
                    placeholder="IFSC0001234"
                  />
                  <Input
                    icon={MapPin}
                    label="BRANCH"
                    value={form.branch}
                    onChange={(v) => onChange("branch", v)}
                    placeholder="Branch name"
                  />
                  <Input
                    icon={MapPin}
                    label="WORK LOCATION (OPTIONAL)"
                    value={form.location}
                    onChange={(v) => onChange("location", v)}
                    placeholder="Colombo / Chennai"
                  />
                </div>

                {/* EMERGENCY */}
                <Divider />
                <SectionHeader
                  icon={HeartPulse}
                  title="Emergency Contact Details"
                  subtitle="Who to contact in emergency"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={User}
                    label="NAME"
                    value={form.emergencyName}
                    onChange={(v) => onChange("emergencyName", v)}
                    placeholder="Contact person name"
                  />
                  <Input
                    icon={HeartPulse}
                    label="RELATIONSHIP"
                    value={form.emergencyRelationship}
                    onChange={(v) => onChange("emergencyRelationship", v)}
                    placeholder="Father / Mother / Spouse..."
                  />
                  <Input
                    icon={Phone}
                    label="CONTACT NUMBER"
                    value={form.emergencyContactNumber}
                    onChange={(v) => onChange("emergencyContactNumber", v)}
                    placeholder="+94 / +91 ..."
                  />
                </div>

                {/* FOOTER ACTION */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900">Quick Notes</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                <li>Default image இல்லை — நீங்க upload பண்ணினா மட்டும் preview வரும்.</li>
                <li>Education / Experience rows add/remove பண்ணலாம்.</li>
                <li>Save pannina details localStorage-la store ஆகும்.</li>
              </ul>
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
          {subtitle ? (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-slate-200" />;
}

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

function Select({ icon: Icon, label, value, onChange, options, placeholder }) {
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
