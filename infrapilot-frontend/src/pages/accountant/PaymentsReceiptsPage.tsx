import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateTransactionModal from "../../components/forms/CreateTransactionModal";
import ViewTransactionModal from "../../components/forms/ViewTransactionModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_TRANSACTIONS = [
  { 
    id: 1, 
    type: "Receipt", 
    party_name: "Aditya Enterprises", 
    amount: 50000, 
    date: "2024-03-30", 
    mode: "Bank Transfer", 
    reference: "RTGS-9901-X", 
    linked_id: "INV-2024-001",
    remarks: "Partial payment for project Alpha"
  },
  { 
    id: 2, 
    type: "Payment", 
    party_name: "Mahaveer Cements", 
    amount: 120000, 
    date: "2024-04-01", 
    mode: "UPI", 
    reference: "UPI-404022", 
    linked_id: "BILL/2024/401",
    remarks: "Full payment for March delivery"
  }
];

const PaymentsReceiptsPage = () => {
  const { category } = useParams<{ category: string }>();
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        const mapping: Record<string, string> = {
            receipt: "Receipt",
            payment: "Payment"
        };
        setActiveTab(mapping[category.toLowerCase()] || "All");
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const handleCreateTransaction = (data: any) => {
    if (selectedTransaction) {
        setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? { ...t, ...data } : t));
        toast.success("Transaction updated!");
    } else {
        const newRecord = {
            ...data,
            id: transactions.length + 1,
        };
        setTransactions(prev => [newRecord, ...prev]);
        toast.success("Transaction recorded!");
    }
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      toast.success("Transaction deleted successfully");
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const filtered = activeTab === "All" 
    ? transactions 
    : transactions.filter(t => t.type === activeTab);

  return (
    <>
      <Navbar title="Payments & Receipts" breadcrumb={["Accountant", "Finance", "Transactions"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
              {activeTab === "All" ? "Financial Transactions" : `${activeTab} Summary`}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Log incoming collections and outgoing disbursements.</p>
          </div>
          <button
            onClick={() => { setSelectedTransaction(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Record Transaction
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Card Header */}
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Financial Transactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">All incoming receipts and outgoing payments</p>
            </div>
            <button
              onClick={() => {
                const rows = filtered.map(t => [
                  `"${t.date}"`, `"${t.type}"`, `"${t.party_name}"`, t.mode, t.reference, `"${t.linked_id}"`, t.amount
                ].join(','));
                const csv = ['Date,Type,Party Name,Mode,Reference,Linked Doc,Amount (INR)', ...rows].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Transactions_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:border-primary/30 hover:text-primary transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
          </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50 whitespace-nowrap">
                            <th className="px-6 py-4">Transaction Type</th>
                            <th className="px-6 py-4">Party Name</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Mode</th>
                            <th className="px-6 py-4">Reference Number</th>
                            <th className="px-6 py-4">Linked Invoice / Bill</th>
                            <th className="px-6 py-4">Remark</th>
                            <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                                        t.type === "Receipt" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                    }`}>{t.type}</span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">{t.party_name}</td>
                                <td className="px-6 py-4 text-right">
                                    <p className={`text-sm font-black tabular-nums ${t.type === "Receipt" ? "text-emerald-600" : "text-rose-600"}`}>
                                        {t.type === "Receipt" ? "+" : "-"} ₹{t.amount.toLocaleString("en-IN")}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">{t.date}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{t.mode}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.reference}</td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg border border-slate-200">{t.linked_id}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={t.remarks}>{t.remarks}</td>
                                <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleViewTransaction(t)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button onClick={() => handleEditTransaction(t)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </PageTransition>

      <CreateTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
        initialData={selectedTransaction}
      />

      <ViewTransactionModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        transaction={selectedTransaction}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmText="Delete Transaction"
        type="danger"
      />
    </>
  );
};
export default PaymentsReceiptsPage;
