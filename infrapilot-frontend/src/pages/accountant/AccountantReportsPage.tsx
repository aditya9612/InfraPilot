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
            <tr>{columns.map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
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

// --- SECTIONS ---

const DashboardSection = () => {
  const kpis = [
    { label: "Total Revenue", value: "₹24.5 Cr", icon: "💰", accent: "from-emerald-500 to-teal-500", sub: "YTD Revenue" },
    { label: "Total Expenses", value: "₹18.2 Cr", icon: "📉", accent: "from-rose-500 to-pink-500", sub: "YTD Direct & Indirect" },
    { label: "Net Profit", value: "₹6.3 Cr", icon: "📈", accent: "from-blue-500 to-indigo-500", sub: "25.7% Margin" },
    { label: "O/S Receivables", value: "₹4.1 Cr", icon: "📥", accent: "from-amber-500 to-orange-500", sub: "From Clients" },
    { label: "O/S Payables", value: "₹2.8 Cr", icon: "📤", accent: "from-purple-500 to-fuchsia-500", sub: "To Vendors/Contractors" },
    { label: "Cash Balance", value: "₹1.5 Cr", icon: "🏦", accent: "from-emerald-500 to-green-500", sub: "All Bank Accounts" },
    { label: "Project Cost", value: "₹16.5 Cr", icon: "🏗️", accent: "from-slate-500 to-gray-500", sub: "Allocated to Projects" },
    { label: "GST Liability", value: "₹45.2 L", icon: "⚖️", accent: "from-red-500 to-orange-500", sub: "Net Payable" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.accent} flex items-center justify-center text-xl mb-4 shadow-sm text-white`}>{k.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-xl font-bold text-slate-800">{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      
      <h3 className="font-bold text-slate-800 pt-4">Most Used Reports by Construction Company Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {["Profit & Loss", "Cash Flow", "Outstanding Receivables", "Outstanding Payables", "Project Profitability", "Budget vs Actual", "Material Cost Report", "Labor Cost Report", "GST Report", "Management MIS Report"].map((r, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer shadow-sm transition-all">
            <span className="text-2xl mb-2 block">📊</span>
            <p className="text-xs font-bold text-slate-700">{r}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Generic Wrapper Generator
const createWrapper = (categoryTabs: {key: string, label: string}[], tableGenerators: Record<string, () => React.ReactNode>) => {
  return ({ initialSubTab }: { initialSubTab?: string }) => {
    const navigate = useNavigate();
    const sub = initialSubTab || categoryTabs[0].key;
    
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 overflow-x-auto">
            {categoryTabs.map(t => (
              <button key={t.key} onClick={() => navigate(`?sub=${t.key}`, { replace: true })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  sub === t.key ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <CommonFilters />
        {tableGenerators[sub] ? tableGenerators[sub]() : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">Report details for {categoryTabs.find(t=>t.key===sub)?.label} are generated here.</p>
          </div>
        )}
      </div>
    );
  };
};

const FinancialReportsWrapper = createWrapper([
  { key: "pl", label: "Profit & Loss" }, { key: "bs", label: "Balance Sheet" }, { key: "cashflow", label: "Cash Flow Statement" }, 
  { key: "trial", label: "Trial Balance" }, { key: "ledger", label: "General Ledger" }, { key: "journal", label: "Journal Report" }
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
  { key: "client", label: "Client Ledger" }, { key: "outstanding", label: "Outstanding Receivables" }, { key: "invoice", label: "Invoice Report" },
  { key: "rabill", label: "RA Bill Report" }, { key: "collection", label: "Collection Report" }, { key: "credit", label: "Credit Note Report" }
], {
  "client": () => <GenericTableSection title="Client Ledger Report" columns={["Date", "Invoice", "Debit", "Credit", "Balance"]} data={[["2024-10-01", "INV-882", "₹5,00,000", "-", "₹5,00,000 Dr"], ["2024-10-15", "RCPT-102", "-", "₹3,00,000", "₹2,00,000 Dr"]]} />,
  "outstanding": () => <GenericTableSection title="Outstanding Receivables" columns={["Client", "Project", "Invoice No", "Due Date", "Amount Due"]} data={[["Govt Infra Dept", "Metro Line 3", "INV-882", "2024-11-01", "₹2,00,000"]]} />
});

const PayableReportsWrapper = createWrapper([
  { key: "vendor", label: "Vendor Ledger" }, { key: "contractor", label: "Contractor Ledger" }, { key: "outstanding", label: "Outstanding Payables" },
  { key: "bill", label: "Vendor Bill Report" }, { key: "due", label: "Due Payment Report" }
], {
  "vendor": () => <GenericTableSection title="Vendor Ledger Report" columns={["Date", "Bill No", "Debit", "Credit", "Balance"]} data={[["2024-10-05", "BILL-V01", "-", "₹1,00,000", "₹1,00,000 Cr"], ["2024-10-20", "PMT-55", "₹1,00,000", "-", "Nil"]]} />,
  "outstanding": () => <GenericTableSection title="Outstanding Payables" columns={["Vendor/Contractor", "Type", "Bill No", "Due Date", "Amount Due"]} data={[["ABC Cements", "Material", "BILL-V05", "2024-11-10", "₹4,50,000"]]} />
});

const ExpenseReportsWrapper = createWrapper([
  { key: "summary", label: "Expense Summary" }, { key: "project", label: "Project Expense Report" }, { key: "category", label: "Category-wise Expense Report" },
  { key: "monthly", label: "Monthly Expense Report" }, { key: "site", label: "Site Expense Report" }
], {});

const PayrollReportsWrapper = createWrapper([
  { key: "salary", label: "Salary Report" }, { key: "wage", label: "Labor Wage Report" }, { key: "contractor", label: "Contractor Payment Report" },
  { key: "attendance", label: "Attendance Report" }, { key: "overtime", label: "Overtime Report" }
], {});

const AssetReportsWrapper = createWrapper([
  { key: "register", label: "Asset Register" }, { key: "valuation", label: "Asset Valuation" }, { key: "depreciation", label: "Depreciation Report" },
  { key: "transfer", label: "Asset Transfer Report" }, { key: "maintenance", label: "Maintenance Cost Report" }
], {});

const TaxReportsWrapper = createWrapper([
  { key: "gst", label: "GST Report" }, { key: "input", label: "Input GST Report" }, { key: "output", label: "Output GST Report" },
  { key: "tds", label: "TDS Report" }, { key: "recon", label: "GST Reconciliation Report" }, { key: "filing", label: "Tax Filing Report" }
], {});

const ProjectCostReportsWrapper = createWrapper([
  { key: "budget", label: "Budget vs Actual" }, { key: "profit", label: "Project Profitability" }, { key: "material", label: "Material Cost Report" },
  { key: "labor", label: "Labor Cost Report" }, { key: "contractor", label: "Contractor Cost Report" }, { key: "equipment", label: "Equipment Cost Report" }, { key: "variance", label: "Cost Variance Report" }
], {
  "budget": () => <GenericTableSection title="Budget vs Actual" columns={["Project", "Budget", "Actual Cost", "Variance"]} data={[["Metro Line 3", "₹50,00,00,000", "₹45,00,00,000", "₹5,00,00,000 (10%)"]]} />,
  "profit": () => <GenericTableSection title="Project Profitability" columns={["Project", "Revenue", "Expense", "Profit", "Margin"]} data={[["Highway Proj A", "₹10,00,00,000", "₹8,00,00,000", "₹2,00,00,000", "20%"]]} />,
  "material": () => <GenericTableSection title="Material Cost Report" columns={["Material", "Quantity Used", "Total Cost", "Avg Cost/Unit"]} data={[["Cement (OPC 53)", "5000 Bags", "₹20,00,000", "₹400/Bag"]]} />,
  "labor": () => <GenericTableSection title="Labor Cost Report" columns={["Project", "Skilled Labor Cost", "Unskilled Labor Cost", "Total Labor Cost"]} data={[["Metro Line 3", "₹12,00,000", "₹8,00,000", "₹20,00,000"]]} />
});

const BankingReportsWrapper = createWrapper([
  { key: "cash", label: "Cash Book" }, { key: "bank", label: "Bank Book" }, { key: "recon", label: "Bank Reconciliation" },
  { key: "transfer", label: "Fund Transfer Report" }, { key: "petty", label: "Petty Cash Report" }
], {});

const MISReportsWrapper = createWrapper([
  { key: "dashboard", label: "Executive Dashboard" }, { key: "monthly", label: "Monthly Financial Summary" }, { key: "performance", label: "Project Performance Report" },
  { key: "revexp", label: "Revenue vs Expense" }, { key: "management", label: "Management MIS" }
], {});

// --- MAIN PAGE ---
type TabKey = "dashboard" | "financial" | "receivables" | "payables" | "expenses" | "payroll" | "assets" | "taxes" | "project" | "banking" | "mis";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",   label: "Dashboard",       icon: "📊" },
  { key: "financial",   label: "Financial",       icon: "💵" },
  { key: "receivables", label: "Receivables",     icon: "📥" },
  { key: "payables",    label: "Payables",        icon: "📤" },
  { key: "expenses",    label: "Expenses",        icon: "💳" },
  { key: "payroll",     label: "Payroll",         icon: "👥" },
  { key: "assets",      label: "Assets",          icon: "🏢" },
  { key: "taxes",       label: "GST & Tax",       icon: "⚖️" },
  { key: "project",     label: "Project Cost",    icon: "🏗️" },
  { key: "banking",     label: "Bank & Cash",     icon: "🏦" },
  { key: "mis",         label: "MIS",             icon: "📈" },
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
      "receivables": "receivables",
      "payables": "payables",
      "expenses": "expenses",
      "payroll": "payroll",
      "assets": "assets",
      "taxes": "taxes",
      "project": "project",
      "banking": "banking",
      "mis": "mis",
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
    navigate(`/accountant/reports/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Financial & Project Reports" breadcrumb={["Accountant", "Reports"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Analytics</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Enterprise Reports</h1>
            <p className="text-slate-500 text-sm mt-1">Financial, Project Cost, Receivables, Payables, and MIS reporting.</p>
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
          <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Reports</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"    && <DashboardSection />}
        {activeTab === "financial"    && <FinancialReportsWrapper initialSubTab={subTab} key={subTab || "pl"} />}
        {activeTab === "receivables"  && <ReceivableReportsWrapper initialSubTab={subTab} key={subTab || "client"} />}
        {activeTab === "payables"     && <PayableReportsWrapper initialSubTab={subTab} key={subTab || "vendor"} />}
        {activeTab === "expenses"     && <ExpenseReportsWrapper initialSubTab={subTab} key={subTab || "summary"} />}
        {activeTab === "payroll"      && <PayrollReportsWrapper initialSubTab={subTab} key={subTab || "salary"} />}
        {activeTab === "assets"       && <AssetReportsWrapper initialSubTab={subTab} key={subTab || "register"} />}
        {activeTab === "taxes"        && <TaxReportsWrapper initialSubTab={subTab} key={subTab || "gst"} />}
        {activeTab === "project"      && <ProjectCostReportsWrapper initialSubTab={subTab} key={subTab || "budget"} />}
        {activeTab === "banking"      && <BankingReportsWrapper initialSubTab={subTab} key={subTab || "cash"} />}
        {activeTab === "mis"          && <MISReportsWrapper initialSubTab={subTab} key={subTab || "dashboard"} />}
      </PageTransition>
    </>
  );
};

export default AccountantReportsPage;
