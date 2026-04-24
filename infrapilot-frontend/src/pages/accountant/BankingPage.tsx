import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
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
  const [records] = useState(MOCK_BANKING_RECORDS);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.toLowerCase());
    } else {
        setActiveTab("All");
    }
  }, [category]);

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

  return (
    <>
      <Navbar title="Bank & Cash" breadcrumb={["Accountant", "Finance", "Banking"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {formatTitle(activeTab)}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Manage bank accounts, petty cash, and reconciliation statements.</p>
          </div>
          <button 
            onClick={() => toast.success("Record generation coming soon!")}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add Record
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-5">Account Name</th>
                            <th className="px-6 py-5">Bank Details</th>
                            <th className="px-6 py-5 text-right">Opening Balance</th>
                            <th className="px-6 py-5 text-right">{activeTab === 'reconciliation' ? 'Bank Balance' : 'Current Balance'}</th>
                            <th className="px-6 py-5">Transaction History</th>
                            <th className="px-6 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-slate-700">{record.account_name}</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${record.type === "cash" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                                        {record.type === "cash" ? "Petty Cash" : "Bank"}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-slate-700">{record.bank_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        {record.account_number !== "-" ? `A/C: ${record.account_number} | IFSC: ${record.ifsc}` : "Cash Account"}
                                    </p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-bold text-slate-500">₹{record.opening_balance.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-800">₹{record.current_balance.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <p className={`text-[11px] font-bold ${activeTab === 'reconciliation' ? 'text-rose-500' : 'text-slate-500'}`}>
                                        {record.last_transaction}
                                    </p>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </PageTransition>
    </>
  );
};

export default BankingPage;
