export const MANAGER_SESSION_KEY = "hrms.manager.session";

export const managerAccounts = [
  {
    id: "MGR-01",
    name: "Priya Menon",
    email: "manager1@hrms.com",
    role: "approver", // can approve / reject
    team: "Product",
  },
  {
    id: "MGR-02",
    name: "Arun Dev",
    email: "manager2@hrms.com",
    role: "viewer", // view-only
    team: "Operations",
  },
];

export const teamMembers = [
  {
    id: "EMP-1045",
    name: "Sneha Iyer",
    role: "Product Designer",
    status: "On Leave",
    leaveType: "Casual Leave",
    leaveDates: "Today & Tomorrow",
    location: "Bangalore",
  },
  {
    id: "EMP-1046",
    name: "Ritwik Sharma",
    role: "Backend Engineer",
    status: "Available",
    leaveType: "",
    leaveDates: "",
    location: "Remote - Pune",
  },
  {
    id: "EMP-1047",
    name: "Neha George",
    role: "QA Analyst",
    status: "On Leave",
    leaveType: "Sick Leave",
    leaveDates: "Today",
    location: "Hyderabad",
  },
  {
    id: "EMP-1048",
    name: "Dhruv Pai",
    role: "Frontend Engineer",
    status: "Available",
    leaveType: "",
    leaveDates: "",
    location: "Chennai",
  },
  {
    id: "EMP-1049",
    name: "Bhavana Kulkarni",
    role: "Product Manager",
    status: "Available",
    leaveType: "",
    leaveDates: "",
    location: "Bangalore",
  },
];

export const leaveRequests = [
  {
    id: "LV-3201",
    employee: "Sneha Iyer",
    type: "Casual Leave",
    dates: "Today & Tomorrow",
    reason: "Family function",
    status: "Pending",
    handover: "Ritwik Sharma",
  },
  {
    id: "LV-3202",
    employee: "Neha George",
    type: "Sick Leave",
    dates: "Today",
    reason: "High fever",
    status: "Pending",
    handover: "QA squad",
  },
  {
    id: "LV-3203",
    employee: "Ritwik Sharma",
    type: "WFH",
    dates: "This Friday",
    reason: "Planned outage at home",
    status: "Approved",
    handover: "Self",
    approvedBy: "Priya Menon",
  },
];

export const payrollRecords = [
  { month: "Dec 2025", status: "Ready for HR", remarks: "All inputs locked" },
  { month: "Nov 2025", status: "Processed", remarks: "Payslips published" },
  { month: "Oct 2025", status: "Processed", remarks: "No anomalies" },
];

export const payslipRecords = [
  { id: "EMP-1045", name: "Sneha Iyer", month: "Nov 2025", netPay: "Rs 92,300", status: "Published" },
  { id: "EMP-1047", name: "Neha George", month: "Nov 2025", netPay: "Rs 71,500", status: "Published" },
  { id: "EMP-1048", name: "Dhruv Pai", month: "Nov 2025", netPay: "Rs 88,900", status: "Published" },
  { id: "EMP-1049", name: "Bhavana Kulkarni", month: "Nov 2025", netPay: "Rs 1,12,400", status: "Published" },
];

export const buildDefaultSession = () => {
  const fallback = managerAccounts[1] || managerAccounts[0];
  return {
    id: fallback.id,
    name: fallback.name,
    email: fallback.email,
    role: fallback.role,
    team: fallback.team,
  };
};

export const getManagerSession = () => {
  try {
    const raw = localStorage.getItem(MANAGER_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.name) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return buildDefaultSession();
};
