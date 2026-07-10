import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { dsrService } from "../../services/dsrService";
import { projectService } from "../../services/projectService";
import { measurementService } from "../../services/measurementService";
import type { DsrItem } from "../../types/dsr";
import { CheckCircle, XCircle, Eye, Search, Calendar, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const DSRApprovalPage = () => {
    const [dsrs, setDsrs] = useState<DsrItem[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const pData = await projectService.getProjects();
                const projectList = Array.isArray(pData) ? pData : pData.items || [];
                setProjects(projectList);

                // Load DSRs for the first project as initial view or all if supported
                if (projectList.length > 0) {
                    const firstProjectId = projectList[0].id;
                    const dsrData = await dsrService.getDsrByProject(firstProjectId);
                    setDsrs(dsrData.items);
                }
            } catch (err) {
                console.error("DSR Hub Load Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleProjectChange = async (projectId: string) => {
        setSelectedProjectId(projectId);
        if (projectId === "all") return;

        setLoading(true);
        try {
            const dsrData = await dsrService.getDsrByProject(Number(projectId));
            setDsrs(dsrData.items);
        } catch (err) {
            toast.error("Failed to load DSRs for this site.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (dsr: DsrItem) => {
        try {
            await dsrService.approveDsr(dsr.id);

            await measurementService.createMeasurement({
                project_id: dsr.project_id,
                task_id: 0,
                boq_item_id: 0,
                final_area: Math.random() * 100, // Simulated progress volume
                approved_rate: 450, // Mock rate from BOQ
                extra_area: 0,
                extra_rate: 0,
                measured_qty: 0,
                certified_qty: 0,
                rejected_qty: 0,
                retention_amount: 0,
                status: "DRAFT"
            });

            setDsrs(prev => prev.map(d => d.id === dsr.id ? { ...d, status: "Approved" } : d));
            toast.success("DSR Approved & Synced to Finance");
        } catch (err) {
            toast.error("Approval failed.");
        }
    };

    const handleReject = async (id: number) => {
        try {
            await dsrService.rejectDsr(id);
            setDsrs(prev => prev.map(d => d.id === id ? { ...d, status: "Draft" } : d));
            toast.error("DSR Sent back to Site Engineer");
        } catch (err) {
            toast.error("Operation failed.");
        }
    };

    if (loading && dsrs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar title="DSR Approval Hub" breadcrumb={["Manager", "Workflows", "DSR Approval"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Site Report Approvals</h1>
                            <p className="text-slate-500 text-sm">Review, verify, and authorize daily progress reports from all sites.</p>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                            <div className="pl-3 py-2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                className="pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 outline-none min-w-[250px]"
                            >
                                <option value="all">Select Site Intelligence...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {dsrs.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-slate-700 font-bold">No DSRs Found</h3>
                                <p className="text-slate-400 text-sm">Please select a site to view daily progress reports.</p>
                            </div>
                        ) : (
                            dsrs.map((dsr) => (
                                <div key={dsr.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(dsr.report_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-lg font-bold text-slate-800 leading-none">{new Date(dsr.report_date).getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${dsr.status === "Approved" ? "bg-emerald-50 text-emerald-600" : dsr.status === "Submitted" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                                                    }`}>
                                                    {dsr.status}
                                                </span>
                                                <span className="text-xs font-bold text-slate-700">DSR #{dsr.id}</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                                                {dsr.work_done || "Progress Report Entry"}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                    <MapPin className="w-3 h-3" />
                                                    {projects.find(p => p.id === dsr.project_id)?.project_name || "Unknown Site"}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                    <span className="font-bold text-slate-500">Eng:</span> {dsr.created_by_name || "Assigned Engineer"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>

                                        {dsr.status === "Submitted" && (
                                            <>
                                                <button
                                                    onClick={() => handleReject(dsr.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Send Back
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(dsr)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve DSR
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default DSRApprovalPage;
