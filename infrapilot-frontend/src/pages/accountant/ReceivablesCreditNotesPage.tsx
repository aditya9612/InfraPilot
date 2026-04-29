import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateCreditNoteModal from "../../components/forms/CreateCreditNoteModal";
import ViewCreditNoteModal from "../../components/forms/ViewCreditNoteModal";
import toast from "react-hot-toast";

const MOCK_CREDIT_NOTES = [
  { 
    id: 1, 
    cn_no: "CN/24/001", 
    ref_invoice: "INV/24/082", 
    client: "Reliance Industries", 
    date: "2024-04-12", 
    amount: 50000, 
    reason: "Quantity Correction - Steel TMT",
    status: "Approved"
  },
  { 
    id: 2, 
    cn_no: "CN/24/002", 
    ref_invoice: "INV/24/095", 
    client: "Adani Realty", 
    date: "2024-04-18", 
    amount: 12500, 
    reason: "Damaged Material Return",
    status: "Pending"
  },
  { 
    id: 3, 
    cn_no: "CN/24/003", 
    ref_invoice: "INV/24/102", 
    client: "L&T Construction", 
    date: "2024-04-22", 
    amount: 25000, 
    reason: "Discount Applied Post-Invoice",
    status: "Approved"
  }
];

const ReceivablesCreditNotesPage = () => {
  const [records, setRecords] = useState(MOCK_CREDIT_NOTES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  const handleCreateCN = (data: any) => {
    const newRecord = {
        ...data,
        id: records.length + 1,
    };
    setRecords(prev => [newRecord, ...prev]);
    toast.success("Credit Note issued successfully!");
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      toast.success("Credit Note deleted");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  return (
    <>
      <Navbar 
        title="Credit Notes" 
        breadcrumb={["Accountant", "Receivables", "Credit Notes"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Credit Notes</h1>
            <p className="text-slate-500 text-sm font-medium">Issue and track credit notes for client bill adjustments or reversals.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all text-nowrap"
          >
            + Issue Credit Note
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Credit Note Details</th>
                            <th className="px-6 py-5">Reference & Client</th>
                            <th className="px-6 py-5">Reason</th>
                            <th className="px-6 py-5 text-right">Adjusted Amount</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {records.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{record.cn_no}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date: {record.date}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-slate-700">{record.ref_invoice}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.client}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs text-slate-500 font-medium italic max-w-[200px]">"{record.reason}"</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-rose-600">-₹{record.amount.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                        record.status === "Approved" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                    }`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                          onClick={() => handleViewRecord(record)}
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDelete(record.id)}
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

      <CreateCreditNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCN}
      />

      <ViewCreditNoteModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Credit Note"
        message="Are you sure you want to delete this credit note? This will revert the invoice adjustment."
        confirmText="Delete Note"
        type="danger"
      />
    </>
  );
};

export default ReceivablesCreditNotesPage;
