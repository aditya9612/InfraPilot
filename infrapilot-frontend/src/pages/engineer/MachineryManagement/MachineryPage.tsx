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
import { 
  Wrench, 
  Settings2, 
  Fuel, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Activity
} from "lucide-react";

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

    const projectId = 1;

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        setIsLoading(true);
        try {
            const data = await equipmentService.getEquipment(projectId);
            const items = Array.isArray(data) ? data : data.items || [];
            setMachineryList(items);
        } catch (err) {
            toast.error("Failed to load machinery registry");
        } finally {
            setIsLoading(false);
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
            return matchesSearch && matchesCondition;
        });
    }, [machineryList, searchTerm, conditionFilter]);

    // Summary stats
    const totalAssets = machineryList.length;
    const operationalCount = machineryList.filter(m => m.condition === "GOOD").length;
    const repairCount = machineryList.filter(m => m.condition === "REPAIR").length;
    const totalFuelUsed = machineryList.reduce((acc, m) => acc + Number(m.fuel_used || 0), 0);

    return (
        <>
            <Navbar title="Machinery & Equipment" breadcrumb={["Engineer", "Machinery", "Asset List"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Heavy Machinery Registry</h1>
                        <p className="text-slate-500 text-sm">Monitor utilization, fuel consumption, and health status.</p>
                    </div>
                    <button
                        onClick={() => { setEditingEquipment(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Register Equipment
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Active Assets"
                        value={totalAssets.toString()}
                        sub="Registered Units"
                        accent="text-slate-800"
                        icon={<Activity className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Operational"
                        value={operationalCount.toString()}
                        sub="Optimal Condition"
                        accent="text-emerald-500"
                        icon={<Settings2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Under Repair"
                        value={repairCount.toString()}
                        sub="Needs Attention"
                        accent="text-rose-500"
                        icon={<Wrench className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Total Fuel"
                        value={`${totalFuelUsed}L`}
                        sub="Consumption Log"
                        accent="text-blue-500"
                        icon={<Fuel className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
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
                            <option value="REPAIR">Needs Repair</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Asset Details</th>
                                    <th className="px-6 py-4">Operator</th>
                                    <th className="px-6 py-4">Utilization</th>
                                    <th className="px-6 py-4">Fuel Log</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                            Loading assets...
                                        </td>
                                    </tr>
                                ) : filteredList.length > 0 ? (
                                    filteredList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{item.equipment_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.equipment_code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-slate-600">{item.operator_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">{item.working_hours} h</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-blue-600">{item.fuel_used} L</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    item.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600' : 
                                                    item.condition === 'REPAIR' ? 'bg-rose-50 text-rose-600 animate-pulse' : 
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {item.condition}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setViewingEquipment(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
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
                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                                            No equipment logs found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                title="Equipment Insights"
                maxWidth="max-w-lg"
            >
                {viewingEquipment && (
                    <div className="p-6 text-inter">
                        <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Asset Identity</p>
                            <h3 className="text-xl font-black text-slate-800 mb-1">{viewingEquipment.equipment_name}</h3>
                            <p className="text-sm font-bold text-primary">{viewingEquipment.equipment_code}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 px-2 mb-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operator</p>
                                <p className="text-sm font-black text-slate-700">{viewingEquipment.operator_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current State</p>
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-lg ${
                                    viewingEquipment.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                    {viewingEquipment.condition}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Working Hours</p>
                                <p className="text-sm font-black text-slate-700">{viewingEquipment.working_hours} h</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Consumed</p>
                                <p className="text-sm font-black text-blue-600">{viewingEquipment.fuel_used} L</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rental Cost</p>
                                <p className="text-sm font-black text-slate-700">₹{viewingEquipment.rental_cost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Maintenance</p>
                                <p className="text-sm font-black text-slate-700">{viewingEquipment.maintenance_date}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setViewingEquipment(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                        >
                            Close Insight
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MachineryPage;
