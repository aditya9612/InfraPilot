import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateBankingRecordModal from "../../components/forms/CreateBankingRecordModal";
import ViewBankingRecordModal from "../../components/forms/ViewBankingRecordModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_BANKING_RECORDS = [
  { 
    id: 1, 
    type: "accounts", 
    account_name: "InfraPilot Main Account",
    bank_name: "HDFC Bank", 
    account_number: "50100234891234", 
    ifsc: "HDFC0001234",
    opening_balance: 1500000,
    current_balance: 1250000,
    last_transaction: "2024-04-15 (Debit: ₹2,50,000)"
  },
  { 
    id: 2, 
    type: "cash", 
    account_name: "Site Petty Cash (Mumbai)",
    bank_name: "Cash-in-Hand", 
    account_number: "-", 
    ifsc: "-",
    opening_balance: 50000,
    current_balance: 15000,
    last_transaction: "2024-04-18 (Debit: ₹35,000)"
  },
  { 
    id: 3, 
    type: "reconciliation", 
    account_name: "InfraPilot Main Account",
    bank_name: "HDFC Bank", 
    account_number: "50100234891234", 
    ifsc: "HDFC0001234",
    opening_balance: 1250000, // Ledger Balance
    current_balance: 1300000, // Bank Statement Balance
    last_transaction: "Unreconciled Difference: ₹50,000"
  }
];

const BankingPage = () => {
  const { category } = useParams<{ category: string }>();
  const [records, setRecords] = useState(MOCK_BANKING_RECORDS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.toLowerCase());
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const handleCreateRecord = (data: any) => {
    if (selectedRecord && !isViewModalOpen) {
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, ...data } : r));
        toast.success("Banking record updated!");
    } else {
        const newRecord = {
            ...data,
            id: records.length + 1,
        };
        setRecords(prev => [newRecord, ...prev]);
        toast.success("Banking record added successfully!");
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

  const handleDeleteRecord = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      toast.success("Record deleted successfully");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const filtered = activeTab === "All" 
    ? records 
    : records.filter(t => t.type === activeTab);

  const formatTitle = (tab: string) => {
    switch(tab) {
        case 'accounts': return 'Bank Accounts';
        case 'cash': return 'Cash Book';
        case 'reconciliation': return 'Bank Reconciliation';
        default: return 'Bank & Cash Management';
    }
  };

  const renderAccountIcon = (type: string) => {
    if (type === 'cash') return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
    );
    return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
    );
  };

  return (
    <>
      <Navbar title="Bank & Cash" breadcrumb={["Accountant", "Finance", "Banking"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Finance</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">{formatTitle(activeTab)}</h1>
            <p className="text-slate-500 text-sm mt-1">Manage institutional bank accounts, site petty cash, and automated reconciliation statements.</p>
          </div>
          <button
            onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Add Asset/Account
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{formatTitle(activeTab)}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bank accounts, petty cash and reconciliation records</p>
            </div>
            <button
              onClick={() => {
                const rows = filtered.map(r => [r.account_name, r.bank_name, r.account_number, r.ifsc, r.opening_balance, r.current_balance, r.last_transaction].join(','));
                const csv = ['Account,Bank,Account No,IFSC,Opening Bal,Current Bal,Last Transaction', ...rows].join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Banking_${new Date().toISOString().split('T')[0]}.csv`; a.click();
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
                          <th className="px-6 py-4">Account Name</th>
                          <th className="px-6 py-4">Bank Name</th>
                          <th className="px-6 py-4">Account Number</th>
                          <th className="px-6 py-4">IFSC Code</th>
                          <th className="px-6 py-4 text-right">Opening Balance</th>
                          <th className="px-6 py-4">Transaction History</th>
                          <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {renderAccountIcon(record.type)}
                                        <p className="text-sm font-black text-slate-800">{record.account_name}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-700">{record.bank_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 font-mono tracking-wider">{record.account_number}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 font-mono tracking-wider">{record.ifsc}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-bold text-slate-700 tabular-nums">₹{record.opening_balance.toLocaleString("en-IN")}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Bal: ₹{record.current_balance.toLocaleString("en-IN")}</p>
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'reconciliation' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTab === 'reconciliation' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                        {record.last_transaction}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleViewRecord(record)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                        <button onClick={() => handleEditRecord(record)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleDeleteRecord(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </PageTransition>

      <CreateBankingRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRecord}
      />

      <ViewBankingRecordModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this banking record? This action cannot be undone."
        confirmText="Delete Record"
        type="danger"
      />
    </>
  );
};

export default BankingPage;
