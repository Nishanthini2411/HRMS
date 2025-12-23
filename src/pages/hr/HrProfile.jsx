import { useEffect, useState } from "react";
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
  HeartPulse,
  Home,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import DocumentManager from "../../components/DocumentManager.jsx";

/* ========================================================= */
/* ======================= MAIN ============================ */
/* ========================================================= */

export default function HrProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editProfile, setEditProfile] = useState(false);
  const [addEmergency, setAddEmergency] = useState(false);
  const [editEmergency, setEditEmergency] = useState(null);
  const [addId, setAddId] = useState(false);
  const [editId, setEditId] = useState(null);

  /* ================= FETCH HR PROFILE ================= */
  useEffect(() => {
    async function loadProfile() {
      try {
        const session = JSON.parse(
          localStorage.getItem("HRMSS_AUTH_SESSION")
        );

        const userId = session?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("hrmss_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw error;

        setProfile({
          name: data.full_name,
          id: data.employee_id,
          avatar: data.avatar_url,

          personal: {
            dob: data.dob,
            gender: data.gender,
            maritalStatus: data.marital_status,
            bloodGroup: data.blood_group,
            personalEmail: data.personal_email,
            officialEmail: data.official_email,
            mobileNumber: data.mobile_number,
            alternateContactNumber: data.alternate_contact_number,
            currentAddress: data.current_address,
            permanentAddress: data.permanent_address,
          },

          job: {
            employeeId: data.employee_id,
            title: "HR",
            department: "Human Resources",
            location: data.location,
            workMode: "Office",
          },

          education: Array.isArray(data.education) ? data.education : [],
          experience: Array.isArray(data.experience) ? data.experience : [],

          skills: {
            primarySkills: data.primary_skills,
            secondarySkills: data.secondary_skills,
            toolsTechnologies: data.tools_technologies,
          },

          bank: {
            accountHolderName: data.account_holder_name,
            bankName: data.bank_name,
            accountNumber: data.account_number,
            ifscCode: data.ifsc_code,
            branch: data.branch,
          },

          emergencyContacts: data.emergency_name
            ? [
                {
                  name: data.emergency_name,
                  relation: data.emergency_relationship,
                  phone: data.emergency_contact_number,
                },
              ]
            : [],

          idProofs: [],
        });
      } catch (e) {
        console.error("HR profile load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-semibold">
        Loading HR Profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-10 text-center text-rose-600 font-semibold">
        HR Profile not found
      </div>
    );
  }

  const {
    name,
    id,
    personal,
    job,
    education,
    experience,
    skills,
    bank,
    emergencyContacts,
    avatar,
    idProofs,
  } = profile;

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
          <p className="text-xs uppercase tracking-wide text-slate-500">
            HR Workspace
          </p>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500">
            Manage your HR profile information
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
              alt="HR"
            />
          ) : (
            <div className="h-28 w-28 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              <Camera size={18} className="text-slate-500" />
            </div>
          )}
          <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer">
            <Camera size={16} />
            <input hidden type="file" onChange={changeAvatar} />
          </label>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
          <p className="text-sm text-slate-500">
            {job.title} – {job.department}
          </p>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge><IdCard size={14} /> {id || "-"}</Badge>
            <Badge><MapPin size={14} /> {job.location || "-"}</Badge>
            <Badge><Briefcase size={14} /> {job.workMode}</Badge>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Personal Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <Detail label="FULL NAME" value={name} />
              <Detail label="DOB" value={personal.dob} />
              <Detail label="GENDER" value={personal.gender} />
              <Detail label="MARITAL STATUS" value={personal.maritalStatus} />
              <Detail label="BLOOD GROUP" value={personal.bloodGroup} />
              <Detail label="PERSONAL EMAIL" value={personal.personalEmail} />
              <Detail label="OFFICIAL EMAIL" value={personal.officialEmail} />
              <Detail label="MOBILE NUMBER" value={personal.mobileNumber} />
              <Detail label="ALTERNATE NUMBER" value={personal.alternateContactNumber} />
              <Detail label="CURRENT ADDRESS" value={personal.currentAddress} full />
              <Detail label="PERMANENT ADDRESS" value={personal.permanentAddress} full />
            </div>
          </SectionCard>

          <SectionCard title="Educational Qualifications">
            <div className="pt-4 space-y-3">
              {education.length ? education.map((e, i) => (
                <CardBlock key={i} title={`Qualification #${i + 1}`} icon={GraduationCap}>
                  <Detail label="QUALIFICATION" value={e.qualification} />
                  <Detail label="INSTITUTION" value={e.institution} />
                  <Detail label="YEAR" value={e.yearOfPassing} />
                  <Detail label="SPECIALIZATION" value={e.specialization} />
                </CardBlock>
              )) : <EmptyHint icon={GraduationCap} text="No education details" />}
            </div>
          </SectionCard>

          <SectionCard title="Professional Experience">
            <div className="pt-4 space-y-3">
              {experience.length ? experience.map((e, i) => (
                <CardBlock key={i} title={`Experience #${i + 1}`} icon={Building2}>
                  <Detail label="ORGANIZATION" value={e.organization} />
                  <Detail label="DESIGNATION" value={e.designation} />
                  <Detail label="DURATION" value={e.duration} />
                  <Detail label="REASON" value={e.reasonForLeaving} />
                </CardBlock>
              )) : <EmptyHint icon={Briefcase} text="No experience details" />}
            </div>
          </SectionCard>

          <SectionCard title="Skills & Expertise">
            <Detail label="PRIMARY SKILLS" value={skills.primarySkills} />
            <Detail label="SECONDARY SKILLS" value={skills.secondarySkills} />
            <Detail label="TOOLS / TECHNOLOGIES" value={skills.toolsTechnologies} full />
          </SectionCard>

          <SectionCard title="Bank & Payroll Details">
            <Detail label="ACCOUNT HOLDER" value={bank.accountHolderName} />
            <Detail label="BANK NAME" value={bank.bankName} />
            <Detail label="ACCOUNT NUMBER" value={bank.accountNumber} />
            <Detail label="IFSC" value={bank.ifscCode} />
            <Detail label="BRANCH" value={bank.branch} />
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <SectionCard title="Emergency Contact">
            {emergencyContacts.length ? emergencyContacts.map((c, i) => (
              <div key={i} className="rounded-xl border p-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs">{c.relation}</p>
                <p className="text-sm flex gap-1 items-center">
                  <Phone size={14} /> {c.phone}
                </p>
              </div>
            )) : <EmptyHint icon={HeartPulse} text="No emergency contacts" />}
          </SectionCard>
        </div>
      </div>

      <DocumentManager
        title="My Documents"
        subtitle="Upload and manage HR documents"
        accent="purple"
      />
    </div>
  );
}

/* ========================================================= */
/* ===================== UI HELPERS ======================== */
/* ========================================================= */

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold bg-slate-100">
      {children}
    </span>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {children}
    </div>
  );
}

function Detail({ label, value, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function CardBlock({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex items-center gap-2 font-semibold">
        <Icon size={16} /> {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function EmptyHint({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm">
      <Icon size={16} /> {text}
    </div>
  );
}
