import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateJVModal from "../../components/forms/CreateJVModal";
import ViewJVModal from "../../components/forms/ViewJVModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_JOURNAL_ENTRIES = [
  { 
    id: 1, 
    date: "2024-04-18", 
    debit_account: "Office Equipment A/C",
    credit_account: "HDFC Bank A/C", 
    amount: 45000, 
    narration: "Being laptop purchased for site engineer",
    reference: "JV-24-001"
  },
  { 
    id: 2, 
    date: "2024-04-20", 
    debit_account: "Depreciation A/C",
    credit_account: "Machinery A/C", 
    amount: 15000, 
    narration: "Being depreciation charged for the month of April",
    reference: "JV-24-002"
  },
  { 
    id: 3, 
    date: "2024-04-22", 
    debit_account: "Prepaid Insurance A/C",
    credit_account: "Cash A/C", 
    amount: 12000, 
    narration: "Being insurance premium paid in advance",
    reference: "JV-24-003"
  }
];

const JournalEntriesPage = () => {
  const [entries, setEntries] = useState(MOCK_JOURNAL_ENTRIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  const handleCreateJV = (data: any) => {
    if (selectedEntry) {
        setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, ...data } : e));
        toast.success("Journal voucher updated!");
    } else {
        const newEntry = {
            ...data,
            id: entries.length + 1,
        };
        setEntries(prev => [newEntry, ...prev]);
        toast.success("Journal Voucher posted successfully!");
    }
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleViewEntry = (entry: any) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
  };

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = (id: number) => {
    setEntryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      setEntries(prev => prev.filter(e => e.id !== entryToDelete));
      toast.success("Journal Entry deleted");
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <>
      <Navbar title="Journal Entries" breadcrumb={["Accountant", "Finance", "Journal"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Finance</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">General Journal</h1>
            <p className="text-slate-500 text-sm mt-1">Record manual adjustments, depreciation, and complex multi-leg transactions.</p>
          </div>
          <button
            onClick={() => { setSelectedEntry(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Create JV
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Journal Entries</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manual journal adjustments and double-entry records</p>
            </div>
            <button
              onClick={() => {
                const rows = entries.map(e => [e.date, e.reference, e.debit_account, e.credit_account, e.amount, `"${e.narration}"`].join(','));
                const csv = ['Date,Ref,Debit,Credit,Amount,Narration', ...rows].join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `JournalEntries_${new Date().toISOString().split('T')[0]}.csv`; a.click();
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
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Debit Account</th>
                            <th className="px-6 py-4">Credit Account</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Narration</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-700">{entry.date}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider w-8 text-center">DR</span>
                                        <p className="text-sm font-black text-slate-700">{entry.debit_account}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg uppercase tracking-wider w-8 text-center">CR</span>
                                        <p className="text-sm font-bold text-slate-600">{entry.credit_account}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-black text-slate-800 tabular-nums">₹{entry.amount.toLocaleString("en-IN")}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-500 font-medium max-w-[200px] truncate italic" title={entry.narration}>"{entry.narration}"</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                        {entry.reference}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleViewEntry(entry)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                        <button onClick={() => handleEditEntry(entry)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleDeleteEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </PageTransition>

      <CreateJVModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateJV}
        initialData={selectedEntry}
      />

      <ViewJVModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        entry={selectedEntry}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this journal entry? This will impact your ledger balances."
        confirmText="Delete Entry"
        type="danger"
      />
    </>
  );
};

export default JournalEntriesPage;
