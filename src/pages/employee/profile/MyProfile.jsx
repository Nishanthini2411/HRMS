import { useState } from "react";
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
  CalendarDays,
  GraduationCap,
  Building2,
  Sparkles,
  CreditCard,
  HeartPulse,
  Home,
} from "lucide-react";
import { employeeProfile as seedProfile } from "../shared/employeeStore";
import DocumentManager from "../../../components/DocumentManager.jsx";

const LS_KEY = "hrmss.employee.signin";

/* ===================================================== */
export default function MyProfile() {
  // ✅ merge EmployeeSignIn data (localStorage) into seedProfile (no breaking old flow)
  const [profile, setProfile] = useState(() => {
    const base = seedProfile;

    let saved = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      // ignore
    }

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

      // avatar + header name/id
      avatar: saved.avatar || base?.avatar || "",
      name: saved.fullName || base?.name || "",
      id: saved.employeeId || base?.id || "",

      // keep old structure working
      personal: {
        ...(base?.personal || {}),
        dob: saved.dob || base?.personal?.dob || "",
        // prefer personalEmail from signin, fallback to old
        email:
          saved.personalEmail ||
          saved.email ||
          base?.personal?.email ||
          "",
        phone:
          saved.mobileNumber ||
          saved.phone ||
          base?.personal?.phone ||
          "",
        address:
          saved.currentAddress ||
          saved.address ||
          base?.personal?.address ||
          "",

        // extra personal fields (new)
        gender: saved.gender || base?.personal?.gender || "",
        maritalStatus: saved.maritalStatus || "",
        bloodGroup: saved.bloodGroup || "",

        // contact extras
        personalEmail: saved.personalEmail || "",
        officialEmail: saved.officialEmail || "",
        mobileNumber: saved.mobileNumber || "",
        alternateContactNumber: saved.alternateContactNumber || "",

        // address extras
        currentAddress: saved.currentAddress || "",
        permanentAddress: saved.permanentAddress || "",
      },

      job: {
        ...(base?.job || {}),
        employeeId: saved.employeeId || base?.job?.employeeId || "",
        location: saved.location || base?.job?.location || "",
      },

      // arrays (new)
      education: Array.isArray(saved.education) ? saved.education : base?.education || [],
      experience: Array.isArray(saved.experience) ? saved.experience : base?.experience || [],

      // skills (new)
      skills: {
        primarySkills: saved.primarySkills || base?.skills?.primarySkills || "",
        secondarySkills: saved.secondarySkills || base?.skills?.secondarySkills || "",
        toolsTechnologies: saved.toolsTechnologies || base?.skills?.toolsTechnologies || "",
      },

      // bank (new)
      bank: {
        accountHolderName: saved.accountHolderName || base?.bank?.accountHolderName || "",
        bankName: saved.bankName || base?.bank?.bankName || "",
        accountNumber: saved.accountNumber || base?.bank?.accountNumber || "",
        ifscCode: saved.ifscCode || base?.bank?.ifscCode || "",
        branch: saved.branch || base?.bank?.branch || "",
      },

      emergencyContacts: mergedEmergency,
    };
  });

  const [editProfile, setEditProfile] = useState(false);
  const [addEmergency, setAddEmergency] = useState(false);
  const [editEmergency, setEditEmergency] = useState(null);
  const [addId, setAddId] = useState(false);
  const [editId, setEditId] = useState(null);

  const { name, id, personal, job, emergencyContacts, idProofs, avatar } =
    profile;

  // ✅ additional fields from EmployeeSignIn (safe defaults)
  const education = Array.isArray(profile.education) ? profile.education : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const skills = profile.skills || {};
  const bank = profile.bank || {};

  /* ---------- IMAGE CHANGE ---------- */
  const changeAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfile({ ...profile, avatar: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500">
            Manage your personal information
          </p>
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
                <p className="mt-1 text-xs font-semibold text-slate-600">Add Photo</p>
              </div>
            </div>
          )}

          <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer">
            <Camera size={16} />
            <input hidden type="file" accept="image/*" onChange={changeAvatar} />
          </label>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
          <p className="text-sm text-slate-500">
            {job?.title} • {job?.department}
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
              <Detail label="PERSONAL EMAIL" value={personal?.personalEmail || personal?.email} />
              <Detail label="OFFICIAL EMAIL" value={personal?.officialEmail} />
              <Detail label="MOBILE NUMBER" value={personal?.mobileNumber || personal?.phone} />
              <Detail label="ALTERNATE NUMBER" value={personal?.alternateContactNumber} />
              <Detail label="CURRENT ADDRESS" value={personal?.currentAddress || personal?.address} full />
              <Detail label="PERMANENT ADDRESS" value={personal?.permanentAddress} full />
            </div>
          </SectionCard>

          {/* JOB INFORMATION */}
          <SectionCard title="Job Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="EMPLOYEE ID" value={job?.employeeId} />
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
              <button
                onClick={() => setAddEmergency(true)}
                className="text-blue-600 text-sm"
              >
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
                  <button
                    onClick={() => setEditEmergency(i)}
                    className="text-xs text-blue-600 mt-1"
                  >
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
              <button
                onClick={() => setAddId(true)}
                className="text-blue-600 text-sm"
              >
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
                    <Badge tone={d.status === "Verified" ? "success" : "warning"}>
                      {d.status}
                    </Badge>
                    <button
                      onClick={() => setEditId(i)}
                      className="block text-xs text-blue-600 mt-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyHint icon={IdCard} text="No ID proofs uploaded yet." />
            )}
          </SectionCard>

          {/* QUICK CONTACT CARD (extra) */}
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
          setProfile={setProfile}
          onClose={() => setEditProfile(false)}
        />
      )}

      {(addEmergency || editEmergency !== null) && (
        <EmergencyModal
          profile={profile}
          setProfile={setProfile}
          index={editEmergency}
          onClose={() => {
            setAddEmergency(false);
            setEditEmergency(null);
          }}
        />
      )}

      {(addId || editId !== null) && (
        <IdModal
          profile={profile}
          setProfile={setProfile}
          index={editId}
          onClose={() => {
            setAddId(false);
            setEditId(null);
          }}
        />
      )}
    </div>
  );
}

/* ===================================================== */
/* UI HELPERS */

function Detail({ label, value, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-900">
        {value || "-"}
      </p>
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
        <p className="text-sm font-semibold text-slate-900 truncate">
          {value || "-"}
        </p>
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ===================================================== */
/* EDIT PROFILE MODAL */

function EditProfileModal({ profile, setProfile, onClose }) {
  const [f, setF] = useState(profile);

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      {["name", "dob",  "email", "phone", "address"].map((k) => (
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
          setProfile(f);
          onClose();
        }}
      >
        Save
      </button>
    </Modal>
  );
}

/* ===================================================== */
/* EMERGENCY MODAL */

function EmergencyModal({ profile, setProfile, index, onClose }) {
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
          value={f[k]}
          onChange={(e) => setF({ ...f, [k]: e.target.value })}
        />
      ))}

      <button
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        onClick={() => {
          const list = [...(profile.emergencyContacts || [])];
          index !== null ? (list[index] = f) : list.push(f);
          setProfile({ ...profile, emergencyContacts: list });
          onClose();
        }}
      >
        Save
      </button>
    </Modal>
  );
}

/* ===================================================== */
/* ID PROOF MODAL */

function IdModal({ profile, setProfile, index, onClose }) {
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
        value={f.type}
        onChange={(e) => setF({ ...f, type: e.target.value })}
      />
      <input
        className="w-full rounded-xl border p-2"
        placeholder="ID Number"
        value={f.number}
        onChange={(e) => setF({ ...f, number: e.target.value })}
      />

      <button
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        onClick={() => {
          const list = [...(profile.idProofs || [])];
          index !== null ? (list[index] = f) : list.push(f);
          setProfile({ ...profile, idProofs: list });
          onClose();
        }}
      >
        Save
      </button>
    </Modal>
  );
}
