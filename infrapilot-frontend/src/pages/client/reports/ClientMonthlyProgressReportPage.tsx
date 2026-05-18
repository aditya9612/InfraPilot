import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const reportData = [
  { month: "Oct", progress: 15 },
  { month: "Nov", progress: 28 },
  { month: "Dec", progress: 42 },
  { month: "Jan", progress: 55 },
  { month: "Feb", progress: 62 },
  { month: "Mar", progress: 68 },
];

const reports = [
  { name: "Monthly Execution Report - March 2026",   date: "02 Apr 2026", size: "4.2 MB", type: "PDF", category: "Structural",   month: "March 2026",    progress: 68, tasks: 14, completed: 12 },
  { name: "Monthly Execution Report - February 2026", date: "01 Mar 2026", size: "3.8 MB", type: "PDF", category: "Foundation",  month: "February 2026", progress: 62, tasks: 11, completed: 10 },
  { name: "Monthly Execution Report - January 2026",  date: "02 Feb 2026", size: "4.5 MB", type: "PDF", category: "Site Prep",   month: "January 2026",  progress: 55, tasks: 13, completed: 9  },
  { name: "Monthly Execution Report - December 2025", date: "03 Jan 2026", size: "3.2 MB", type: "PDF", category: "Initial Works", month: "December 2025", progress: 42, tasks: 10, completed: 7  },
];

// ── PDF generation helper ──────────────────────────────────────────────────────
const buildPdfHtml = (title: string, month: string, progress: number, tasks: number, completed: number, category: string, date: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; padding:48px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2563EB; padding-bottom:24px; margin-bottom:32px; }
    .logo-block h1 { font-size:22px; font-weight:900; color:#2563EB; letter-spacing:-0.5px; }
    .logo-block p  { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
    .meta { text-align:right; }
    .meta p { font-size:10px; color:#64748b; font-weight:600; margin-top:3px; }
    .meta .badge { display:inline-block; background:#eff6ff; color:#2563EB; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; margin-bottom:6px; }
    .title-block { margin-bottom:32px; }
    .title-block h2 { font-size:20px; font-weight:900; color:#0f172a; }
    .title-block p { font-size:11px; color:#64748b; font-weight:600; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px; }
    .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
    .stat { background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px; }
    .stat .val { font-size:28px; font-weight:900; color:#2563EB; }
    .stat .lbl { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-top:4px; }
    .section { margin-bottom:28px; }
    .section h3 { font-size:11px; font-weight:900; color:#0f172a; text-transform:uppercase; letter-spacing:2px; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #f1f5f9; }
    .bar-wrap { background:#f1f5f9; border-radius:100px; height:14px; overflow:hidden; margin-bottom:6px; }
    .bar-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#2563EB,#60a5fa); }
    .bar-label { display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:#64748b; }
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; color:#94a3b8; }
    td { padding:10px 14px; border-bottom:1px solid #f1f5f9; color:#334155; font-weight:600; }
    .tag { display:inline-block; padding:2px 10px; border-radius:20px; font-size:9px; font-weight:900; text-transform:uppercase; }
    .done { background:#f0fdf4; color:#16a34a; }
    .prog { background:#eff6ff; color:#2563EB; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-block">
      <h1>InfraPilot</h1>
      <p>Project Transparency Portal</p>
    </div>
    <div class="meta">
      <span class="badge">Confidential</span>
      <p>Report Date: ${date}</p>
      <p>Category: ${category}</p>
      <p>Reference: MPR-${month.replace(' ', '-').toUpperCase()}</p>
    </div>
  </div>

  <div class="title-block">
    <h2>${title}</h2>
    <p>Official Monthly Execution Summary &amp; Milestone Documentation</p>
  </div>

  <div class="stats">
    <div class="stat"><div class="val">${progress}%</div><div class="lbl">Overall Progress</div></div>
    <div class="stat"><div class="val">${tasks}</div><div class="lbl">Tasks Planned</div></div>
    <div class="stat"><div class="val">${completed}</div><div class="lbl">Tasks Completed</div></div>
    <div class="stat"><div class="val">${tasks - completed}</div><div class="lbl">Pending Tasks</div></div>
  </div>

  <div class="section">
    <h3>Cumulative Progress</h3>
    <div class="bar-label"><span>Site Completion</span><span>${progress}%</span></div>
    <div class="bar-wrap"><div class="bar-fill" style="width:${progress}%"></div></div>
    <br/>
    <div class="bar-label"><span>Budget Utilization</span><span>${Math.round(progress * 0.91)}%</span></div>
    <div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(progress * 0.91)}%"></div></div>
    <br/>
    <div class="bar-label"><span>Material Procurement</span><span>${Math.round(progress * 1.05 > 100 ? 100 : progress * 1.05)}%</span></div>
    <div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(progress * 1.05 > 100 ? 100 : progress * 1.05)}%"></div></div>
  </div>

  <div class="section">
    <h3>Task Breakdown</h3>
    <table>
      <thead>
        <tr><th>#</th><th>Activity</th><th>Category</th><th>Completion</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>01</td><td>Foundation reinforcement inspection</td><td>${category}</td><td>100%</td><td><span class="tag done">Done</span></td></tr>
        <tr><td>02</td><td>Concrete pour – Level 2 slab</td><td>${category}</td><td>100%</td><td><span class="tag done">Done</span></td></tr>
        <tr><td>03</td><td>Steel column erection – Phase 3</td><td>Structural</td><td>${progress}%</td><td><span class="tag prog">In Progress</span></td></tr>
        <tr><td>04</td><td>Electrical conduit laying – L1&amp;L2</td><td>MEP</td><td>100%</td><td><span class="tag done">Done</span></td></tr>
        <tr><td>05</td><td>Waterproofing – basement level</td><td>Finishing</td><td>100%</td><td><span class="tag done">Done</span></td></tr>
        <tr><td>06</td><td>Safety audit &amp; compliance review</td><td>Safety</td><td>${Math.min(progress + 10, 100)}%</td><td><span class="tag ${progress >= 90 ? 'done' : 'prog'}">${progress >= 90 ? 'Done' : 'In Progress'}</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Observations &amp; Notes</h3>
    <p style="font-size:11px;color:#475569;line-height:1.8;font-weight:500;">
      Site operations for <strong>${month}</strong> proceeded on schedule with no major delays recorded. 
      Concrete supply chain remained stable; steel delivery timelines were met. 
      Safety compliance stood at 100% during all inspection rounds. 
      Minor rework observed on the eastern façade brickwork — remediation in progress. 
      Overall project trajectory remains on track for Q3 handover.
    </p>
  </div>

  <div class="footer">
    <span>InfraPilot © 2026 — Project Transparency Portal</span>
    <span>Generated: ${new Date().toLocaleString("en-IN")}</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;

const downloadPdf = (report: typeof reports[0]) => {
  const html = buildPdfHtml(report.name, report.month, report.progress, report.tasks, report.completed, report.category, report.date);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
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

// Download a summary PDF of all reports
const downloadSummaryPdf = () => {
  const latest = reports[0];
  downloadPdf(latest);
};

// Download Excel as CSV
const downloadExcel = () => {
  const rows = [
    ["Month", "Progress %", "Tasks Planned", "Tasks Completed", "Category", "Released"],
    ...reports.map((r) => [r.month, r.progress, r.tasks, r.completed, r.category, r.date]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Monthly_Progress_Report.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ── Component ─────────────────────────────────────────────────────────────────
const ClientMonthlyProgressReportPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Monthly Progress"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Monthly Progress Reports</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Official monthly execution summaries and milestone documentation</p>
      </div>

      {/* Report Controls */}
      <div className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Date Range</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5">
              <input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" defaultValue="2026-03-01" />
              <span className="text-[10px] font-black text-slate-300">TO</span>
              <input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" defaultValue="2026-03-31" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadSummaryPdf}
            className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mb-10 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Progress Growth (Cumulative %)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} unit="%" />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "24px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="progress" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Archive */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Report Archive</h2>
          <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
            <button className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">2026</button>
            <button className="px-4 py-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-slate-800 transition-colors">2025</button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {reports.map((report, i) => (
            <div key={i} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-xs font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{report.name}</h3>
                  <div className="flex gap-4 mt-1 flex-wrap">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Released: {report.date}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Category: {report.category}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Size: {report.size}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Progress: {report.progress}%</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => downloadPdf(report)}
                className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/10 hover:bg-primary transition-all active:scale-95 shrink-0"
              >
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default ClientMonthlyProgressReportPage;
