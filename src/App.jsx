// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";

/* ================= HR ================= */
import HrLayout from "./pages/hr/HrLayout";
import HrHome from "./pages/hr/HrHome";
import LeaveManagement from "./pages/hr/LeaveManagement";
import Attendance from "./pages/hr/Attendance";
import HrNotifications from "./pages/hr/HrNotifications";
import HrProfile from "./pages/hr/HrProfile";

/* ================= ADMIN ================= */
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees.jsx";
import AdminAttendance from "./pages/admin/Attendance.jsx";
import AdminLeave from "./pages/admin/LeaveManagement.jsx";
import Payroll from "./pages/admin/Payroll.jsx";
import PayslipManagement from "./pages/admin/PayslipManagement.jsx";
import AdminPayslipView from "./pages/admin/AdminPayslipView.jsx";
import AdminNotifications from "./pages/admin/AdminNotifications.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";

/* ================= ADMIN HEAD ================= */
import AdminHeadLayout from "./pages/adminHead/AdminHeadLayout.jsx";
import AdminHeadDashboard from "./pages/adminHead/AdminHeadDashboard.jsx";
import AdminHeadApprovals from "./pages/adminHead/AdminHeadApprovals.jsx";
import AdminHeadAttendanceControl from "./pages/adminHead/AdminHeadAttendanceControl.jsx";
import AdminHeadLeaveControl from "./pages/adminHead/AdminHeadLeaveControl.jsx";
import AdminHeadDocumentControl from "./pages/adminHead/AdminHeadDocumentControl.jsx";
import AdminHeadPayrollAdmin from "./pages/adminHead/AdminHeadPayrollAdmin.jsx";
import AdminHeadSystemSettings from "./pages/adminHead/AdminHeadSystemSettings.jsx";
import AdminHeadReports from "./pages/adminHead/AdminHeadReports.jsx";
import AdminHeadNotifications from "./pages/adminHead/AdminHeadNotifications.jsx";

/* ================= MANAGER ================= */
import ManagerLayout from "./pages/manager/ManagerLayout.jsx";
import ManagerDashboard from "./pages/manager/ManagerDashboard.jsx";
import ManagerApprovals from "./pages/manager/ManagerApprovals.jsx";
import ManagerTeam from "./pages/manager/ManagerTeam.jsx";
import ManagerPayroll from "./pages/manager/ManagerPayroll.jsx";
import ManagerNotifications from "./pages/manager/ManagerNotifications.jsx";

/* ================= EMPLOYEE ================= */
import EmployeeLayout from "./pages/employee/EmployeeLayout.jsx";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard.jsx";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance.jsx";
import EmployeeLeaveManagement from "./pages/employee/EmployeeLeaveManagement.jsx";
import MyProfile from "./pages/employee/profile/MyProfile.jsx";
import EmployeePayslips from "./pages/employee/EmployeePayslips.jsx";

/* ✅ NEW: EMPLOYEE SIGN IN (details fill page) */
import EmployeeSignIn from "./pages/employee/EmployeeSignIn.jsx";

/* EMPLOYEE MENU PAGES */
import { SupportPage } from "./pages/employee/EmployeeMenuPages.jsx";

/* REAL EMPLOYEE PAGES */
import EmployeeNotifications from "./pages/employee/pages/EmployeeNotifications.jsx";
import EmployeeSettings from "./pages/employee/pages/EmployeeSettings.jsx";
import PeopleDirectory from "./pages/PeopleDirectory.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/people" element={<PeopleDirectory />} />

      {/* ✅ NEW ROUTE: Employee login -> Sign In (fill personal details) */}
      <Route path="/employee-signin" element={<EmployeeSignIn />} />

      {/* ================= HR ================= */}
      <Route path="/hr-dashboard" element={<HrLayout />}>
        <Route index element={<HrHome />} />
        <Route path="payroll" element={<Payroll basePath="/hr-dashboard" />} />
        <Route path="payslips" element={<PayslipManagement basePath="/hr-dashboard" />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="notifications" element={<HrNotifications />} />
        <Route path="profile" element={<HrProfile />} />
        <Route path="people" element={<PeopleDirectory />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="leave" element={<AdminLeave />} />
        <Route path="payslips" element={<AdminPayslipView />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="people" element={<PeopleDirectory />} />
      </Route>

      {/* ================= ADMIN HEAD ================= */}
      <Route path="/admin-head" element={<AdminHeadLayout />}>
        <Route index element={<AdminHeadDashboard />} />
        <Route path="approvals" element={<AdminHeadApprovals />} />
        <Route path="attendance" element={<AdminHeadAttendanceControl />} />
        <Route path="leave" element={<AdminHeadLeaveControl />} />
        <Route path="documents" element={<AdminHeadDocumentControl />} />
        <Route path="payroll" element={<AdminHeadPayrollAdmin />} />
        <Route path="settings" element={<AdminHeadSystemSettings />} />
        <Route path="reports" element={<AdminHeadReports />} />
        <Route path="notifications" element={<AdminHeadNotifications />} />
      </Route>

      {/* ================= MANAGER ================= */}
      <Route path="/manager-dashboard" element={<ManagerLayout />}>
        <Route index element={<ManagerDashboard />} />
        <Route path="approvals" element={<ManagerApprovals />} />
        <Route path="team" element={<ManagerTeam />} />
        <Route path="payroll" element={<ManagerPayroll />} />
        <Route path="notifications" element={<ManagerNotifications />} />
      </Route>

      {/* ================= EMPLOYEE ================= */}
      <Route path="/employee-dashboard" element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="leave" element={<EmployeeLeaveManagement />} />
        <Route path="payslips" element={<EmployeePayslips />} />
        <Route path="notifications" element={<EmployeeNotifications />} />
        <Route path="settings" element={<EmployeeSettings />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="people" element={<PeopleDirectory />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
