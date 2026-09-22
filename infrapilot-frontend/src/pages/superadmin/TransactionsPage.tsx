import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const TransactionsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("manual");
  const [rejectPanelOpen, setRejectPanelOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: manualPaymentsResponse, isLoading: isLoadingManual } = useQuery({
    queryKey: ['superadmin_manual_payments'],
    queryFn: () => superadminService.getManualPayments(),
    enabled: activeTab === 'manual'
  });

  const { data: reconciliation, isLoading: isLoadingReconciliation } = useQuery({
    queryKey: ['superadmin_reconciliation'],
    queryFn: () => superadminService.getPlatformReconciliation(),
    enabled: activeTab === 'billing'
  });

  const manualPayments = manualPaymentsResponse?.items || [];

  const verifyMutation = useMutation({
    mutationFn: (txId: string | number) => superadminService.verifyManualPayment(txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_manual_payments'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => superadminService.rejectManualPayment(selectedTxId!, { reason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_manual_payments'] });
      setRejectPanelOpen(false);
      setSelectedTxId(null);
      setRejectReason("");
    }
  });

  return (
    <>
      <Navbar title="Transactions" breadcrumb={["InfraPilot", "Super Admin", "Transactions"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="max-w-[1600px] mx-auto flex gap-6 relative">
      <div className={`flex-1 transition-all duration-300 ${rejectPanelOpen ? 'pr-[400px]' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
            <p className="text-sm text-slate-500">Manage manual payments, billing, and reconciliation</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "manual" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Manual UPI Payments
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "billing" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Billing & Reconciliation
            </button>
          </div>
        </div>

        {activeTab === "manual" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Company ID</th>
                    <th className="px-6 py-4">Plan ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">UTR Number</th>
                    <th className="px-6 py-4">Submitted At</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingManual ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td>
                    </tr>
                  ) : manualPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">No manual payments found.</td>
                    </tr>
                  ) : manualPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{payment.company_id}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{payment.plan_id}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">₹{payment.amount}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{payment.utr_number}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{new Date(payment.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          payment.status === 'Pending' ? 'text-amber-500' :
                          payment.status === 'Verified' ? 'text-emerald-500' :
                          'text-rose-500'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => verifyMutation.mutate(payment.id)}
                              disabled={verifyMutation.isPending}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 disabled:opacity-50"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedTxId(payment.id);
                                setRejectPanelOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Platform Reconciliation</h2>
            {isLoadingReconciliation ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : reconciliation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-6">
                  <p className="text-slate-500 font-medium mb-1">Total Expected Revenue</p>
                  <p className="text-3xl font-black text-slate-800">₹{reconciliation.total_expected_revenue ?? 0}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6">
                  <p className="text-emerald-700 font-medium mb-1">Total Realized Revenue</p>
                  <p className="text-3xl font-black text-emerald-800">₹{reconciliation.total_realized_revenue ?? 0}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-6">
                  <p className="text-rose-700 font-medium mb-1">Total Outstanding (Unpaid)</p>
                  <p className="text-3xl font-black text-rose-800">₹{reconciliation.total_outstanding ?? 0}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-6">
                  <p className="text-amber-700 font-medium mb-1">Pending Manual Transactions</p>
                  <p className="text-3xl font-black text-amber-800">{reconciliation.pending_manual_transactions ?? 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-slate-500">Failed to load reconciliation data.</div>
            )}
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">Note: Invoices and detailed billing events are managed at the company level. Please navigate to a specific Company Details page to view its invoices and billing events.</p>
            </div>
          </div>
        )}
      </div>

      {/* Reject Payment Panel */}
      {rejectPanelOpen && (
        <div className="w-[400px] bg-white border-l border-slate-200 shadow-2xl fixed right-0 top-0 bottom-0 z-50 overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
            <h2 className="text-lg font-bold text-slate-800">Reject Payment</h2>
            <button onClick={() => setRejectPanelOpen(false)} className="text-slate-400 hover:text-slate-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Rejection <span className="text-rose-500">*</span></label>
              <textarea 
                rows={4} 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejecting this UTR..." 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" 
              />
              <p className="text-[11px] text-slate-400 mt-1">This reason will be visible to the company admin.</p>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setRejectPanelOpen(false)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectReason || rejectMutation.isPending}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </PageTransition>
    </>
  );
};

export default TransactionsPage;
