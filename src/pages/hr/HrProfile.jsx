// src/pages/hr/HrProfile.jsx
import { useState } from "react";
import { MapPin, IdCard, Briefcase, Phone, Pencil, X, Camera } from "lucide-react";
import DocumentManager from "../../components/DocumentManager.jsx";

/* ===================== SEED (HR) ===================== */
const seedHrProfile = {
  name: "Ananya Iyer",
  id: "HR-001",
  avatar: "https://i.pravatar.cc/150?img=12",
  personal: {
    dob: "1993-04-18",
    email: "ananya.iyer@hrms.example.com",
    phone: "+91 98765 10021",
    address: "Bengaluru, IN",
  },
  job: {
    employeeId: "HR-001",
    title: "HR Business Partner",
    department: "Human Resources",
    manager: "Rohan Kulkarni",
    joiningDate: "12 Jul 2021",
    workMode: "Hybrid",
    location: "Bengaluru, IN",
  },
  emergencyContacts: [
    { name: "Suresh Iyer", relation: "Father", phone: "+91 90000 11111" },
  ],
  idProofs: [
    { type: "Aadhaar", number: "XXXX-XXXX-7788", status: "Verified" },
    { type: "PAN", number: "PQRSX1234Y", status: "Pending" },
  ],
};

export default function HrProfile() {
  const [profile, setProfile] = useState(seedHrProfile);

  const [editProfile, setEditProfile] = useState(false);
  const [addEmergency, setAddEmergency] = useState(false);
  const [editEmergency, setEditEmergency] = useState(null);
  const [addId, setAddId] = useState(false);
  const [editId, setEditId] = useState(null);

  const { name, id, personal, job, emergencyContacts, idProofs, avatar } = profile;

  /* ---------- IMAGE CHANGE ---------- */
  const changeAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfile({ ...profile, avatar: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">HR Workspace</p>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500">Manage your HR profile information</p>
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
          <img src={avatar} className="h-28 w-28 rounded-full border object-cover" alt="HR" />
          <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer">
            <Camera size={16} />
            <input hidden type="file" onChange={changeAvatar} />
          </label>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
          <p className="text-sm text-slate-500">
            {job.title} • {job.department}
          </p>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge tone="neutral">
              <IdCard size={14} /> {id}
            </Badge>
            <Badge tone="info">
              <MapPin size={14} /> {job.location}
            </Badge>
            <Badge tone="success">
              <Briefcase size={14} /> {job.workMode}
            </Badge>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Personal Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="FULL NAME" value={name} />
              <Detail label="DOB" value={personal.dob} />
              <Detail label="EMAIL" value={personal.email} />
              <Detail label="PHONE" value={personal.phone} />
              <Detail label="ADDRESS" value={personal.address} full />
            </div>
          </SectionCard>

          <SectionCard title="Job Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
              <Detail label="HR ID" value={job.employeeId} />
              <Detail label="DESIGNATION" value={job.title} />
              <Detail label="DEPARTMENT" value={job.department} />
              <Detail label="REPORTING MANAGER" value={job.manager} />
              <Detail label="DATE OF JOINING" value={job.joiningDate} />
              <Detail label="WORK MODE" value={job.workMode} />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <SectionCard
            title="Emergency Contact"
            action={
              <button onClick={() => setAddEmergency(true)} className="text-blue-600 text-sm">
                + Add
              </button>
            }
          >
            {emergencyContacts.map((c, i) => (
              <div key={i} className="rounded-xl border p-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">{c.relation}</p>
                <p className="text-sm flex gap-1 items-center mt-1">
                  <Phone size={14} /> {c.phone}
                </p>
                <button onClick={() => setEditEmergency(i)} className="text-xs text-blue-600 mt-2">
                  Edit
                </button>
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="ID Proofs"
            action={
              <button onClick={() => setAddId(true)} className="text-blue-600 text-sm">
                Upload
              </button>
            }
          >
            {idProofs.map((d, i) => (
              <div key={i} className="flex justify-between rounded-xl border p-3">
                <div>
                  <p className="font-medium">{d.type}</p>
                  <p className="text-xs">{d.number}</p>
                </div>
                <div className="text-right">
                  <Badge tone={d.status === "Verified" ? "success" : "warning"}>{d.status}</Badge>
                  <button onClick={() => setEditId(i)} className="block text-xs text-blue-600 mt-2">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>

      <DocumentManager
        title="My Documents"
        subtitle="Upload and manage HR documents right from your profile"
        accent="purple"
      />

      <Divider label="End of Profile" />

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

/* ===================== LOCAL UI COMPONENTS ===================== */
function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function Badge({ tone = "neutral", children }) {
  const map = {
    neutral: "bg-slate-100 text-slate-800 border-slate-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        map[tone] || map.neutral
      )}
    >
      {children}
    </span>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px bg-slate-200 flex-1" />
      <span className="text-xs text-slate-500">{label}</span>
      <div className="h-px bg-slate-200 flex-1" />
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-50">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ===================== MODALS ===================== */
function EditProfileModal({ profile, setProfile, onClose }) {
  const [f, setF] = useState(profile);
  const keys = ["name", "dob", "email", "phone", "address"];

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      {keys.map((k) => (
        <input
          key={k}
          className="w-full rounded-xl border p-2"
          placeholder={k}
          value={k === "name" ? f.name : f.personal[k]}
          onChange={(e) =>
            k === "name"
              ? setF({ ...f, name: e.target.value })
              : setF({ ...f, personal: { ...f.personal, [k]: e.target.value } })
          }
        />
      ))}

      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-white w-full"
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

function EmergencyModal({ profile, setProfile, index, onClose }) {
  const data = index !== null ? profile.emergencyContacts[index] : { name: "", relation: "", phone: "" };
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
        className="rounded-xl bg-slate-900 px-4 py-2 text-white w-full"
        onClick={() => {
          const list = [...profile.emergencyContacts];
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

function IdModal({ profile, setProfile, index, onClose }) {
  const data = index !== null ? profile.idProofs[index] : { type: "", number: "", status: "Pending" };
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
        className="rounded-xl bg-slate-900 px-4 py-2 text-white w-full"
        onClick={() => {
          const list = [...profile.idProofs];
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
