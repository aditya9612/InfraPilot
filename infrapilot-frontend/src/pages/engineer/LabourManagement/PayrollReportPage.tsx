import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
    FileText, 
    TrendingUp, 
    Filter,
    Download,
    RotateCcw
} from "lucide-react";
import { paymentService } from '../../../services/paymentService';
import { labourService } from '../../../services/labourService';
import toast from 'react-hot-toast';
import { 
    XAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const PayrollReportPage: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [isLoading, setIsLoading] = useState(true);
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "High" | "OT" | "Summary">("All");
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const now = new Date();
    const [projectId] = useState<number>(() => {
        try {
            const userStr = localStorage.getItem("infrapilot_user");
            if (userStr) {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) return Number(pId);
            }
        } catch (err) {
            console.error("Failed to load user project context:", err);
        }
        return 36; // Default fallback to 36 to ensure list renders and matches registered project
    });
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

    const [stats, setStats] = useState({
        totalPayout: 0,
        highPayouts: 0,
        otIntensive: 0,
        advanceAdjusted: 0
    });

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            console.log(`Reports: Fetching ${activeTab} for Project ${projectId || 'all'}`);
            
            const [labourRes, attendanceRes, historyRes] = await Promise.all([
                labourService.getLabours(projectId, { limit: 50 }),
                labourService.getAttendanceList(projectId),
                paymentService.getPaymentHistory({ ...(projectId ? { project_id: projectId } : {}), limit: 50, offset: 0 })
            ]);

            const laboursList = labourRes.items || [];
            const attendances = attendanceRes.items || [];
            const history = historyRes || [];

            // Build report rows from laboursList enriched with attendance stats
            const workerStats = attendances.reduce((acc: any, curr: any) => {
                const id = curr.labour_id;
                if (!acc[id]) acc[id] = { present_days: 0, total_hours: 0, overtime_hours: 0, total_wage: 0 };
                if (curr.status?.toLowerCase() !== 'absent') {
                    acc[id].present_days++;
                    acc[id].total_hours += (curr.working_hours || 0);
                    acc[id].overtime_hours += (curr.overtime_hours || 0);
                    acc[id].total_wage += (curr.total_wage || 0);
                }
                return acc;
            }, {});

            const enrichedLabours = laboursList.map((l: any) => ({
                ...l,
                ...(workerStats[l.id] || { present_days: 0, total_hours: 0, overtime_hours: 0, total_wage: 0 })
            }));

            setReports(enrichedLabours);

            // Summary Stats
            const totalPayout = history.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
            const highPayouts = history.filter((h: any) => h.amount > 5000).length;
            const otIntensive = attendances.filter((a: any) => a.overtime_hours > 0).length;
            const advanceAdjusted = history.filter((h: any) => h.payment_type?.toLowerCase() === 'advance').reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

            setStats({ totalPayout, highPayouts, otIntensive, advanceAdjusted });

            console.log("Reports Sync Success (200 OK)");
        } catch (error) {
            console.error("Reports Sync Failure:", error);
            toast.error('Failed to load payroll reports');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [activeTab, projectId]);

    const handleExportExcel = () => {
        setIsExportingExcel(true);
        try {
            const filteredList = reports.filter(r => {
                if (activeStatFilter === "High") return (r.total_wage || 0) > 5000;
                if (activeStatFilter === "OT") return (r.overtime_hours || 0) > 0;
                return true;
            });

            const headers = [
                "Labour Name",
                "Skill Type",
                "Daily Wage Rate",
                "Days Present",
                "OT Hours",
                "Total Wage Earned",
                "Status"
            ];
            const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
            
            const rows = filteredList.map((r: any) => [
                escape(r.labour_name || 'Unknown'),
                escape(String(r.skill_type || '—').replace('SkillType.', '').replace('SemiSkilled', 'Semi-Skilled')),
                escape(`₹${Number(r.daily_wage_rate || 0).toLocaleString()}`),
                escape(r.present_days || 0),
                escape(`${r.overtime_hours || 0}h`),
                escape(`₹${(r.total_wage || (Number(r.daily_wage_rate || 0) * (r.present_days || 0))).toLocaleString()}`),
                escape(r.status || 'Active')
            ].join(","));

            const csvContent = [headers.join(","), ...rows].join("\n");
            const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payroll_report_${selectedMonth}_${selectedYear}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Payroll Excel exported successfully');
        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error('Excel export failed');
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleExportPDF = () => {
        setIsExportingPDF(true);
        try {
            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                toast.error("Popup blocker blocked print preview. Please allow popups.");
                return;
            }

            const filteredList = reports.filter(r => {
                if (activeStatFilter === "High") return (r.total_wage || 0) > 5000;
                if (activeStatFilter === "OT") return (r.overtime_hours || 0) > 0;
                return true;
            });

            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const monthLabel = monthNames[selectedMonth - 1] || 'Month';

            const tableRowsHtml = filteredList.map((r: any) => `
                <tr>
                    <td>
                        <div class="worker-cell">
                            <span class="avatar">${(r.labour_name?.charAt(0) || '?').toUpperCase()}</span>
                            <span class="name">${r.labour_name || 'Unknown'}</span>
                        </div>
                    </td>
                    <td><span class="skill-badge">${String(r.skill_type || '—').replace('SkillType.', '').replace('SemiSkilled', 'Semi-Skilled')}</span></td>
                    <td class="num">₹${Number(r.daily_wage_rate || 0).toLocaleString()}</td>
                    <td class="num">${r.present_days || 0}</td>
                    <td class="num">${r.overtime_hours || 0}h</td>
                    <td class="num earned">₹${(r.total_wage || (Number(r.daily_wage_rate || 0) * (r.present_days || 0))).toLocaleString()}</td>
                    <td>
                        <span class="status-badge ${r.status === 'Active' ? 'active' : 'inactive'}">
                            ${r.status || 'Active'}
                        </span>
                    </td>
                </tr>
            `).join("");

            printWindow.document.write(`
                <html>
                <head>
                    <title>Payroll Analysis Report - ${monthLabel} ${selectedYear} - InfraPilot</title>
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 20mm 15mm 20mm 15mm;
                        }
                        body {
                            font-family: 'Inter', system-ui, -apple-system, sans-serif;
                            color: #1e293b;
                            background: #fff;
                            margin: 0;
                            padding: 0;
                            font-size: 10pt;
                            line-height: 1.5;
                        }
                        .document-container {
                            width: 100%;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .header-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                            border: none;
                        }
                        .header-table td {
                            border: none;
                            padding: 0;
                            vertical-align: middle;
                        }
                        .logo-text {
                            font-size: 18pt;
                            font-weight: 800;
                            color: #2563eb;
                            letter-spacing: 0.5px;
                        }
                        .logo-subtext {
                            font-size: 8pt;
                            color: #64748b;
                            font-weight: bold;
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                            margin-top: 2px;
                        }
                        .doc-title {
                            font-size: 14pt;
                            font-weight: 800;
                            color: #0f172a;
                            text-align: right;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .doc-meta {
                            font-size: 8.5pt;
                            color: #64748b;
                            text-align: right;
                            margin-top: 4px;
                            font-weight: 600;
                        }
                        .divider {
                            height: 2px;
                            background-color: #3b82f6;
                            margin-bottom: 25px;
                        }
                        
                        /* Info Grid */
                        .info-grid {
                            width: 100%;
                            margin-bottom: 30px;
                            border-collapse: collapse;
                            background: #f8fafc;
                            border-radius: 12px;
                            border: 1px solid #e2e8f0;
                        }
                        .info-grid td {
                            border: none;
                            padding: 12px 20px;
                            font-size: 9.5pt;
                        }
                        .info-label {
                            color: #64748b;
                            font-weight: 700;
                            width: 120px;
                            text-transform: uppercase;
                            font-size: 8pt;
                            letter-spacing: 0.5px;
                        }
                        .info-value {
                            color: #0f172a;
                            font-weight: 700;
                        }

                        /* Data Table */
                        table.data-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                            margin-bottom: 40px;
                        }
                        table.data-table th {
                            background-color: #f8fafc;
                            color: #94a3b8;
                            font-size: 8.5pt;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                            padding: 14px 18px;
                            text-align: center;
                            border-top: 1px solid #e2e8f0;
                            border-bottom: 2px solid #e2e8f0;
                        }
                        table.data-table th:first-child {
                            text-align: left;
                        }
                        table.data-table td {
                            padding: 14px 18px;
                            font-size: 10pt;
                            border-bottom: 1px solid #f1f5f9;
                            color: #334155;
                            vertical-align: middle;
                            text-align: center;
                        }
                        table.data-table td:first-child {
                            text-align: left;
                        }
                        .num {
                            font-variant-numeric: tabular-nums;
                            font-weight: 700;
                            color: #334155;
                        }
                        .earned {
                            color: #10b981;
                            font-weight: 800;
                        }
                        
                        /* Badges */
                        .status-badge {
                            font-size: 8pt;
                            font-weight: 700;
                            padding: 4px 10px;
                            border-radius: 6px;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            display: inline-block;
                        }
                        .status-badge.active {
                            background: #d1fae5;
                            color: #065f46;
                            border: 1px solid #a7f3d0;
                        }
                        .status-badge.inactive {
                            background: #fee2e2;
                            color: #991b1b;
                            border: 1px solid #fca5a5;
                        }
                        .skill-badge {
                            font-size: 8pt;
                            font-weight: 700;
                            color: #475569;
                            background: #f1f5f9;
                            padding: 4px 10px;
                            border-radius: 6px;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            display: inline-block;
                            border: 1px solid #e2e8f0;
                        }

                        /* Worker identity formatting matching live screen */
                        .worker-cell {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        }
                        .avatar {
                            width: 32px;
                            height: 32px;
                            background: #eff6ff;
                            color: #3b82f6;
                            font-size: 12px;
                            font-weight: 700;
                            border-radius: 10px;
                            border: 1px solid #dbeafe;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .name {
                            font-size: 10pt;
                            font-weight: 700;
                            color: #0f172a;
                        }

                        /* Signatures */
                        .signature-block {
                            width: 100%;
                            margin-top: 50px;
                            margin-bottom: 30px;
                            border-collapse: collapse;
                        }
                        .signature-block td {
                            border: none;
                            padding: 0;
                            width: 50%;
                        }
                        .sig-line {
                            width: 180px;
                            border-bottom: 1.5px solid #cbd5e1;
                            margin-bottom: 6px;
                        }
                        .sig-label {
                            font-size: 8pt;
                            color: #64748b;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }

                        /* Formal Footer */
                        .footer {
                            margin-top: 40px;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 15px;
                            font-size: 8pt;
                            color: #94a3b8;
                            text-align: center;
                            font-weight: 500;
                        }
                        
                        @media print {
                            body {
                                margin: 0;
                            }
                            th {
                                background-color: #f8fafc !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .info-grid {
                                background: #f8fafc !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="document-container">
                        <!-- Top Header -->
                        <table class="header-table">
                            <tr>
                                <td>
                                    <div class="logo-text">INFRAPILOT</div>
                                    <div class="logo-subtext">Financial Intelligence</div>
                                </td>
                                <td>
                                    <div class="doc-title">Fiscal Payroll Register</div>
                                    <div class="doc-meta">Period: ${monthLabel} ${selectedYear}</div>
                                </td>
                            </tr>
                        </table>

                        <div class="divider"></div>

                        <!-- Metadata Card -->
                        <table class="info-grid">
                            <tr>
                                <td class="info-label">Project Context</td>
                                <td class="info-value">Project ID ${projectId || 'All'}</td>
                                <td class="info-label" style="text-align: right; padding-right: 10px;">Cycle Mode</td>
                                <td class="info-value" style="width: 160px; text-align: right;">${activeTab.toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Operator</td>
                                <td class="info-value">Site Engineer Terminal</td>
                                <td class="info-label" style="text-align: right; padding-right: 10px;">Classification</td>
                                <td class="info-value" style="text-align: right;">Official Ledger</td>
                            </tr>
                        </table>

                        <!-- Data Table -->
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Labour Name</th>
                                    <th>Skill Type</th>
                                    <th>Daily Wage</th>
                                    <th>Days Present</th>
                                    <th>OT Hours</th>
                                    <th>Total Wage Earned</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>

                        <!-- Signature Elements -->
                        <table class="signature-block">
                            <tr>
                                <td>
                                    <div class="sig-line"></div>
                                    <div class="sig-label">Prepared By (Site Engineer)</div>
                                </td>
                                <td style="text-align: right;">
                                    <div class="sig-line" style="margin-left: auto;"></div>
                                    <div class="sig-label">Authorized Signature</div>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer Note -->
                        <div class="footer">
                            This is an official computer-generated transaction record from the InfraPilot ERP Platform. Page 1 of 1.
                        </div>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
            toast.success('Payroll PDF exported successfully');
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error('PDF export failed');
        } finally {
            setIsExportingPDF(false);
        }
    };

    const chartData = useMemo(() => [
        { name: 'Jan', amount: 180000 },
        { name: 'Feb', amount: 210000 },
        { name: 'Mar', amount: 195000 },
        { name: 'Apr', amount: 245000 },
    ], []);

    return (
        <>
            <Navbar title="Financial Intelligence" breadcrumb={["Engineer", "Human Resources", "Payroll Reports"]} />
            
            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fiscal Payroll Analysis</h1>
                        <p className="text-slate-500 text-sm">Historical man-power costing and wage distribution trends.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Month & Year Selectors */}
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                        >
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                <option key={i+1} value={i+1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 shadow-sm hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                        >
                            {isExportingPDF ? <TrendingUp className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
                        </button>
                        <button 
                            onClick={handleExportExcel}
                            disabled={isExportingExcel}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            {isExportingExcel ? 'Generating...' : 'Export Excel'}
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Payout"
                            value={`₹${(stats.totalPayout / 1000).toFixed(1)}k`}
                            sub="All Wage Items"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("High")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "High" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="High Payouts"
                            value={stats.highPayouts.toString()}
                            sub="Above ₹5k Threshold"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("OT")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "OT" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="OT Intensive"
                            value={stats.otIntensive.toString()}
                            sub="Shifts with Overtime"
                            accent="text-amber-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Summary")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Summary" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Advance Adjusted"
                            value={`₹${(stats.advanceAdjusted / 1000).toFixed(1)}k`}
                            sub="Recovery Target"
                            accent="text-rose-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    {/* Chart Card */}
                    <div className="lg:col-span-3 bg-primary rounded-2xl p-8 shadow-xl relative overflow-hidden">
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Payroll Momentum</h3>
                                    <p className="text-white/70 text-xs font-bold">Monthly wage expenditure trend analysis.</p>
                                </div>
                                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">
                                    +12.4% vs Mar
                                </span>
                            </div>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Report Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center flex-wrap gap-4 bg-white">
                        <div className="flex gap-2">
                            {[
                                { id: 'daily', label: 'Daily Analysis' },
                                { id: 'weekly', label: 'Weekly Summary' },
                                { id: 'monthly', label: 'Monthly Report' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                        {activeStatFilter !== "All" && (
                            <button onClick={() => setActiveStatFilter("All")} className="px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Clear Stat Filter</span>
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Generating reports...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Labour Name</th>
                                        <th className="px-6 py-4">Skill Type</th>
                                        <th className="px-6 py-4 text-center">Daily Wage</th>
                                        <th className="px-6 py-4 text-center">Days Present</th>
                                        <th className="px-6 py-4 text-center">OT Hours</th>
                                        <th className="px-6 py-4 text-center">Total Wage Earned</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reports.filter(r => {
                                        if (activeStatFilter === "High") return (r.total_wage || 0) > 5000;
                                        if (activeStatFilter === "OT") return (r.overtime_hours || 0) > 0;
                                        return true;
                                    }).map((r, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                                                        <span className="text-sm font-bold text-primary">{r.labour_name?.charAt(0) || '?'}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{r.labour_name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{String(r.skill_type || '—').replace('SkillType.', '').replace('SemiSkilled', 'Semi-Skilled')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">₹{Number(r.daily_wage_rate || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">{r.present_days || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-bold tabular-nums ${(r.overtime_hours || 0) > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                    {r.overtime_hours || 0}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums">
                                                    ₹{(r.total_wage || (Number(r.daily_wage_rate || 0) * (r.present_days || 0))).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${r.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {r.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {reports.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                                                <p className="text-[10px] font-bold uppercase tracking-widest">No payroll records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default PayrollReportPage;
