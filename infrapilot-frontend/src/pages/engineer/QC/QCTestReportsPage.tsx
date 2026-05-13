import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import { 
  User
} from "lucide-react";

import { qcService } from "../../../services/qcService";
import { projectService } from "../../../services/projectService";
import type { QcItem } from "../../../services/qcService";

const QCTestReportsPage = () => {
    const navigate = useNavigate();
    
    // Core Data States
    const [qcList, setQcList] = useState<QcItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectId, setProjectId] = useState<number | null>(null);
    
    // UI States
    const [activeTab] = useState<"Inspection" | "Test Reports">("Test Reports");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Pass" | "Fail">("All");

    // ─── PROJECT RESOLUTION ─────────────────────────────────────────────
    useEffect(() => {
        const initializeProject = async () => {
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

                // Discovery Fallback
                console.warn("QC Reports: No project_id in user context, attempting discovery fallback");
                const projectsResponse = await projectService.getProjects(1, 0);
                const projects = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse.items || []);
                if (projects && projects.length > 0) {
                    setProjectId(Number(projects[0].project_id || projects[0].id));
                } else {
                    setProjectId(36);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(36);
            }
        };
        initializeProject();
    }, []);

    // ─── INITIALIZATION ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        if (projectId === null) return;
        setIsLoading(true);
        try {
            const res = await qcService.listQc(projectId);
            setQcList(res.items || []);
        } catch (err) {
            toast.error("Failed to sync QC logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── HELPERS & ANALYTICS ─────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = qcList.length;
        const passCount = qcList.filter(q => q.status === "Pass").length;
        const failCount = qcList.filter(q => q.status === "Fail").length;
        
        return {
            total,
            passCount,
            failCount,
            passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
            failRate: total > 0 ? Math.round((failCount / total) * 100) : 0
        };
    }, [qcList]);

    const filteredQcList = useMemo(() => {
        if (activeStatFilter === "Pass") return qcList.filter(q => q.status === "Pass");
        if (activeStatFilter === "Fail") return qcList.filter(q => q.status === "Fail");
        return qcList;
    }, [qcList, activeStatFilter]);

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

    // ─── RENDER ──────────────────────────────────────────────────────────

    return (
        <>
            <Navbar title="QC Test Reports" breadcrumb={["Engineer", "Quality Control", "Analytical Insights"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Test Analytics Vault</h1>
                        <p className="text-slate-500 text-sm">Comprehensive analysis and historical breakdown of site quality tests.</p>
                    </div>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Tests"
                            value={stats.total.toString()}
                            sub="Analytic Samples"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pass")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pass" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Pass Rate"
                            value={`${stats.passRate}%`}
                            sub="Compliance Velocity"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Fail")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Fail" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Failures"
                            value={stats.failCount.toString()}
                            sub="Critical Deviations"
                            accent="text-rose-500" />
                    </div>
                    <StatCard
                        title="Data Quality"
                        value="100%"
                        sub="Verification Level"
                        accent="text-blue-500" />
                </div>

                {/* ── Tab Bar ────────────────────────────────────────────── */}
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

                {/* ── Scrollable Content Area ────────────────────────── */}
                <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
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
                                         <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest font-inter">Archive Active</span>
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
                                                {filteredQcList.map((qc) => (
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
                                                            <span className="text-xs text-slate-400 line-clamp-1 max-w-[200px] font-inter" title={qc.remarks || ""}>
                                                                {qc.remarks || "-"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 font-inter">
                                <p className="text-4xl mb-4">📊</p>
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
