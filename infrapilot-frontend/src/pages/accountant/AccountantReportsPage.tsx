import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { accountingService } from "../../services/accountingService";

const REPORT_TABS = [
  { id: "financial", label: "Financial", reports: ["trial-balance", "balance-sheet", "profit-loss", "cashflow"] },
  { id: "tax", label: "Taxation (GST/TDS)", reports: ["gst-summary", "gst-returns", "tds-deductions"] },
  { id: "receivables", label: "Receivables", reports: ["receivables-summary", "receivables-aging"] },
  { id: "payables", label: "Payables", reports: ["vendor-aging", "procurement-efficiency"] },
  { id: "bank", label: "Bank", reports: ["bank-reconciliation"] },
  { id: "expense", label: "Expense", reports: ["expense-ledger"] },
  { id: "project", label: "Project & Recon", reports: ["project-financial-health", "billing-reconciliation"] }
];

const REPORT_CONFIG: Record<string, any> = {
  "trial-balance": { title: "Trial Balance", endpoint: "/accountant/reports/trial-balance", filters: [] },
  "balance-sheet": { title: "Balance Sheet", endpoint: "/accountant/reports/balance-sheet", filters: ["as_of"] },
  "profit-loss": { title: "Profit & Loss", endpoint: "/reports/profit-loss", filters: [] },
  "cashflow": { title: "Cash Flow", endpoint: "/reports/cashflow", filters: [] },
  "gst-summary": { title: "GST Summary", endpoint: "/accountant/gst/summary", filters: [] },
  "gst-returns": { title: "GST Returns", endpoint: "/accountant/gst/returns", filters: [] },
  "tds-deductions": { title: "TDS Deductions", endpoint: "/accountant/tds/deductions", filters: ["skip_limit"] }, 
  "receivables-summary": { title: "Receivables Summary", endpoint: "/invoices/receivables/summary", filters: [] },
  "receivables-aging": { title: "Receivables Aging", endpoint: "/invoices/receivables/aging", filters: [] },
  "bank-reconciliation": { title: "Bank Reconciliation", endpoint: "/accountant/bank/reconciliation/dashboard", filters: ["bank_account_id"] },
  "expense-ledger": { title: "Expense Ledger", endpoint: "/expenses/ledger", filters: [] },
  "project-financial-health": { title: "Project Financial Health", endpoint: "/reports/financial-summary", filters: ["project_id"] },
  "procurement-efficiency": { 
      title: "Procurement Efficiency", 
      endpoint: "/reports/procurement-efficiency", 
      filters: ["project_id", "supplier_id", "status", "payment_status", "date_from", "date_to", "search", "format"] 
  },
  "vendor-aging": { title: "Vendor Payables Aging", endpoint: "/accountant/reports/vendor-aging", filters: ["supplier_id", "project_id", "as_of_date"] },
  "billing-reconciliation": { 
      title: "Billing vs Payments Reconciliation", 
      endpoint: "/accountant/reports/billing-reconciliation", 
      filters: ["project_id", "start_date", "end_date"],
      warning: "Important Limitation: Partial/multiple payment tracking in RA Bills is not fully complete. Please do not assume this as a full-fledged partial-payment reconciliation."
  }
};

const GenericTable = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return <div className="p-4 text-xs text-slate-500">No records found.</div>;
    
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== "object");

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        {headers.map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                {h.replace(/_/g, ' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            {headers.map(h => (
                                <td key={h} className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                                    {row[h] !== null && row[h] !== undefined ? String(row[h]) : "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SmartDataRenderer = ({ data }: { data: any }) => {
    if (!data) return null;

    if (Array.isArray(data)) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <GenericTable data={data} />
            </div>
        );
    }

    if (typeof data === "object") {
        const scalars = Object.entries(data).filter(([, v]) => typeof v === 'string' || typeof v === 'number');
        const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v));

        return (
            <div className="space-y-6">
                {/* Render Stat Cards for all simple key-value pairs */}
                {scalars.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {scalars.map(([key, value]) => (
                            <div key={key} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate" title={key.replace(/_/g, ' ')}>
                                    {key.replace(/_/g, ' ')}
                                </h4>
                                <div className="text-xl font-bold text-slate-800 truncate" title={String(value)}>
                                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Render Tables for all array lists */}
                {arrays.map(([key, value]) => (
                    <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">{key.replace(/_/g, ' ')}</h4>
                        </div>
                        <GenericTable data={value as any[]} />
                    </div>
                ))}
                
                {/* Fallback if it's a complex nested object we can't easily flatten */}
                {scalars.length === 0 && arrays.length === 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 overflow-y-auto">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

const ReportViewer = ({ reportId }: { reportId: string }) => {
    const config = REPORT_CONFIG[reportId];
    const [params, setParams] = useState<Record<string, string>>({});
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);

    useEffect(() => {
        setParams(reportId === "tds-deductions" ? { skip: "0", limit: "100" } : {});
        setData(null);

        if (config.filters.includes("project_id") && projects.length === 0) {
            projectService.getProjects(100, 0, "", "").then(res => {
                setProjects(Array.isArray(res) ? res : res.items || []);
            }).catch(console.error);
        }
        if (config.filters.includes("supplier_id") && suppliers.length === 0) {
            api.get('/materials/suppliers').then(res => {
                const d = res.data;
                setSuppliers(Array.isArray(d) ? d : d?.items || d?.data || []);
            }).catch(console.error);
        }
        if (config.filters.includes("bank_account_id") && bankAccounts.length === 0) {
            accountingService.getBankAccounts().then(res => {
                setBankAccounts(Array.isArray(res) ? res : res.items || res.data || []);
            }).catch(console.error);
        }
    }, [reportId, config.filters]);

    const handleFetch = async () => {
        setLoading(true);
        try {
            const res = await api.get(config.endpoint, { params });
            setData(res.data);
            toast.success(`${config.title} fetched successfully`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to fetch report");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">{config.title}</h3>
                {config.warning && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-sm font-semibold flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span>{config.warning}</span>
                    </div>
                )}
            </div>

            {config.filters.length > 0 && (
                <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    {config.filters.includes("as_of") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">As Of Date</label><input type="date" value={params.as_of || ""} onChange={e => setParams({...params, as_of: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" /></div>
                    )}
                    {config.filters.includes("as_of_date") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">As Of Date</label><input type="date" value={params.as_of_date || ""} onChange={e => setParams({...params, as_of_date: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" /></div>
                    )}
                    {config.filters.includes("start_date") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label><input type="date" value={params.start_date || ""} onChange={e => setParams({...params, start_date: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" /></div>
                    )}
                    {config.filters.includes("end_date") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label><input type="date" value={params.end_date || ""} onChange={e => setParams({...params, end_date: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" /></div>
                    )}
                    {config.filters.includes("date_from") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date From</label><input type="date" value={params.date_from || ""} onChange={e => setParams({...params, date_from: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" /></div>
                    )}
                    {config.filters.includes("date_to") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date To</label><input type="date" value={params.date_to || ""} onChange={e => setParams({...params, date_to: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" /></div>
                    )}
                    {config.filters.includes("project_id") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label>
                            <select value={params.project_id || ""} onChange={e => setParams({...params, project_id: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-40 bg-white">
                                <option value="">All Projects</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name || `Project ${p.id}`}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {config.filters.includes("supplier_id") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
                            <select value={params.supplier_id || ""} onChange={e => setParams({...params, supplier_id: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-40 bg-white">
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name || s.supplier_name || `Supplier ${s.id}`}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {config.filters.includes("bank_account_id") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account</label>
                            <select value={params.bank_account_id || ""} onChange={e => setParams({...params, bank_account_id: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-48 bg-white">
                                <option value="">Select Bank Account</option>
                                {bankAccounts.map(b => (
                                    <option key={b.id} value={b.id}>{b.bank_name || b.name || `Account ${b.id}`} {b.account_number ? `(${b.account_number})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {config.filters.includes("status") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                            <select value={params.status || ""} onChange={e => setParams({...params, status: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-32 bg-white">
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    )}
                    {config.filters.includes("payment_status") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
                            <select value={params.payment_status || ""} onChange={e => setParams({...params, payment_status: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-36 bg-white">
                                <option value="">All</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partially Paid</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    )}
                    {config.filters.includes("search") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search</label><input type="text" placeholder="Search..." value={params.search || ""} onChange={e => setParams({...params, search: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-48" /></div>
                    )}
                    {config.filters.includes("format") && (
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format</label><input type="text" placeholder="e.g. json, pdf" value={params.format || ""} onChange={e => setParams({...params, format: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-24" /></div>
                    )}
                    {config.filters.includes("skip_limit") && (
                        <>
                           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skip</label><input type="number" value={params.skip || "0"} onChange={e => setParams({...params, skip: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-24" /></div>
                           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limit</label><input type="number" value={params.limit || "100"} onChange={e => setParams({...params, limit: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-24" /></div>
                        </>
                    )}
                </div>
            )}
            
            <div className="mb-6">
                <button 
                    onClick={handleFetch}
                    disabled={loading}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? "Fetching Report..." : "Fetch Report"}
                </button>
            </div>

            {data && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-6">Report Output</h4>
                    <SmartDataRenderer data={data} />
                </div>
            )}
        </div>
    );
};

export default function AccountantReportsPage() {
    const [activeTab, setActiveTab] = useState(REPORT_TABS[0].id);
    const [activeReport, setActiveReport] = useState(REPORT_TABS[0].reports[0]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        const tab = REPORT_TABS.find(t => t.id === tabId);
        if (tab && tab.reports.length > 0) {
            setActiveReport(tab.reports[0]);
        }
    };


    return (
        <>
            <Navbar title="Accountant Reports" breadcrumb={["Accountant", "Reports"]} />
            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-inter pb-8">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Accountant Reports</h1>
                    <p className="text-slate-500 text-sm mt-1">Generate and view all 15 financial and compliance reports.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar / Tabs */}
                    <div className="lg:w-64 shrink-0 flex flex-col gap-6">
                        {REPORT_TABS.map((tab) => {
                            const isActiveTab = activeTab === tab.id;
                            return (
                                <div key={tab.id} className="space-y-1">
                                    <button
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            isActiveTab 
                                            ? "bg-slate-800 text-white shadow-sm" 
                                            : "text-slate-600 hover:bg-white hover:text-slate-800"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                    
                                    {isActiveTab && (
                                        <div className="flex flex-col gap-1 pl-4 border-l-2 border-slate-200 ml-2 mt-2">
                                            {tab.reports.map(reportId => (
                                                <button
                                                    key={reportId}
                                                    onClick={() => setActiveReport(reportId)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                                        activeReport === reportId
                                                        ? "bg-white text-primary shadow-sm border border-slate-200"
                                                        : "text-slate-500 hover:text-slate-800"
                                                    }`}
                                                >
                                                    {REPORT_CONFIG[reportId].title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Report Viewer */}
                    <div className="flex-1">
                        <ReportViewer reportId={activeReport} />
                    </div>
                </div>
            </PageTransition>
        </>
    );
}
