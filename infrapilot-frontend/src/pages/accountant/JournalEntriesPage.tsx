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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                General Journal
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Record manual adjustments, depreciation, and complex multi-leg transactions.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedEntry(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Create JV
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Date & Ref</th>
                            <th className="px-6 py-5">Accounting Legs (Debit / Credit)</th>
                            <th className="px-6 py-5">Narration</th>
                            <th className="px-6 py-5 text-right">Amount</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{entry.date}</p>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 mt-1 inline-block">
                                        {entry.reference}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider w-10 text-center">DR</span>
                                            <p className="text-sm font-black text-slate-700">{entry.debit_account}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pl-4">
                                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg uppercase tracking-wider w-10 text-center">CR</span>
                                            <p className="text-sm font-bold text-slate-500">{entry.credit_account}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs text-slate-500 font-medium max-w-sm italic">"{entry.narration}"</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-sm font-black text-slate-800">₹{entry.amount.toLocaleString()}</p>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Balanced</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => handleViewEntry(entry)}
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                          title="View Voucher"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleEditEntry(entry)}
                                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                          title="Edit Entry"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteEntry(entry.id)}
                                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                          title="Delete Entry"
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
