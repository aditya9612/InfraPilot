import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";

interface FinancialSummaryData {
  project_id: number;
  total_expense: number;
  total_invoice: number;
  paid_invoice: number;
  pending_invoice: number;
  profit: number;
}

const DEFAULT_FINANCIAL_DATA: FinancialSummaryData = {
  project_id: 0,
  total_expense: 53000000,
  total_invoice: 82000000,
  paid_invoice: 53000000,
  pending_invoice: 29000000,
  profit: 29000000
};

const costDataMock = [
  { name: "Phase 1", budget: 1.2, actual: 1.1 },
  { name: "Phase 2", budget: 2.5, actual: 2.7 },
  { name: "Phase 3", budget: 2.0, actual: 1.5 },
  { name: "Phase 4", budget: 1.5, actual: 0 },
  { name: "Phase 5", budget: 1.0, actual: 0 },
];

const ClientFinancialsSummaryPage = () => {
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setLoading(true);
        const settings = await import("../../../services/settingsService").then(m => m.settingsService.getSettings()).catch(() => null);
        let pid = 1;
        if (settings?.default_project_id) {
          pid = settings.default_project_id;
        } else {
          const projectsResult: any = await projectService.getProjects(10, 0);
          if (Array.isArray(projectsResult) && projectsResult.length > 0) {
            pid = projectsResult[0].id || projectsResult[0].project_id;
          } else if (projectsResult?.items?.length > 0) {
            pid = projectsResult.items[0].id || projectsResult.items[0].project_id;
          }
        }

        const result = await reportService.getFinancialSummary(pid);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch financials, using fallback:", err);
        setData(DEFAULT_FINANCIAL_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  const financialData = data || DEFAULT_FINANCIAL_DATA;

  // ── PDF generator ─────────────────────────────────────────────────────────────
  const downloadFinancialSummaryPdf = () => {
    const generated = new Date().toLocaleString("en-IN");
    const formatCr = (val: number) => `₹${(val / 10000000).toFixed(2)} Cr`;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Project Financial Summary Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; padding:48px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e293b; padding-bottom:24px; margin-bottom:32px; }
    .logo h1  { font-size:22px; font-weight:900; color:#1e293b; letter-spacing:-0.5px; }
    .logo p   { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
    .meta     { text-align:right; }
    .meta .badge { display:inline-block; background:#f1f5f9; color:#1e293b; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; margin-bottom:6px; }
    .meta p   { font-size:10px; color:#64748b; font-weight:600; margin-top:3px; }
    .title-block { margin-bottom:32px; }
    .title-block h2 { font-size:20px; font-weight:900; color:#0f172a; }
    .title-block p  { font-size:11px; color:#64748b; font-weight:600; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px; }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
    .kpi  { background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px; }
    .kpi .val { font-size:18px; font-weight:900; }
    .kpi .lbl { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-top:4px; }
    .blue   { color:#2563eb; }
    .green  { color:#10b981; }
    .amber  { color:#f59e0b; }
    .red    { color:#ef4444; }
    .sec h3 { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#0f172a; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #f1f5f9; }
    .sec    { margin-bottom:28px; }
    .note { font-size:11px; color:#475569; line-height:1.8; font-weight:500; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <h1>InfraPilot</h1>
      <p>Project Transparency Portal</p>
    </div>
    <div class="meta">
      <span class="badge">Financial Audit Trail</span>
      <p>Generated: ${generated}</p>
    </div>
  </div>

  <div class="title-block">
    <h2>Financial Performance Summary</h2>
    <p>Live budget utilization and invoice tracking overview</p>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="val">${formatCr(financialData.total_invoice)}</div>
      <div class="lbl">Total Invoiced</div>
    </div>
    <div class="kpi">
      <div class="val green">${formatCr(financialData.paid_invoice)}</div>
      <div class="lbl">Paid Amount</div>
    </div>
    <div class="kpi">
      <div class="val amber">${formatCr(financialData.pending_invoice)}</div>
      <div class="lbl">Pending Dues</div>
    </div>
    <div class="kpi">
      <div class="val red">${formatCr(financialData.total_expense)}</div>
      <div class="lbl">Total Expenses</div>
    </div>
  </div>

  <div class="sec">
    <h3>Financial Analysis</h3>
    <p class="note">
      Project financial standing as of ${generated.split(',')[0]}. 
      The total invoiced amount stands at <strong>${formatCr(financialData.total_invoice)}</strong>, 
      with a current net profit margin estimated at <strong>${formatCr(financialData.profit)}</strong>. 
      Expenditure control is maintained at <strong>${formatCr(financialData.total_expense)}</strong>.
    </p>
  </div>

  <div class="footer">
    <span>InfraPilot © 2026 — Project Transparency Portal</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 600);
  };

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials", "Summary"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Summary</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Overview of project budget and actual expenditures</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Invoiced", value: formatPrice(financialData.total_invoice), icon: "📋", color: "text-slate-600 bg-slate-50" },
            { label: "Total Paid", value: formatPrice(financialData.paid_invoice), icon: "✅", color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending Dues", value: formatPrice(financialData.pending_invoice), icon: "⏳", color: "text-amber-600 bg-amber-50" },
            { label: "Total Expense", value: formatPrice(financialData.total_expense), icon: "⚠️", color: "text-red-600 bg-red-50" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className={`w-10 h-10 ${card.color} rounded-2xl flex items-center justify-center text-lg mb-4 shadow-inner`}>
                {card.icon}
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{loading ? '...' : card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Phase-wise Cost Tracking</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actual Spent</span>
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costDataMock} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} unit="Cr" />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="actual" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40}>
                    {costDataMock.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-3xl mb-6 shadow-inner text-primary">📊</div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Net Project Profit</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Estimated net profit based on current site expenses and billed invoices.
            </p>
            <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
               <p className="text-3xl font-black text-emerald-600">{loading ? '...' : formatPrice(financialData.profit)}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Current Standing</p>
            </div>
            <button
              onClick={downloadFinancialSummaryPdf}
              className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors active:scale-95 transform"
            >
              Download Financial Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientFinancialsSummaryPage;
