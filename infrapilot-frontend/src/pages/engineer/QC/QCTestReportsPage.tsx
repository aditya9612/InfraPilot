import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import {
    User,
    ChevronLeft,
    ChevronRight,
    Clock,
    ChevronDown
} from "lucide-react";

import { qcService } from "../../../services/qcService";
import type { QcItem } from "../../../services/qcService";

const QCTestReportsPage = () => {
    const navigate = useNavigate();

    // Core Data States
    const [qcList, setQcList] = useState<QcItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectId, setProjectId] = useState<number | null>(null);

    // UI States
    const [activeTab] = useState<"Inspection" | "Test Reports">("Test Reports");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Pass" | "Fail" | "Momentum">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // â”€â”€â”€ PROJECT RESOLUTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const initializeProject = () => {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const pId = user?.project_id || user?.user?.project_id;
                    if (pId) {
                        setProjectId(Number(pId));
                        return;
                    }
                }
                setProjectId(92);
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
            }
        };
        initializeProject();
    }, []);

    // â”€â”€â”€ INITIALIZATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const fetchData = useCallback(async () => {
        if (projectId === null) return;
        setIsLoading(true);
        try {
            const res = await qcService.listQc(projectId);
            const items = res.items || [];
            const sortedItems = items.sort((a: QcItem, b: QcItem) => Number(b.id) - Number(a.id));
            setQcList(sortedItems);
        } catch (err) {
            toast.error("Failed to sync QC logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeStatFilter]);

    // â”€â”€â”€ HELPERS & ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const filteredQcList = useMemo(() => {
        let list = qcList;
        if (activeStatFilter === "Pass") list = list.filter(q => q.status === "Pass");
        if (activeStatFilter === "Fail") list = list.filter(q => q.status === "Fail");
        
        return [...list].sort((a, b) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });
    }, [qcList, activeStatFilter, sortOrder]);

    const stats = useMemo(() => {
        const total = filteredQcList.length;
        const passCount = filteredQcList.filter(q => q.status === "Pass").length;
        const failCount = filteredQcList.filter(q => q.status === "Fail").length;

        let totalFields = 0;
        let filledFields = 0;

        filteredQcList.forEach(q => {
            const fields = [
                q.inspection_type,
                q.test_type,
                q.result !== undefined && q.result !== null && String(q.result) !== '',
                q.standard_value !== undefined && q.standard_value !== null && String(q.standard_value) !== '',
                q.status,
                q.engineer_name,
                q.remarks,
                q.report_file
            ];
            fields.forEach(f => {
                totalFields++;
                if (f && String(f).trim() !== '') {
                    filledFields++;
                }
            });
        });

        const dataQuality = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 100;

        return {
            total,
            passCount,
            failCount,
            passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
            failRate: total > 0 ? Math.round((failCount / total) * 100) : 0,
            dataQuality
        };
    }, [filteredQcList]);

    const paginatedQcList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredQcList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredQcList, currentPage, itemsPerPage]);

    const breakdown = useMemo(() => {
        const groups: Record<string, { total: number; passed: number; failed: number }> = {};

        filteredQcList.forEach(q => {
            if (!groups[q.test_type]) {
                groups[q.test_type] = { total: 0, passed: 0, failed: 0 };
            }
            groups[q.test_type].total++;
            if (q.status === "Pass") groups[q.test_type].passed++;
            else groups[q.test_type].failed++;
        });

        return Object.entries(groups).map(([type, data]) => ({
            type,
            ...data,
            passRate: Math.round((data.passed / data.total) * 100) + "%"
        }));
    }, [filteredQcList]);

    // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return (
        <>
            <Navbar title="QC Test Reports" breadcrumb={["Engineer", "Quality Control", "Analytical Insights"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-inter flex flex-col">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Test Analytics Vault</h1>
                        <p className="text-slate-500 text-sm">Comprehensive analysis and historical breakdown of site quality tests.</p>
                    </div>
                </div>

                {/* â”€â”€ Summary Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Total Audits" value={stats.total.toString()} sub="Verified Logs" accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pass")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pass" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Pass Tests" value={stats.passCount.toString()} sub="Pass Tests" accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Fail")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Fail" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Failed Tests" value={stats.failCount.toString()} sub="Failed Tests" accent="text-rose-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Momentum")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Momentum" ? "ring-2 ring-blue-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Audit Momentum" value={`${stats.passRate}%`} sub="Overall Pass Percentage" accent="text-blue-500" />
                    </div>
                </div>

                {/* â”€â”€ Tab Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8">
                    <button
                        onClick={() => navigate("/engineer/qc/inspection")}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "Inspection" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        QC Inspection
                    </button>
                    <button
                        onClick={() => navigate("/engineer/qc/reports")}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "Test Reports" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Test Reports
                    </button>
                </div>

                {/* â”€â”€ Scrollable Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex-1 w-full max-w-full font-inter">
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-400 font-inter">
                            <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Analyzing test data...</p>
                        </div>
                    ) : (
                        <>
                            {qcList.length > 0 ? (
                                <div className="space-y-10">
                                    {/* Test Type Breakdown Table */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter">
                                        <div className="p-4 border-b border-slate-50 bg-white">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Test Protocol Breakdown</h3>
                                        </div>
                                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                            <table className="w-full text-left font-inter">
                                                <thead>
                                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                                        <th className="px-6 py-4 font-inter">Test Protocol</th>
                                                        <th className="px-6 py-4 text-center font-inter">Sample Count</th>
                                                        <th className="px-6 py-4 text-center font-inter">Compliant</th>
                                                        <th className="px-6 py-4 text-center font-inter">Non-Compliant</th>
                                                        <th className="px-6 py-4 text-right font-inter">Velocity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 font-inter">
                                                    {breakdown.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-bold text-slate-800 font-inter">{row.type}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 font-inter">{row.total}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.passed}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{row.failed}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-sm font-bold text-primary font-inter">{row.passRate}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* All Inspections Table */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter">
                                        <div className="p-4 border-b border-slate-50 bg-white flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Operational Audit Ledger</h3>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest font-inter">Archive Active</span>
                                                <div className="relative flex items-center font-inter">
                                                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <select
                                                        value={sortOrder}
                                                        onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                                        className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                                                    >
                                                        <option value="latest">Latest First</option>
                                                        <option value="oldest">Oldest First</option>
                                                    </select>
                                                    <div className="absolute right-3 text-slate-400 pointer-events-none">
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                            <table className="w-full text-left font-inter min-w-[1200px]">
                                                <thead>
                                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                                        <th className="px-6 py-4 font-inter">Audit Category</th>
                                                        <th className="px-6 py-4 font-inter">Test Type</th>
                                                        <th className="px-6 py-4 text-center font-inter">Metrics</th>
                                                        <th className="px-6 py-4 font-inter">Compliance</th>
                                                        <th className="px-6 py-4 font-inter">Technical Auditor</th>
                                                        <th className="px-6 py-4 font-inter">Narrative</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 font-inter">
                                                    {paginatedQcList.map((qc) => (
                                                        <tr key={qc.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col font-inter">
                                                                    <span className="text-sm font-bold text-slate-800 font-inter">{qc.inspection_type}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">AUDIT-#{qc.id}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-bold text-slate-800 font-inter">{qc.test_type}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex flex-col font-inter items-center">
                                                                    <p className="text-[10px] font-bold text-slate-800 font-inter">{qc.result}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">TH: {qc.standard_value}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${qc.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                                    {qc.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 font-inter">
                                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                                    <p className="text-[10px] font-bold text-slate-800 font-inter uppercase tracking-widest">{qc.engineer_name}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs text-slate-600 font-inter" title={qc.remarks || ""}>
                                                                    {qc.remarks && qc.remarks.trim() ? qc.remarks : "-"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* ─── Pagination ─────────────────────────────────── */}
                                        {!isLoading && filteredQcList.length > 0 && (
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
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredQcList.length)} of {filteredQcList.length} records
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
                                    const totalItems = filteredQcList.length;
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
                                        const pageNum = page;
                                        const isActive = currentPage === pageNum;
                                        return (
                                            <button
                                                key={`page-${pageNum}`}
                                                onClick={() => setCurrentPage(pageNum as number)}
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                                                    isActive 
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
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredQcList.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredQcList.length / itemsPerPage)) || filteredQcList.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 font-inter">
                                    <p className="text-4xl mb-4">ðŸ“Š</p>
                                    <h3 className="text-lg font-bold text-slate-400 font-inter">No test reports available</h3>
                                    <p className="text-slate-400 text-sm font-inter">Complete inspections to generate data insights</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </PageTransition>
        </>
    );
};

export default QCTestReportsPage;
