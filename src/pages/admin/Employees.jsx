import React, { useState, useMemo } from "react";

// ---------------------- SAMPLE DATA ----------------------
const initialEmployees = [
  {
    id: "EMP001",
    name: "Priya Sharma",
    department: "Developerment",
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
  {
    id: "EMP002",
    name: "Kavin Raj",
    department: "Engineering",
    role: "Software Engineer",
    email: "kavin.raj@example.com",
    phone: "+94 77 765 4321",
    location: "Jaffna",
    status: "Active",
    joinDate: "2024-03-05",
    employeeType: "Full-time",
    avatar: "",
    gender: "Male",
    dob: "1998-09-25",
    reportingManager: "Tech Lead",
  },
  {
    id: "EMP003",
    name: "Anjali Perera",
    department: "Finance",
    role: "Account Executive",
    email: "anjali.perera@example.com",
    phone: "+94 71 234 5678",
    location: "Kilinochchi",
    status: "Inactive",
    joinDate: "2024-08-20",
    employeeType: "Intern",
    avatar: "",
    gender: "Female",
    dob: "2001-12-01",
    reportingManager: "Finance Manager",
  },
];

// ---------------------- TAG / BADGE HELPERS ----------------------
const statusColors = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  // Probation: "bg-amber-100 text-amber-700 border border-amber-200",
  Inactive: "bg-rose-100 text-rose-700 border border-rose-200",
};

const departmentColors = {
  HR: "bg-indigo-50 text-indigo-700",
  Engineering: "bg-sky-50 text-sky-700",
  Finance: "bg-emerald-50 text-emerald-700",
  Marketing: "bg-pink-50 text-pink-700",
};

// ---------------------- MAIN COMPONENT ----------------------
const Employees = () => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    id: "",
    name: "",
    department: "",
    role: "",
    email: "",
    phone: "",
    location: "",
    status: "Active",
    joinDate: "",
    employeeType: "",
    gender: "",
    dob: "",
    reportingManager: "",
  });

  // -------- FILTERED EMPLOYEES --------
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === "All" || emp.department === departmentFilter;

      const matchesStatus =
        statusFilter === "All" || emp.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  // -------- HANDLERS --------
  const handleOpenProfile = (emp) => {
    setSelectedEmployee(emp);
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setSelectedEmployee(null);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewEmployee({
      id: "",
      name: "",
      department: "",
      role: "",
      email: "",
      phone: "",
      location: "",
      status: "Active",
      joinDate: "",
      employeeType: "",
      gender: "",
      dob: "",
      reportingManager: "",
    });
  };

  const handleNewEmployeeChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();

    if (!newEmployee.id || !newEmployee.name || !newEmployee.department) {
      alert("Employee ID, Name and Department are required.");
      return;
    }

    setEmployees((prev) => [...prev, newEmployee]);
    handleCloseAddModal();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      {/* -------- HEADER -------- */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Employee Database
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employee records, view profiles and keep your HR data
            organized.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          + Add Employee
        </button>
      </div>

      {/* -------- FILTERS -------- */}
      <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Department
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All departments</option>
            <option value="HR">UI Developer</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            {/* <option value="Probation">Probation</option> */}
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* -------- TABLE -------- */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredEmployees.length}
            </span>{" "}
            employees
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employee
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Join Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No employees found. Try adjusting filters or add a new
                    employee.
                  </td>
                </tr>
              )}

              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {emp.id} • {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        departmentColors[emp.department] ||
                        "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {emp.department}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-700">{emp.role}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[emp.status] ||
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {emp.joinDate || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenProfile(emp)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================== PROFILE MODAL ================== */}
      {isProfileOpen && selectedEmployee && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-100">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedEmployee.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedEmployee.role} • {selectedEmployee.department}
                </p>
              </div>
              <button
                onClick={handleCloseProfile}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {selectedEmployee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    ID: {selectedEmployee.id}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[selectedEmployee.status] ||
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {selectedEmployee.status}
                  </span>
                  {selectedEmployee.employeeType && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                      {selectedEmployee.employeeType}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Reporting to: {selectedEmployee.reportingManager || "-"}
                </div>
              </div>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </h3>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm text-slate-900">
                    {selectedEmployee.email}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Phone</div>
                  <div className="text-sm text-slate-900">
                    {selectedEmployee.phone}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Location</div>
                  <div className="text-sm text-slate-900">
                    {selectedEmployee.location || "-"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Personal
                </h3>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Gender</div>
                  <div className="text-sm text-slate-900">
                    {selectedEmployee.gender || "-"}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Date of Birth
                  </div>
                  <div className="text-sm text-slate-900">
                    {selectedEmployee.dob || "-"}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Join Date</div>
                  <div className="text-sm text-slate-900">
                    {selectedEmployee.joinDate || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== ADD EMPLOYEE MODAL ================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-100">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Add New Employee
                </h2>
                <p className="text-xs text-slate-500">
                  Create a new employee record in the HR system.
                </p>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Employee ID *
                  </label>
                  <input
                    name="id"
                    value={newEmployee.id}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="EMP004"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Full Name *
                  </label>
                  <input
                    name="name"
                    value={newEmployee.name}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={newEmployee.department}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select department</option>
                    <option value="HR">UI Developer</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Role / Designation
                  </label>
                  <input
                    name="role"
                    value={newEmployee.role}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. HR Executive"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={newEmployee.phone}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="+94 ..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Location
                  </label>
                  <input
                    name="location"
                    value={newEmployee.location}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="City / Branch"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newEmployee.status}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Employee Type
                  </label>
                  <select
                    name="employeeType"
                    value={newEmployee.employeeType}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Intern">Intern</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={newEmployee.gender}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={newEmployee.dob}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Join Date
                  </label>
                  <input
                    type="date"
                    name="joinDate"
                    value={newEmployee.joinDate}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Reporting Manager
                  </label>
                  <input
                    name="reportingManager"
                    value={newEmployee.reportingManager}
                    onChange={handleNewEmployeeChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. HR Head, Tech Lead"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
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
};

export default Employees;
