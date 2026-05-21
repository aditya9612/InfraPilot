import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const costData = [
  { name: "Phase 1", budget: 1.2, actual: 1.1 },
  { name: "Phase 2", budget: 2.5, actual: 2.7 },
  { name: "Phase 3", budget: 2.0, actual: 1.5 },
  { name: "Phase 4", budget: 1.5, actual: 0 },
  { name: "Phase 5", budget: 1.0, actual: 0 },
];

// ── PDF generator ─────────────────────────────────────────────────────────────
const downloadFinancialSummaryPdf = () => {
  const generated = new Date().toLocaleString("en-IN");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Project Financial Summary Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; padding:48px; }

    /* Header */
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e293b; padding-bottom:24px; margin-bottom:32px; }
    .logo h1  { font-size:22px; font-weight:900; color:#1e293b; letter-spacing:-0.5px; }
    .logo p   { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
    .meta     { text-align:right; }
    .meta .badge { display:inline-block; background:#f1f5f9; color:#1e293b; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; margin-bottom:6px; }
    .meta p   { font-size:10px; color:#64748b; font-weight:600; margin-top:3px; }

    /* Title */
    .title-block { margin-bottom:32px; }
    .title-block h2 { font-size:20px; font-weight:900; color:#0f172a; }
    .title-block p  { font-size:11px; color:#64748b; font-weight:600; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px; }

    /* KPI cards */
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
    .kpi  { background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px; }
    .kpi .val { font-size:22px; font-weight:900; }
    .kpi .lbl { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-top:4px; }
    
    .blue   { color:#2563eb; }
    .green  { color:#10b981; }
    .amber  { color:#f59e0b; }
    .red    { color:#ef4444; }

    /* Section heading */
    .sec h3 { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#0f172a; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #f1f5f9; }
    .sec    { margin-bottom:28px; }

    /* Progress bar */
    .prog-wrap { margin-bottom:32px; }
    .prog-label { display:flex; justify-content:space-between; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:8px; }
    .prog-bar { background:#f1f5f9; border-radius:100px; height:12px; overflow:hidden; }
    .prog-fill { height:100%; border-radius:100px; background:#1e293b; width:68%; }

    /* Table */
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; color:#94a3b8; }
    td { padding:10px 14px; border-bottom:1px solid #f1f5f9; color:#334155; font-weight:600; }
    .amt { font-weight:900; color:#1e293b; }
    .status-tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:9px; font-weight:900; text-transform:uppercase; }
    .tag-completed { background:#ecfdf5; color:#10b981; }
    .tag-over { background:#fef2f2; color:#ef4444; }
    .tag-prog { background:#eff6ff; color:#2563eb; }
    .tag-up { background:#f8fafc; color:#94a3b8; }

    /* Observations */
    .note { font-size:11px; color:#475569; line-height:1.8; font-weight:500; }

    /* Footer */
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <h1>InfraPilot</h1>
      <p>Project Transparency Portal</p>
    </div>
    <div class="meta">
      <span class="badge">Confidential — Financial Summary</span>
      <p>Reference: FS-Q1-2026</p>
      <p>Generated: ${generated}</p>
    </div>
  </div>

  <!-- Title -->
  <div class="title-block">
    <h2>Financial Summary Report — Phase 1-5 Overview</h2>
    <p>Comprehensive budget vs actual expenditure analysis</p>
  </div>

  <!-- KPI Cards -->
  <div class="kpis">
    <div class="kpi">
      <div class="val">₹8.2 Cr</div>
      <div class="lbl">Total Budget</div>
    </div>
    <div class="kpi">
      <div class="val green">₹5.3 Cr</div>
      <div class="lbl">Total Spent</div>
    </div>
    <div class="kpi">
      <div class="val amber">₹2.9 Cr</div>
      <div class="lbl">Remaining Budget</div>
    </div>
    <div class="kpi">
      <div class="val red">₹20 L</div>
      <div class="lbl">Variation Orders</div>
    </div>
  </div>

  <!-- Overall Progress -->
  <div class="prog-wrap">
     <div class="prog-label"><span>Overall Project Progress</span><span>68%</span></div>
     <div class="prog-bar"><div class="prog-fill"></div></div>
  </div>

  <!-- Phase-wise Breakdown -->
  <div class="sec">
    <h3>Phase-wise Cost Tracking</h3>
    <table>
      <thead>
        <tr><th>Phase Name</th><th>Budget (₹ Cr)</th><th>Actual (₹ Cr)</th><th>Variance (₹ Cr)</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>Phase 1</td><td class="amt">1.20</td><td class="amt">1.10</td><td style="color:#10b981;">-0.10</td><td><span class="status-tag tag-completed">Completed</span></td></tr>
        <tr><td>Phase 2</td><td class="amt">2.50</td><td class="amt">2.70</td><td style="color:#ef4444;">+0.20</td><td><span class="status-tag tag-over">Over Budget</span></td></tr>
        <tr><td>Phase 3</td><td class="amt">2.00</td><td class="amt">1.50</td><td style="color:#2563eb;">-0.50</td><td><span class="status-tag tag-prog">In Progress</span></td></tr>
        <tr><td>Phase 4</td><td class="amt">1.50</td><td class="amt">0.00</td><td>0.00</td><td><span class="status-tag tag-up">Upcoming</span></td></tr>
        <tr><td>Phase 5</td><td class="amt">1.00</td><td class="amt">0.00</td><td>0.00</td><td><span class="status-tag tag-up">Upcoming</span></td></tr>
      </tbody>
    </table>
  </div>

  <!-- Analysis -->
  <div class="sec">
    <h3>Financial Analysis &amp; Observations</h3>
    <p class="note">
      As of ${generated.split(',')[0]}, the project has utilized <strong>64.6%</strong> of its total sanctioned budget. 
      Overall progress is currently at <strong>68%</strong>, indicating that financial expenditure is largely aligned with physical execution. 
      Phase 2 recorded a variance of ₹0.2 Cr due to unforeseen foundation adjustments; however, Phase 3 is currently tracking below budget, which may offset the Phase 2 overflow. 
      Remaining budget of ₹2.9 Cr is deemed sufficient for completing the remaining phases (4 & 5) provided variation orders are kept under ₹30 L.
    </p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>InfraPilot © 2026 — Project Transparency Portal</span>
    <span>FS-Q1-2026 | Page 1 of 1</span>
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

const ClientFinancialsSummaryPage = () => (
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
          { label: "Total Budget", value: "₹8.2 Cr", icon: "📋", color: "text-slate-600 bg-slate-50" },
          { label: "Total Spent", value: "₹5.3 Cr", icon: "✅", color: "text-emerald-600 bg-emerald-50" },
          { label: "Remaining Budget", value: "₹2.9 Cr", icon: "⏳", color: "text-amber-600 bg-amber-50" },
          { label: "Variation Orders", value: "₹20 L", icon: "⚠️", color: "text-red-600 bg-red-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className={`w-10 h-10 ${card.color} rounded-2xl flex items-center justify-center text-lg mb-4 shadow-inner`}>
              {card.icon}
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</p>
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
              <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} unit="Cr" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="actual" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40}>
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#2563EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-3xl mb-6 shadow-inner text-primary">📊</div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Budget Utilization</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">64.6% of the total project budget has been utilized across completed phases.</p>
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <div className="flex justify-between mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
                 <span className="text-xs font-black text-slate-800">68%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                 <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
               </div>
            </div>
            <button 
              onClick={downloadFinancialSummaryPdf}
              className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors active:scale-95 transform"
            >
              Download Report
            </button>
        </div>
      </div>
    </div>
  </>
);

export default ClientFinancialsSummaryPage;
