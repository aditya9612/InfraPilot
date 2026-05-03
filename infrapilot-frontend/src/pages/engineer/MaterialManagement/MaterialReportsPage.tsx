import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import {
    FileText,
    FileJson,
    Briefcase,
    AlertTriangle,
    Activity
} from "lucide-react";
import type { MaterialReport } from '../../../types/material';
import { materialService } from '../../../services/materialService';
import toast from 'react-hot-toast';

const MaterialReportsPage: React.FC = () => {
    const [reports, setReports] = useState<MaterialReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);

    useEffect(() => {
        const resolveAndFetch = async () => {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId = user?.project_id || user?.user?.project_id || 1;
            
            setIsLoading(true);
            try {
                const data = await materialService.getMaterialReport(Number(pId));
                setReports(data);
            } catch (error) {
                toast.error('Failed to load material reports');
            } finally {
                setIsLoading(false);
            }
        };
        resolveAndFetch();
    }, []);

    const stats = useMemo(() => {
        const totalMaterials = reports.length;
        const totalCost = reports.reduce((acc, curr) => acc + curr.total_cost, 0);
        const totalPending = reports.reduce((acc, curr) => acc + curr.payment_pending, 0);
        return { totalMaterials, totalCost, totalPending };
    }, [reports]);

    const handleExportPDF = async () => {
        setIsExporting('pdf');
        try {
            await materialService.exportReportPDF(1); // Default project 1
            toast.success('Capital PDF report generated');
        } catch (error) {
            toast.error('PDF export failed');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportExcel = async () => {
        setIsExporting('excel');
        try {
            await materialService.exportReportExcel(1); // Default project 1
            toast.success('Capital Excel ledger generated');
        } catch (error) {
            toast.error('Excel export failed');
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <>
            <Navbar title="Material Intelligence" breadcrumb={["Engineer", "Analytics", "Inventory Reports"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Logistics & Capital Report</h1>
                        <p className="text-slate-500 text-sm italic-none">Consolidated fiscal tracking of material procurement and consumption.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting !== null}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-rose-500 border border-rose-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                        >
                            <FileText className="w-4 h-4" />
                            {isExporting === 'pdf' ? 'Downloading...' : 'Export PDF'}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting !== null}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FileJson className="w-4 h-4" />
                            {isExporting === 'excel' ? 'Downloading...' : 'Export Excel'}
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Materials Tracked"
                        value={stats.totalMaterials.toString()}
                        sub="Verified Archives"
                        accent="text-slate-800"
                        icon={<Briefcase className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Capital Outlay"
                        value={`₹${(stats.totalCost / 100000).toFixed(1)}L`}
                        sub="Project Momentum"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Outstanding Dues"
                        value={`₹${(stats.totalPending / 1000).toFixed(1)}k`}
                        sub="Action Required"
                        accent={stats.totalPending > 0 ? "text-rose-500" : "text-emerald-500"}
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                </div>

                {/* ── Report Table ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Fiscal Ledger</h3>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Asset Specification</th>
                                    <th className="px-6 py-4 font-inter text-center">Total Procured</th>
                                    <th className="px-6 py-4 font-inter text-center">Total Consumed</th>
                                    <th className="px-6 py-4 font-inter text-center">Current Stock</th>
                                    <th className="px-6 py-4 font-inter text-right">Investment</th>
                                    <th className="px-6 py-4 font-inter text-right">Balance Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {reports.map((report) => (
                                    <tr key={report.material_id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-800 font-inter uppercase">{report.material_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-600 tabular-nums font-inter">{report.total_purchased.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-600 tabular-nums font-inter">{report.total_used.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${report.remaining_stock < 10 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {report.remaining_stock.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-800 tabular-nums font-inter">₹{report.total_cost.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold tabular-nums font-inter ${report.payment_pending > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                ₹{report.payment_pending.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {reports.length === 0 && !isLoading && (
                        <div className="py-24 flex flex-col items-center justify-center text-center font-inter">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">No Report Data</h3>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto italic-none">Execute some procurement actions to generate financial intelligence.</p>
                        </div>
                    )}
                </div>
            </PageTransition>
        </>
    );
};

export default MaterialReportsPage;
