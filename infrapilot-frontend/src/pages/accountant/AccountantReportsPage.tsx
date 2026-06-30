import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";


// --- GENERIC COMPONENTS ---
const GenericTableSection = ({ title, columns, data }: { title: string; columns: string[]; data: any[][] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter(row =>
    row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search report..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => toast.success("Downloading PDF...")} className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">PDF</button>
          <button onClick={() => toast.success("Downloading Excel...")} className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Excel</button>
          <button onClick={() => toast.success("Downloading CSV...")} className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">CSV</button>
          <button onClick={() => window.print()} className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Print</button>
          <button onClick={() => toast.success("Report emailed to configured address!")} className="text-[10px] font-bold px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Email Report</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{columns.map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.length > 0 ? filteredData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                {row.map((cell, j) => <td key={j} className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-slate-500">No results found for "{searchTerm}"</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CommonFilters = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Report Generated Successfully");
    }, 1000);
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label><input type="date" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg" /></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All Projects</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All Sites</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All Clients</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All Vendors</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All Contractors</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
      <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label><select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"><option>All</option></select></div>
      <button onClick={handleGenerate} disabled={isGenerating} className={`text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 active:scale-95'}`}>
        {isGenerating ? "Generating..." : "Generate"}
      </button>
    </div>
  );
};


// Generic Wrapper Generator
const createWrapper = (categoryTabs: { key: string, label: string, icon?: string }[], tableGenerators: Record<string, () => React.ReactNode>) => {
  return ({ initialSubTab }: { initialSubTab?: string }) => {
    const navigate = useNavigate();
    const sub = initialSubTab || categoryTabs[0].key;

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 overflow-x-auto">
            {categoryTabs.map(t => (
              <button key={t.key} onClick={() => navigate(`?sub=${t.key}`, { replace: true })}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${sub === t.key ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                {t.icon && <span>{t.icon}</span>}
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <CommonFilters />
        {tableGenerators[sub] ? tableGenerators[sub]() : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">Report details for {categoryTabs.find(t => t.key === sub)?.label} are generated here.</p>
          </div>
        )}
      </div>
    );
  };
};

const FinancialReportsWrapper = createWrapper([
  { key: "pl", label: "Profit & Loss", icon: "📈" }, { key: "bs", label: "Balance Sheet", icon: "⚖️" }, { key: "cashflow", label: "Cash Flow Statement", icon: "💸" },
  { key: "trial", label: "Trial Balance", icon: "📊" }, { key: "ledger", label: "General Ledger", icon: "📓" }, { key: "journal", label: "Journal Report", icon: "📔" }
], {
  "pl": () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 font-mono text-sm max-w-3xl">
      <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Profit & Loss Statement</h3>
      <div className="flex justify-between font-bold text-slate-800"><span>Revenue</span><span>₹24,50,00,000</span></div>
      <div className="flex justify-between text-rose-600 pl-4 mt-2"><span>- Direct Expenses</span><span>₹14,00,00,000</span></div>
      <div className="flex justify-between text-rose-600 pl-4"><span>- Indirect Expenses</span><span>₹4,20,00,000</span></div>
      <div className="border-t border-slate-300 my-2"></div>
      <div className="flex justify-between font-black text-emerald-600 text-base"><span>Net Profit</span><span>₹6,30,00,000</span></div>
    </div>
  ),
  "bs": () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 font-mono text-sm max-w-3xl">
      <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Balance Sheet</h3>
      <div className="flex justify-between font-bold text-slate-800 mb-2"><span>Assets</span><span>₹45,00,00,000</span></div>
      <div className="flex justify-between text-slate-600 mb-2"><span>Liabilities</span><span>₹22,00,00,000</span></div>
      <div className="flex justify-between text-slate-600"><span>Equity</span><span>₹23,00,00,000</span></div>
    </div>
  ),
  "cashflow": () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 font-mono text-sm max-w-3xl">
      <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Cash Flow</h3>
      <div className="flex justify-between text-slate-600"><span>Opening Balance</span><span>₹1,10,00,000</span></div>
      <div className="flex justify-between text-emerald-600 pl-4 mt-2"><span>+ Receipts</span><span>₹8,40,00,000</span></div>
      <div className="flex justify-between text-rose-600 pl-4"><span>- Payments</span><span>₹8,00,00,000</span></div>
      <div className="border-t border-slate-300 my-2"></div>
      <div className="flex justify-between font-black text-slate-800 text-base"><span>Closing Balance</span><span>₹1,50,00,000</span></div>
    </div>
  )
});

const ReceivableReportsWrapper = createWrapper([
  { key: "client", label: "Client Ledger", icon: "👥" }, { key: "outstanding", label: "Outstanding Receivables", icon: "📥" }, { key: "invoice", label: "Invoice Report", icon: "📄" },
  { key: "rabill", label: "RA Bill Report", icon: "🏗️" }, { key: "collection", label: "Collection Report", icon: "💰" }, { key: "credit", label: "Credit Note Report", icon: "💳" }
], {
  "client": () => <GenericTableSection title="Client Ledger Report" columns={["Date", "Invoice", "Debit", "Credit", "Balance"]} data={[["2024-10-01", "INV-882", "₹5,00,000", "-", "₹5,00,000 Dr"], ["2024-10-15", "RCPT-102", "-", "₹3,00,000", "₹2,00,000 Dr"]]} />,
  "outstanding": () => <GenericTableSection title="Outstanding Receivables" columns={["Client", "Project", "Invoice No", "Due Date", "Amount Due"]} data={[["Govt Infra Dept", "Metro Line 3", "INV-882", "2024-11-01", "₹2,00,000"]]} />
});

const PayableReportsWrapper = createWrapper([
  { key: "vendor", label: "Vendor Ledger", icon: "🏢" }, { key: "contractor", label: "Contractor Ledger", icon: "👷" }, { key: "outstanding", label: "Outstanding Payables", icon: "📤" },
  { key: "bill", label: "Vendor Bill Report", icon: "🧾" }, { key: "due", label: "Due Payment Report", icon: "⏰" }
], {
  "vendor": () => <GenericTableSection title="Vendor Ledger Report" columns={["Date", "Bill No", "Debit", "Credit", "Balance"]} data={[["2024-10-05", "BILL-V01", "-", "₹1,00,000", "₹1,00,000 Cr"], ["2024-10-20", "PMT-55", "₹1,00,000", "-", "Nil"]]} />,
  "outstanding": () => <GenericTableSection title="Outstanding Payables" columns={["Vendor/Contractor", "Type", "Bill No", "Due Date", "Amount Due"]} data={[["ABC Cements", "Material", "BILL-V05", "2024-11-10", "₹4,50,000"]]} />
});

const ExpenseReportsWrapper = createWrapper([
  { key: "summary", label: "Expense Summary", icon: "📉" }, { key: "project", label: "Project Expense Report", icon: "🏗️" }, { key: "category", label: "Category-wise Expense Report", icon: "🏷️" },
  { key: "monthly", label: "Monthly Expense Report", icon: "📅" }, { key: "site", label: "Site Expense Report", icon: "📍" }
], {});

const PayrollReportsWrapper = createWrapper([
  { key: "salary", label: "Salary Report", icon: "💸" }, { key: "wage", label: "Labor Wage Report", icon: "👷" }, { key: "contractor", label: "Contractor Payment Report", icon: "🛠️" },
  { key: "attendance", label: "Attendance Report", icon: "⏱️" }, { key: "overtime", label: "Overtime Report", icon: "⏳" }
], {});

const AssetReportsWrapper = createWrapper([
  { key: "register", label: "Asset Register", icon: "📋" }, { key: "valuation", label: "Asset Valuation", icon: "💲" }, { key: "depreciation", label: "Depreciation Report", icon: "📉" },
  { key: "transfer", label: "Asset Transfer Report", icon: "🔁" }, { key: "maintenance", label: "Maintenance Cost Report", icon: "🔧" }
], {});


const BankingReportsWrapper = createWrapper([
  { key: "cash", label: "Cash Book", icon: "💵" }, { key: "bank", label: "Bank Book", icon: "🏦" }, { key: "recon", label: "Bank Reconciliation", icon: "🔍" },
  { key: "transfer", label: "Fund Transfer Report", icon: "🔁" }, { key: "petty", label: "Petty Cash Report", icon: "🪙" }
], {});

const MISReportsWrapper = createWrapper([
  { key: "dashboard", label: "Executive Dashboard", icon: "📊" }, { key: "monthly", label: "Monthly Financial Summary", icon: "📅" }, { key: "performance", label: "Project Performance Report", icon: "📈" },
  { key: "revexp", label: "Revenue vs Expense", icon: "⚖️" }, { key: "management", label: "Management MIS", icon: "📋" }
], {});

// --- MAIN PAGE ---
type TabKey = "financial" | "receivable" | "payable" | "expense" | "payroll" | "assets" | "cash_flow" | "mis";

const TABS: { key: TabKey; label: string }[] = [
  { key: "financial", label: "Financial" },
  { key: "receivable", label: "Receivable" },
  { key: "payable", label: "Payable" },
  { key: "expense", label: "Expense" },
  { key: "payroll", label: "Payroll" },
  { key: "assets", label: "Assets" },
  { key: "cash_flow", label: "Cash Flow" },
  { key: "mis", label: "MIS" },
];

const AccountantReportsPage = () => {
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
      "financial": "financial",
      "receivable": "receivable",
      "payable": "payable",
      "expense": "expense",
      "payroll": "payroll",
      "assets": "assets",
      "cash_flow": "cash_flow",
      "mis": "mis",
    };
    return map[currentSub || ""] || "financial";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/reports/${key}`, { replace: true });
  };

  const commonActions = (
    <div className="flex flex-wrap items-center gap-3">
      <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
        <span className="text-lg">📤</span> Export PDF
      </button>
      <button onClick={() => toast.success("Emailing Report...")} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
        <span className="text-lg">✉️</span> Email Report
      </button>
    </div>
  );

  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    financial: { title: "Financial Reports", subtitle: "Analyze core financial statements and summaries.", actions: commonActions },
    receivable: { title: "Receivable Reports", subtitle: "Track client invoices, collections, and outstanding dues.", actions: commonActions },
    payable: { title: "Payable Reports", subtitle: "Monitor vendor bills and outstanding payments.", actions: commonActions },
    expense: { title: "Expense Reports", subtitle: "Review organizational and project expenses.", actions: commonActions },
    payroll: { title: "Payroll Reports", subtitle: "Analyze salary, wages, and contractor payments.", actions: commonActions },
    assets: { title: "Asset Reports", subtitle: "View asset register, valuation, and depreciation.", actions: commonActions },
    cash_flow: { title: "Cash Flow Reports", subtitle: "Monitor bank transactions and cash balances.", actions: commonActions },
    mis: { title: "MIS Reports", subtitle: "Executive dashboards and performance metrics.", actions: commonActions },
  };

  const currentConfig = TAB_CONFIG[activeTab];

  return (
    <>
      <Navbar title="Financial & Project Reports" breadcrumb={["Accountant", "Reports"]} />

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
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "financial" && <FinancialReportsWrapper initialSubTab={subTab} key={subTab || "pl"} />}
        {activeTab === "receivable" && <ReceivableReportsWrapper initialSubTab={subTab} key={subTab || "client"} />}
        {activeTab === "payable" && <PayableReportsWrapper initialSubTab={subTab} key={subTab || "vendor"} />}
        {activeTab === "expense" && <ExpenseReportsWrapper initialSubTab={subTab} key={subTab || "summary"} />}
        {activeTab === "payroll" && <PayrollReportsWrapper initialSubTab={subTab} key={subTab || "salary"} />}
        {activeTab === "assets" && <AssetReportsWrapper initialSubTab={subTab} key={subTab || "register"} />}
        {activeTab === "cash_flow" && <BankingReportsWrapper initialSubTab={subTab} key={subTab || "cash"} />}
        {activeTab === "mis" && <MISReportsWrapper initialSubTab={subTab} key={subTab || "dashboard"} />}
      </PageTransition>
    </>
  );
};

export default AccountantReportsPage;
