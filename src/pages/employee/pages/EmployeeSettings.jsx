import { useState } from "react";
import {
  Bell,
  Lock,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { SectionCard } from "../shared/ui.jsx";

export default function EmployeeSettings() {
  const [settings, setSettings] = useState({
    attendance: true,
    leave: true,
    documents: false,
    payroll: true,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage notification preferences and security
        </p>
      </div>

      {/* NOTIFICATIONS */}
      <SectionCard
        title="Notification Preferences"
        subtitle="Choose which alerts you want to receive"
      >
        <ToggleRow
          icon={Bell}
          label="Attendance Notifications"
          checked={settings.attendance}
          onChange={() => toggle("attendance")}
        />
        <ToggleRow
          icon={Bell}
          label="Leave Notifications"
          checked={settings.leave}
          onChange={() => toggle("leave")}
        />
        <ToggleRow
          icon={Bell}
          label="Document Notifications"
          checked={settings.documents}
          onChange={() => toggle("documents")}
        />
        <ToggleRow
          icon={Bell}
          label="Payroll Notifications"
          checked={settings.payroll}
          onChange={() => toggle("payroll")}
        />
      </SectionCard>

      {/* SECURITY */}
      <SectionCard
        title="Security"
        subtitle="Update your account password"
      >
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
        >
          <Lock size={16} />
          Change Password
        </button>
      </SectionCard>

      {/* SAVE */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm text-white">
          <Check size={16} />
          Save Changes
        </button>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

/* ---------------- TOGGLE ROW ---------------- */

function ToggleRow({ icon: Icon, label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-800">
          {label}
        </span>
      </div>

      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full relative transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ---------------- CHANGE PASSWORD MODAL ---------------- */

function ChangePasswordModal({ onClose }) {
  const [show, setShow] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <PasswordInput label="Current Password" show={show} setShow={setShow} />
        <PasswordInput label="New Password" show={show} setShow={setShow} />
        <PasswordInput label="Confirm New Password" show={show} setShow={setShow} />

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ label, show, setShow }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          className="w-full rounded-xl border px-3 py-2 pr-10 text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-2.5 text-slate-400"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
