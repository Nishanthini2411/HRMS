import React, { useState, useMemo } from "react";

// ---------------------- SAMPLE DATA ----------------------
const initialEmployees = [
  {
    id: "EMP001",
    name: "Priya Sharma",
    department: "Engineering",
    role: "UI Developer",
    email: "priya.sharma@example.com",
    phone: "+94 77 123 4567",
    location: "Colombo",
    status: "Active",
    joinDate: "2023-01-10",
    employeeType: "Full-time",
    avatar: "",
    gender: "Female",
    dob: "1995-04-12",
    reportingManager: "CEO",
  },
];

// ---------------------- TAG HELPERS ----------------------
const statusColors = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive: "bg-rose-100 text-rose-700 border border-rose-200",
};

const departmentColors = {
  Engineering: "bg-sky-50 text-sky-700",
  Finance: "bg-emerald-50 text-emerald-700",
  Marketing: "bg-pink-50 text-pink-700",
  HR: "bg-indigo-50 text-indigo-700",
};

// ---------------------- MAIN COMPONENT ----------------------
export default function Employees() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 🔍 FILTER STATES
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("All");

  // ➕ ADD EMPLOYEE STATE (ALL REQUIRED FIELDS)
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((p) => ({ ...p, [name]: value }));
  };

  const handleAddEmployee = (e) => {
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

    setEmployees((prev) => [
      ...prev,
      {
        ...newEmployee,
        email: "",
        phone: "",
        location: "",
        dob: "",
        status: "Active",
        avatar: "",
      },
    ]);

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
    });
  };

  // 🔍 FILTER LOGIC
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.id.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());

      const matchDepartment =
        departmentFilter === "All" || emp.department === departmentFilter;

      const matchEmployeeType =
        employeeTypeFilter === "All" ||
        emp.employeeType === employeeTypeFilter;

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
          <p className="text-sm text-slate-500">
            Manage employee records
          </p>
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
          <option value="Engineering">Engineering</option>
          <option value="Finance">Finance</option>
          <option value="HR">HR</option>
          <option value="Marketing">Marketing</option>
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
              <th className="px-4 py-3 text-left text-xs font-semibold">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Join Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-xs text-slate-500">{emp.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${departmentColors[emp.department]}`}>
                    {emp.department}
                  </span>
                </td>
                <td className="px-4 py-3">{emp.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[emp.status]}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3">{emp.joinDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= ADD EMPLOYEE MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Add New Employee</h2>

            {/* ✅ ALL REQUIRED FIELDS PRESENT */}
          <form
  onSubmit={handleAddEmployee}
  className="grid gap-4 md:grid-cols-2"
>
  <input
    name="id"
    value={newEmployee.id}
    onChange={handleChange}
    placeholder="Employee ID *"
    className="border px-3 py-2 rounded"
  />

  <input
    type="password"
    name="password"
    value={newEmployee.password}
    onChange={handleChange}
    placeholder="Password *"
    className="border px-3 py-2 rounded"
  />

  <input
    name="name"
    value={newEmployee.name}
    onChange={handleChange}
    placeholder="Full Name *"
    className="border px-3 py-2 rounded"
  />

  <select
    name="department"
    value={newEmployee.department}
    onChange={handleChange}
    className="border px-3 py-2 rounded"
  >
    <option value="">Select Department *</option>
    <option value="Engineering">Engineering</option>
    <option value="Finance">Finance</option>
    <option value="HR">HR</option>
    <option value="Marketing">Marketing</option>
  </select>

  <input
    name="role"
    value={newEmployee.role}
    onChange={handleChange}
    placeholder="Role / Designation"
    className="border px-3 py-2 rounded"
  />

  <select
    name="employeeType"
    value={newEmployee.employeeType}
    onChange={handleChange}
    className="border px-3 py-2 rounded"
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
    className="border px-3 py-2 rounded"
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
    className="border px-3 py-2 rounded"
  />

  <input
    name="reportingManager"
    value={newEmployee.reportingManager}
    onChange={handleChange}
    placeholder="Reporting Manager"
    className="border px-3 py-2 rounded md:col-span-2"
  />

  {/* 🔘 BUTTONS */}
  <div className="md:col-span-2 flex justify-end gap-3">
    <button
      type="button"
      onClick={() => setIsAddModalOpen(false)}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
    >
      Close
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
