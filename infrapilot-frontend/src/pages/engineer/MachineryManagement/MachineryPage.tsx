import { useState, useMemo, useEffect } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import CreateMachineryModal from "../../../components/forms/CreateMachineryModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import { equipmentService } from "../../../services/equipmentService";
import type { Equipment } from "../../../services/equipmentService";
import { projectService } from "../../../services/projectService";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Briefcase,
  Phone,
  Mail,
  FileText
} from "lucide-react";

const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-600',
    'FAIR': 'bg-teal-600',
    'POOR': 'bg-orange-500',
    'REPAIR': 'bg-rose-600',
    'SERVICE': 'bg-amber-600',
    'DAMAGED': 'bg-rose-700',
    'MAINTENANCE': 'bg-blue-600',
};

const MachineryPage = () => {
    const [machineryList, setMachineryList] = useState<Equipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [conditionFilter, setConditionFilter] = useState("All");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Operational" | "Repair">("All");

    const [projectId, setProjectId] = useState<number>(0);

    useEffect(() => {
        const initializeProject = async () => {
            try {
                // Prioritize localStorage for Site Engineers
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const pId = user?.project_id || user?.user?.project_id;
                    if (pId) {
                        setProjectId(Number(pId));
                        return;
                    }
                }

                // Fallback to discovery
                const res = await projectService.getProjects();
                const projects = Array.isArray(res) ? res : (res.items || []);
                if (projects.length > 0) {
                    const pId = projects[0].project_id || projects[0].id;
                    setProjectId(Number(pId));
                } else {
                    setProjectId(36);
                }
            } catch (err) {
                console.error("Machinery Discovery Failed:", err);
                setProjectId(36);
            }
        };
        initializeProject();
    }, []);

    useEffect(() => {
        if (projectId > 0) {
            fetchEquipment();
        }
    }, [projectId]);

    const fetchEquipment = async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            console.log(`Fetching Equipment List for Project: ${projectId}`);
            const data = await equipmentService.getEquipment(projectId);
            console.log("Machinery API Raw Response:", data);
            
            const items = data.items || [];
            console.log(`Successfully synced ${items.length} machinery items (200 OK)`);
            setMachineryList(items);
        } catch (err) {
            console.error("Fetch Equipment Failed:", err);
            toast.error("Failed to sync machinery vault");
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = async (id: number) => {
        try {
            const data = await equipmentService.getEquipmentById(id);
            setViewingEquipment(data);
        } catch (error) {
            console.error("Failed to fetch equipment details:", error);
            // Fallback to local item if API fails
            const localItem = machineryList.find(item => item.id === id);
            if (localItem) {
                setViewingEquipment(localItem);
            } else {
                toast.error("Failed to load asset details");
            }
        }
    };

    const handleCreateOrUpdate = async (data: any) => {
        try {
            if (editingEquipment) {
                await equipmentService.updateEquipment(editingEquipment.id, { ...data, project_id: projectId });
                toast.success("Machinery log updated");
            } else {
                await equipmentService.createEquipment({ ...data, project_id: projectId });
                toast.success("Equipment registered successfully");
            }
            fetchEquipment();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to save record");
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await equipmentService.deleteEquipment(itemToDelete);
            toast.success("Record deleted");
            fetchEquipment();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete record");
        }
    };

    const filteredList = useMemo(() => {
        return machineryList.filter(item => {
            const matchesSearch = item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.operator_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCondition = conditionFilter === "All" || item.condition === conditionFilter;
            
            let matchesStat = true;
            if (activeStatFilter === "Operational") matchesStat = item.condition === "GOOD";
            else if (activeStatFilter === "Repair") matchesStat = item.condition === "REPAIR" || item.condition === "DAMAGED";
            
            return matchesSearch && matchesCondition && matchesStat;
        });
    }, [machineryList, searchTerm, conditionFilter, activeStatFilter]);

    // Summary stats
    const totalAssets = machineryList.length;
    const operationalCount = machineryList.filter(m => m.condition === "GOOD").length;
    const repairCount = machineryList.filter(m => m.condition === "REPAIR" || m.condition === "DAMAGED").length;
    const totalFuelUsed = machineryList.reduce((acc, m) => acc + Number(m.fuel_used || 0), 0);

    return (
        <>
            <Navbar title="Machinery & Equipment" breadcrumb={["Engineer", "Machinery", "Asset List"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Heavy Machinery Registry</h1>
                        <p className="text-slate-500 text-sm">
                            Monitor utilization, fuel consumption, and health status.
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingEquipment(null); setIsModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Register Equipment
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Active Assets"
                            value={totalAssets.toString()}
                            sub="Registered Units"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Operational")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Operational" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Operational"
                            value={operationalCount.toString()}
                            sub="Optimal Condition"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Repair")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Repair" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Under Repair"
                            value={repairCount.toString()}
                            sub="Needs Attention"
                            accent="text-rose-500" />
                    </div>
                    <StatCard
                        title="Total Fuel"
                        value={`${totalFuelUsed}L`}
                        sub="Consumption Log"
                        accent="text-blue-500" />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, ID, or operator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <select
                            value={conditionFilter}
                            onChange={(e) => setConditionFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        >
                            <option value="All">All Conditions</option>
                            <option value="GOOD">Good / Optimal</option>
                            <option value="FAIR">Fair / Functional</option>
                            <option value="POOR">Poor Condition</option>
                            <option value="REPAIR">Needs Repair</option>
                            <option value="SERVICE">Under Service</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="MAINTENANCE">Scheduled Maint.</option>
                        </select>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                         {isLoading ? (
                            <div className="p-20 text-center text-slate-400">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Syncing telemetry...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Asset Details</th>
                                        <th className="px-6 py-4">Operator</th>
                                        <th className="px-6 py-4">Utilization</th>
                                        <th className="px-6 py-4">Maintenance</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredList.length > 0 ? (
                                        filteredList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{item.equipment_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.equipment_code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-600">{item.operator_name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{item.working_hours} h</span>
                                                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{item.fuel_used} L Fuel</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-600">{item.maintenance_date || 'N/A'}</span>
                                                </td>
                                                 <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                                        item.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600' : 
                                                        (item.condition === 'REPAIR' || item.condition === 'DAMAGED') ? 'bg-rose-50 text-rose-600 animate-pulse' : 
                                                        item.condition === 'SERVICE' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-slate-50 text-slate-600'
                                                    }`}>
                                                        {item.condition || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                                        <button 
                                                            onClick={() => handleView(item.id)}
                                                            className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 ${conditionColors[item.condition as keyof typeof conditionColors] || 'bg-primary'} ${item.condition ? `shadow-${conditionColors[item.condition as keyof typeof conditionColors]?.split('-')[1]}/20` : 'shadow-primary/20'}`}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setEditingEquipment(item); setIsModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setItemToDelete(item.id); setIsDeleteModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                No equipment logs found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            <CreateMachineryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrUpdate}
                initialData={editingEquipment}
            />

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Record"
                message="Are you sure you want to delete this equipment entry? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />

            <Modal
                isOpen={!!viewingEquipment}
                onClose={() => setViewingEquipment(null)}
                title="Asset Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {viewingEquipment && (
                    <div className="p-6 font-inter">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${conditionColors[viewingEquipment.condition as keyof typeof conditionColors] || 'bg-primary'} rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-bold font-inter">{viewingEquipment.equipment_name.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{viewingEquipment.equipment_name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">{viewingEquipment.equipment_code}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter">asset.ref-{viewingEquipment.id}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">CONDITION: {viewingEquipment.condition}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Asset Utilization</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Operator Identity</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{viewingEquipment.operator_name}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Working Hours</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{viewingEquipment.working_hours} Hrs</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Fuel Consumption</p>
                                        <p className="text-sm font-bold text-blue-600 font-inter">{viewingEquipment.fuel_used} Liters</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Asset Health</p>
                                        <p className={`text-sm font-bold font-inter ${viewingEquipment.condition === 'GOOD' ? 'text-emerald-500' : 'text-rose-500'}`}>{viewingEquipment.condition}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Fiscal Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Rental Value (₹)</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">₹{viewingEquipment.rental_cost.toLocaleString()}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit ID</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">AST-{viewingEquipment.id}X99</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Maintenance Status</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Maintenance Date</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{viewingEquipment.maintenance_date || 'N/A'}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Integrity</p>
                                        <p className={`text-sm font-bold font-inter ${['GOOD', 'FAIR', 'SERVICE'].includes(viewingEquipment.condition) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {['GOOD', 'FAIR'].includes(viewingEquipment.condition) ? 'Fully Operational' : 
                                             viewingEquipment.condition === 'SERVICE' ? 'Maintenance Active' : 'System Critical'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setViewingEquipment(null)}
                            className={`w-full py-5 ${conditionColors[viewingEquipment.condition as keyof typeof conditionColors] || 'bg-primary'} text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 font-inter`}
                        >
                            Dismiss Asset Insight
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MachineryPage;
