import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// --- UI COMPONENTS ---

const DashboardSection = () => {
  const kpis = [
    { label: "Bank Balance", value: "₹1.45 Cr", icon: "🏦", accent: "from-blue-500 to-indigo-500", sub: "Across 4 Accounts" },
    { label: "Cash Balance", value: "₹2.5L", icon: "💵", accent: "from-emerald-500 to-teal-500", sub: "Petty & Site Cash" },
    { label: "Receipts", value: "₹45.2L", icon: "📈", accent: "from-emerald-500 to-green-500", sub: "Today's Inflow" },
    { label: "Payments", value: "₹12.4L", icon: "📉", accent: "from-rose-500 to-pink-500", sub: "Today's Outflow" },
    { label: "Pending BRS", value: "14", icon: "⚖️", accent: "from-amber-500 to-orange-500", sub: "Unmatched Entries" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.accent} flex items-center justify-center text-xl mb-4 shadow-sm text-white`}>{k.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-xl font-bold text-slate-800">{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-5">Cash Flow Trend (Nov 2024)</h3>
            <div className="h-48 flex items-end justify-between px-2 gap-2">
              {[40, 60, 35, 80, 50, 90, 70].map((h, i) => (
                <div key={i} className="w-full bg-slate-100 rounded-t-lg relative group">
                  <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                  <div className="absolute bottom-0 w-full bg-rose-400 rounded-t-lg transition-all opacity-80" style={{ height: `${h * 0.6}%` }}></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400"></span><span className="text-xs font-semibold text-slate-600">Inflow</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-400"></span><span className="text-xs font-semibold text-slate-600">Outflow</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5">Bank Balances</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div><span className="text-sm font-bold text-slate-800 block">HDFC Bank (Current)</span><span className="text-xs text-slate-500 font-mono">XXXX-1234</span></div>
              <span className="text-sm font-bold text-emerald-600">₹85,50,000</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div><span className="text-sm font-bold text-slate-800 block">SBI (Savings)</span><span className="text-xs text-slate-500 font-mono">XXXX-9876</span></div>
              <span className="text-sm font-bold text-emerald-600">₹45,20,000</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div><span className="text-sm font-bold text-slate-800 block">ICICI (OD)</span><span className="text-xs text-slate-500 font-mono">XXXX-5555</span></div>
              <span className="text-sm font-bold text-rose-500">-₹10,50,000</span>
            </div>
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
          <tr>{["Account", "Bank", "Account No", "Balance", "Status"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
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

// --- CASH BOOK ---
const CashEntryModal = ({ isOpen, onClose, type }: { isOpen: boolean; onClose: () => void; type: "Receipt" | "Payment" }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Cash ${type} Entry`}
    maxWidth="max-w-4xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success(`Cash ${type} Recorded!`); onClose(); }} className={`px-8 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 ${type === "Receipt" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"}`}>Record {type}</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className={`w-6 h-6 text-white text-xs font-black rounded-lg flex items-center justify-center ${type === "Receipt" ? "bg-emerald-500" : "bg-rose-500"}`}>1</span>
          Cash {type} Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher Number *</label><input type="text" readOnly value={`CV-${type === "Receipt" ? "R" : "P"}-1023`} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type === "Receipt" ? "Received From" : "Paid To"} *</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹) *</label><input type="number" className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold ${type === "Receipt" ? "text-emerald-600" : "text-rose-600"}`} /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type === "Receipt" ? "Purpose" : "Category"} *</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label><input type="text" placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>
    </form>
  </Modal>
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
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
      </div>
      
      {activeSubTab === "dashboard" && <BankReconciliationDashboard />}
      {activeSubTab === "pending" && <GenericTableSection title="Pending Reconciliation" columns={["Date", "Bank Entry", "ERP Entry", "Difference", "Action"]} data={[["2024-11-02", "₹12,000 (Dr)", "Not Found", "₹12,000", "Create Entry"]]} />}
      {activeSubTab === "matched" && <GenericTableSection title="Matched Transactions" columns={["Date", "Bank Entry", "ERP Entry", "Match Date", "Status"]} data={[["2024-11-01", "₹1,45,000 (Cr)", "₹1,45,000", "2024-11-01", "Matched"]]} />}
      {activeSubTab === "history" && <GenericTableSection title="Reconciliation History" columns={["Period", "Account", "Opening Bal", "Closing Bal", "Status"]} data={[["Oct 2024", "HDFC (XXXX-1234)", "₹80,50,000", "₹85,50,000", "Reconciled"]]} />}
    </div>
  );
};

// --- FUND TRANSFERS ---
const FundTransferModal = ({ isOpen, onClose, type }: { isOpen: boolean; onClose: () => void; type: string }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Fund Transfer (${type})`}
    maxWidth="max-w-4xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success("Fund Transfer Successful!"); onClose(); }} className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">Execute Transfer</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Transfer Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transfer Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹) *</label><input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold text-indigo-600" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transfer Number *</label><input type="text" readOnly value="TR-1052" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-mono" /></div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Account *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" defaultValue={type === "Cash to Bank" ? "Cash Account" : "HDFC Bank (XXXX-1234)"}>
              <option>HDFC Bank (XXXX-1234)</option><option>Cash Account</option>
            </select>
          </div>
          <div className="flex items-center justify-center pt-5"><span className="text-2xl text-slate-300">➡️</span></div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Account *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" defaultValue={type === "Bank to Cash" ? "Cash Account" : "SBI (XXXX-9876)"}>
              <option>Cash Account</option><option>SBI (XXXX-9876)</option>
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number</label><input type="text" placeholder="Cheque/UTR No" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" placeholder="Purpose of transfer" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>
    </form>
  </Modal>
);

// --- GENERIC COMPONENTS ---
const GenericTableSection = ({ title, columns, data }: { title: string; columns: string[]; data: any[][] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">{title}</h3></div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{columns.map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
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

const ReportsWrapperSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "bankbook");
  const tabs = [
    { key: "bankbook", label: "Bank Book" },
    { key: "cashbook", label: "Cash Book" },
    { key: "reconciliation", label: "Bank Reconciliation Report" },
    { key: "transfer", label: "Fund Transfer Report" },
    { key: "cashflow", label: "Cash Flow Report" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">{tabs.find(t=>t.key===activeSubTab)?.label}</h3><button className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm">Download PDF</button></div>
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="text-4xl mb-3">📊</div>
          <h4 className="text-sm font-bold text-slate-800">Report Generated</h4>
          <p className="text-xs text-slate-500 mt-1">Data from the last 30 days is available in this view.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>{["Date", "Reference", "Account/Category", "Amount", "Balance"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              <tr className="hover:bg-slate-50/50"><td className="px-4 py-3 text-xs text-slate-500">2024-11-01</td><td className="px-4 py-3 text-xs font-mono text-slate-600">CV-R-1023</td><td className="px-4 py-3 text-xs font-semibold text-slate-700">Client Collection</td><td className="px-4 py-3 text-xs font-bold text-emerald-600">+₹1,45,000</td><td className="px-4 py-3 text-xs font-bold text-slate-800">₹85,50,000</td></tr>
              <tr className="hover:bg-slate-50/50"><td className="px-4 py-3 text-xs text-slate-500">2024-11-01</td><td className="px-4 py-3 text-xs font-mono text-slate-600">CV-P-1024</td><td className="px-4 py-3 text-xs font-semibold text-slate-700">Vendor Payment</td><td className="px-4 py-3 text-xs font-bold text-rose-500">-₹45,000</td><td className="px-4 py-3 text-xs font-bold text-slate-800">₹85,05,000</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- WRAPPERS ---
const BankAccountsWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const tabs = [{ key: "list", label: "Account List" }, { key: "statements", label: "Statements" }, { key: "details", label: "Details" }];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Add Bank Account
        </button>
      </div>
      
      <AddBankAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {activeSubTab === "list" && <BankAccountList />}
      {(activeSubTab === "statements" || activeSubTab === "details") && <GenericTableSection title={tabs.find(t=>t.key===activeSubTab)?.label || ""} columns={["Date", "Description", "Ref", "Amount"]} data={[["2024-11-01", "Opening Balance", "-", "₹0"]]} />}
    </div>
  );
};

const CashBookWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "ledger");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"Receipt" | "Payment">("Receipt");

  const openModal = (type: "Receipt" | "Payment") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const tabs = [{ key: "ledger", label: "Cash Ledger" }, { key: "petty", label: "Petty Cash" }];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("Receipt")} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 transition-all shadow-sm whitespace-nowrap">+ Cash Receipt</button>
          <button onClick={() => openModal("Payment")} className="px-4 py-2 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl hover:bg-rose-100 transition-all shadow-sm whitespace-nowrap">+ Cash Payment</button>
        </div>
      </div>
      
      <CashEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} />
      {activeSubTab === "petty" && <GenericTableSection title="Petty Cash Register" columns={["Date", "Voucher No", "Expense", "Amount", "Approved By"]} data={[["2024-11-01", "PC-101", "Tea & Refreshments", "₹450", "Site Engineer"]]} />}
      {activeSubTab === "ledger" && <GenericTableSection title="Cash Ledger" columns={["Date", "Voucher No", "Type", "Debit", "Credit", "Balance"]} data={[["2024-11-01", "PC-101", "Payment", "—", "₹450", "₹12,500"]]} />}
    </div>
  );
};

const FundTransfersWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "history");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("Bank to Bank");

  const openModal = (type: string) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const tabs = [{ key: "history", label: "Transfer History" }];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>{t.label}</button>)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("Bank to Bank")} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all whitespace-nowrap">Bank ➡️ Bank</button>
          <button onClick={() => openModal("Bank to Cash")} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all whitespace-nowrap">Bank ➡️ Cash</button>
          <button onClick={() => openModal("Cash to Bank")} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all whitespace-nowrap">Cash ➡️ Bank</button>
        </div>
      </div>
      
      <FundTransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} />
      {activeSubTab === "history" && <GenericTableSection title="Transfer History" columns={["Date", "Transfer No", "From", "To", "Amount", "Status"]} data={[["2024-11-01", "TR-1052", "HDFC Bank", "Cash", "₹50,000", "Completed"]]} />}
    </div>
  );
};

// --- MAIN PAGE ---
type TabKey = "dashboard" | "accounts" | "cash" | "reconciliation" | "transfers" | "history" | "reports";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",       label: "Dashboard",       icon: "📊" },
  { key: "accounts",        label: "Bank Accounts",   icon: "🏦" },
  { key: "cash",            label: "Cash Book",       icon: "💵" },
  { key: "reconciliation",  label: "Bank Reconcile",  icon: "⚖️" },
  { key: "transfers",       label: "Fund Transfers",  icon: "🔁" },
  { key: "history",         label: "Transactions",    icon: "📜" },
  { key: "reports",         label: "Reports",         icon: "📈" },
];

const BankingPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "accounts": "accounts",
      "cash": "cash",
      "reconciliation": "reconciliation",
      "transfers": "transfers",
      "history": "history",
      "reports": "reports",
      "dashboard": "dashboard",
    };
    return map[currentSub || ""] || "dashboard";
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Treasury</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bank & Cash Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage bank accounts, cash transactions, reconciliations, and fund transfers.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-sm">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Banking</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"      && <DashboardSection />}
        {activeTab === "accounts"       && <BankAccountsWrapper initialSubTab={subTab} key={subTab || "add"} />}
        {activeTab === "cash"           && <CashBookWrapper initialSubTab={subTab} key={subTab || "receipts"} />}
        {activeTab === "reconciliation" && <BankReconciliationWrapper initialSubTab={subTab} key={subTab || "dashboard"} />}
        {activeTab === "transfers"      && <FundTransfersWrapper initialSubTab={subTab} key={subTab || "bank2bank"} />}
        {activeTab === "history"        && <GenericTableSection title="Transaction History" columns={["Date", "Reference", "Type", "Debit", "Credit", "Balance"]} data={[["2024-11-01", "TR-1052", "Fund Transfer", "—", "₹50,000", "₹85,00,000"]]} />}
        {activeTab === "reports"        && <ReportsWrapperSection initialSubTab={subTab} key={subTab || "bankbook"} />}
      </PageTransition>
    </>
  );
};

export default BankingPage;
