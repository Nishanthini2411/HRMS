import DocumentManager from "../../components/DocumentManager.jsx";

export default function HrDocuments() {
  return (
    <DocumentManager
      title="HR Documents"
      subtitle="Upload and manage HR documents"
      accent="purple"
      role="hr"
      categoryOptions={["HR Policy", "Offer Letter", "Appointment Letter", "Company Circular", "Other"]}
    />
  );
}

