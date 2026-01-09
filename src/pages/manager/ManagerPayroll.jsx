import { useEffect, useState } from "react";
import { Eye, FileSpreadsheet, Lock, Receipt } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const PAYROLL_TABLE = "hrmss_payroll_records";
const PAYROLL_TABLE_FALLBACK = "hrmss_payroll";
const PAYSLIP_TABLE = "hrmss_payslip_records";

const safeText = (v) => (v == null ? "" : String(v));
const pick = (row, keys, fallback = "") => {
  for (const k of keys) {
    if (row && row[k] != null && String(row[k]).trim() !== "") return row[k];
  }
  return fallback;
};

const formatMonth = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
};

const normalizePayroll = (row) => {
  const month = pick(row, ["month", "period", "payroll_month", "pay_month"], "");
  return {
    month: safeText(month || formatMonth(row.created_at)),
    status: safeText(pick(row, ["status"], "-")),
    remarks: safeText(pick(row, ["remarks", "note", "description", "summary"], "")),
  };
};

const normalizePayslip = (row) => {
  const month = pick(row, ["month", "period", "payroll_month", "pay_month"], "");
  const published =
    row.published ??
    row.is_published ??
    row.payslip_published ??
    row.isPublished ??
    false;

  return {
    id: safeText(pick(row, ["employee_id", "emp_id", "user_id", "id"], "-")),
    name: safeText(pick(row, ["employee_name", "full_name", "name"], "-")),
    month: safeText(month || formatMonth(row.created_at)),
    netPay: safeText(pick(row, ["net_pay", "net", "net_salary", "take_home"], "-")),
    status: safeText(pick(row, ["status"], published ? "Published" : "Unpublished")),
  };
};

export default function ManagerPayroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payslipRecords, setPayslipRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPayroll = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const primary = await supabase
        .from(PAYROLL_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (primary.error) {
        const fallback = await supabase
          .from(PAYROLL_TABLE_FALLBACK)
          .select("*")
          .order("created_at", { ascending: false });

        setPayrollRecords((fallback.data || []).map(normalizePayroll));
      } else {
        setPayrollRecords((primary.data || []).map(normalizePayroll));
      }

      const { data: payslipRows, error: payslipErr } = await supabase
        .from(PAYSLIP_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (payslipErr) {
        setPayslipRecords([]);
      } else {
        setPayslipRecords((payslipRows || []).map(normalizePayslip));
      }
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-slate-900 text-white p-5 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
          <Lock />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-200">Payroll & Payslip Center</p>
          <p className="text-lg font-bold">View-only access for both managers</p>
        </div>
        <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold">
          <Eye size={14} /> Read only
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading payroll...
        </div>
      ) : errorMsg ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-rose-600 shadow-sm">
          {errorMsg}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Payroll Runs</h3>
              </div>
              <span className="text-xs text-slate-500">Managers cannot edit</span>
            </div>
            <div className="space-y-2">
              {payrollRecords.length === 0 ? (
                <div className="rounded-xl border p-3 text-sm text-slate-600 bg-slate-50/50">
                  No payroll records found.
                </div>
              ) : (
                payrollRecords.map((row) => (
                  <div
                    key={`${row.month}-${row.status}`}
                    className="rounded-xl border p-3 flex items-start justify-between bg-slate-50/50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{row.month}</p>
                      <p className="text-xs text-slate-500">{row.remarks}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                      {row.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Payslip Status</h3>
              </div>
              <span className="text-xs text-slate-500">Read only</span>
            </div>
            <div className="overflow-x-auto">
              {payslipRecords.length === 0 ? (
                <div className="rounded-xl border p-3 text-sm text-slate-600 bg-slate-50/50">
                  No payslips found.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="py-2">Employee</th>
                      <th className="py-2">Month</th>
                      <th className="py-2">Net Pay</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payslipRecords.map((p) => (
                      <tr key={`${p.id}-${p.month}`} className="hover:bg-slate-50">
                        <td className="py-3">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.id}</div>
                        </td>
                        <td className="py-3 text-slate-800">{p.month}</td>
                        <td className="py-3 text-slate-900 font-semibold">{p.netPay}</td>
                        <td className="py-3">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
