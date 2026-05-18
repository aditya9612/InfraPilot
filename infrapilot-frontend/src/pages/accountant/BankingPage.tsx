import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import CreateBankingRecordModal from "../../components/forms/CreateBankingRecordModal";
import ViewBankingRecordModal from "../../components/forms/ViewBankingRecordModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { Eye, Edit2, Trash2 } from "lucide-react";

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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {formatTitle(activeTab)}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage institutional bank accounts, site petty cash, and automated reconciliation statements.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add Asset/Account
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-8 py-5">Account & Category</th>
                            <th className="px-8 py-5">Institution Details</th>
                            <th className="px-8 py-5 text-right">Opening Bal.</th>
                            <th className="px-8 py-5 text-right font-bold text-slate-900">{activeTab === 'reconciliation' ? 'Statement Bal.' : 'Current Liquidity'}</th>
                            <th className="px-8 py-5">Status / Last Event</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        {renderAccountIcon(record.type)}
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{record.account_name}</p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border inline-block mt-1 ${record.type === "cash" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                                                {record.type === "cash" ? "Petty Cash" : record.type === "reconciliation" ? "Recon Target" : "Commercial Bank"}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-sm font-bold text-slate-700">{record.bank_name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 font-mono">
                                        {record.account_number !== "-" ? `${record.account_number} • ${record.ifsc}` : "INTERNAL CASH BOX"}
                                    </p>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <p className="text-sm font-bold text-slate-500">₹{record.opening_balance.toLocaleString("en-IN")}</p>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <p className="text-lg font-black text-slate-900 tracking-tight">₹{record.current_balance.toLocaleString("en-IN")}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === 'reconciliation' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTab === 'reconciliation' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                        {record.last_transaction}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-100">
                                        <button 
                                          onClick={() => handleViewRecord(record)}
                                          className="p-1.5 text-slate-400 hover:text-primary transition-all"
                                          title="View Ledger"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleEditRecord(record)}
                                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                                          title="Update Info"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteRecord(record.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                                          title="Close Account"
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
