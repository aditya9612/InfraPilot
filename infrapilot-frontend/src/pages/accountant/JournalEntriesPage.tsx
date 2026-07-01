import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

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

// --- SECTIONS ---

const JournalEntryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Create Journal Entry"
    maxWidth="max-w-5xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success("Journal Entry Submitted for Approval!"); onClose(); }} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Submit Entry</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Entry Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Journal Number *</label><input type="text" readOnly value="JE-2024-1045" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-mono" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date *</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number</label><input type="text" placeholder="e.g. INV-889" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label><input type="text" placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Location</label><input type="text" placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
          Accounting Entry
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl mb-4">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Account *</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Debit (₹)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit (₹)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Narration *</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-2 py-2"><select className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"><option>Material Expense A/c</option></select></td>
                <td className="px-2 py-2"><input type="number" defaultValue="50000" className="w-full px-2 py-1.5 text-xs font-bold text-emerald-600 border border-slate-200 rounded-lg bg-slate-50" /></td>
                <td className="px-2 py-2"><input type="number" placeholder="0" disabled className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-100" /></td>
                <td className="px-2 py-2"><input type="text" defaultValue="Purchase of cement" className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50" /></td>
              </tr>
              <tr>
                <td className="px-2 py-2"><select className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50"><option>HDFC Bank A/c</option></select></td>
                <td className="px-2 py-2"><input type="number" placeholder="0" disabled className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-100" /></td>
                <td className="px-2 py-2"><input type="number" defaultValue="50000" className="w-full px-2 py-1.5 text-xs font-bold text-rose-500 border border-slate-200 rounded-lg bg-slate-50" /></td>
                <td className="px-2 py-2"><input type="text" defaultValue="Paid via NEFT" className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50" /></td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-sm">
              <tr>
                <td className="px-4 py-3 text-right">Total:</td>
                <td className="px-4 py-3 text-emerald-600">₹50,000</td>
                <td className="px-4 py-3 text-rose-500">₹50,000</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Line Item</button>
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Attachments</h3>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-white transition-colors cursor-pointer bg-white">
          <div className="text-2xl mb-2">📎</div>
          <p className="text-xs font-bold text-slate-600">Upload Supporting Documents</p>
          <p className="text-[10px] text-slate-400 mt-1">Invoices, Receipts, Bills (PDF/JPG)</p>
        </div>
      </div>
    </form>
  </Modal>
);

const ManualEntriesWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800">Manual Journal Entries</h3>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Create Journal Entry
        </button>
      </div>
      <JournalEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <GenericTableSection 
        title="Recent Manual Entries" 
        columns={["Date", "Journal No", "Narration", "Amount", "Status"]} 
        data={[
          ["2024-11-01", "JE-2024-1045", "Purchase of cement", "₹50,000", "Pending Approval"]
        ]} 
      />
    </div>
  );
};

// --- ADJUSTMENT REGISTER SECTION ---
const AdjustmentRegisterSection = () => {
  const [search, setSearch] = useState("");

  const entries = [
    { id: "ADJ-001", date: "31/05/26", reason: "Depreciation Entry", amount: "₹6,50,000", status: "Pending Approval" },
    { id: "ADJ-002", date: "30/04/26", reason: "Prepaid Expense Amortization", amount: "₹25,000", status: "Posted" },
  ];

  const filtered = entries.filter(e =>
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <span className="text-sm font-bold text-slate-700">All Adjustment Registers</span>
        <div className="flex items-center gap-3 flex-1 justify-center max-w-sm mx-auto sm:mx-0">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            <input
              type="text"
              placeholder="Search adjustment register..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-300"
            />
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm ml-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["ADJ NO", "DATE", "REASON", "AMOUNT", "STATUS", "ACTION"].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">{row.id}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{row.date}</td>
                <td className="px-5 py-3.5 text-xs text-slate-700">{row.reason}</td>
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{row.amount}</td>
                <td className="px-5 py-3.5 text-xs">
                  {row.status === "Pending Approval" ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold text-[10px]">Pending Approval</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">Posted</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <button className="text-blue-600 font-bold hover:underline">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
type TabKey = "journal" | "recurring" | "adjustment";

const TABS: { key: TabKey; label: string }[] = [
  { key: "journal",    label: "Journal Entry" },
  { key: "recurring",  label: "Recurring" },
  { key: "adjustment", label: "Adjustment Register" },
];

const JournalEntriesPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();


  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;
    const map: Record<string, TabKey> = {
      "journal":    "journal",
      "recurring":  "recurring",
      "adjustment": "adjustment",
    };
    return map[currentSub || ""] || "journal";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/journal/${key}`, { replace: true });
  };

  // Per-tab config
  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    journal: {
      title: "Journal Entries",
      subtitle: "Record and manage manual journal entries.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button
            onClick={() => toast.success("Opening New Journal Entry...")}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> New Entry
          </button>
        </div>
      ),
    },
    recurring: {
      title: "Recurring Entries",
      subtitle: "Manage recurring and automated journal entries.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button
            onClick={() => toast.success("Opening New Recurring Entry...")}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> New Recurring
          </button>
        </div>
      ),
    },
    adjustment: {
      title: "Adjustment Register",
      subtitle: "Manage accounting adjustments and corrections.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📥</span> Import
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button
            onClick={() => toast.success("Opening New Adjustment...")}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> New Adjustment
          </button>
        </div>
      ),
    },
  };

  const currentConfig = TAB_CONFIG[activeTab];

  return (
    <>
      <Navbar title="Journal Entries" breadcrumb={["Accountant", "Journal Entries"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">

        {/* ── Section Header ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentConfig.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{currentConfig.subtitle}</p>
          </div>
          {currentConfig.actions}
        </div>

        {/* ── Tab Navigation ─────────────────────────────── */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "journal"    && <ManualEntriesWrapper />}
        {activeTab === "recurring"  && <GenericTableSection title="Recurring Entries" columns={["Template Name", "Frequency", "Next Run Date", "Amount", "Status"]} data={[["Office Rent", "Monthly", "2024-12-01", "₹1,50,000", "Active"]]} />}
        {activeTab === "adjustment" && <AdjustmentRegisterSection />}
      </PageTransition>
    </>
  );
};

export default JournalEntriesPage;

