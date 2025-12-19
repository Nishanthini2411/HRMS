import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Download,
  Printer,
  ShieldCheck,
  User,
} from "lucide-react";

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const company = {
  name: "Twite AI Technology",
  address: "Plot 45, Electronic City, Bengaluru, Karnataka - 560100",
};

const payslipData = {
  "December 2025": {
    month: "December 2025",
    employee: {
      name: "Rahul Sharma",
      id: "EMP-2024-0156",
      designation: "Senior Software Engineer",
      department: "Engineering",
      doj: "15-Mar-2022",
    },
    earnings: [
      { label: "Basic Salary", value: 45000 },
      { label: "House Rent Allowance (HRA)", value: 18000 },
      { label: "Special Allowance", value: 12000 },
      { label: "Other Allowances", value: 5000 },
      { label: "Bonus / Incentives", value: 3000 },
    ],
    deductions: [
      { label: "Provident Fund (PF)", value: 5400 },
      { label: "ESI", value: 0 },
      { label: "Professional Tax", value: 200 },
      { label: "Income Tax (TDS)", value: 4500 },
      { label: "Loan / Advance", value: 0 },
      { label: "Other Deductions", value: 0 },
    ],
    attendance: { working: 22, present: 21, paidLeave: 1, lop: 0 },
    bank: {
      name: "HDFC Bank",
      account: "XXXXXXXX9891",
      mode: "Bank Transfer",
      paidOn: "31-Dec-2025",
    },
    paidOn: "31-Dec-2025",
  },

  "November 2025": {
    month: "November 2025",
    employee: {
      name: "Rahul Sharma",
      id: "EMP-2024-0156",
      designation: "Senior Software Engineer",
      department: "Engineering",
      doj: "15-Mar-2022",
    },
    earnings: [
      { label: "Basic Salary", value: 44000 },
      { label: "House Rent Allowance (HRA)", value: 17600 },
      { label: "Special Allowance", value: 11000 },
      { label: "Other Allowances", value: 4500 },
      { label: "Bonus / Incentives", value: 2500 },
    ],
    deductions: [
      { label: "Provident Fund (PF)", value: 5200 },
      { label: "ESI", value: 0 },
      { label: "Professional Tax", value: 200 },
      { label: "Income Tax (TDS)", value: 4200 },
      { label: "Loan / Advance", value: 0 },
      { label: "Other Deductions", value: 0 },
    ],
    attendance: { working: 22, present: 20, paidLeave: 2, lop: 0 },
    bank: {
      name: "HDFC Bank",
      account: "XXXXXXXX9891",
      mode: "Bank Transfer",
      paidOn: "30-Nov-2025",
    },
    paidOn: "30-Nov-2025",
  },
};

const MonthCard = ({ label, selected, onClick, paidOn }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border px-4 py-3 shadow-sm transition ${
      selected
        ? "border-indigo-300 bg-indigo-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-extrabold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">Paid on {paidOn}</p>
      </div>
      {selected ? (
        <span className="text-[11px] font-semibold text-indigo-700">
          Viewing
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-slate-500">Open</span>
      )}
    </div>
  </button>
);

const Pill = ({ label, value }) => (
  <div className="rounded-xl border bg-white px-4 py-3 text-center shadow-sm">
    <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
    <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
  </div>
);

export default function AdminPayslipView() {
  const months = useMemo(() => Object.keys(payslipData), []);
  const [selected, setSelected] = useState(months[0] || "December 2025");
  const data = payslipData[selected] || payslipData[months[0]];

  const totals = useMemo(() => {
    const earn = (data?.earnings || []).reduce((a, b) => a + b.value, 0);
    const ded = (data?.deductions || []).reduce((a, b) => a + b.value, 0);
    return { earn, ded, net: earn - ded };
  }, [data]);

  const handleDownload = () => alert("Downloading payslip PDF (demo)");
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-3 xl:gap-6">
        <div className="space-y-3 xl:col-span-1">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Payslip Months
                </p>
                <p className="text-lg font-extrabold text-slate-900">
                  Select a month
                </p>
              </div>
              <Banknote size={18} className="text-slate-500" />
            </div>

            <div className="mt-3 space-y-2">
              {months.map((m) => (
                <MonthCard
                  key={m}
                  label={m}
                  paidOn={payslipData[m].paidOn}
                  selected={selected === m}
                  onClick={() => setSelected(m)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            {/* Header banner + Logo */}
            <div className="bg-indigo-700 px-6 py-4 text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {/* ✅ Put your logo here: public/twite-logo.jpg */}
                <img
                  src="/twite-logo.jpg"
                  alt="Twite AI Technology"
                  className="h-10 w-10 rounded-xl bg-white/10 object-contain p-1"
                />
                <div>
                  <p className="text-xl font-extrabold">{company.name}</p>
                  <p className="text-sm text-white/80">{company.address}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[13px] font-semibold text-white/80">
                  Payslip for
                </p>
                <p className="text-lg font-bold">{data?.month}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Employee details */}
              <div className="rounded-2xl border bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <User size={16} />
                  Employee Details
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm text-slate-800">
                  <Pill label="Employee Name" value={data?.employee?.name} />
                  <Pill label="Employee ID" value={data?.employee?.id} />
                  <Pill
                    label="Designation"
                    value={data?.employee?.designation}
                  />
                  <Pill label="Department" value={data?.employee?.department} />
                  <Pill label="Date of Joining" value={data?.employee?.doj} />
                </div>
              </div>

              {/* Earnings and deductions */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <p className="text-sm font-extrabold text-slate-900">
                    Earnings
                  </p>
                  <div className="mt-2 divide-y text-sm">
                    {(data?.earnings || []).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-bold text-emerald-700 tabular-nums">
                          {money(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-bold text-emerald-800">
                    <span>Total Earnings (Gross)</span>
                    <span>{money(totals.earn)}</span>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <p className="text-sm font-extrabold text-slate-900">
                    Deductions
                  </p>
                  <div className="mt-2 divide-y text-sm">
                    {(data?.deductions || []).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-bold text-rose-700 tabular-nums">
                          - {money(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>- {money(totals.ded)}</span>
                  </div>
                </div>
              </div>

              {/* Attendance summary */}
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays size={16} />
                  Attendance Summary
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Pill
                    label="Total Working Days"
                    value={data?.attendance?.working ?? "-"}
                  />
                  <Pill
                    label="Days Present"
                    value={data?.attendance?.present ?? "-"}
                  />
                  <Pill
                    label="Paid Leave"
                    value={data?.attendance?.paidLeave ?? "-"}
                  />
                  <Pill
                    label="Loss of Pay (LOP)"
                    value={data?.attendance?.lop ?? "-"}
                  />
                </div>
              </div>

              {/* Net pay summary */}
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm font-extrabold text-slate-900">
                  Net Pay Summary
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Total Earnings</span>
                    <span className="font-bold text-emerald-700">
                      {money(totals.earn)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Total Deductions</span>
                    <span className="font-bold text-rose-700">
                      - {money(totals.ded)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-700">
                    Net Pay (Take-Home)
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-800">
                    {money(totals.net)}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Rupees Sixty Nine Thousand Nine Hundred Only (demo)
                  </p>
                </div>
              </div>

              {/* Payment details */}
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Banknote size={16} />
                  Payment Details
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm">
                  <Pill label="Bank Name" value={data?.bank?.name} />
                  <Pill label="Account Number" value={data?.bank?.account} />
                  <Pill label="Payment Mode" value={data?.bank?.mode} />
                  <Pill label="Paid On" value={data?.bank?.paidOn} />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <ShieldCheck size={14} />
                This is a system-generated payslip and does not require a
                signature.
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50"
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
