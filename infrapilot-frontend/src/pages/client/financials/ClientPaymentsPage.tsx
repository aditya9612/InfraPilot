import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { financeService } from "../../../services/financeService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

const ClientPaymentsPage = () => {
  const [summary, setSummary] = useState<{ paid: number; pending: number }>({ paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchPaymentSummary = async () => {
      try {
        setLoading(true);
        const summaryData = await financeService.getProjectPaymentSummary(projectId);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to fetch payment summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentSummary();
  }, [projectId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials", "Payments"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Payment History</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Log of all successful transactions and payment receipts</p>
        </div>

        {/* Payment Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white text-slate-800 border border-slate-100 shadow-sm rounded-2xl p-8 transition-transform hover:scale-[1.02] duration-300">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-2xl font-black">{loading ? "..." : formatCurrency(summary.paid || 0)}</p>
          </div>
          <div className="bg-red-50 text-red-700 border border-red-100 shadow-sm rounded-2xl p-8 transition-transform hover:scale-[1.02] duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Outstanding</p>
            <p className="text-2xl font-black">{loading ? "..." : formatCurrency(summary.pending || 0)}</p>
          </div>
        </div>



        {/* Payment Information Alert */}
        <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary text-xl shadow-sm shrink-0">ℹ️</div>
          <div>
            <p className="text-sm font-black text-blue-800">Processing Time</p>
            <p className="text-xs text-blue-600 font-bold mt-1 max-w-2xl leading-relaxed">Payments made via NEFT/RTGS may take up to 24 hours to reflect in the project ledger. If your payment is not listed after 48 hours, please contact the project accountant.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientPaymentsPage;
