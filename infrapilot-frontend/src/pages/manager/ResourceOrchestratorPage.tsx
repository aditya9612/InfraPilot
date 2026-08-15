import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { projectService } from "../../services/projectService";
import { labourService } from "../../services/labourService";
import { userService } from "../../services/userService";
import { equipmentService } from "../../services/equipmentService";
import { materialService } from "../../services/materialService";
import ResourceTransferModal from "../../components/modals/ResourceTransferModal";
import {
    Users, Truck, Package, ArrowRightLeft, TrendingUp, AlertCircle,
    Wrench, Activity, MoveRight, LayoutGrid, List, ChevronLeft, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const StatCard = ({ title, value, sub, icon, accent = "text-slate-900" }: any) => (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group w-full flex-1">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                {icon}
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <div className={`text-2xl font-black ${accent} tracking-tighter`}>{value}</div>
            </div>
        </div>
        <div className="h-px bg-slate-50 w-full mb-3" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight text-right">{sub}</p>
    </div>
);

const ResourceOrchestratorPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"workforce" | "assets" | "supply-chain">("workforce");
    const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");
    const [workforcePage, setWorkforcePage] = useState(0);
    const [engineerPage, setEngineerPage] = useState(0);
    const [assetPage, setAssetPage] = useState(0);
    const [supplyChainPage, setSupplyChainPage] = useState(0);
    const PAGE_SIZE = 10;
    const [workforceSubTab, setWorkforceSubTab] = useState<"labour" | "engineer">("labour");

    const [workforceData, setWorkforceData] = useState<{ labours: any[], attendance: any[] }>({ labours: [], attendance: [] });
    const [siteEngineers, setSiteEngineers] = useState<any[]>([]);
    const [assetsData, setAssetsData] = useState<{ equipment: any[], utilization: any[] }>({ equipment: [], utilization: [] });
    const [supplyChainData, setSupplyChainData] = useState<{ stock: any[], transfers: any[] }>({ stock: [], transfers: [] });

    const [transferModal, setTransferModal] = useState<{ isOpen: boolean, type: 'labour' | 'machinery' | 'material', data: any }>({
        isOpen: false,
        type: 'labour',
        data: null
    });

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects();
                let fullList = Array.isArray(res) ? res : res.items || [];

                // Filter projects for Project Manager role
                if (user?.role === "ProjectManager") {
                    const memberChecks = await Promise.all(
                        fullList.map(async (p: any) => {
                            const mems = await projectService.getProjectMembers(p.id).catch(() => []);
                            const memberList = Array.isArray(mems) ? mems : (mems.items || mems.data || []);
                            const isAssigned = memberList.some((m: any) =>
                                String(m.user_id) === String(user.id) ||
                                String(m.user?.id) === String(user.id) ||
                                String(m.userId) === String(user.id)
                            );
                            return { id: p.id, isAssigned };
                        })
                    );
                    fullList = fullList.filter((p: any) =>
                        memberChecks.find(c => c.id === p.id)?.isAssigned
                    );
                }

                setProjects(fullList);
            } catch (err) {
                toast.error("Failed to load project registry.");
            }
        };
        fetchProjects();
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const projId = selectedProjectId === "all" ? undefined : selectedProjectId;

                if (activeTab === "workforce") {
                    const labourProjectId = workforceSubTab === "labour" ? undefined : projId;
                    const attendanceProjectId = workforceSubTab === "labour" ? null : (projId ? Number(projId) : null);

                    const [labRes, attRes] = await Promise.all([
                        labourService.getLabours(labourProjectId),
                        labourService.getAttendanceList(attendanceProjectId)
                    ]);

                    const labourItems = Array.isArray(labRes) ? labRes : labRes.items || [];
                    const attendanceItems = Array.isArray(attRes) ? attRes : attRes.items || [];
                    setWorkforceData({ labours: labourItems, attendance: attendanceItems });

                    let engineerRecords: any[] = [];
                    try {
                        const userRes = await userService.getAllUsers(100, 0);
                        const allUsers = Array.isArray(userRes) ? userRes : userRes.items || userRes.data || [];
                        engineerRecords = (allUsers as any[]).filter((u: any) => {
                            const role = typeof u.role === "string" ? u.role : u.role?.name || "";
                            const normalizedRole = role.toLowerCase().replace(/\s/g, "");
                            return normalizedRole === "siteengineer" || normalizedRole === "engineer";
                        });
                    } catch (error: any) {
                        console.warn("Unable to fetch site engineers, skipping engineer roster.", error);
                        toast.error("Site engineer list unavailable for this account.");
                    }

                    if (projId) {
                        const membersRes = await projectService.getProjectMembers(Number(projId));
                        const projectMembers = Array.isArray(membersRes) ? membersRes : membersRes?.items || membersRes?.data || [];
                        const memberIds = new Set(projectMembers.map((m: any) => m.user_id || m.id || m.user?.id));
                        setSiteEngineers(engineerRecords.filter((e: any) => memberIds.has(e.user_id || e.id)));
                    } else {
                        setSiteEngineers(engineerRecords);
                    }
                } else if (activeTab === "assets") {
                    const [eqRes, utilRes] = await Promise.all([
                        equipmentService.listEquipment(projId ? { project_id: Number(projId) } : undefined),
                        equipmentService.getUtilizationReport(projId ? { project_id: Number(projId) } : undefined)
                    ]);
                    setAssetsData({
                        equipment: Array.isArray(eqRes) ? eqRes : eqRes.items || [],
                        utilization: utilRes || []
                    });
                } else if (activeTab === "supply-chain") {
                    const [stockRes, transRes] = await Promise.all([
                        materialService.getInventory(projId ? Number(projId) : undefined),
                        materialService.listTransfers(0, 50)
                    ]);
                    setSupplyChainData({
                        stock: stockRes || [],
                        transfers: Array.isArray(transRes) ? transRes : transRes.items || []
                    });
                }
            } catch (err) {
                toast.error(`Sync failure in ${activeTab} vault.`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, selectedProjectId, workforceSubTab]);

    const tabs = [
        { id: "workforce", label: "Workforce", icon: <Users className="w-4 h-4" /> },
        { id: "assets", label: "Assets (Fleet)", icon: <Truck className="w-4 h-4" /> },
        { id: "supply-chain", label: "Supply Chain", icon: <Package className="w-4 h-4" /> }
    ];

    const openTransfer = (type: 'labour' | 'machinery' | 'material', data: any) => {
        setTransferModal({ isOpen: true, type, data });
    };

    return (
        <>
            <Navbar title="Resource Orchestrator" breadcrumb={["Manager", "Resource Hub"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="w-full mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Operational Oversight</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight text-left uppercase">Resource Hub</h1>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex flex-wrap sm:flex-nowrap gap-1 shadow-sm w-full sm:w-auto">
                                {tabs.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id as any)}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === t.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50"}`}
                                    >
                                        {t.icon}
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value === "all" ? "all" : Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all w-full sm:w-auto"
                            >
                                <option value="all">ALL ACTIVE PROJECTS</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Analytics...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === "workforce" && (
                                <WorkforceView
                                    data={workforceData}
                                    engineers={siteEngineers}
                                    subTab={workforceSubTab}
                                    onSubTabChange={setWorkforceSubTab}
                                    onMobilize={(d) => openTransfer('labour', d)}
                                    labourPage={workforcePage}
                                    onLabourPageChange={setWorkforcePage}
                                    engineerPage={engineerPage}
                                    onEngineerPageChange={setEngineerPage}
                                    pageSize={PAGE_SIZE}
                                />
                            )}
                            {activeTab === "assets" && (
                                <AssetsView
                                    data={assetsData}
                                    onMobilize={(d) => openTransfer('machinery', d)}
                                    viewMode={assetViewMode}
                                    onViewModeChange={setAssetViewMode}
                                    currentPage={assetPage}
                                    onPageChange={setAssetPage}
                                    pageSize={PAGE_SIZE}
                                />
                            )}
                            {activeTab === "supply-chain" && (
                                <SupplyChainView
                                    data={supplyChainData}
                                    onMobilize={(d) => openTransfer('material', d)}
                                    currentPage={supplyChainPage}
                                    onPageChange={setSupplyChainPage}
                                    pageSize={PAGE_SIZE}
                                />
                            )}
                        </div>
                    )}
                </div>

                <ResourceTransferModal
                    isOpen={transferModal.isOpen}
                    onClose={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}
                    resourceType={transferModal.type}
                    resourceData={transferModal.data}
                />
            </PageTransition>
        </>
    );
};

const WorkforceView = ({ data, engineers, subTab, onSubTabChange, onMobilize, labourPage, onLabourPageChange, engineerPage, onEngineerPageChange, pageSize }: { data: { labours: any[], attendance: any[] }, engineers: any[], subTab: "labour" | "engineer", onSubTabChange: (tab: "labour" | "engineer") => void, onMobilize: (d: any) => void, labourPage: number, onLabourPageChange: (p: number) => void, engineerPage: number, onEngineerPageChange: (p: number) => void, pageSize: number }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Personnel" value={data.labours.length.toString()} sub="Registered Workforce" icon={<Users className="w-5 h-5 text-primary" />} />
            <StatCard title="Active Today" value={data.attendance.length.toString()} sub="Site Attendance" icon={<Activity className="w-5 h-5 text-emerald-500" />} />
            <StatCard title="Deployment" value={`${data.labours.length > 0 ? Math.round((data.attendance.length / data.labours.length) * 100) : 0}%`} sub="Utilization Rate" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Compliance" value="98%" sub="Safety Verification" icon={<AlertCircle className="w-5 h-5 text-emerald-500" />} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Deployment Registry</h2>
                        <div className="mt-3 flex flex-wrap rounded-2xl bg-slate-100 p-1">
                            <button
                                onClick={() => onSubTabChange("labour")}
                                className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex-1 text-center whitespace-nowrap ${subTab === "labour" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
                                Labour
                            </button>
                            <button
                                onClick={() => onSubTabChange("engineer")}
                                className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex-1 text-center whitespace-nowrap ${subTab === "engineer" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
                                Site Engineers
                            </button>
                        </div>
                    </div>
                    <button className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all w-full md:w-auto">Audit Logs</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="px-6 py-4 border-b border-slate-100">Personnel Details</th>
                                <th className="px-6 py-4 border-b border-slate-100">Category</th>
                                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(subTab === "labour" ? data.labours : engineers).slice((subTab === "labour" ? labourPage : engineerPage) * pageSize, ((subTab === "labour" ? labourPage : engineerPage) + 1) * pageSize).map((l, i) => {
                                const isEngineer = subTab === "engineer";
                                const isPresent = isEngineer ? false : data.attendance.some(a => String(a.labour_id) === String(l.id) || String(a.user_id) === String(l.id));
                                const attendanceRecord = isEngineer ? null : data.attendance.find(a => String(a.labour_id) === String(l.id) || String(a.user_id) === String(l.id));

                                return (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-primary border border-slate-200">
                                                    {isEngineer ? (l.full_name || l.name || "E").charAt(0) : (l.labour_name || "L").charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{isEngineer ? (l.full_name || l.name || "Unknown Engineer") : l.labour_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {isEngineer ? (l.designation || l.role || "Site Engineer") : l.worker_code}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{isEngineer ? (l.projects || l.designation || "Site Engineer") : (l.skill_type || "General")}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">
                                                    {isEngineer ? `Projects: ${l.projects || "Unassigned"}` : `Daily Rate: ₹${l.daily_wage_rate}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEngineer ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{l.status || "Active"}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{l.email || l.mobile || "No contact"}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-300"}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPresent ? "text-emerald-600" : "text-slate-400"}`}>
                                                            {isPresent ? "Present" : "Off-Site"}
                                                        </span>
                                                        {isPresent && attendanceRecord && (
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">IN: {attendanceRecord.in_time}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => onMobilize(l)}
                                                className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                title="Mobilize Resource"
                                            >
                                                <ArrowRightLeft className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                        Showing {(subTab === "labour" ? labourPage : engineerPage) * pageSize + 1}–{Math.min(((subTab === "labour" ? labourPage : engineerPage) + 1) * pageSize, (subTab === "labour" ? data.labours.length : engineers.length))} of {(subTab === "labour" ? data.labours.length : engineers.length)} Registry
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (subTab === "labour") onLabourPageChange(Math.max(0, labourPage - 1));
                                else onEngineerPageChange(Math.max(0, engineerPage - 1));
                            }}
                            disabled={(subTab === "labour" ? labourPage === 0 : engineerPage === 0)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-[10px] font-black text-slate-700">
                            {(subTab === "labour" ? labourPage : engineerPage) + 1}
                        </div>
                        <button
                            onClick={() => {
                                if (subTab === "labour") onLabourPageChange(Math.min(Math.ceil(data.labours.length / pageSize) - 1, labourPage + 1));
                                else onEngineerPageChange(Math.min(Math.ceil(engineers.length / pageSize) - 1, engineerPage + 1));
                            }}
                            disabled={(subTab === "labour" ? labourPage >= Math.ceil(data.labours.length / pageSize) - 1 : engineerPage >= Math.ceil(engineers.length / pageSize) - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Workforce Mix</h3>
                    <div className="space-y-6">
                        {["Masonry", "Electrical", "Earthworks", "Plumbing"].map((skill, i) => (
                            <div key={skill}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{skill}</span>
                                    <span className="text-xs font-black text-blue-400">{25 + (i * 2)}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${25 + (i * 2)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            </div>
        </div>
    </div>
);

const AssetsView = ({ data, onMobilize, viewMode, onViewModeChange, currentPage, onPageChange, pageSize }: { data: { equipment: any[], utilization: any[] }, onMobilize: (d: any) => void, viewMode: "grid" | "list", onViewModeChange: (m: "grid" | "list") => void, currentPage: number, onPageChange: (p: number) => void, pageSize: number }) => (
    <div className="space-y-6">
        <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <StatCard title="Fleet Size" value={data.equipment.length.toString()} sub="Total Heavy Assets" icon={<Truck className="w-5 h-5 text-primary" />} />
                <StatCard title="Active" value={data.equipment.filter((e: any) => e.condition === "GOOD").length.toString()} sub="Operational Units" icon={<Activity className="w-5 h-5 text-emerald-500" />} />
                <StatCard title="Maintenance" value={data.equipment.filter((e: any) => e.condition === "REPAIR").length.toString()} sub="Service Pipeline" icon={<Wrench className="w-5 h-5 text-rose-500" />} />
                <StatCard title="Uptime" value="94%" sub="Portfolio Performance" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} />
            </div>
        </div>

        <div className="flex justify-end mb-4">
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-sm">
                <button
                    onClick={() => onViewModeChange("grid")}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:bg-slate-50"}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onViewModeChange("list")}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:bg-slate-50"}`}
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
        </div>

        {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.equipment.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((e, idx) => (
                    <div key={idx} className="group p-6 bg-white rounded-[2.5rem] border border-slate-100 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform"><Truck className="w-6 h-6 text-primary" /></div>
                            <button onClick={() => onMobilize(e)} className="p-2 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all"><ArrowRightLeft className="w-4 h-4" /></button>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 uppercase mb-1 truncate text-left">{e.equipment_name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 text-left">{e.equipment_code}</p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2"><span className="text-[9px] font-black text-slate-400 uppercase">Uptime</span><span className="text-[10px] font-black text-slate-800">88%</span></div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: '88%' }} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <div className="flex flex-col"><span className="text-[8px] font-bold text-slate-400 uppercase text-left">Hours</span><span className="text-xs font-black text-slate-700">{e.working_hours}H</span></div>
                                <div className="flex flex-col text-right"><span className="text-[8px] font-bold text-slate-400 uppercase">Site</span><span className="text-xs font-black text-primary truncate">{e.project_name || "Central"}</span></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden text-left">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="px-6 py-4 border-b border-slate-100">Asset Details</th>
                                <th className="px-6 py-4 border-b border-slate-100">Code</th>
                                <th className="px-6 py-4 border-b border-slate-100">Project</th>
                                <th className="px-6 py-4 border-b border-slate-100">Condition</th>
                                <th className="px-6 py-4 border-b border-slate-100">Hours</th>
                                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.equipment.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((e, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group text-left">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-primary">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{e.equipment_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{e.equipment_code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-primary uppercase tracking-tight">{e.project_name || "Central"}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${e.condition === 'GOOD' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{e.condition}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-black text-slate-700 tabular-nums">
                                        {e.working_hours}H
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onMobilize(e)} className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><ArrowRightLeft className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                        Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, data.equipment.length)} of {data.equipment.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-[10px] font-black text-slate-700">
                            {currentPage + 1}
                        </div>
                        <button
                            onClick={() => onPageChange(Math.min(Math.ceil(data.equipment.length / pageSize) - 1, currentPage + 1))}
                            disabled={currentPage >= Math.ceil(data.equipment.length / pageSize) - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);

const SupplyChainView = ({ data, onMobilize, currentPage, onPageChange, pageSize }: { data: { stock: any[], transfers: any[] }, onMobilize: (d: any) => void, currentPage: number, onPageChange: (p: number) => void, pageSize: number }) => (
    <div className="space-y-6 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Inventory" value={data.stock.length.toString()} sub="Unique SKUs" icon={<Package className="w-5 h-5 text-primary" />} />
            <StatCard title="Stock Value" value="₹28.4L" sub="Current On-Site" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
            <StatCard title="Low Level" value="14" sub="Below Safety Norms" icon={<AlertCircle className="w-5 h-5 text-rose-500" />} />
            <StatCard title="Transfers" value={data.transfers.length.toString()} sub="Active Logistics" icon={<ArrowRightLeft className="w-5 h-5 text-blue-500" />} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden text-left">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 text-left">Inventory Health</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="px-4 py-3 border-b border-slate-100">Material</th>
                                <th className="px-4 py-3 border-b border-slate-100">Stock Status</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.stock.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-4"><p className="text-sm font-bold text-slate-800">{s.material_name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{s.unit}</p></td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>{s.remaining_stock} Qty</span><span>{Math.round((s.remaining_stock / 2000) * 100)}%</span></div>
                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${s.remaining_stock < 500 ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full`} style={{ width: `${Math.min(100, (s.remaining_stock / 2000) * 100)}%` }} /></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button onClick={() => onMobilize(s)} className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><MoveRight className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between mt-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                        Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, data.stock.length)} of {data.stock.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-[10px] font-black text-slate-700">
                            {currentPage + 1}
                        </div>
                        <button
                            onClick={() => onPageChange(Math.min(Math.ceil(data.stock.length / pageSize) - 1, currentPage + 1))}
                            disabled={currentPage >= Math.ceil(data.stock.length / pageSize) - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden text-left">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 text-left text-left">Mobilization Pipeline</h2>
                <div className="space-y-4 text-left">
                    {data.transfers.length > 0 ? data.transfers.slice(0, 6).map((t, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group text-left">
                            <div className="flex items-center justify-between mb-3 text-left">
                                <div className="flex items-center gap-2 text-left"><div className="p-2 bg-white rounded-lg shadow-sm"><ArrowRightLeft className="w-3 h-3 text-blue-500" /></div><span className="text-xs font-black text-slate-800 uppercase truncate max-w-[150px] text-left">{t.material_name || "Resource"}</span></div>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{t.status || "TRANSIT"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 text-left"><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter text-left">Origin</p><p className="text-[10px] font-bold text-slate-700 truncate text-left">{t.from_project_name}</p></div>
                                <MoveRight className="w-3 h-3 text-slate-300" />
                                <div className="flex-1 text-right text-left text-left"><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter text-right text-left">Destination</p><p className="text-[10px] font-bold text-primary truncate text-right text-left">{t.to_project_name}</p></div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center text-slate-300"><ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-10" /><p className="text-xs font-bold uppercase tracking-widest">No Active Logistics</p></div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default ResourceOrchestratorPage;
