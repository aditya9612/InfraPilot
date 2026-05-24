import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
    Filter,
    Download,
    RotateCcw,
    ChevronLeft,
    ChevronRight
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
    const [chartData, setChartData] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "High" | "OT" | "Summary">("All");
    const [isExportingExcel, setIsExportingExcel] = useState(false);
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
        return 92; // Default fallback to 92 to ensure list renders and matches registered project
    });
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

    const [stats, setStats] = useState({
        totalPayout: 0,
        highPayouts: 0,
        otIntensive: 0,
        advanceAdjusted: 0
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, projectId, activeStatFilter, selectedMonth, selectedYear]);

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

            // Summary Stats derived directly from the loaded list (reports)
            const totalPayout = enrichedLabours.reduce((acc: number, curr: any) => acc + (curr.total_wage || (Number(curr.daily_wage_rate || 0) * (curr.present_days || 0))), 0);
            const highPayouts = enrichedLabours.filter((r: any) => (r.total_wage || (Number(r.daily_wage_rate || 0) * (r.present_days || 0))) > 5000).length;
            const otIntensive = enrichedLabours.filter((r: any) => (r.overtime_hours || 0) > 0).length;
            const advanceAdjusted = history.filter((h: any) => h.payment_type?.toLowerCase() === 'advance').reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

            setStats({ totalPayout, highPayouts, otIntensive, advanceAdjusted });

            // Build dynamic chart data from history
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthMap: Record<string, number> = {};
            
            history.forEach((h: any) => {
                const date = new Date(h.payment_date || new Date());
                const monthName = months[date.getMonth()];
                monthMap[monthName] = (monthMap[monthName] || 0) + (h.amount || 0);
            });

            const currentMonthIndex = new Date().getMonth();
            const newChartData = [];
            for (let i = 3; i >= 0; i--) {
                let mIndex = currentMonthIndex - i;
                if (mIndex < 0) mIndex += 12;
                const mName = months[mIndex];
                newChartData.push({
                    name: mName,
                    amount: monthMap[mName] || 0
                });
            }
            // If completely empty, provide an empty state to avoid broken chart
            if (newChartData.every(d => d.amount === 0)) {
                newChartData.forEach(d => d.amount = 0);
            }
            setChartData(newChartData);

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
                escape(String(r.skill_type || 'â€”').replace('SkillType.', '').replace('SemiSkilled', 'Semi-Skilled')),
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

    const filteredReports = reports.filter(r => {
        if (activeStatFilter === "High") return (r.total_wage || 0) > 5000;
        if (activeStatFilter === "OT") return (r.overtime_hours || 0) > 0;
        return true;
    });

    return (
        <>
            <Navbar title="Financial Intelligence" breadcrumb={["Engineer", "Human Resources", "Payroll Reports"]} />
            
            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fiscal Payroll Analysis</h1>
                        <p className="text-slate-500 text-sm">Historical man-power costing and wage distribution trends.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                    </div>
                </div>

                {/* â”€â”€ Summary Stats with Interactive Filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                {/* Chart has been moved to the bottom */}

                {/* â”€â”€ Report Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between flex-wrap gap-4 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filter</span>
                                <select
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value)}
                                    className="px-6 py-2 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                                >
                                    <option value="daily">Daily Analysis</option>
                                    <option value="weekly">Weekly Summary</option>
                                    <option value="monthly">Monthly Report</option>
                                    <option value="3_months">3 Months</option>
                                    <option value="6_months">6 Months</option>
                                    <option value="1_year">1 Year</option>
                                </select>
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
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                            >
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                    <option key={i+1} value={i+1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                            >
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleExportExcel}
                                disabled={isExportingExcel}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                {isExportingExcel ? 'Generating...' : 'Export Excel'}
                            </button>
                            <button 
                                onClick={() => toast.success("PDF Export coming soon!")}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:bg-rose-100 active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
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
                                    {filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r, idx) => (
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
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{String(r.skill_type || 'â€”').replace('SkillType.', '').replace('SemiSkilled', 'Semi-Skilled')}</span>
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
                                    {filteredReports.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                                                <p className="text-[10px] font-bold uppercase tracking-widest">No payroll records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        
                        {/* ── Pagination Controls ───────────────────────── */}
                        {!isLoading && filteredReports.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white font-inter">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    PAGE {currentPage} OF {Math.max(1, Math.ceil(filteredReports.length / itemsPerPage))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                                        title="Previous Page"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                                        {currentPage}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(filteredReports.length / itemsPerPage)), prev + 1))}
                                        disabled={currentPage === Math.max(1, Math.ceil(filteredReports.length / itemsPerPage))}
                                        className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                                        title="Next Page"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
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
            </PageTransition>
        </>
    );
};

export default PayrollReportPage;
