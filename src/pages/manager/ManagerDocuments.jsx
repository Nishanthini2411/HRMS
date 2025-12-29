import DocumentManager from "../../components/DocumentManager.jsx";

export default function ManagerDocuments() {
  return (
    <DocumentManager
      title="Manager Documents"
      subtitle="Upload and manage team-related documents"
      accent="purple"
      role="manager"
      categoryOptions={["Team Reports", "Policies", "Approvals", "Payroll", "Other"]}
    />
  );
}

