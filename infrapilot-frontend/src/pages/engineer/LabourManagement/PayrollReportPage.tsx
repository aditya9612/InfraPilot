import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import {
    Filter,
    Download,
    RotateCcw,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { paymentService } from '../../../services/paymentService';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils/currencyUtils';

const PayrollReportPage: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);

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
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, projectId, activeStatFilter, selectedMonth, selectedYear]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            console.log(`Reports: Fetching aggregate report for Project ${projectId || 'all'}`);

            const [aggregateRes, summaryRes] = await Promise.all([
                paymentService.getAggregateReport({ project_id: projectId, month: selectedMonth, year: selectedYear }),
                paymentService.getFiscalSummary({ project_id: projectId, month: selectedMonth, year: selectedYear })
            ]);

            const enrichedLabours = aggregateRes || [];

            setReports(enrichedLabours);

            // Summary Stats derived from the fiscal-summary API
            const totalPayout = summaryRes?.total_payout || 0;
            const highPayouts = summaryRes?.high_payouts || 0;
            const otIntensive = summaryRes?.ot_intensive || 0;
            const advanceAdjusted = summaryRes?.advance_adjusted || 0;

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
    }, [activeTab, projectId, selectedMonth, selectedYear]);

    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            if (!selectedMonth || !selectedYear) {
                toast.error("Please select month and year");
                return;
            }
            
            const responseBlob = await paymentService.exportPayrollExcel({ month: selectedMonth, year: selectedYear, project_id: projectId });
            
            // Create blob with explicit Excel MIME type to prevent corruption
            const blob = new Blob([responseBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payroll_Report_${selectedMonth}_${selectedYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
            
            toast.success('Excel exported successfully');
        } catch (error) {
            console.error("Export Excel Error:", error);
            toast.error('Excel Export failed');
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExportingExcel(true); // Using same loading state for simplicity or could add isExportingPdf
        try {
            if (!selectedMonth || !selectedYear) {
                toast.error("Please select month and year");
                return;
            }
            const blob = await paymentService.exportPayrollPDF({ month: selectedMonth, year: selectedYear, project_id: projectId });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payroll_Report_${selectedMonth}_${selectedYear}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('PDF exported successfully');
        } catch (error) {
            console.error("Export PDF Error:", error);
            toast.error('PDF Export failed');
        } finally {
            setIsExportingExcel(false);
        }
    };

    const filteredReports = reports.filter(r => {
        if (activeStatFilter === "High") return (r.total_wage_earned || 0) > 5000;
        if (activeStatFilter === "OT") return (r.ot_hours || 0) > 0;
        return true;
    });

    return (
        <>
            <Navbar title="Financial Intelligence" breadcrumb={["Engineer", "Human Resources", "Payroll Reports"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ─── Header ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Fiscal Payroll Analysis</h1>
                        <p className="text-slate-500 text-sm font-inter">Historical man-power costing and wage distribution trends.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-inter">
                    </div>
                </div>

                {/* ── Interactive Stats ───────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    {[
                        {
                            title: "Total Payout",
                            value: formatCurrency(stats.totalPayout),
                            sub: "All Wage Items",
                            accent: "text-slate-800",
                            status: "All",
                        },
                        {
                            title: "High Payouts",
                            value: stats.highPayouts.toString(),
                            sub: "Above ₹5k Threshold",
                            accent: "text-emerald-500",
                            status: "High",
                        },
                        {
                            title: "OT Intensive",
                            value: stats.otIntensive.toString(),
                            sub: "Shifts with Overtime",
                            accent: "text-amber-500",
                            status: "OT",
                        },
                        {
                            title: "Advance Adjusted",
                            value: formatCurrency(stats.advanceAdjusted),
                            sub: "Recovery Target",
                            accent: "text-rose-500",
                            status: "Summary",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group ${activeStatFilter === s.status ? "ring-2 ring-primary/20" : ""}`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                {s.sub}
                            </p>
                        </div>
                    ))}
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
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
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
                                onClick={handleExportPDF}
                                disabled={isExportingExcel}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                {isExportingExcel ? 'Generating...' : 'Export PDF'}
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
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{String(r.skill_category || r.skill_type || r.skill || '—').replace('SkillType.', '').replace('SemiSkilled', 'Semi-Skilled')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">₹{Number(r.daily_wage || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">{r.days_present || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-bold tabular-nums ${(r.ot_hours || 0) > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                    {r.ot_hours || 0}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-emerald-600 tabular-nums">
                                                    ₹{(r.total_wage_earned || 0).toLocaleString()}
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
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                                {/* Left: Items per page */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Center: Showing info */}
                                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} records
                                </div>

                                {/* Right: Pagination */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {(() => {
                                        const totalItems = filteredReports.length;
                                        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                        const pages = [];
                                        if (totalPages <= 5) {
                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                        } else {
                                            if (currentPage <= 3) {
                                                pages.push(1, 2, 3, 4, '...', totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                            }
                                        }

                                        return pages.map((page, index) => {
                                            if (page === '...') {
                                                return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                            }
                                            const pageNum = page as number;
                                            const isActive = currentPage === pageNum;
                                            return (
                                                <button
                                                    key={`page-${pageNum}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                            ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        });
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredReports.length / itemsPerPage), prev + 1))}
                                        disabled={currentPage === Math.max(1, Math.ceil(filteredReports.length / itemsPerPage)) || filteredReports.length === 0}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </PageTransition>
        </>
    );
};

export default PayrollReportPage;
