import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// --- UI COMPONENTS ---

type TabKey = "accounts" | "cash" | "bank-book" | "reconciliation";

const BankingHeader = ({ activeTab, onAddAccount, tabsNode }: { activeTab: TabKey, onAddAccount: () => void, tabsNode?: React.ReactNode }) => {
  const getTitle = () => {
    switch (activeTab) {
      case "accounts": return "BANK ACCOUNTS";
      case "cash": return "CASH BOOK";
      case "bank-book": return "BANK BOOK";
      case "reconciliation": return "BANK RECONCILIATION";
      default: return "";
    }
  };

  return (
    <div className="mb-6 space-y-6 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{getTitle()}</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your {activeTab.replace('-', ' ')} records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📥</span> Import
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
             <span className="text-lg">📤</span> Export
          </button>
          {activeTab === "accounts" && (
            <button onClick={onAddAccount} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">+</span> Add Account
            </button>
          )}
          {activeTab === "reconciliation" && (
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">🔄</span> Run Recon
            </button>
          )}
        </div>
      </div>
      
      {tabsNode}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m-9-2h4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL BANK BALANCE</p>
            <p className="text-xl font-bold text-slate-800">₹10.5 Cr</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AVAILABLE CASH</p>
            <p className="text-xl font-bold text-slate-800">₹1.5 Lakh</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7l10 10M17 7v10H7"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TODAY'S DEPOSIT</p>
            <p className="text-xl font-bold text-slate-800">₹45 Lakh</p>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M7 7h10v10"></path></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TODAY'S WITHDRAWAL</p>
            <p className="text-xl font-bold text-slate-800">₹13 Lakh</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- BANK ACCOUNTS ---
const AddBankAccountModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Add Bank Account"
    maxWidth="max-w-4xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success("Bank Account Added!"); onClose(); }} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Create Account</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Basic Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name *</label><input type="text" placeholder="e.g. Primary Current" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name *</label><input type="text" placeholder="HDFC Bank" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Type *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option>Current Account</option><option>Savings Account</option><option>OD Account</option><option>Escrow Account</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number *</label><input type="text" placeholder="0000 0000 0000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code *</label><input type="text" placeholder="HDFC0001234" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono uppercase" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Name</label><input type="text" placeholder="Main Branch" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balance *</label><input type="number" placeholder="₹ 0.00" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Balance</label><input type="text" readOnly placeholder="Auto-calculated" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
        </div>
      </div>
    </form>
  </Modal>
);

const BankAccountList = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Bank Accounts</h3></div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{["Account", "Bank", "Account No", "Balance", "Status"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="hover:bg-slate-50/50">
            <td className="px-4 py-3 text-xs font-bold text-slate-800">Primary Current</td><td className="px-4 py-3 text-xs text-slate-600">HDFC Bank</td>
            <td className="px-4 py-3 text-xs font-mono text-slate-500">XXXX-1234</td><td className="px-4 py-3 text-xs font-bold text-emerald-600">₹85,50,000</td>
            <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// --- BANK RECONCILIATION ---
const BankReconciliationDashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-2">Pending Items</h3>
      <p className="text-3xl font-black text-amber-500">14</p>
      <p className="text-xs text-slate-500 mt-2">Unmatched ERP transactions</p>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-2">Matched Today</h3>
      <p className="text-3xl font-black text-emerald-500">42</p>
      <p className="text-xs text-slate-500 mt-2">Successfully reconciled</p>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 mb-2">Discrepancy</h3>
      <p className="text-3xl font-black text-rose-500">₹12,000</p>
      <p className="text-xs text-slate-500 mt-2">Bank vs ERP Difference</p>
    </div>
  </div>
);

const BankReconciliationWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "dashboard");
  const tabs = [{ key: "dashboard", label: "Dashboard" }, { key: "pending", label: "Pending" }, { key: "matched", label: "Matched" }, { key: "history", label: "History" }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
        </div>
        {activeSubTab !== "dashboard" && (
          <div className="flex flex-wrap gap-2">
            <select className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Bank Accounts</option>
              <option value="1">HDFC Bank</option>
              <option value="2">SBI (Savings)</option>
            </select>
            <input type="date" className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20" title="Date Range" />
            <select className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Statuses</option>
              <option value="matched">Matched</option>
              <option value="unmatched">Unmatched</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        )}
      </div>

      {activeSubTab === "dashboard" && <BankReconciliationDashboard />}
      {activeSubTab === "pending" && <GenericTableSection title="Pending Reconciliation" columns={["Date", "Bank Entry", "ERP Entry", "Difference", "Action"]} data={[["2024-11-02", "₹12,000 (Dr)", "Not Found", "₹12,000", "Create Entry"]]} />}
      {activeSubTab === "matched" && <GenericTableSection title="Matched Transactions" columns={["Date", "Bank Entry", "ERP Entry", "Match Date", "Status"]} data={[["2024-11-01", "₹1,45,000 (Cr)", "₹1,45,000", "2024-11-01", "Matched"]]} />}
      {activeSubTab === "history" && <GenericTableSection title="Reconciliation History" columns={["Period", "Account", "Opening Bal", "Closing Bal", "Status"]} data={[["Oct 2024", "HDFC (XXXX-1234)", "₹80,50,000", "₹85,50,000", "Reconciled"]]} />}
    </div>
  );
};



// --- GENERIC COMPONENTS ---
const GenericTableSection = ({ title, columns, data }: { title: string; columns: string[]; data: any[][] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">{title}</h3></div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{columns.map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);






const BankBookWrapper = () => (
  <div className="space-y-6">

    <GenericTableSection title="Transactions" columns={["Date", "Ref", "Details", "Withdrawal", "Deposit", "Balance"]} data={[["2024-11-01", "TRX-001", "Opening Balance", "-", "-", "₹10,50,00,000"]]} />
  </div>
);

// --- WRAPPERS ---
const BankAccountsWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "list");

  const tabs = [{ key: "list", label: "Account List" }, { key: "statements", label: "Statements" }, { key: "details", label: "Details" }];
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto mb-4">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>

      {activeSubTab === "list" && <BankAccountList />}
      {(activeSubTab === "statements" || activeSubTab === "details") && <GenericTableSection title={tabs.find(t => t.key === activeSubTab)?.label || ""} columns={["Date", "Description", "Ref", "Amount"]} data={[["2024-11-01", "Opening Balance", "-", "₹0"]]} />}
    </div>
  );
};

const CashBookWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "ledger");

  const tabs = [{ key: "ledger", label: "Cash Ledger" }, { key: "petty", label: "Petty Cash" }];
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto mb-4">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>

      {activeSubTab === "petty" && <GenericTableSection title="Petty Cash Register" columns={["Date", "Voucher No", "Expense", "Amount", "Approved By"]} data={[["2024-11-01", "PC-101", "Tea & Refreshments", "₹450", "Site Engineer"]]} />}
      {activeSubTab === "ledger" && <GenericTableSection title="Cash Ledger" columns={["Date", "Voucher No", "Type", "Debit", "Credit", "Balance"]} data={[["2024-11-01", "PC-101", "Payment", "—", "₹450", "₹12,500"]]} />}
    </div>
  );
};

// --- MAIN PAGE ---

const TABS: { key: TabKey; label: string }[] = [
  { key: "accounts", label: "Bank Accounts" },
  { key: "cash", label: "Cash Book" },
  { key: "bank-book", label: "Bank Book" },
  { key: "reconciliation", label: "Bank Reconciliation" },
];

const BankingPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;
  
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "accounts": "accounts",
      "cash": "cash",
      "bank-book": "bank-book",
      "reconciliation": "reconciliation",
    };
    return map[currentSub || ""] || "accounts";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/banking/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Bank & Cash Management" breadcrumb={["Accountant", "Banking"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Main Header (Title + Buttons + Tabs + Stat Cards) */}
        <BankingHeader activeTab={activeTab} onAddAccount={() => setIsAddAccountModalOpen(true)} tabsNode={
          <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        } />
        
        <AddBankAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} />

        {/* Content Rendering */}
        <div className="mt-6">
          {activeTab === "accounts" && <BankAccountsWrapper initialSubTab={subTab} key={subTab || "add"} />}
          {activeTab === "cash" && <CashBookWrapper initialSubTab={subTab} key={subTab || "receipts"} />}
          {activeTab === "reconciliation" && <BankReconciliationWrapper initialSubTab={subTab} key={subTab || "dashboard"} />}
          {activeTab === "bank-book" && <BankBookWrapper />}
        </div>
      </PageTransition>
    </>
  );
};

export default BankingPage;
