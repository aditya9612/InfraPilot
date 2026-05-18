import Navbar from "../../../components/common/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Oct", cost: 1.2 },
  { month: "Nov", cost: 2.1 },
  { month: "Dec", cost: 3.4 },
  { month: "Jan", cost: 4.2 },
  { month: "Feb", cost: 4.8 },
  { month: "Mar", cost: 5.3 },
];

const stats = [
  { label: "Total Budget Utilized",    val: "₹5.3 Cr", change: "+12.5%",    color: "text-blue-600"   },
  { label: "Budget Savings (Variance)", val: "₹0.9 Cr", change: "On Track",  color: "text-emerald-600" },
  { label: "Pending Vendor Payments",   val: "₹0.2 Cr", change: "3 Pending", color: "text-amber-600"  },
];

// ── PDF generator ─────────────────────────────────────────────────────────────
const downloadAuditPdf = () => {
  const generated = new Date().toLocaleString("en-IN");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Detailed Financial Audit Report — Q1 2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; padding:48px; }

    /* Header */
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #6366f1; padding-bottom:24px; margin-bottom:32px; }
    .logo h1  { font-size:22px; font-weight:900; color:#6366f1; letter-spacing:-0.5px; }
    .logo p   { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-top:4px; }
    .meta     { text-align:right; }
    .meta .badge { display:inline-block; background:#eef2ff; color:#6366f1; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; margin-bottom:6px; }
    .meta p   { font-size:10px; color:#64748b; font-weight:600; margin-top:3px; }

    /* Title */
    .title-block { margin-bottom:32px; }
    .title-block h2 { font-size:20px; font-weight:900; color:#0f172a; }
    .title-block p  { font-size:11px; color:#64748b; font-weight:600; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px; }

    /* KPI cards */
    .kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:32px; }
    .kpi  { background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px; }
    .kpi .val { font-size:26px; font-weight:900; }
    .kpi .lbl { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-top:4px; }
    .kpi .chg { display:inline-block; font-size:9px; font-weight:900; margin-top:8px; padding:2px 10px; border-radius:20px; background:#e0e7ff; color:#6366f1; }
    .blue   { color:#2563eb; }
    .green  { color:#16a34a; }
    .amber  { color:#d97706; }

    /* Section heading */
    .sec h3 { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#0f172a; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #f1f5f9; }
    .sec    { margin-bottom:28px; }

    /* Expenditure table */
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; color:#94a3b8; }
    td { padding:10px 14px; border-bottom:1px solid #f1f5f9; color:#334155; font-weight:600; }
    .amt { font-weight:900; color:#1e293b; }

    /* Budget bar */
    .bar-wrap { background:#e2e8f0; border-radius:100px; height:12px; overflow:hidden; margin-top:6px; }
    .bar-fill { height:100%; border-radius:100px; }
    .bar-row  { margin-bottom:14px; }
    .bar-label{ display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:#64748b; }

    /* Vendor table */
    .tag { display:inline-block; padding:2px 10px; border-radius:20px; font-size:9px; font-weight:900; text-transform:uppercase; }
    .paid    { background:#f0fdf4; color:#16a34a; }
    .pending { background:#fefce8; color:#d97706; }
    .partial { background:#eff6ff; color:#2563eb; }

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
      <span class="badge">Confidential — Financial Audit</span>
      <p>Period: October 2025 – March 2026</p>
      <p>Reference: FAR-Q1-2026</p>
      <p>Generated: ${generated}</p>
    </div>
  </div>

  <!-- Title -->
  <div class="title-block">
    <h2>Detailed Financial Audit Report — Q1 FY 2025–26</h2>
    <p>Real-time budget utilization vs actual expenditure analysis</p>
  </div>

  <!-- KPI Cards -->
  <div class="kpis">
    <div class="kpi">
      <div class="val blue">₹5.3 Cr</div>
      <div class="lbl">Total Budget Utilized</div>
      <span class="chg">+12.5% vs last quarter</span>
    </div>
    <div class="kpi">
      <div class="val green">₹0.9 Cr</div>
      <div class="lbl">Budget Savings (Variance)</div>
      <span class="chg" style="background:#dcfce7;color:#16a34a;">On Track</span>
    </div>
    <div class="kpi">
      <div class="val amber">₹0.2 Cr</div>
      <div class="lbl">Pending Vendor Payments</div>
      <span class="chg" style="background:#fef9c3;color:#d97706;">3 Pending</span>
    </div>
  </div>

  <!-- Monthly Expenditure -->
  <div class="sec">
    <h3>Monthly Expenditure Breakdown</h3>
    <table>
      <thead>
        <tr><th>Month</th><th>Planned (₹ Cr)</th><th>Actual (₹ Cr)</th><th>Variance</th><th>Utilization</th></tr>
      </thead>
      <tbody>
        <tr><td>October 2025</td>  <td class="amt">1.40</td><td class="amt">1.20</td><td style="color:#16a34a;font-weight:900;">-0.20</td><td>85.7%</td></tr>
        <tr><td>November 2025</td> <td class="amt">2.30</td><td class="amt">2.10</td><td style="color:#16a34a;font-weight:900;">-0.20</td><td>91.3%</td></tr>
        <tr><td>December 2025</td> <td class="amt">3.50</td><td class="amt">3.40</td><td style="color:#16a34a;font-weight:900;">-0.10</td><td>97.1%</td></tr>
        <tr><td>January 2026</td>  <td class="amt">4.50</td><td class="amt">4.20</td><td style="color:#16a34a;font-weight:900;">-0.30</td><td>93.3%</td></tr>
        <tr><td>February 2026</td> <td class="amt">5.00</td><td class="amt">4.80</td><td style="color:#16a34a;font-weight:900;">-0.20</td><td>96.0%</td></tr>
        <tr><td>March 2026</td>    <td class="amt">5.50</td><td class="amt">5.30</td><td style="color:#16a34a;font-weight:900;">-0.20</td><td>96.4%</td></tr>
        <tr style="background:#f8fafc;"><td><strong>Total</strong></td><td class="amt"><strong>22.20</strong></td><td class="amt"><strong>21.00</strong></td><td style="color:#16a34a;font-weight:900;"><strong>-1.20</strong></td><td><strong>94.6%</strong></td></tr>
      </tbody>
    </table>
  </div>

  <!-- Budget Utilization Bars -->
  <div class="sec">
    <h3>Budget Category Utilization</h3>
    <div class="bar-row">
      <div class="bar-label"><span>Civil &amp; Structural Works</span><span>₹8.4 Cr — 82%</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:82%;background:linear-gradient(90deg,#6366f1,#a5b4fc);"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label"><span>MEP (Electrical, Plumbing)</span><span>₹4.2 Cr — 74%</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:74%;background:linear-gradient(90deg,#2563eb,#93c5fd);"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label"><span>Labour &amp; Manpower</span><span>₹5.1 Cr — 91%</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:91%;background:linear-gradient(90deg,#16a34a,#86efac);"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label"><span>Materials &amp; Procurement</span><span>₹2.1 Cr — 68%</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:68%;background:linear-gradient(90deg,#d97706,#fcd34d);"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label"><span>Safety &amp; Compliance</span><span>₹1.2 Cr — 100%</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:100%;background:linear-gradient(90deg,#dc2626,#fca5a5);"></div></div>
    </div>
  </div>

  <!-- Vendor Payments -->
  <div class="sec">
    <h3>Vendor Payment Ledger</h3>
    <table>
      <thead>
        <tr><th>#</th><th>Vendor</th><th>Invoice No.</th><th>Amount (₹)</th><th>Due Date</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>01</td><td>Mehta Constructions Pvt. Ltd.</td><td>INV-2026-031</td><td class="amt">42,00,000</td><td>15 Mar 2026</td><td><span class="tag paid">Paid</span></td></tr>
        <tr><td>02</td><td>SteelTech Suppliers</td><td>INV-2026-028</td><td class="amt">18,50,000</td><td>20 Mar 2026</td><td><span class="tag paid">Paid</span></td></tr>
        <tr><td>03</td><td>Vikram Build Co.</td><td>INV-2026-034</td><td class="amt">12,00,000</td><td>31 Mar 2026</td><td><span class="tag pending">Pending</span></td></tr>
        <tr><td>04</td><td>Anjali MEP Solutions</td><td>INV-2026-036</td><td class="amt">6,30,000</td><td>05 Apr 2026</td><td><span class="tag pending">Pending</span></td></tr>
        <tr><td>05</td><td>Rapid Cement &amp; Aggregates</td><td>INV-2026-029</td><td class="amt">9,20,000</td><td>10 Mar 2026</td><td><span class="tag partial">Partial</span></td></tr>
        <tr><td>06</td><td>SafeGuard Equipment Rentals</td><td>INV-2026-032</td><td class="amt">3,80,000</td><td>28 Mar 2026</td><td><span class="tag paid">Paid</span></td></tr>
      </tbody>
    </table>
  </div>

  <!-- Audit Observations -->
  <div class="sec">
    <h3>Audit Observations &amp; Recommendations</h3>
    <p class="note">
      The Q1 FY 2025–26 financial audit confirms that overall budget utilization remains within acceptable thresholds at <strong>94.6%</strong>, 
      with a net saving of <strong>₹1.20 Cr</strong> against the sanctioned budget of ₹22.20 Cr. 
      Labour and safety compliance spends are fully aligned with project milestones. 
      Three vendor invoices totalling <strong>₹20.50 lakhs</strong> remain outstanding and are flagged for immediate clearance.
      Material procurement is on track; SteelTech delivery schedule confirmed for April 2026.
      No material irregularities or unapproved variations were recorded during this period.
      Recommend initiating Q2 budget reallocation review by 15 April 2026 to accommodate Phase 4 expansion costs.
    </p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>InfraPilot © 2026 — Project Transparency Portal</span>
    <span>FAR-Q1-2026 | Confidential</span>
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

// ── Component ─────────────────────────────────────────────────────────────────
const ClientFinancialReportPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Financial Report"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial &amp; Audit Reports</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time budget utilization vs actual expenditure analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Bar Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-[400px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Cumulative Spent (₹ Cr)</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total expenditure tracked over the last 6 months</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }} unit="Cr" />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="cost" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Summary + Download */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-8">Quarterly Audit Summary</h2>
            <div className="space-y-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.val}</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm">{stat.change}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={downloadAuditPdf}
            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-indigo-700"
          >
            Download Detailed Audit PDF
          </button>
        </div>
      </div>
    </div>
  </>
);

export default ClientFinancialReportPage;
