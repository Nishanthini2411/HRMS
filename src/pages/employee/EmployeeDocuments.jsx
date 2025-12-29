import DocumentManager from "../../components/DocumentManager.jsx";

export default function EmployeeDocuments() {
  return (
    <DocumentManager
      title="My Documents"
      subtitle="Upload and manage your documents"
      accent="slate"
      role="employee"
      categoryOptions={["Offer Letter", "Payslip", "ID Proof", "Experience Letter", "Other"]}
    />
  );
}

