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
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Receivables</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Financial Credit Notes</h1>
            <p className="text-slate-500 text-sm mt-1">Issue and track credit notes for client bill adjustments or reversals.</p>
          </div>
          <button
            onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Issue Credit Note
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Card Header */}
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Credit Notes Register</h3>
              <p className="text-xs text-slate-400 mt-0.5">Invoice adjustments, reversals and discount notes</p>
            </div>
            <button
              onClick={() => {
                const rows = records.map(r => [
                  r.cn_no, r.ref_invoice, `"${r.client}"`, r.date, r.amount, `"${r.reason}"`, r.status
                ].join(','));
                const csv = ['CN No,Ref Invoice,Client,Date,Amount (INR),Reason,Status', ...rows].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Credit_Notes_${new Date().toISOString().split('T')[0]}.csv`;
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
                  <th className="px-6 py-4">Invoice Number</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Billing Date</th>
                  <th className="px-6 py-4">Work Description</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4 text-right">Rate</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-right">GST (%)</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-800">Total with GST</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Attachment</th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((record) => {
                  const projectName = "Unknown Project"; // Mock fallback
                  const quantity = 1;
                  const rate = record.amount;
                  const gstPercent = 18;
                  const totalWithGst = record.amount * 1.18;
                  const status = record.status === "Approved" ? "paid" : record.status === "Pending" ? "pending" : "partial";
                  const dueDate = record.date;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{record.cn_no}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{record.client}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{projectName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{record.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={record.reason}>{record.reason}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{quantity}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{rate.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">₹{record.amount.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">{gstPercent}%</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-800 text-right">₹{totalWithGst.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                          status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          status === "partial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        }`}>{record.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{dueDate}</td>
                      <td className="px-6 py-4 text-center">
                          <button className="text-primary hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-all mx-auto block" title="View Attachment">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          </button>
                      </td>
                      <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewRecord(record)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => handleEditRecord(record)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
