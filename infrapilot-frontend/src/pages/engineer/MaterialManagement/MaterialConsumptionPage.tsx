import { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Layers, 
  Activity, 
  AlertCircle, 
  Clock, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  TrendingUp,
  FileText
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialConsumption {
    id: number;
    materialName: string;
    unit: "Bag" | "Kg" | "Ton" | "No" | "Liters";
    openingStock: number;
    receivedQuantity: number;
    usedQuantity: number;
    closingStock: number;
    supplierName: string;
    billNumber: string;
    location: string;
    activityLink: string;
    date: string;
    loggedBy: string;
    priority: "Standard" | "High Value";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockConsumption: MaterialConsumption[] = [
    {
        id: 1,
        materialName: "UltraTech Cement",
        unit: "Bag",
        openingStock: 1000,
        receivedQuantity: 500,
        usedQuantity: 120,
        closingStock: 1380,
        supplierName: "Global Builders",
        billNumber: "INV-2026-001",
        location: "Site Store",
        activityLink: "RCC Footing - Block A",
        date: "2026-04-13",
        loggedBy: "John Doe",
        priority: "Standard",
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        openingStock: 15,
        receivedQuantity: 5,
        usedQuantity: 1.5,
        closingStock: 18.5,
        supplierName: "Iron Traders",
        billNumber: "INV-2026-042",
        location: "Site Store",
        activityLink: "Column Reinforcement",
        date: "2026-04-12",
        loggedBy: "Jane Smith",
        priority: "High Value",
    },
];

const initialFormData = {
    materialName: "",
    unit: "Bag" as "Bag" | "Kg" | "Ton" | "No" | "Liters",
    usedQuantity: "",
    location: "Site Store",
    activityLink: "",
    priority: "Standard" as "Standard" | "High Value",
    openingStock: "100",
    receivedQuantity: "0",
    supplierName: "",
    billNumber: "",
};

const MaterialConsumptionPage = () => {
    const [consumptionList, setConsumptionList] = useState<MaterialConsumption[]>(mockConsumption);
    const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [consumptionToDelete, setConsumptionToDelete] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState("All Priority");

    const stats = {
        total: consumptionList.length,
        highValue: consumptionList.filter(c => c.priority === "High Value").length,
        todayUsage: "125 Units",
        stockAccuracy: "98.2%"
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.materialName.trim()) errs.materialName = "Material is required";
        if (!formData.usedQuantity || Number(formData.usedQuantity) <= 0) errs.usedQuantity = "Invalid qty";
        if (!formData.activityLink.trim()) errs.activityLink = "Activity is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenEdit = (c: MaterialConsumption) => {
        setFormMode("edit");
        setEditId(c.id);
        setFormData({
            materialName: c.materialName,
            unit: c.unit,
            usedQuantity: c.usedQuantity.toString(),
            location: c.location,
            activityLink: c.activityLink,
            priority: c.priority,
            openingStock: c.openingStock.toString(),
            receivedQuantity: c.receivedQuantity.toString(),
            supplierName: c.supplierName,
            billNumber: c.billNumber,
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill required fields");
            return;
        }

        const opening = Number(formData.openingStock);
        const received = Number(formData.receivedQuantity);
        const used = Number(formData.usedQuantity);
        const closing = (opening + received) - used;

        const entryData: MaterialConsumption = {
            id: formMode === "edit" ? editId! : Date.now(),
            materialName: formData.materialName,
            unit: formData.unit,
            openingStock: opening,
            receivedQuantity: received,
            usedQuantity: used,
            closingStock: closing,
            supplierName: formData.supplierName || "N/A",
            billNumber: formData.billNumber || "N/A",
            location: formData.location,
            activityLink: formData.activityLink,
            date: new Date().toISOString().split("T")[0],
            loggedBy: "Site Engineer",
            priority: formData.priority,
        };

        if (formMode === "edit") {
            setConsumptionList(prev => prev.map(c => c.id === editId ? entryData : c));
            toast.success("Consumption entry modified");
        } else {
            setConsumptionList(prev => [entryData, ...prev]);
            toast.success("Usage logged & Stock reduced automatically");
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (id: number) => {
        setConsumptionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!consumptionToDelete) return;
        setConsumptionList(prev => prev.filter(c => c.id !== consumptionToDelete));
        toast.success("Consumption record deleted");
        setIsDeleteModalOpen(false);
        setConsumptionToDelete(null);
    };

    const filteredList = useMemo(() => {
        return consumptionList.filter(item => {
            const matchesSearch = item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.activityLink.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPriority = filterPriority === "All Priority" || item.priority === filterPriority;
            return matchesSearch && matchesPriority;
        });
    }, [consumptionList, searchTerm, filterPriority]);

    return (
        <>
            <Navbar title="Material Consumption Tracker" breadcrumb={["Engineer", "Material", "Consumption Ledger"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Inventory Outflow & Usage Registry</h1>
                        <p className="text-slate-500 text-sm italic-none">Monitor daily material expenditure across site activities with real-time stock impact.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Material Usage
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Usage Intensity"
                        value={stats.todayUsage}
                        sub="Current Deployment"
                        accent="text-slate-800"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Outflow Logs"
                        value={stats.total.toString()}
                        sub="Total Entries"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Critical Outflow"
                        value={stats.highValue.toString()}
                        sub="High Value Materials"
                        accent="text-rose-500"
                        icon={<AlertCircle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Ledger Integrity"
                        value={stats.stockAccuracy}
                        sub="System Health"
                        accent="text-emerald-500"
                        icon={<Clock className="w-5 h-5" />}
                    />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by material or site activity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select 
                                value={filterPriority} 
                                onChange={(e) => setFilterPriority(e.target.value)} 
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                            >
                                <option>All Priority</option>
                                <option>Standard</option>
                                <option>High Value</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Material & Outflow Log</th>
                                    <th className="px-6 py-4 font-inter">Consumption Delta</th>
                                    <th className="px-6 py-4 font-inter">Linked Site Activity</th>
                                    <th className="px-6 py-4 font-inter">Priority</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredList.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{item.materialName}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{item.date} • Logged by {item.loggedBy}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-black text-rose-500 tabular-nums font-inter">-{item.usedQuantity} {item.unit}</span>
                                                <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">Closing: {item.closingStock} {item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-bold text-slate-600 font-inter truncate italic-none">{item.activityLink}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                    <FileText className="w-3 h-3" />
                                                    <span className="truncate font-inter italic-none">{item.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.priority === 'High Value' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button 
                                                    onClick={() => { setSelectedConsumption(item); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(item.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* Consumption Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formMode === "create" ? "Record Material Usage" : "Edit Outflow Registry"} maxWidth="max-w-5xl">
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="consumption-form" onSubmit={handleSubmit} className="space-y-10 text-inter">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-inter">
                            <div className="space-y-8 font-inter">
                                <div>
                                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 font-inter">
                                        <span className="w-2 h-2 rounded-full bg-primary font-inter"></span>
                                        Usage Context
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 font-inter">
                                        <div className="flex flex-col font-inter">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Material Category</label>
                                            <input name="materialName" value={formData.materialName} onChange={handleChange} placeholder="e.g. UltraTech Cement" className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter ${errors.materialName ? "border-rose-300" : "border-slate-100"}`} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 font-inter">
                                            <div className="flex flex-col font-inter">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Measurement Unit</label>
                                                <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter">
                                                    <option value="Bag">Bag</option>
                                                    <option value="Kg">Kg</option>
                                                    <option value="Ton">Ton</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col font-inter">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Opening Balance</label>
                                                <input name="openingStock" type="number" value={formData.openingStock} onChange={handleChange} className="w-full px-5 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-sm text-slate-500 font-bold font-inter" readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 font-inter">
                                <div>
                                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 font-inter">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 font-inter"></span>
                                        Execution Audit
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 font-inter">
                                        <div className="flex flex-col font-inter">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Consumption Quantity</label>
                                            <input name="usedQuantity" type="number" value={formData.usedQuantity} onChange={handleChange} placeholder="0.00" className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter ${errors.usedQuantity ? "border-rose-300" : "border-slate-100"}`} />
                                        </div>
                                        <div className="flex flex-col font-inter">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Linked Site Activity</label>
                                            <textarea name="activityLink" rows={3} value={formData.activityLink} onChange={handleChange} placeholder="Activity description..." className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter resize-none ${errors.activityLink ? "border-rose-300" : "border-slate-100"}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-4 font-inter">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all font-inter italic-none">Discard Entry</button>
                    <button type="submit" form="consumption-form" className="px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter italic-none">
                        {formMode === "create" ? "Authorize & Log Usage" : "Update Usage Profile"}
                    </button>
                </div>
            </Modal>

            {/* Insight Modal */}
            <Modal isOpen={!!selectedConsumption} onClose={() => setSelectedConsumption(null)} title="Consumption Intelligence Insight" maxWidth="max-w-2xl">
                {selectedConsumption && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Inventory Consumption Ledger</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">{selectedConsumption.materialName}</h3>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Consumption</p>
                                        <p className="text-lg font-black font-inter italic-none text-rose-400">-{selectedConsumption.usedQuantity} {selectedConsumption.unit}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Ledger Balance</p>
                                        <p className="text-lg font-black font-inter italic-none">{selectedConsumption.closingStock} {selectedConsumption.unit}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Audit Traceability</p>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Executed Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedConsumption.date}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Verified By</p>
                                        <p className="text-sm font-black text-slate-800 font-inter uppercase">{selectedConsumption.loggedBy}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Site Activity Context</p>
                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 font-inter italic-none">
                                    <p className="text-sm font-bold text-slate-800 mb-2 font-inter">{selectedConsumption.activityLink}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">
                                        <Layers className="w-3.5 h-3.5" />
                                        Location: {selectedConsumption.location}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedConsumption(null)}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 font-inter italic-none"
                        >
                            Dismiss Consumption Insight
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Consumption Entry"
                message="Are you sure you want to remove this usage log? This will revert the automatic stock reduction and update the inventory ledger."
                confirmText="Archive Log"
                type="danger"
            />
        </>
    );
};

export default MaterialConsumptionPage;
