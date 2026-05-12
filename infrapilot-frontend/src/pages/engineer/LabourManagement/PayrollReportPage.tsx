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
import { projectService } from '../../../services/projectService';
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
    const [projectId, setProjectId] = useState<number | null>(null);

    useEffect(() => {
        const initializeProject = async () => {
            try {
                const res = await projectService.getProjects();
                const projects = Array.isArray(res) ? res : (res.items || []);
                if (projects.length > 0) {
                    const pId = projects[0].project_id || projects[0].id;
                    console.log("Report Discovery: Using Project ID:", pId);
                    setProjectId(Number(pId));
                }
            } catch (err) {
                console.error("Report Discovery Failed:", err);
            }
        };
        initializeProject();
    }, []);

    const fetchReports = async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            console.log(`Reports: Fetching ${activeTab} for Project ${projectId}`);
            let data: any[] = [];
            
            // First find a valid labour ID to fetch reports for
            const labourRes = await labourService.getLabours(projectId);
            const firstWorker = labourRes.items?.[0];

            if (activeTab === 'daily') {
                data = await paymentService.getDailyPayroll(projectId);
            } else if (activeTab === 'weekly') {
                if (firstWorker) {
                    const weeklyData = await labourService.getLabourWeeklyReport(firstWorker.id);
                    data = Array.isArray(weeklyData) ? weeklyData.map((item: any) => ({
                        week: `Month ${item.month} - Week Summary`,
                        total_wages: item.total_wage,
                        overtime_wages: 0,
                        total_payout: item.total_wage,
                        attendance_summary: `${item.present_days}P / ${item.absent_days}A / ${item.total_days}T`,
                        total_hours: item.total_hours
                    })) : [];
                }
            } else {
                if (firstWorker) {
                    const monthlyData = await labourService.getLabourMonthlyReport(firstWorker.id);
                    data = Array.isArray(monthlyData) ? monthlyData.map((item: any) => ({
                        month: `Month ${item.month} - Full Report`,
                        total_wages: item.total_wage,
                        overtime_wages: 0,
                        total_payout: item.total_wage,
                        attendance_summary: `${item.present_days}P / ${item.absent_days}A / ${item.total_days}T`,
                        total_hours: item.total_hours
                    })) : [];
                }
            }
            setReports(data);
            console.log("Reports Sync Success (200 OK):", data);
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

    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            // Using the specific labour report export API as requested
            const blob = await labourService.exportExcel(1);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workforce_report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            toast.success('Excel report exported successfully');
        } catch (error) {
            toast.error('Excel export failed');
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await paymentService.exportPayrollPDF();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payroll_report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;
            a.click();
            toast.success('PDF report exported successfully');
        } catch (error) {
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
            
            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fiscal Payroll Analysis</h1>
                        <p className="text-slate-500 text-sm">Historical man-power costing and wage distribution trends.</p>
                    </div>
                    <div className="flex gap-3">
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
                            className="flex items-center justify-center px-8 py-3 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-100 shadow-sm hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                        >
                            {isExportingExcel ? 'Generating...' : 'EXCEL SHEET'}
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Payout"
                            value="₹2.63L"
                            sub="All Wage Items"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("High")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "High" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="High Payouts"
                            value="12"
                            sub="Above ₹5k Threshold"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("OT")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "OT" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="OT Intensive"
                            value="8"
                            sub="Shifts with Overtime"
                            accent="text-amber-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Summary")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Summary" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Advance Adjusted"
                            value="₹12.4k"
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white">
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

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Generating reports...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Fiscal Period</th>
                                        <th className="px-6 py-4">Base Wages</th>
                                        <th className="px-6 py-4">Overtime Pay</th>
                                        <th className="px-6 py-4">Total Payout</th>
                                        <th className="px-6 py-4">Attendance Summary</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reports.filter(r => {
                                        if (activeStatFilter === "High") return r.total_payout > 5000;
                                        if (activeStatFilter === "OT") return r.overtime_wages > 0;
                                        return true;
                                    }).map((r, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">
                                                    {r.date || r.week || r.month}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">₹{r.total_wages?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-amber-500 tabular-nums">₹{r.overtime_wages?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums">₹{r.total_payout?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {r.attendance_summary || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => toast.success('Downloading fiscal receipt...')}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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
