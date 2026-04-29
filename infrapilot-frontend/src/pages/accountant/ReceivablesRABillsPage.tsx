import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import CreateRABillModal from "../../components/forms/CreateRABillModal";
import ViewRABillModal from "../../components/forms/ViewRABillModal";
import toast from "react-hot-toast";

const MOCK_RA_BILLS = [
  { 
    id: 1, 
    bill_no: "RA/ALPHA/001", 
    project: "Site Alpha - Mumbai", 
    client: "Reliance Industries", 
    date: "2024-04-10", 
    amount: 1250000, 
    status: "Certified",
    certified_by: "PMC - Tata Projects"
  },
  { 
    id: 2, 
    bill_no: "RA/BETA/004", 
    project: "Site Beta - Pune", 
    client: "Adani Realty", 
    date: "2024-04-15", 
    amount: 850000, 
    status: "Pending",
    certified_by: "Internal Audit"
  },
  { 
    id: 3, 
    bill_no: "RA/ALPHA/002", 
    project: "Site Alpha - Mumbai", 
    client: "Reliance Industries", 
    date: "2024-04-20", 
    amount: 2100000, 
    status: "Submitted",
    certified_by: "PMC - Tata Projects"
  }
];

const ReceivablesRABillsPage = () => {
  const [records, setRecords] = useState(MOCK_RA_BILLS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  const handleCreateRABill = (data: any) => {
    const newRecord = {
        ...data,
        id: records.length + 1,
    };
    setRecords(prev => [newRecord, ...prev]);
    toast.success("RA Bill created successfully!");
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
      toast.success("RA Bill record deleted");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  return (
    <>
      <Navbar 
        title="Running Account (RA) Bills" 
        breadcrumb={["Accountant", "Receivables", "RA Bills"]} 
      />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">RA Bills (Progress Billing)</h1>
            <p className="text-slate-500 text-sm font-medium">Manage cumulative bills based on site work measurements and certifications.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all text-nowrap"
          >
            + New RA Bill
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Bill Details</th>
                            <th className="px-6 py-5">Project & Client</th>
                            <th className="px-6 py-5">Certification</th>
                            <th className="px-6 py-5 text-right">Bill Amount</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {records.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{record.bill_no}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date: {record.date}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-slate-700">{record.project}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.client}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-600 italic">"{record.certified_by}"</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-800">₹{record.amount.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                        record.status === "Certified" ? "bg-emerald-100 text-emerald-600" :
                                        record.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
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

      <CreateRABillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRABill}
      />

      <ViewRABillModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete RA Bill"
        message="Are you sure you want to delete this RA Bill? This will affect cumulative measurements."
        confirmText="Delete Bill"
        type="danger"
      />
    </>
  );
};

export default ReceivablesRABillsPage;
