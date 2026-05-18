import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { qcService } from "../../services/qcService";
import type { QcItem } from "../../services/qcService";
import { projectService } from "../../services/projectService";
import { Eye, ShieldCheck, AlertTriangle, FileText, Filter } from "lucide-react";
import toast from "react-hot-toast";

const QCGovernancePage = () => {
    const [qcItems, setQcItems] = useState<QcItem[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, qcData] = await Promise.all([
                    projectService.getProjects(),
                    qcService.listQc(0)
                ]);
                setProjects(Array.isArray(projectsData) ? projectsData : projectsData.items || []);
                setQcItems(qcData.items);
            } catch (err) {
                console.error("QC Governance Load Error:", err);
                toast.error("Failed to load compliance data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredItems = qcItems.filter(item => {
        const matchesProject = filterProject === "all" || String(item.project_id) === filterProject;
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        return matchesProject && matchesStatus;
    });

    const getProjectName = (id: number) => {
        return projects.find(p => p.id === id)?.project_name || `Project #${id}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Scanning Quality Metrics...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar title="QC Governance Hub" breadcrumb={["Manager", "Compliance", "Quality"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quality Audit & Governance</h1>
                            <p className="text-slate-500 text-sm">Master oversight of site material testing and structural inspections.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
                            <FileText className="w-4 h-4" />
                            Generate Audit Report
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Total Tests" value={qcItems.length.toString()} sub="All Site Scans" icon={<ShieldCheck className="w-5 h-5 text-primary" />} />
                        <StatCard title="Failed Tests" value={qcItems.filter(i => i.status === "Fail").length.toString()} sub="Requiring Intervention" accent="text-rose-600" icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} />
                        <StatCard title="Compliance Rate" value={`${Math.round(((qcItems.length - qcItems.filter(i => i.status === "Fail").length) / (qcItems.length || 1)) * 100)}%`} sub="Overall Quality Score" accent="text-emerald-500" />
                        <StatCard title="Pending Review" value="0" sub="All caught up" icon={<Filter className="w-5 h-5 text-slate-400" />} />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-w-[200px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Project:</span>
                                <select
                                    value={filterProject}
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 outline-none flex-1"
                                >
                                    <option value="all">All Active Sites</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-w-[150px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 outline-none flex-1"
                                >
                                    <option value="all">All Results</option>
                                    <option value="Pass">Pass</option>
                                    <option value="Fail">Fail</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Inspection Type</th>
                                        <th className="px-6 py-4">Project / Site</th>
                                        <th className="px-6 py-4">Engineer</th>
                                        <th className="px-6 py-4">Test Result</th>
                                        <th className="px-6 py-4">Standard</th>
                                        <th className="px-6 py-4">Compliance</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredItems.map((qc) => (
                                        <tr key={qc.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{qc.inspection_type}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium uppercase">{qc.test_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-primary/80">{getProjectName(qc.project_id)}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{qc.engineer_name}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{qc.result}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">{qc.standard_value}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${qc.status === "Pass" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                    }`}>
                                                    {qc.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-1.5 bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-all group-hover:bg-white">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default QCGovernancePage;
