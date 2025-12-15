// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

// HR
import HrLayout from "./pages/hr/HrLayout";
import HrHome from "./pages/hr/HrHome";
import LeaveManagement from "./pages/hr/LeaveManagement";
import Attendance from "./pages/hr/Attendance";

// ADMIN
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees.jsx";
import AdminAttendance from "./pages/admin/Attendance.jsx";
import AdminLeave from "./pages/admin/LeaveManagement.jsx";
import Payroll from "./pages/admin/Payroll.jsx";
import Documents from "./pages/admin/Documents.jsx";

// ✅ EMPLOYEE (NEW)
import EmployeeLayout from "./pages/employee/EmployeeLayout.jsx";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance.jsx";
import EmployeeLeaveManagement from "./pages/employee/EmployeeLeaveManagement.jsx";
import EmployeeDocuments from "./pages/employee/EmployeeDocuments.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* HR */}
      <Route path="/hr-dashboard" element={<HrLayout />}>
        <Route index element={<HrHome />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="attendance" element={<Attendance />} />
      </Route>

      {/* ADMIN */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="leave" element={<AdminLeave />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="documents" element={<Documents />} />
      </Route>

      {/* ✅ EMPLOYEE */}
      <Route path="/employee-dashboard" element={<EmployeeLayout />}>
        <Route index element={<Navigate to="attendance" replace />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="leave" element={<EmployeeLeaveManagement />} />
        <Route path="documents" element={<EmployeeDocuments />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
