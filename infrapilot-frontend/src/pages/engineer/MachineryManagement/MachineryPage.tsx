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
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Briefcase,
  Phone,
  Mail,
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown
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
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "GOOD" | "REPAIR" | "DAMAGED" | "MAINTENANCE">("All");

    // Project ID resolved once from localStorage (Settings page) — never changes during session
    const selectedProjectId = (() => {
        try {
            const userStr = localStorage.getItem("infrapilot_user");
            if (userStr) {
                const user = JSON.parse(userStr);
                const pId = user?.default_project_id || user?.project_id || user?.user?.project_id;
                if (pId) return Number(pId);
            }
        } catch (e) {
            console.error("Failed to resolve project ID from localStorage", e);
        }
        return 92;
    })();

    useEffect(() => {
        fetchEquipment(selectedProjectId);
    }, [selectedProjectId]);

    const fetchEquipment = async (projectIdToFetch: number) => {
        setIsLoading(true);
        try {
            console.log(`Fetching Machinery Registry for Project ID: ${projectIdToFetch}`);
            const data = await equipmentService.getEquipment(projectIdToFetch);
            console.log("Machinery API Response:", data);
            
            const items = data.items || [];
            console.log(`Successfully synced ${items.length} machinery items for project ID ${projectIdToFetch}`);
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
        let targetProjectId = data.project_id ? Number(data.project_id) : selectedProjectId;
        if (!targetProjectId) {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const pId = user?.default_project_id || user?.project_id || user?.user?.project_id;
                    if (pId) targetProjectId = Number(pId);
                }
            } catch (err) {
                console.error("Failed to load user project context:", err);
            }
        }
        if (!targetProjectId) targetProjectId = 92;

        try {
            if (editingEquipment) {
                await equipmentService.updateEquipment(editingEquipment.id, { ...data, project_id: targetProjectId });
                toast.success("Machinery log updated");
            } else {
                await equipmentService.createEquipment({ ...data, project_id: targetProjectId });
                toast.success("Equipment registered successfully");
            }
            fetchEquipment(selectedProjectId);
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
            fetchEquipment(selectedProjectId);
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete record");
        }
    };

    const filteredList = useMemo(() => {
        let result = machineryList.filter(item => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === "" || 
                item.equipment_name.toLowerCase().includes(term) ||
                item.equipment_code.toLowerCase().includes(term) ||
                item.operator_name.toLowerCase().includes(term);
            
            const matchesCondition = conditionFilter === "All" || item.condition === conditionFilter;
            
            const matchesStat = activeStatFilter === "All" || item.condition === activeStatFilter;
            
            return matchesSearch && matchesCondition && matchesStat;
        });

        result.sort((a, b) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });

        return result;
    }, [machineryList, searchTerm, conditionFilter, activeStatFilter, sortOrder]);

    const paginatedList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedProjectId, searchTerm, conditionFilter, activeStatFilter, sortOrder]);

    // Summary stats (always from the full list or filtered?) 
    // User said "calculate karke stat card mai dikhao", usually means total overview.
    const stats = useMemo(() => {
        const total = machineryList.length;
        const good = machineryList.filter(m => m.condition === "GOOD").length;
        const repair = machineryList.filter(m => m.condition === "REPAIR").length;
        const damaged = machineryList.filter(m => m.condition === "DAMAGED").length;
        const maintenance = machineryList.filter(m => m.condition === "MAINTENANCE").length;
        return { total, good, repair, damaged, maintenance };
    }, [machineryList]);


    return (
        <>
            <Navbar title="Machinery & Equipment" breadcrumb={["Engineer", "Machinery", "Asset List"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Heavy Machinery Registry</h1>
                        <p className="text-slate-500 text-sm">
                            Monitor utilization, fuel consumption, and health status.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchEquipment(selectedProjectId)}
                            className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
                            title="Sync Ledger"
                        >
                            <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => { setEditingEquipment(null); setIsModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                        >
                            <Plus className="w-4 h-4" />
                            Register Equipment
                        </button>
                    </div>
                </div>

                {/* â”€â”€ Summary Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Assets"
                            value={stats.total.toString()}
                            sub="Registered Units"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("GOOD")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "GOOD" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Good"
                            value={stats.good.toString()}
                            sub="Optimal Condition"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("REPAIR")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "REPAIR" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Repair"
                            value={stats.repair.toString()}
                            sub="Needs Attention"
                            accent="text-rose-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("DAMAGED")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "DAMAGED" ? "ring-2 ring-red-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Damaged"
                            value={stats.damaged.toString()}
                            sub="Critical Failure"
                            accent="text-red-500" />
                    </div>

                </div>

                {/* â”€â”€ Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or operator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={conditionFilter}
                                onChange={(e) => setConditionFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                            >
                                <option value="All">All Conditions</option>
                                <option value="GOOD">Good</option>
                                <option value="REPAIR">Repair</option>
                                <option value="DAMAGED">Damaged</option>
                            </select>

                            {/* Sort Filter */}
                            <div className="relative flex items-center">
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
                                    {paginatedList.length > 0 ? (
                                        paginatedList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{item.equipment_name}</span>
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
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                            title="View Details"
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
                    
                    {/* â”€â”€ Pagination Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {!isLoading && filteredList.length > 0 && (
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
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} records
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
                                    const totalItems = filteredList.length;
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
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredList.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredList.length / itemsPerPage)) || filteredList.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
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
                        {/* â”€â”€ Profile Style Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
