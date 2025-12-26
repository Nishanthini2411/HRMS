// src/pages/hr/Employees.jsx
import React, { useState, useMemo, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

/* ---------------------- SAMPLE DATA ---------------------- */
const initialEmployees = [
  {
    id: "EMP001",
    name: "Priya Sharma",
    department: "AI Engineer",
    role: "UI Developer",
    email: "priya.sharma@example.com",
    phone: "+94 77 123 4567",
    location: "Remote",
    status: "Active",
    joinDate: "2023-01-10",
    employeeType: "Full-time",
    avatar: "",
    gender: "Female",
    dob: "1995-04-12",
    reportingManager: "CEO",
  },
];

/* ---------------------- DROPDOWN OPTIONS ---------------------- */
const DEPARTMENTS = [
  "Founder",
  "Finance & HR",
  "Business Development Executive",
  "AI Engineer",
  "AI Intern",
  "UI/UX Intern",
  "Software Developer Intern",
  "Talent Acquisition Manager",
  "Talent Acquisition Executive",
];

const WORK_LOCATIONS = ["Chennai", "Bangalore", "Remote", "Other"];

/* ---------------------- TAG HELPERS ---------------------- */
const statusColors = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive: "bg-rose-100 text-rose-700 border border-rose-200",
};

const departmentColors = {
  Founder: "bg-amber-50 text-amber-700",
  "Finance & HR": "bg-emerald-50 text-emerald-700",
  "Business Development Executive": "bg-pink-50 text-pink-700",
  "AI Engineer": "bg-sky-50 text-sky-700",
  "AI Intern": "bg-indigo-50 text-indigo-700",
  "UI/UX Intern": "bg-fuchsia-50 text-fuchsia-700",
  "Software Developer Intern": "bg-violet-50 text-violet-700",
  "Talent Acquisition Manager": "bg-teal-50 text-teal-700",
  "Talent Acquisition Executive": "bg-cyan-50 text-cyan-700",
};

const deptPill = (dept) =>
  departmentColors[dept] || "bg-slate-100 text-slate-700";

/* ---------------------- MAIN COMPONENT ---------------------- */
export default function Employees() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 🔍 FILTER STATES
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("All");

  // ➕ ADD EMPLOYEE STATE
  const [newEmployee, setNewEmployee] = useState({
    id: "",
    password: "",
    name: "",
    department: "",
    role: "",
    employeeType: "",
    gender: "",
    reportingManager: "",
    joinDate: "",
    // ✅ Work Location (checkboxes)
    workLocations: [],
    otherWorkLocation: "",
  });

  // ✅ PAGE LOAD: DB-ல இருந்து employee list fetch பண்ணி UI-ல show
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isSupabaseConfigured) return;

      try {
        const { data, error } = await supabase
          .from("hrmss_employees")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((r) => ({
            id: r.employee_id || "",
            name: r.full_name || "",
            department: r.department || "",
            role: r.role || "",
            email: r.email || "",
            phone: r.phone || "",
            location: r.location || "",
            status: r.status || "Active",
            joinDate: r.join_date || "",
            employeeType: r.employee_type || "",
            avatar: r.avatar || "",
            gender: r.gender || "",
            dob: r.dob || "",
            reportingManager: r.reporting_manager || "",
          }));
          setEmployees(mapped);
        }
      } catch (err) {
        console.error("Fetch employees failed:", err);
        // fallback: keep initialEmployees
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((p) => ({ ...p, [name]: value }));
  };

  const toggleWorkLocation = (loc) => {
    setNewEmployee((p) => {
      const exists = p.workLocations.includes(loc);
      const next = exists
        ? p.workLocations.filter((x) => x !== loc)
        : [...p.workLocations, loc];

      // If "Other" unchecked, clear other text
      const nextOther = loc === "Other" && exists ? "" : p.otherWorkLocation;

      return { ...p, workLocations: next, otherWorkLocation: nextOther };
    });
  };

  const buildLocationText = (workLocations, otherWorkLocation) => {
    const base = workLocations.filter((x) => x !== "Other");
    const other =
      workLocations.includes("Other") && otherWorkLocation?.trim()
        ? [`Other: ${otherWorkLocation.trim()}`]
        : workLocations.includes("Other")
        ? ["Other"]
        : [];
    return [...base, ...other].join(", ");
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (
      !newEmployee.id ||
      !newEmployee.password ||
      !newEmployee.name ||
      !newEmployee.department
    ) {
      alert("Employee ID, Password, Name & Department required");
      return;
    }

    // ✅ Local duplicate check
    const exists = employees.some(
      (x) =>
        String(x.id || "").toLowerCase() ===
        String(newEmployee.id).toLowerCase()
    );
    if (exists) {
      alert("This Employee ID already exists");
      return;
    }

    const locationText = buildLocationText(
      newEmployee.workLocations,
      newEmployee.otherWorkLocation
    );

    // ✅ 1) credentials save + 2) details save (persist)
    if (isSupabaseConfigured) {
      try {
        // 1) Save login credentials (employee_accounts table via RPC)
        const { error: credErr } = await supabase.rpc("upsert_employee_account", {
          p_employee_id: String(newEmployee.id || "").trim(),
          p_password: String(newEmployee.password || ""),
        });
        if (credErr) throw credErr;

        // 2) Save employee details to DB table (so refresh also show)
        const payload = {
          employee_id: String(newEmployee.id || "").trim(),
          full_name: String(newEmployee.name || "").trim(),
          department: newEmployee.department || null,
          role: newEmployee.role || null,
          employee_type: newEmployee.employeeType || null,
          gender: newEmployee.gender || null,
          reporting_manager: newEmployee.reportingManager || null,
          join_date: newEmployee.joinDate || null,
          location: locationText || null,
          status: "Active",
          email: null,
          phone: null,
          dob: null,
          avatar: null,
        };

        const { data: inserted, error: insErr } = await supabase
          .from("hrmss_employees")
          .insert([payload])
          .select("*")
          .single();

        if (insErr) throw insErr;

        // UI update (password store pannama)
        setEmployees((prev) => [
          {
            id: inserted.employee_id,
            name: inserted.full_name,
            department: inserted.department || "",
            role: inserted.role || "",
            email: inserted.email || "",
            phone: inserted.phone || "",
            location: inserted.location || "",
            status: inserted.status || "Active",
            joinDate: inserted.join_date || "",
            employeeType: inserted.employee_type || "",
            avatar: inserted.avatar || "",
            gender: inserted.gender || "",
            dob: inserted.dob || "",
            reportingManager: inserted.reporting_manager || "",
          },
          ...prev,
        ]);
      } catch (err) {
        console.error(err);
        alert(err?.message || "Failed to save employee");
        return;
      }
    } else {
      console.warn("Supabase not configured. Employee not persisted.");

      // ✅ Do NOT store password in UI state list
      const { password, ...safeEmployee } = newEmployee;

      setEmployees((prev) => [
        ...prev,
        {
          ...safeEmployee,
          email: "",
          phone: "",
          location: locationText || "",
          dob: "",
          status: "Active",
          avatar: "",
        },
      ]);
    }

    setIsAddModalOpen(false);
    setNewEmployee({
      id: "",
      password: "",
      name: "",
      department: "",
      role: "",
      employeeType: "",
      gender: "",
      reportingManager: "",
      joinDate: "",
      workLocations: [],
      otherWorkLocation: "",
    });
  };

  // 🔍 FILTER LOGIC
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        (emp.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (emp.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (emp.email || "").toLowerCase().includes(search.toLowerCase());

      const matchDepartment =
        departmentFilter === "All" || emp.department === departmentFilter;

      const matchEmployeeType =
        employeeTypeFilter === "All" || emp.employeeType === employeeTypeFilter;

      return matchSearch && matchDepartment && matchEmployeeType;
    });
  }, [employees, search, departmentFilter, employeeTypeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Employee Database
          </h1>
          <p className="text-sm text-slate-500">Manage employee records</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Employee
        </button>
      </div>

      {/* 🔍 FILTER BAR */}
      <div className="mb-6 grid gap-4 rounded-xl bg-white p-4 shadow ring-1 ring-slate-100 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, email..."
          className="rounded-lg border px-3 py-2 text-sm"
        />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="All">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={employeeTypeFilter}
          onChange={(e) => setEmployeeTypeFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="All">All</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Intern">Intern</option>
          <option value="Contract">Contract</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow ring-1 ring-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">
                Work Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold">
                Join Date
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{emp.name}</div>
                  <div className="text-xs text-slate-500">{emp.id}</div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${deptPill(
                      emp.department
                    )}`}
                  >
                    {emp.department || "-"}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-700">{emp.role || "-"}</td>

                <td className="px-4 py-3 text-slate-700">
                  {emp.location || "-"}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                      statusColors[emp.status] ||
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {emp.joinDate || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">
            No employees found.
          </div>
        )}
      </div>

      {/* ================= ADD EMPLOYEE MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Add New Employee
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="grid gap-4 md:grid-cols-2">
              <input
                name="id"
                value={newEmployee.id}
                onChange={handleChange}
                placeholder="Employee ID *"
                className="rounded border px-3 py-2"
              />

              <input
                type="password"
                name="password"
                value={newEmployee.password}
                onChange={handleChange}
                placeholder="Password *"
                className="rounded border px-3 py-2"
              />

              <input
                name="name"
                value={newEmployee.name}
                onChange={handleChange}
                placeholder="Full Name *"
                className="rounded border px-3 py-2"
              />

              <select
                name="department"
                value={newEmployee.department}
                onChange={handleChange}
                className="rounded border px-3 py-2"
              >
                <option value="">Select Department *</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                name="role"
                value={newEmployee.role}
                onChange={handleChange}
                placeholder="Role / Designation"
                className="rounded border px-3 py-2"
              />

              <select
                name="employeeType"
                value={newEmployee.employeeType}
                onChange={handleChange}
                className="rounded border px-3 py-2"
              >
                <option value="">Employee Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Intern">Intern</option>
                <option value="Contract">Contract</option>
              </select>

              <select
                name="gender"
                value={newEmployee.gender}
                onChange={handleChange}
                className="rounded border px-3 py-2"
              >
                <option value="">Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>

              <input
                type="date"
                name="joinDate"
                value={newEmployee.joinDate}
                onChange={handleChange}
                className="rounded border px-3 py-2"
              />

              <input
                name="reportingManager"
                value={newEmployee.reportingManager}
                onChange={handleChange}
                placeholder="Reporting Manager"
                className="rounded border px-3 py-2 md:col-span-2"
              />

              {/* ✅ Work Location Checkboxes */}
              <div className="md:col-span-2 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Work Location</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {WORK_LOCATIONS.map((loc) => (
                    <label key={loc} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={newEmployee.workLocations.includes(loc)}
                        onChange={() => toggleWorkLocation(loc)}
                        className="h-4 w-4"
                      />
                      {loc}
                    </label>
                  ))}
                </div>

                {newEmployee.workLocations.includes("Other") && (
                  <div className="mt-3">
                    <input
                      value={newEmployee.otherWorkLocation}
                      onChange={(e) =>
                        setNewEmployee((p) => ({
                          ...p,
                          otherWorkLocation: e.target.value,
                        }))
                      }
                      placeholder="Other location (type here)"
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-500">
                  Selected:{" "}
                  {buildLocationText(newEmployee.workLocations, newEmployee.otherWorkLocation) || "—"}
                </div>
              </div>

              {/* 🔘 BUTTONS */}
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
