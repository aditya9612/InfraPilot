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
  const [transactions, _setTransactions] = useState(MOCK_TRANSACTIONS);
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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === "All" ? "Financial Transactions" : `${activeTab} Summary`}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Log incoming collections and outgoing disbursements.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedTransaction(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Record Transaction
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Date & Type</th>
                            <th className="px-6 py-5">Party Name</th>
                            <th className="px-6 py-5">Transaction Details</th>
                            <th className="px-6 py-5">Linked Doc</th>
                            <th className="px-6 py-5 text-right">Amount</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-[10px] shadow-sm ${
                                            t.type === "Receipt" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                        }`}>
                                            {t.type === "Receipt" ? "RC" : "PY"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-700">{t.date}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${t.type === "Receipt" ? "text-emerald-600" : "text-rose-600"}`}>
                                                {t.type}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-slate-700">{t.party_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium italic truncate max-w-[200px]">{t.remarks}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-600">{t.mode}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref: {t.reference}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-lg border border-slate-200">
                                        {t.linked_id}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className={`text-sm font-black ${t.type === "Receipt" ? "text-emerald-600" : "text-rose-600"}`}>
                                        {t.type === "Receipt" ? "+" : "-"} ₹{t.amount.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => handleViewTransaction(t)}
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                          title="View Transaction"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleEditTransaction(t)}
                                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                          title="Edit Transaction"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteTransaction(t.id)}
                                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                          title="Delete Record"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
