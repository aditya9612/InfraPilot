import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

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
        closingStock: 1380, // (1000+500)-120
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [consumptionToDelete, setConsumptionToDelete] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState("All");

    // Summary stats
    const totalConsumption = consumptionList.length;
    const highValueCount = consumptionList.filter(c => c.priority === "High Value").length;
    const siteUsage = consumptionList.filter(c => c.location.includes("Site")).length;

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
            const matchesPriority = filterPriority === "All" || item.priority === filterPriority;
            return matchesSearch && matchesPriority;
        });
    }, [consumptionList, searchTerm, filterPriority]);

    return (
        <>
            <Navbar title="Material Consumption" breadcrumb={["InfraPilot", "Engineer", "Inventory", "Consumption"]} />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">Inventory Outflow Registry</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Material Consumption</h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">Track daily material usage against activity benchmarks with automatic stock reduction.</p>
                    </div>

                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter active:scale-95"
                    >
                        <span className="text-lg leading-none font-inter">+</span>
                        Log Usage Entry
                    </button>
                </div>

                {/* ── Summary Stats (DSR Style) ───────────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">Consumption Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Logged</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{totalConsumption}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Usage Entries Filed</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">High Value</p>
                            <p className="text-2xl font-bold text-amber-500 font-inter">{highValueCount}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Critical Outflows</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Site Usage</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">{siteUsage}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Active Areas</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar (DSR Exact Parity) ────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap font-inter">Inflow Filters</span>
                    </div>

                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0 mx-2" />

                    <div className="flex flex-col gap-0.5 min-w-[200px] font-inter">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-inter">Quick Search</label>
                        <div className="relative font-inter">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Material or Activity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5 font-inter">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-inter">Inflow Priority</label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 font-inter h-[38px] items-center">
                            {["All", "Standard", "High Value"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterPriority(tab)}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all font-inter ${filterPriority === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Ledger Grid (DSR Card Style) ───────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter underline-none">
                        {filteredList.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col underline-none">
                                <div className="flex items-center justify-between mb-1 font-inter">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LOG #{item.id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.priority === "High Value" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"}`}>
                                        {item.priority}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2 italic-none uppercase tracking-wider">{item.date} · {item.loggedBy}</p>
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1 tracking-tight">{item.materialName}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed line-clamp-1 mb-4 italic-none uppercase tracking-wider">Activity: {item.activityLink}</p>

                                <div className="grid grid-cols-2 gap-3 mt-auto border-t border-slate-50 pt-4 font-inter">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Qty Used</p>
                                        <p className="text-2xl font-bold text-rose-500 font-inter tabular-nums">-{item.usedQuantity}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-inter">{item.unit}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Closing Stock</p>
                                        <p className="text-2xl font-bold text-slate-800 font-inter tabular-nums tracking-tighter">{item.closingStock}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-inter">Updated Ledger</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setSelectedConsumption(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-inter"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                        <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all font-inter"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                    </div>
                                    <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all font-inter"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageTransition>

            {/* Consumption Modal (Absolute DSR Parity) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formMode === "create" ? "New Material Usage Entry" : "Modify Usage Registry"} maxWidth="max-w-5xl">
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="consumption-form" onSubmit={handleSubmit} className="space-y-10 text-inter">
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Usage Context</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Material Name <span className="text-rose-500">*</span></label>
                                    <input name="materialName" value={formData.materialName} onChange={handleChange} placeholder="e.g. UltraTech Cement" className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.materialName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`} />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Unit (Bag/Kg/Ton)</label>
                                    <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter">
                                        <option value="Bag">Bag</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Ton">Ton</option>
                                    </select>
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Opening Stock</label>
                                    <input name="openingStock" type="number" value={formData.openingStock} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 font-bold font-inter" />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Used Quantity <span className="text-rose-500">*</span></label>
                                    <input name="usedQuantity" type="number" value={formData.usedQuantity} onChange={handleChange} placeholder="0.00" className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.usedQuantity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`} />
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Site Execution</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Linked Site Activity <span className="text-rose-500">*</span></label>
                                    <textarea name="activityLink" rows={3} value={formData.activityLink} onChange={handleChange} placeholder="RCC Slab at Tower B..." className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter resize-none ${errors.activityLink ? "border-rose-300 bg-rose-50" : "border-slate-200"}`} />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Location (Store / Site)</label>
                                    <input name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 font-inter focus:ring-blue-500 transition-all" />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Original Supplier (Ref)</label>
                                    <input name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder="Global Builders" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter" />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Bill Number (Ref)</label>
                                    <input name="billNumber" value={formData.billNumber} onChange={handleChange} placeholder="INV-2026-X" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 font-inter">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-[13px] font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-inter shadow-sm uppercase tracking-wider">Cancel</button>
                    <button type="submit" form="consumption-form" className="px-8 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 font-inter">
                        {formMode === "create" ? "Record Usage Entry" : "Update Registry"}
                    </button>
                </div>
            </Modal>

            {/* Insight Modal (Showing All Required Fields) */}
            <Modal isOpen={!!selectedConsumption} onClose={() => setSelectedConsumption(null)} title="Consumption Analytics Insight" maxWidth="max-w-xl">
                {selectedConsumption && (
                    <div className="bg-white p-6 italic-none text-inter">
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 font-inter">Usage Blueprints</p>
                                <div className="flex items-center justify-between mb-8 font-inter">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedConsumption.materialName}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner font-inter">
                                        <svg className="w-6 h-6 opacity-40 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Consumption</p>
                                        <p className="text-xl font-black">-{selectedConsumption.usedQuantity} <span className="text-xs">{selectedConsumption.unit}</span></p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Closing Stock</p>
                                        <p className="text-xl font-black">{selectedConsumption.closingStock}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 mb-10 px-1 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Comprehensive Stock Impact</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 border-emerald-500 pl-6">
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Opening Stock</p><p className="text-sm font-black text-slate-600 font-inter tabular-nums">{selectedConsumption.openingStock}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Received (+)</p><p className="text-sm font-black text-slate-800 font-inter tabular-nums">+{selectedConsumption.receivedQuantity}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Used (-)</p><p className="text-sm font-black text-rose-600 font-inter tabular-nums">-{selectedConsumption.usedQuantity}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Supplier (Ref)</p><p className="text-sm font-black text-slate-800 font-inter">{selectedConsumption.supplierName}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill Number (Ref)</p><p className="text-sm font-black text-slate-800 font-inter">{selectedConsumption.billNumber}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Log Date</p><p className="text-sm font-black text-slate-800 tabular-nums font-inter">{selectedConsumption.date}</p></div>
                                    <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Location</p><p className="text-sm font-black text-slate-800 font-inter">{selectedConsumption.location}</p></div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedConsumption(null)} className="flex-1 w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter">Close Insight</button>
                    </div>
                )}
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setConsumptionToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Consumption Record"
                message="Are you sure you want to delete this material usage log? This will revert the automatic stock reduction for this entry."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default MaterialConsumptionPage;
