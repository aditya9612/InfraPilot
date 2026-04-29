import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
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

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {activeTab === "All" ? "Financial Transactions" : `${activeTab}s`}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Log incoming collections and outgoing disbursements.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <span className="text-lg">+</span> Record Transaction
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
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{t.date}</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${t.type === "Receipt" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                                        {t.type}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-slate-700">{t.party_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium italic">{t.remarks}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-600">{t.mode}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref: {t.reference}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                        {t.linked_id}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className={`text-sm font-black ${t.type === "Receipt" ? "text-emerald-600" : "text-rose-600"}`}>
                                        {t.type === "Receipt" ? "+" : "-"} ₹{t.amount.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                          onClick={() => handleViewTransaction(t)}
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteTransaction(t.id)}
                                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Transaction" maxWidth="max-w-2xl">
          <form className="space-y-6 pt-2" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); toast.success("Transaction recorded!"); }}>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Transaction Type</label>
                   <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                      <option>Receipt (Incoming)</option>
                      <option>Payment (Outgoing)</option>
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Amount (₹)</label>
                   <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="0.00" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Party Name</label>
                   <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="Client or Vendor Name" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Date</label>
                   <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payment Mode</label>
                   <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>UPI</option>
                      <option>Cheque</option>
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Reference Number</label>
                   <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="UTR / UPI Ref / Cheque No" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Linked Invoice / Bill</label>
                   <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="e.g. INV-001 or BILL-404" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Remarks</label>
                   <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="Additional details..." />
                </div>
             </div>

             <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold">Save Transaction</button>
             </div>
          </form>
      </Modal>

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
