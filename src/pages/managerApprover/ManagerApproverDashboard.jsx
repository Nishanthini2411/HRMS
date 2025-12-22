// src/pages/managerApprover/ManagerApproverDashboard.jsx
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Lock,
  Sparkles,
  Users,
  Workflow,
  ArrowLeft,
  X,
  UserRound,
  FileText,
} from "lucide-react";

import {
  getManagerSession,
  leaveRequests,
  payrollRecords,
  payslipRecords,
  teamMembers,
} from "./managerApproverData";

const companyEmployees = [
  {
    id: "EMP-1045",
    name: "Sneha Iyer",
    avatar: "https://i.pravatar.cc/150?img=47",
    personal: {
      dob: "1994-03-12",
      gender: "Female",
      maritalStatus: "Single",
      bloodGroup: "B+",
      personalEmail: "sneha.iyer@example.com",
      officialEmail: "sneha.iyer@company.com",
      mobileNumber: "+91 98765 11111",
      alternateContactNumber: "",
      currentAddress: "Bangalore, IN",
      permanentAddress: "Bangalore, IN",
    },
    job: {
      employeeId: "EMP-1045",
      title: "Product Designer",
      department: "Product",
      manager: "Priya Menon",
      joiningDate: "2022-04-15",
      workMode: "Hybrid",
      location: "Bangalore, IN",
    },
    emergencyContacts: [
      { name: "Anita Iyer", relation: "Mother", phone: "+91 98765 22222" },
    ],
    idProofs: [
      { type: "Aadhaar", number: "XXXX-XXXX-1234", status: "Verified" },
      { type: "PAN", number: "ABCDE1234F", status: "Pending" },
    ],
    education: [
      {
        qualification: "B.Des",
        institution: "NID",
        yearOfPassing: "2016",
        specialization: "Interaction Design",
      },
    ],
    experience: [
      {
        organization: "DesignWorks",
        designation: "UI Designer",
        duration: "2016 - 2019",
        reasonForLeaving: "Career growth",
      },
    ],
    skills: {
      primarySkills: "UI/UX, Figma",
      secondarySkills: "Prototyping, UX Research",
      toolsTechnologies: "Figma, FigJam, Miro",
    },
    bank: {
      accountHolderName: "Sneha Iyer",
      bankName: "HDFC Bank",
      accountNumber: "XXXXXX4521",
      ifscCode: "HDFC0001234",
      branch: "Bangalore",
      paymentMode: "Bank Transfer",
    },
  },
  {
    id: "EMP-1046",
    name: "Ritwik Sharma",
    avatar: "https://i.pravatar.cc/150?img=12",
    personal: {
      dob: "1991-09-08",
      gender: "Male",
      maritalStatus: "Married",
      bloodGroup: "O+",
      personalEmail: "ritwik.sharma@example.com",
      officialEmail: "ritwik.sharma@company.com",
      mobileNumber: "+91 98765 33333",
      alternateContactNumber: "",
      currentAddress: "Pune, IN",
      permanentAddress: "Pune, IN",
    },
    job: {
      employeeId: "EMP-1046",
      title: "Backend Engineer",
      department: "Engineering",
      manager: "Priya Menon",
      joiningDate: "2020-11-02",
      workMode: "Remote",
      location: "Pune, IN",
    },
    emergencyContacts: [
      { name: "Ravi Sharma", relation: "Brother", phone: "+91 98765 44444" },
    ],
    idProofs: [
      { type: "Aadhaar", number: "XXXX-XXXX-5678", status: "Verified" },
    ],
    education: [
      {
        qualification: "B.Tech",
        institution: "IIT",
        yearOfPassing: "2014",
        specialization: "Computer Science",
      },
    ],
    experience: [
      {
        organization: "TechNova",
        designation: "Software Engineer",
        duration: "2014 - 2018",
        reasonForLeaving: "Better role",
      },
    ],
    skills: {
      primarySkills: "Node.js, PostgreSQL",
      secondarySkills: "AWS, Docker",
      toolsTechnologies: "AWS, Docker, GitHub Actions",
    },
    bank: {
      accountHolderName: "Ritwik Sharma",
      bankName: "ICICI Bank",
      accountNumber: "XXXXXX8899",
      ifscCode: "ICIC0009876",
      branch: "Pune",
      paymentMode: "Bank Transfer",
    },
  },
  {
    id: "EMP-1047",
    name: "Neha George",
    avatar: "https://i.pravatar.cc/150?img=32",
    personal: {
      dob: "1993-01-21",
      gender: "Female",
      maritalStatus: "Single",
      bloodGroup: "A+",
      personalEmail: "neha.george@example.com",
      officialEmail: "neha.george@company.com",
      mobileNumber: "+91 98765 55555",
      alternateContactNumber: "",
      currentAddress: "Hyderabad, IN",
      permanentAddress: "Hyderabad, IN",
    },
    job: {
      employeeId: "EMP-1047",
      title: "QA Analyst",
      department: "Quality",
      manager: "Arun Dev",
      joiningDate: "2021-03-18",
      workMode: "Onsite",
      location: "Hyderabad, IN",
    },
    emergencyContacts: [
      { name: "Lina George", relation: "Mother", phone: "+91 98765 66666" },
    ],
    idProofs: [
      { type: "PAN", number: "PQRSX1234Y", status: "Verified" },
    ],
    education: [
      {
        qualification: "B.Sc",
        institution: "Osmania University",
        yearOfPassing: "2015",
        specialization: "IT",
      },
    ],
    experience: [
      {
        organization: "QA Labs",
        designation: "QA Engineer",
        duration: "2015 - 2020",
        reasonForLeaving: "Relocation",
      },
    ],
    skills: {
      primarySkills: "Manual Testing, API Testing",
      secondarySkills: "Automation Basics",
      toolsTechnologies: "Postman, Jira",
    },
    bank: {
      accountHolderName: "Neha George",
      bankName: "SBI",
      accountNumber: "XXXXXX7788",
      ifscCode: "SBIN0001111",
      branch: "Hyderabad",
      paymentMode: "Bank Transfer",
    },
  },
  {
    id: "EMP-1048",
    name: "Dhruv Pai",
    avatar: "https://i.pravatar.cc/150?img=18",
    personal: {
      dob: "1992-12-04",
      gender: "Male",
      maritalStatus: "Married",
      bloodGroup: "O-",
      personalEmail: "dhruv.pai@example.com",
      officialEmail: "dhruv.pai@company.com",
      mobileNumber: "+91 98765 77777",
      alternateContactNumber: "",
      currentAddress: "Chennai, IN",
      permanentAddress: "Chennai, IN",
    },
    job: {
      employeeId: "EMP-1048",
      title: "Frontend Engineer",
      department: "Engineering",
      manager: "Arun Dev",
      joiningDate: "2019-08-22",
      workMode: "Hybrid",
      location: "Chennai, IN",
    },
    emergencyContacts: [
      { name: "Meera Pai", relation: "Spouse", phone: "+91 98765 88888" },
    ],
    idProofs: [
      { type: "Aadhaar", number: "XXXX-XXXX-9911", status: "Verified" },
    ],
    education: [
      {
        qualification: "B.E",
        institution: "Anna University",
        yearOfPassing: "2014",
        specialization: "Computer Science",
      },
    ],
    experience: [
      {
        organization: "WebLabs",
        designation: "Frontend Developer",
        duration: "2014 - 2018",
        reasonForLeaving: "New role",
      },
    ],
    skills: {
      primarySkills: "React, TypeScript",
      secondarySkills: "UX, Testing",
      toolsTechnologies: "React, Vite, Jest",
    },
    bank: {
      accountHolderName: "Dhruv Pai",
      bankName: "Axis Bank",
      accountNumber: "XXXXXX9900",
      ifscCode: "UTIB0002222",
      branch: "Chennai",
      paymentMode: "Bank Transfer",
    },
  },
  {
    id: "EMP-1049",
    name: "Bhavana Kulkarni",
    avatar: "https://i.pravatar.cc/150?img=25",
    personal: {
      dob: "1989-07-30",
      gender: "Female",
      maritalStatus: "Married",
      bloodGroup: "AB+",
      personalEmail: "bhavana.kulkarni@example.com",
      officialEmail: "bhavana.kulkarni@company.com",
      mobileNumber: "+91 98765 99999",
      alternateContactNumber: "",
      currentAddress: "Bangalore, IN",
      permanentAddress: "Bangalore, IN",
    },
    job: {
      employeeId: "EMP-1049",
      title: "Product Manager",
      department: "Product",
      manager: "Priya Menon",
      joiningDate: "2018-06-12",
      workMode: "Hybrid",
      location: "Bangalore, IN",
    },
    emergencyContacts: [
      { name: "Arun Kulkarni", relation: "Spouse", phone: "+91 98765 10101" },
    ],
    idProofs: [
      { type: "PAN", number: "ABCDE1234F", status: "Verified" },
    ],
    education: [
      {
        qualification: "MBA",
        institution: "IIM",
        yearOfPassing: "2012",
        specialization: "Product Management",
      },
    ],
    experience: [
      {
        organization: "ProductX",
        designation: "Product Owner",
        duration: "2012 - 2017",
        reasonForLeaving: "Leadership role",
      },
    ],
    skills: {
      primarySkills: "Product Strategy, Roadmaps",
      secondarySkills: "Analytics, UX",
      toolsTechnologies: "Jira, Notion",
    },
    bank: {
      accountHolderName: "Bhavana Kulkarni",
      bankName: "Kotak Bank",
      accountNumber: "XXXXXX3311",
      ifscCode: "KKBK0003333",
      branch: "Bangalore",
      paymentMode: "Bank Transfer",
    },
  },
];

/* ===================== small UI blocks ===================== */
const toneMap = {
  indigo: "bg-indigo-50 text-indigo-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  slate: "bg-slate-100 text-slate-700",
};

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "indigo", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border p-4 bg-white shadow-sm flex gap-3 text-left hover:shadow-md hover:ring-2 hover:ring-indigo-100 transition"
    >
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center ${toneMap[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </button>
  );
}

function ViewHeader({ title, subtitle, onBack, right }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border">
        <div className="p-4 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Details
            </p>
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border bg-white hover:bg-slate-50 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ===================== main ===================== */
export default function ManagerDashboard() {
  const session = getManagerSession();
  const approver = session.role === "approver";

  // ✅ even if managerData has "Alpha squad" / "Alpha — squad", it will remove it
  const teamLabel = (session.team || "")
    .replace(/\s*[-—]?\s*squad\s*$/i, "")
    .trim();

  const onLeave = useMemo(
    () => teamMembers.filter((m) => m.status === "On Leave"),
    []
  );

  const pending = useMemo(
    () => leaveRequests.filter((l) => l.status === "Pending"),
    []
  );

  // ✅ dashboard | employees | leave | approvals | payroll
  const [view, setView] = useState("dashboard");
  const [employeeQuery, setEmployeeQuery] = useState("");

  // ✅ modal
  const [modal, setModal] = useState({ open: false, title: "", payload: null });
  const openModal = (title, payload) =>
    setModal({ open: true, title, payload });
  const closeModal = () => setModal({ open: false, title: "", payload: null });

  const teamMemberMap = useMemo(() => {
    return new Map(teamMembers.map((m) => [m.id, m]));
  }, []);

  const employeesList = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    return companyEmployees
      .map((emp) => {
        const member = teamMemberMap.get(emp.id);
        return {
          ...emp,
          status: member?.status || "Available",
          location: member?.location || emp.job?.location || "-",
          role: member?.role || emp.job?.title || "-",
          leaveType: member?.leaveType || "",
          leaveDates: member?.leaveDates || "",
        };
      })
      .filter((emp) => {
        if (!q) return true;
        const text = `${emp.name} ${emp.id} ${emp.job?.department || ""} ${emp.job?.title || ""}`.toLowerCase();
        return text.includes(q);
      });
  }, [employeeQuery, teamMemberMap]);

  const openProfile = (member, options = {}) => {
    const profile = companyEmployees.find((e) => e.id === member.id) || member;
    openModal(profile.name || member.name, {
      kind: "profile",
      profile,
      status: member.status || "Available",
      location: member.location || profile.job?.location || "-",
      role: member.role || profile.job?.title || "-",
      leaveType: member.leaveType || "",
      leaveDates: member.leaveDates || "",
      showLeave: Boolean(options.showLeave),
    });
  };

  /* ===================== Views ===================== */
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-600">Welcome back, {session.name}</p>
            <h1 className="text-2xl font-bold text-slate-900">
              Manager Dashboard
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Track team presence, handle leave approvals, and view payroll &
              payslips. Only one manager can approve leaves; the other has
              view-only access.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {/* ✅ removed “— squad” (data-level sanitize) */}
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 font-semibold">
              <Sparkles size={14} /> {teamLabel || "Team"}
            </span>

            {/* ✅ removed “View-only” badge in header (only show if approver) */}
            {approver ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 font-semibold">
                <Workflow size={14} />
                Approver access
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ✅ Clickable Stat Cards -> opens view */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Team Members"
          value={teamMembers.length}
          onClick={() => setView("employees")}
        />
        <StatCard
          icon={CalendarClock}
          label="On Leave"
          value={onLeave.length}
          tone="amber"
          onClick={() => setView("leave")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Pending Approvals"
          value={pending.length}
          tone="emerald"
          onClick={() => setView("approvals")}
        />
        <StatCard
          icon={Eye}
          label="Payroll / Payslip"
          value="View"
          tone="slate"
          onClick={() => setView("payroll")}
        />
      </div>

      {/* Quick panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Leave board quick */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Leave Board</h3>
              <button
                type="button"
                onClick={() => setView("leave")}
                className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-semibold hover:bg-amber-200"
              >
                {onLeave.length} on leave now (View)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {onLeave.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => openProfile(m, { showLeave: true })}
                  className="rounded-xl border p-3 bg-amber-50/40 text-left hover:shadow-sm hover:ring-2 hover:ring-amber-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{m.role}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      {m.leaveType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{m.leaveDates}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Location: {m.location}
                  </p>
                </button>
              ))}

              {!onLeave.length && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No one is on leave right now.
                </div>
              )}
            </div>
          </div>

          {/* Approval queue quick */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Approval Queue</h3>
              <button
                type="button"
                onClick={() => setView("approvals")}
                className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full font-semibold hover:bg-indigo-200"
              >
                View
              </button>
            </div>

            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="rounded-xl border p-4">
                  <button
                    type="button"
                    onClick={() =>
                      openModal(`${req.employee} — ${req.type}`, {
                        kind: "leaveRequest",
                        ...req,
                      })
                    }
                    className="w-full text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {req.employee}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{req.type}</p>
                      </div>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                        {req.dates}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">Reason: {req.reason}</p>
                    <p className="text-xs text-slate-500 mt-1">Handover: {req.handover}</p>
                  </button>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <button
                      disabled={!approver}
                      className={`rounded-lg px-3 py-2 font-semibold border ${
                        approver
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-100 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      disabled={!approver}
                      className={`rounded-lg px-3 py-2 font-semibold border ${
                        approver
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Reject
                    </button>
                    {!approver && <span className="text-slate-400">(Only approver can act)</span>}
                  </div>
                </div>
              ))}

              {!pending.length && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No pending approvals.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="space-y-4">
          {/* Team roster quick */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Team Roster</h3>
              <button
                type="button"
                onClick={() => setView("employees")}
                className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full font-semibold hover:bg-slate-200"
              >
                View
              </button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => openProfile(member)}
                  className="w-full rounded-xl border p-3 flex items-start justify-between text-left hover:shadow-sm hover:ring-2 hover:ring-slate-100 transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Location: {member.location}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                      member.status === "On Leave"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {member.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payroll quick */}
          <div className="rounded-2xl border bg-slate-900 text-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock size={16} />
                <div className="text-sm font-semibold">Payroll & Payslip</div>
              </div>
              <button
                type="button"
                onClick={() => setView("payroll")}
                className="text-xs bg-white/10 hover:bg-white/15 px-2 py-1 rounded-full font-semibold"
              >
                View
              </button>
            </div>

            <p className="text-xs text-slate-200">
              Both managers have read-only access to payroll snapshots and payslip status.
            </p>

            <div className="bg-black/20 rounded-xl p-3 space-y-2 text-sm">
              {payrollRecords.slice(0, 2).map((p) => (
                <button
                  type="button"
                  key={p.month}
                  onClick={() => openModal(p.month, { kind: "payroll", ...p })}
                  className="w-full flex items-center justify-between text-left hover:bg-white/5 rounded-lg p-2 -m-2 transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.month}</p>
                    <p className="text-xs text-slate-200 truncate">{p.remarks}</p>
                  </div>
                  <span className="text-[11px] bg-white/10 px-2 py-1 rounded-full">{p.status}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                openModal(`Payslips — ${payslipRecords[0].month}`, {
                  kind: "payslip",
                  ...payslipRecords[0],
                })
              }
              className="bg-white/10 hover:bg-white/15 rounded-xl p-3 text-xs text-slate-100 flex items-center justify-between transition"
            >
              <span>Payslips published for {payslipRecords[0].month}</span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-full">
                <Eye size={12} /> View
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EmployeesView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Company Employees"
        subtitle="Click an employee to view profile details."
        onBack={() => setView("dashboard")}
        right={
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {employeesList.length} employees
          </span>
        }
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-slate-400" />
          <input
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
            placeholder="Search by name, ID, department, role..."
            className="w-full text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employeesList.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => openProfile(m)}
            className="rounded-2xl border bg-white p-4 shadow-sm text-left hover:shadow-md hover:ring-2 hover:ring-slate-100 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRound size={16} className="text-slate-500" />
                  <p className="font-bold text-slate-900 truncate">{m.name}</p>
                </div>
                <p className="text-sm text-slate-600 mt-1 truncate">{m.role}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Department: {m.job?.department || "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Location: {m.location || "-"}
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                  m.status === "On Leave"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {m.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const LeaveView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Leave Board"
        subtitle="Currently on leave (click a card to view)."
        onBack={() => setView("dashboard")}
        right={
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            {onLeave.length} on leave
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {onLeave.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => openProfile(m, { showLeave: true })}
            className="rounded-2xl border bg-white p-4 shadow-sm text-left hover:shadow-md hover:ring-2 hover:ring-amber-100 transition"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{m.name}</p>
                <p className="text-xs text-slate-500 truncate">{m.role}</p>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                {m.leaveType}
              </span>
            </div>
            <p className="text-sm text-slate-700 mt-2">{m.leaveDates}</p>
            <p className="text-xs text-slate-500 mt-1">Location: {m.location}</p>
          </button>
        ))}

        {!onLeave.length && (
          <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">
            No one is on leave right now.
          </div>
        )}
      </div>
    </div>
  );

  const ApprovalsView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Approval Queue"
        subtitle={
          approver ? "You are the approver." : "View only. Only approver can act."
        }
        onBack={() => setView("dashboard")}
        right={
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              approver
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {pending.length} pending
          </span>
        }
      />

      <div className="space-y-4">
        {pending.map((req) => (
          <div
            key={req.id}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                openModal(`${req.employee} — ${req.type}`, {
                  kind: "leaveRequest",
                  ...req,
                })
              }
              className="w-full text-left hover:bg-slate-50 rounded-xl p-3 -m-3 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{req.employee}</p>
                  <p className="text-sm text-slate-600 truncate">{req.type}</p>
                  <p className="text-xs text-slate-500 mt-1">Reason: {req.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">Handover: {req.handover}</p>
                </div>
                <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {req.dates}
                </span>
              </div>
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <button
                disabled={!approver}
                className={`rounded-lg px-3 py-2 font-semibold border ${
                  approver
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-500 cursor-not-allowed"
                }`}
              >
                Approve
              </button>
              <button
                disabled={!approver}
                className={`rounded-lg px-3 py-2 font-semibold border ${
                  approver
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-100 text-slate-500 cursor-not-allowed"
                }`}
              >
                Reject
              </button>
              {!approver ? (
                <span className="text-slate-400">(Only approver can act)</span>
              ) : null}
            </div>
          </div>
        ))}

        {!pending.length && (
          <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">
            No pending approvals.
          </div>
        )}
      </div>
    </div>
  );

  const PayrollView = () => (
    <div className="space-y-4">
      <ViewHeader
        title="Payroll & Payslip"
        subtitle="Read-only snapshots (click to view details)."
        onBack={() => setView("dashboard")}
        right={
          <span className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-3 py-1 rounded-full">
            <Lock size={14} /> View only
          </span>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Payroll Records</h3>
            <span className="text-xs text-slate-500">{payrollRecords.length} months</span>
          </div>

          <div className="space-y-2">
            {payrollRecords.map((p) => (
              <button
                key={p.month}
                type="button"
                onClick={() => openModal(p.month, { kind: "payroll", ...p })}
                className="w-full rounded-xl border p-4 text-left hover:shadow-sm hover:ring-2 hover:ring-slate-100 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.month}</p>
                    <p className="text-sm text-slate-600 truncate">{p.remarks}</p>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {p.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Payslip Status</h3>
            <span className="text-xs text-slate-500">{payslipRecords.length} records</span>
          </div>

          <div className="space-y-2">
            {payslipRecords.map((ps) => (
              <button
                key={ps.month}
                type="button"
                onClick={() =>
                  openModal(`Payslips — ${ps.month}`, { kind: "payslip", ...ps })
                }
                className="w-full rounded-xl border p-4 text-left hover:shadow-sm hover:ring-2 hover:ring-slate-100 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{ps.month}</p>
                    <p className="text-sm text-slate-600 truncate">
                      Published: {ps.published ? "Yes" : "No"}
                    </p>
                  </div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Eye size={12} /> View
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 border p-4 text-xs text-slate-600 flex gap-2">
            <FileText size={14} className="mt-0.5" />
            <p>
              Manager page is read-only. Publish / approve payroll should be in HR/Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ===================== Modal body ===================== */
  const payload = modal.payload;

  const ModalBody = () => {
    if (!payload) return null;

    if (payload.kind === "profile") {
      const profile = payload.profile || {};
      const personal = profile.personal || {};
      const job = profile.job || {};
      const emergency = Array.isArray(profile.emergencyContacts)
        ? profile.emergencyContacts
        : [];
      const idProofs = Array.isArray(profile.idProofs) ? profile.idProofs : [];
      const education = Array.isArray(profile.education) ? profile.education : [];
      const experience = Array.isArray(profile.experience) ? profile.experience : [];
      const skills = profile.skills || {};
      const bank = profile.bank || {};

      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Employee</p>
            <p className="text-lg font-bold text-slate-900">{profile.name || "-"}</p>
            <p className="text-sm text-slate-600">{payload.role || job.title || "-"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-900">{payload.status || "-"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Location</p>
              <p className="font-semibold text-slate-900">
                {payload.location || job.location || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Personal Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Full Name" value={profile.name} />
              <DetailItem label="DOB" value={personal.dob} />
              <DetailItem label="Gender" value={personal.gender} />
              <DetailItem label="Marital Status" value={personal.maritalStatus} />
              <DetailItem label="Blood Group" value={personal.bloodGroup} />
              <DetailItem label="Personal Email" value={personal.personalEmail || personal.email} />
              <DetailItem label="Official Email" value={personal.officialEmail} />
              <DetailItem label="Mobile Number" value={personal.mobileNumber || personal.phone} />
              <DetailItem label="Alternate Number" value={personal.alternateContactNumber} />
              <DetailItem label="Current Address" value={personal.currentAddress || personal.address} />
              <DetailItem label="Permanent Address" value={personal.permanentAddress} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Job Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Employee ID" value={job.employeeId || profile.id} />
              <DetailItem label="Designation" value={job.title} />
              <DetailItem label="Department" value={job.department} />
              <DetailItem label="Reporting Manager" value={job.manager} />
              <DetailItem label="Date of Joining" value={job.joiningDate} />
              <DetailItem label="Work Mode" value={job.workMode} />
              <DetailItem label="Work Location" value={job.location} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Skills and Expertise</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Primary Skills" value={skills.primarySkills} />
              <DetailItem label="Secondary Skills" value={skills.secondarySkills} />
              <DetailItem label="Tools / Technologies" value={skills.toolsTechnologies} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Bank and Payroll Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailItem label="Account Holder Name" value={bank.accountHolderName} />
              <DetailItem label="Bank Name" value={bank.bankName} />
              <DetailItem label="Account Number" value={bank.accountNumber} />
              <DetailItem label="IFSC Code" value={bank.ifscCode} />
              <DetailItem label="Branch" value={bank.branch} />
              <DetailItem label="Payment Mode" value={bank.paymentMode} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Emergency Contacts</p>
            {emergency.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emergency.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Name" value={c.name} />
                    <DetailItem label="Relation" value={c.relation} />
                    <DetailItem label="Phone" value={c.phone} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No emergency contacts.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">ID Proofs</p>
            {idProofs.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {idProofs.map((d, i) => (
                  <div key={`${d.type}-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Type" value={d.type} />
                    <DetailItem label="Number" value={d.number} />
                    <DetailItem label="Status" value={d.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No ID proofs.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Education</p>
            {education.length ? (
              <div className="space-y-3">
                {education.map((e, i) => (
                  <div key={`edu-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Qualification" value={e.qualification} />
                    <DetailItem label="Institution" value={e.institution} />
                    <DetailItem label="Year of Passing" value={e.yearOfPassing} />
                    <DetailItem label="Specialization" value={e.specialization} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No education details.</p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-3">Experience</p>
            {experience.length ? (
              <div className="space-y-3">
                {experience.map((ex, i) => (
                  <div key={`exp-${i}`} className="rounded-lg border p-3">
                    <DetailItem label="Organization" value={ex.organization} />
                    <DetailItem label="Designation" value={ex.designation} />
                    <DetailItem label="Duration" value={ex.duration} />
                    <DetailItem label="Reason for Leaving" value={ex.reasonForLeaving} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No experience details.</p>
            )}
          </div>

          {payload.showLeave && payload.leaveType ? (
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Leave Info</p>
              <p className="font-semibold text-slate-900">{payload.leaveType}</p>
              <p className="text-sm text-slate-600 mt-1">{payload.leaveDates}</p>
            </div>
          ) : null}
        </div>
      );
    }

    if (payload.kind === "leaveRequest") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Request</p>
            <p className="text-lg font-bold text-slate-900">{payload.employee}</p>
            <p className="text-sm text-slate-600">{payload.type}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Dates</p>
              <p className="font-semibold text-slate-900">{payload.dates}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-900">{payload.status}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500">Reason</p>
            <p className="text-sm text-slate-700 mt-1">{payload.reason}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500">Handover</p>
            <p className="text-sm text-slate-700 mt-1">{payload.handover}</p>
          </div>
        </div>
      );
    }

    if (payload.kind === "payroll") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Payroll</p>
            <p className="text-lg font-bold text-slate-900">{payload.month}</p>
            <p className="text-sm text-slate-600">{payload.status}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-slate-500">Remarks</p>
            <p className="text-sm text-slate-700 mt-1">{payload.remarks}</p>
          </div>
        </div>
      );
    }

    if (payload.kind === "payslip") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Payslips</p>
            <p className="text-lg font-bold text-slate-900">{payload.month}</p>
            <p className="text-sm text-slate-600">
              Published: {payload.published ? "Yes" : "No"}
            </p>
          </div>

          {payload.note ? (
            <div className="rounded-xl border p-4">
              <p className="text-xs text-slate-500">Note</p>
              <p className="text-sm text-slate-700 mt-1">{payload.note}</p>
            </div>
          ) : null}
        </div>
      );
    }

    return <div className="text-sm text-slate-600">No details available.</div>;
  };

  /* ===================== Render ===================== */
  return (
    <div className="space-y-6">
      {view === "dashboard" && <DashboardView />}
      {view === "employees" && <EmployeesView />}
      {view === "leave" && <LeaveView />}
      {view === "approvals" && <ApprovalsView />}
      {view === "payroll" && <PayrollView />}

      <Modal open={modal.open} title={modal.title} onClose={closeModal}>
        <ModalBody />
      </Modal>
    </div>
  );
}
