import { useEffect, useState } from "react";
import { Badge, Divider, SectionCard } from "../shared/ui.jsx";
import {
  MapPin,
  IdCard,
  Briefcase,
  Phone,
  Pencil,
  X,
  Camera,
  Mail,
  GraduationCap,
  Building2,
  CreditCard,
  HeartPulse,
  Home,
} from "lucide-react";

import { supabase, isSupabaseConfigured } from "../../../lib/supabaseClient";
import { employeeProfile as seedProfile } from "../shared/employeeStore";
import DocumentManager from "../../../components/DocumentManager.jsx";

/**
 * ✅ IMPORTANT:
 * EmployeeSignIn.jsx stores cache like:
 *   hrmss.profile.cache.employee.<employee_id>
 */
const AUTH_KEY = "HRMSS_AUTH_SESSION";
const PROFILE_CACHE_KEY = (role, key) => `hrmss.profile.cache.${role}.${key || "unknown"}`;

// (optional legacy key fallback - keep if already used previously)
const LEGACY_LS_KEY = "hrmss.employee.signin";

/* ========================= Helpers ========================= */

function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readEmployeeIdFromAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  const s = safeJsonParse(raw);
  const empId = (s?.employee_id || s?.identifier || s?.id || "").trim();
  return empId || "";
}

function mapDbRowToSaved(row, empId) {
  if (!row) return null;

  return {
    employeeId: row.employee_id || empId || "",
    fullName: row.full_name || "",
    dob: row.dob || "",
    gender: row.gender || "",
    maritalStatus: row.marital_status || "",
    bloodGroup: row.blood_group || "",

    personalEmail: row.personal_email || "",
    officialEmail: row.official_email || "",
    mobileNumber: row.mobile_number || "",
    alternateContactNumber: row.alternate_contact_number || "",

    currentAddress: row.current_address || "",
    permanentAddress: row.permanent_address || "",

    education: Array.isArray(row.education) ? row.education : [],
    experience: Array.isArray(row.experience) ? row.experience : [],

    primarySkills: row.primary_skills || "",
    secondarySkills: row.secondary_skills || "",
    toolsTechnologies: row.tools_technologies || "",

    accountHolderName: row.account_holder_name || "",
    bankName: row.bank_name || "",
    accountNumber: row.account_number || "",
    ifscCode: row.ifsc_code || "",
    branch: row.branch || "",

    emergencyName: row.emergency_name || "",
    emergencyRelationship: row.emergency_relationship || "",
    emergencyContactNumber: row.emergency_contact_number || "",

    location: row.location || "",
    avatar: row.avatar_url || "",
  };
}

function mergeSeedWithSaved(base, saved) {
  if (!saved) return base;

  const mergedEmergency =
    Array.isArray(base?.emergencyContacts) && base.emergencyContacts.length
      ? base.emergencyContacts
      : saved?.emergencyName || saved?.emergencyContactNumber
      ? [
          {
            name: saved.emergencyName || "",
            relation: saved.emergencyRelationship || "",
            phone: saved.emergencyContactNumber || "",
          },
        ]
      : base?.emergencyContacts || [];

  return {
    ...base,

    avatar: saved.avatar || base?.avatar || "",
    name: saved.fullName || base?.name || "",
    id: saved.employeeId || base?.id || "",

    personal: {
      ...(base?.personal || {}),
      dob: saved.dob || base?.personal?.dob || "",
      email: saved.personalEmail || base?.personal?.email || "",
      phone: saved.mobileNumber || base?.personal?.phone || "",
      address: saved.currentAddress || base?.personal?.address || "",

      gender: saved.gender || base?.personal?.gender || "",
      maritalStatus: saved.maritalStatus || "",
      bloodGroup: saved.bloodGroup || "",

      personalEmail: saved.personalEmail || "",
      officialEmail: saved.officialEmail || "",
      mobileNumber: saved.mobileNumber || "",
      alternateContactNumber: saved.alternateContactNumber || "",

      currentAddress: saved.currentAddress || "",
      permanentAddress: saved.permanentAddress || "",
    },

    job: {
      ...(base?.job || {}),
      employeeId: saved.employeeId || base?.job?.employeeId || "",
      location: saved.location || base?.job?.location || "",
    },

    education: Array.isArray(saved.education) ? saved.education : base?.education || [],
    experience: Array.isArray(saved.experience) ? saved.experience : base?.experience || [],

    skills: {
      primarySkills: saved.primarySkills || base?.skills?.primarySkills || "",
      secondarySkills: saved.secondarySkills || base?.skills?.secondarySkills || "",
      toolsTechnologies: saved.toolsTechnologies || base?.skills?.toolsTechnologies || "",
    },

    bank: {
      accountHolderName: saved.accountHolderName || base?.bank?.accountHolderName || "",
      bankName: saved.bankName || base?.bank?.bankName || "",
      accountNumber: saved.accountNumber || base?.bank?.accountNumber || "",
      ifscCode: saved.ifscCode || base?.bank?.ifscCode || "",
      branch: saved.branch || base?.bank?.branch || "",
    },

    emergencyContacts: mergedEmergency,
  };
}

function profileToSaved(profile) {
  const p = profile || {};
  const personal = p.personal || {};
  const job = p.job || {};
  const skills = p.skills || {};
  const bank = p.bank || {};

  const firstEmergency =
    Array.isArray(p.emergencyContacts) && p.emergencyContacts.length
      ? p.emergencyContacts[0]
      : null;

  return {
    employeeId: p.id || job.employeeId || "",
    fullName: p.name || "",
    dob: personal.dob || "",
    gender: personal.gender || "",
    maritalStatus: personal.maritalStatus || "",
    bloodGroup: personal.bloodGroup || "",

    personalEmail: personal.personalEmail || personal.email || "",
    officialEmail: personal.officialEmail || "",
    mobileNumber: personal.mobileNumber || personal.phone || "",
    alternateContactNumber: personal.alternateContactNumber || "",

    currentAddress: personal.currentAddress || personal.address || "",
    permanentAddress: personal.permanentAddress || "",

    education: Array.isArray(p.education) ? p.education : [],
    experience: Array.isArray(p.experience) ? p.experience : [],

    primarySkills: skills.primarySkills || "",
    secondarySkills: skills.secondarySkills || "",
    toolsTechnologies: skills.toolsTechnologies || "",

    accountHolderName: bank.accountHolderName || "",
    bankName: bank.bankName || "",
    accountNumber: bank.accountNumber || "",
    ifscCode: bank.ifscCode || "",
    branch: bank.branch || "",

    emergencyName: firstEmergency?.name || "",
    emergencyRelationship: firstEmergency?.relation || "",
    emergencyContactNumber: firstEmergency?.phone || "",

    location: job.location || "",
    avatar: p.avatar || "",
  };
}

function savedToDbPayload(saved) {
  const empId = String(saved?.employeeId || "").trim();

  return {
    employee_id: empId,
    profile_key: empId,

    full_name: saved.fullName || null,
    dob: saved.dob || null,
    gender: saved.gender || null,
    marital_status: saved.maritalStatus || null,
    blood_group: saved.bloodGroup || null,

    personal_email: saved.personalEmail || null,
    official_email: saved.officialEmail || null,
    mobile_number: saved.mobileNumber || null,
    alternate_contact_number: saved.alternateContactNumber || null,

    current_address: saved.currentAddress || null,
    permanent_address: saved.permanentAddress || null,

    education: Array.isArray(saved.education) ? saved.education : [],
    experience: Array.isArray(saved.experience) ? saved.experience : [],

    primary_skills: saved.primarySkills || null,
    secondary_skills: saved.secondarySkills || null,
    tools_technologies: saved.toolsTechnologies || null,

    account_holder_name: saved.accountHolderName || null,
    bank_name: saved.bankName || null,
    account_number: saved.accountNumber || null,
    ifsc_code: saved.ifscCode || null,
    branch: saved.branch || null,

    emergency_name: saved.emergencyName || null,
    emergency_relationship: saved.emergencyRelationship || null,
    emergency_contact_number: saved.emergencyContactNumber || null,

    location: saved.location || null,
    avatar_url: saved.avatar || null,

    // ✅ mark completed (optional but recommended)
    profile_completed: true,
    completed_at: new Date().toISOString(),
  };
}

// ✅ employee uses employeeId as "folder"
async function uploadAvatar({ folderKey, file }) {
  const cleanName = (file.name || "avatar").replace(/\s+/g, "-");
  const path = `profiles/${folderKey}/${Date.now()}-${cleanName}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl || "";
}

/* ===================================================== */
export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [profile, setProfile] = useState(seedProfile);

  // modals
  const [editProfile, setEditProfile] = useState(false);
  const [addEmergency, setAddEmergency] = useState(false);
  const [editEmergency, setEditEmergency] = useState(null);
  const [addId, setAddId] = useState(false);
  const [editId, setEditId] = useState(null);

  // ✅ LOAD FROM localStorage OR DB (Sign-In data)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setLoadErr("");

        const base = seedProfile;

        const empId = readEmployeeIdFromAuth();
        const cacheKey = PROFILE_CACHE_KEY("employee", empId);

        // 1) Try NEW cache key (EmployeeSignIn writes here)
        if (empId) {
          const savedLS = safeJsonParse(localStorage.getItem(cacheKey));
          if (savedLS) {
            const merged = mergeSeedWithSaved(base, savedLS);
            if (mounted) setProfile(merged);
            return;
          }
        }

        // 1b) legacy fallback (if old cache exists)
        const legacy = safeJsonParse(localStorage.getItem(LEGACY_LS_KEY));
        if (legacy) {
          const merged = mergeSeedWithSaved(base, legacy);
          if (mounted) setProfile(merged);

          // migrate legacy -> new key if possible
          if (empId) {
            localStorage.setItem(cacheKey, JSON.stringify(legacy));
          }
          return;
        }

        // 2) Try Supabase DB (hrmss_employee_profiles)
        if (!empId) {
          if (mounted) setProfile(base);
          return;
        }

        if (!isSupabaseConfigured) {
          if (mounted) {
            setProfile(base);
            setLoadErr("Supabase env missing. Unable to load employee profile from DB.");
          }
          return;
        }

        const { data, error } = await supabase
          .from("hrmss_employee_profiles")
          .select("*")
          .eq("employee_id", empId)
          .maybeSingle();

        if (error) throw error;

        const savedFromDb = mapDbRowToSaved(data, empId);

        if (savedFromDb) {
          // Cache into localStorage (same key as Sign-In)
          localStorage.setItem(cacheKey, JSON.stringify(savedFromDb));
          const merged = mergeSeedWithSaved(base, savedFromDb);
          if (mounted) setProfile(merged);
        } else {
          if (mounted) setProfile(base);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setLoadErr(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Derived fields
  const { name, id, personal, job, emergencyContacts, idProofs, avatar } = profile;
  const education = Array.isArray(profile.education) ? profile.education : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const skills = profile.skills || {};
  const bank = profile.bank || {};

  // ✅ Persist helper: localStorage + DB
  const persistProfile = async (nextProfile) => {
    setProfile(nextProfile);

    const saved = profileToSaved(nextProfile);
    const empId = String(saved.employeeId || readEmployeeIdFromAuth() || "").trim();

    // write cache (same as Sign-In)
    if (empId) {
      localStorage.setItem(PROFILE_CACHE_KEY("employee", empId), JSON.stringify(saved));
    }
    // (optional legacy write)
    localStorage.setItem(LEGACY_LS_KEY, JSON.stringify(saved));

    // DB upsert
    if (empId && isSupabaseConfigured) {
      try {
        const payload = savedToDbPayload({ ...saved, employeeId: empId });
        const { error } = await supabase
          .from("hrmss_employee_profiles")
          .upsert(payload, { onConflict: "employee_id" });

        if (error) throw error;
      } catch (e) {
        console.error(e);
        setLoadErr(e?.message || "Failed to save profile to DB");
      }
    }
  };

  /* ---------- IMAGE CHANGE ---------- */
  const changeAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const empId = readEmployeeIdFromAuth() || id || "";

    // show instantly (preview)
    const previewUrl = URL.createObjectURL(file);
    const previewProfile = { ...profile, avatar: previewUrl };
    setProfile(previewProfile);

    try {
      // if supabase configured -> upload and store public url
      if (isSupabaseConfigured && empId) {
        const publicUrl = await uploadAvatar({ folderKey: empId, file });

        const next = { ...profile, avatar: publicUrl };
        await persistProfile(next);

        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
      } else {
        // fallback: just cache blob (works until refresh)
        const saved = profileToSaved(previewProfile);
        localStorage.setItem(LEGACY_LS_KEY, JSON.stringify(saved));
        if (empId) localStorage.setItem(PROFILE_CACHE_KEY("employee", empId), JSON.stringify(saved));
      }
    } catch (err) {
      console.error(err);
      setLoadErr(err?.message || "Avatar upload failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm text-sm font-semibold text-slate-700">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ERROR (if any) */}
      {loadErr ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadErr}
        </div>
      ) : null}

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500">Manage your personal information</p>
        </div>

        <button
          onClick={() => setEditProfile(true)}
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
        >
          <Pencil size={16} /> Edit Profile
        </button>
      </div>

      {/* PROFILE SUMMARY */}
      <div className="rounded-2xl border bg-white p-6 flex gap-6 items-center">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              className="h-28 w-28 rounded-full border object-cover"
              alt="Profile"
            />
          ) : (
            <div className="h-28 w-28 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <Camera size={18} className="mx-auto text-slate-500" />
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Add Photo
                </p>
              </div>
            </div>
          )}

          <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer">
            <Camera size={16} />
            <input hidden type="file" accept="image/*" onChange={changeAvatar} />
          </label>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900">{name || "-"}</h2>
          <p className="text-sm text-slate-500">
            {job?.title || "-"} • {job?.department || "-"}
          </p>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge tone="neutral">
              <IdCard size={14} /> {id || "-"}
            </Badge>
            <Badge tone="info">
              <MapPin size={14} /> {job?.location || "-"}
            </Badge>
            <Badge tone="success">
              <Briefcase size={14} /> {job?.workMode || "-"}
            </Badge>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* PERSONAL DETAILS */}
          <SectionCard title="Personal Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="FULL NAME" value={name} />
              <Detail label="DOB" value={personal?.dob} />
              <Detail label="GENDER" value={personal?.gender} />
              <Detail label="MARITAL STATUS" value={personal?.maritalStatus} />
              <Detail label="BLOOD GROUP" value={personal?.bloodGroup} />
              <Detail
                label="PERSONAL EMAIL"
                value={personal?.personalEmail || personal?.email}
              />
              <Detail label="OFFICIAL EMAIL" value={personal?.officialEmail} />
              <Detail
                label="MOBILE NUMBER"
                value={personal?.mobileNumber || personal?.phone}
              />
              <Detail
                label="ALTERNATE NUMBER"
                value={personal?.alternateContactNumber}
              />
              <Detail
                label="CURRENT ADDRESS"
                value={personal?.currentAddress || personal?.address}
                full
              />
              <Detail label="PERMANENT ADDRESS" value={personal?.permanentAddress} full />
            </div>
          </SectionCard>

          {/* JOB INFORMATION */}
          <SectionCard title="Job Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="EMPLOYEE ID" value={job?.employeeId || id} />
              <Detail label="DESIGNATION" value={job?.title} />
              <Detail label="DEPARTMENT" value={job?.department} />
              <Detail label="REPORTING MANAGER" value={job?.manager} />
              <Detail label="DATE OF JOINING" value={job?.joiningDate} />
              <Detail label="WORK MODE" value={job?.workMode} />
            </div>
          </SectionCard>

          {/* EDUCATION */}
          <SectionCard title="Educational Qualifications">
            <div className="pt-4 space-y-3">
              {education.length ? (
                education.map((e, i) => (
                  <div key={i} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <GraduationCap size={16} className="text-slate-600" />
                      Qualification #{i + 1}
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                      <Detail label="QUALIFICATION" value={e.qualification} />
                      <Detail label="INSTITUTION / UNIVERSITY" value={e.institution} />
                      <Detail label="YEAR OF PASSING" value={e.yearOfPassing} />
                      <Detail label="SPECIALIZATION" value={e.specialization} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyHint icon={GraduationCap} text="No education details added yet." />
              )}
            </div>
          </SectionCard>

          {/* EXPERIENCE */}
          <SectionCard title="Professional Experience">
            <div className="pt-4 space-y-3">
              {experience.length ? (
                experience.map((ex, i) => (
                  <div key={i} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Building2 size={16} className="text-slate-600" />
                      Experience #{i + 1}
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                      <Detail label="ORGANIZATION" value={ex.organization} />
                      <Detail label="DESIGNATION" value={ex.designation} />
                      <Detail label="DURATION" value={ex.duration} />
                      <Detail label="REASON FOR LEAVING" value={ex.reasonForLeaving} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyHint icon={Briefcase} text="No experience details added yet." />
              )}
            </div>
          </SectionCard>

          {/* SKILLS */}
          <SectionCard title="Skills & Expertise">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="PRIMARY SKILLS" value={skills.primarySkills} />
              <Detail label="SECONDARY SKILLS" value={skills.secondarySkills} />
              <Detail label="TOOLS / TECHNOLOGIES" value={skills.toolsTechnologies} full />
            </div>
          </SectionCard>

          {/* BANK & PAYROLL */}
          <SectionCard title="Bank & Payroll Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="ACCOUNT HOLDER NAME" value={bank.accountHolderName} />
              <Detail label="BANK NAME" value={bank.bankName} />
              <Detail label="ACCOUNT NUMBER" value={bank.accountNumber} />
              <Detail label="IFSC CODE" value={bank.ifscCode} />
              <Detail label="BRANCH" value={bank.branch} />
              <Detail label="WORK LOCATION" value={job?.location} />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* EMERGENCY CONTACT */}
          <SectionCard
            title="Emergency Contact"
            action={
              <button onClick={() => setAddEmergency(true)} className="text-blue-600 text-sm">
                + Add
              </button>
            }
          >
            {emergencyContacts?.length ? (
              emergencyContacts.map((c, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.relation}</p>
                  <p className="text-sm flex gap-1">
                    <Phone size={14} /> {c.phone}
                  </p>
                  <button onClick={() => setEditEmergency(i)} className="text-xs text-blue-600 mt-1">
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <EmptyHint icon={HeartPulse} text="No emergency contacts added yet." />
            )}
          </SectionCard>

          {/* ID PROOFS */}
          <SectionCard
            title="ID Proofs"
            action={
              <button onClick={() => setAddId(true)} className="text-blue-600 text-sm">
                Upload
              </button>
            }
          >
            {idProofs?.length ? (
              idProofs.map((d, i) => (
                <div key={i} className="flex justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{d.type}</p>
                    <p className="text-xs">{d.number}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={d.status === "Verified" ? "success" : "warning"}>{d.status}</Badge>
                    <button onClick={() => setEditId(i)} className="block text-xs text-blue-600 mt-1">
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyHint icon={IdCard} text="No ID proofs uploaded yet." />
            )}
          </SectionCard>

          {/* QUICK CONTACT */}
          <SectionCard title="Quick Contact">
            <div className="space-y-3 pt-2">
              <QuickRow icon={Mail} label="Personal Email" value={personal?.personalEmail || personal?.email} />
              <QuickRow icon={Mail} label="Official Email" value={personal?.officialEmail} />
              <QuickRow icon={Phone} label="Mobile" value={personal?.mobileNumber || personal?.phone} />
              <QuickRow icon={Phone} label="Alternate" value={personal?.alternateContactNumber} />
              <QuickRow icon={Home} label="Current Address" value={personal?.currentAddress || personal?.address} />
              <QuickRow icon={MapPin} label="Work Location" value={job?.location} />
            </div>
          </SectionCard>
        </div>
      </div>

      <Divider label="End of Profile" />

      <DocumentManager
        title="My Documents"
        subtitle="Upload and view your documents directly from your profile"
        accent="blue"
      />

      {/* MODALS */}
      {editProfile && (
        <EditProfileModal
          profile={profile}
          onSave={(next) => persistProfile(next)}
          onClose={() => setEditProfile(false)}
        />
      )}

      {(addEmergency || editEmergency !== null) && (
        <EmergencyModal
          profile={profile}
          index={editEmergency}
          onSave={(next) => persistProfile(next)}
          onClose={() => {
            setAddEmergency(false);
            setEditEmergency(null);
          }}
        />
      )}

      {(addId || editId !== null) && (
        <IdModal
          profile={profile}
          index={editId}
          onSave={(next) => persistProfile(next)}
          onClose={() => {
            setAddId(false);
            setEditId(null);
          }}
        />
      )}
    </div>
  );
}

/* ===================== UI HELPERS ===================== */

function Detail({ label, value, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function QuickRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 rounded-lg border bg-white p-1.5">
        <Icon size={14} className="text-slate-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value || "-"}</p>
      </div>
    </div>
  );
}

function EmptyHint({ icon: Icon, text }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600 flex items-center gap-2">
      <Icon size={16} className="text-slate-500" />
      <span>{text}</span>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center gap-3">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg border p-1 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ===================== EDIT PROFILE MODAL ===================== */

function EditProfileModal({ profile, onSave, onClose }) {
  const [f, setF] = useState(profile);

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      {["name", "dob", "email", "phone", "address"].map((k) => (
        <input
          key={k}
          className="w-full rounded-xl border p-2"
          placeholder={k}
          value={k === "name" ? f.name : (f.personal?.[k] || "")}
          onChange={(e) =>
            k === "name"
              ? setF({ ...f, name: e.target.value })
              : setF({
                  ...f,
                  personal: { ...(f.personal || {}), [k]: e.target.value },
                })
          }
        />
      ))}

      <button
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        onClick={() => {
          onSave(f);
          onClose();
        }}
      >
        Save
      </button>
    </Modal>
  );
}

/* ===================== EMERGENCY MODAL ===================== */

function EmergencyModal({ profile, index, onSave, onClose }) {
  const data =
    index !== null
      ? profile.emergencyContacts[index]
      : { name: "", relation: "", phone: "" };

  const [f, setF] = useState(data);

  return (
    <Modal title="Emergency Contact" onClose={onClose}>
      {["name", "relation", "phone"].map((k) => (
        <input
          key={k}
          className="w-full rounded-xl border p-2"
          placeholder={k}
          value={f[k] || ""}
          onChange={(e) => setF({ ...f, [k]: e.target.value })}
        />
      ))}

      <button
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        onClick={() => {
          const list = [...(profile.emergencyContacts || [])];
          index !== null ? (list[index] = f) : list.push(f);
          onSave({ ...profile, emergencyContacts: list });
          onClose();
        }}
      >
        Save
      </button>
    </Modal>
  );
}

/* ===================== ID PROOF MODAL ===================== */

function IdModal({ profile, index, onSave, onClose }) {
  const data =
    index !== null
      ? profile.idProofs[index]
      : { type: "", number: "", status: "Pending" };

  const [f, setF] = useState(data);

  return (
    <Modal title="ID Proof" onClose={onClose}>
      <input
        className="w-full rounded-xl border p-2"
        placeholder="ID Type"
        value={f.type || ""}
        onChange={(e) => setF({ ...f, type: e.target.value })}
      />
      <input
        className="w-full rounded-xl border p-2"
        placeholder="ID Number"
        value={f.number || ""}
        onChange={(e) => setF({ ...f, number: e.target.value })}
      />

      <button
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        onClick={() => {
          const list = [...(profile.idProofs || [])];
          index !== null ? (list[index] = f) : list.push(f);
          onSave({ ...profile, idProofs: list });
          onClose();
        }}
      >
        Save
      </button>
    </Modal>
  );
}
