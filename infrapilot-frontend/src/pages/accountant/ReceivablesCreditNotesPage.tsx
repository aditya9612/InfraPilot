import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateCreditNoteModal from "../../components/forms/CreateCreditNoteModal";
import ViewCreditNoteModal from "../../components/forms/ViewCreditNoteModal";
import toast from "react-hot-toast";
import { Eye, Edit2, Trash2 } from "lucide-react";

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
    if (selectedRecord && !isViewModalOpen) {
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, ...data } : r));
        toast.success("Credit Note updated successfully!");
    } else {
        const newRecord = {
            ...data,
            id: records.length + 1,
        };
        setRecords(prev => [newRecord, ...prev]);
        toast.success("Credit Note issued successfully!");
    }
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Credit Notes</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Issue and track credit notes for client bill adjustments or reversals.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 text-nowrap"
          >
            + Issue Credit Note
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-6 py-5">Credit Note Details</th>
                            <th className="px-6 py-5">Reference & Client</th>
                            <th className="px-6 py-5">Reason</th>
                            <th className="px-6 py-5 text-right">Adjusted Amount</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {records.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center font-black text-[10px] shadow-sm">CN</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-700">{record.cn_no}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date: {record.date}</p>
                                        </div>
                                    </div>
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
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-100">
                                        <button 
                                          onClick={() => handleViewRecord(record)}
                                          className="p-1.5 text-slate-400 hover:text-primary transition-all"
                                          title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleEditRecord(record)}
                                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                                          title="Edit Record"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDelete(record.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"
                                          title="Delete Record"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
