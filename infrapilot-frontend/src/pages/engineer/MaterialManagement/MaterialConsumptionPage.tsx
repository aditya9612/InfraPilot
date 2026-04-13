import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialConsumption {
    id: number;
    materialName: string;
    unit: "Bag" | "Kg" | "Ton";
    usedQuantity: number;
    location: "Store" | "Site";
    activityLink: string; // Linking to which activity this material was used for
    date: string;
    loggedBy: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockConsumption: MaterialConsumption[] = [
    {
        id: 1,
        materialName: "UltraTech Cement",
        unit: "Bag",
        usedQuantity: 120,
        location: "Site",
        activityLink: "RCC Footing - Block A",
        date: "2026-04-13",
        loggedBy: "John Doe",
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        usedQuantity: 1.5,
        location: "Site",
        activityLink: "Column Reinforcement",
        date: "2026-04-12",
        loggedBy: "Jane Smith",
    },
];

// ─── Profile Field Helper ──────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
    mono = false,
}: {
    label: string;
    value: string;
    accent?: string;
    mono?: boolean;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${mono ? "font-mono tracking-tight" : ""} ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const MaterialConsumptionPage = () => {
    const [consumptionList, setConsumptionList] = useState<MaterialConsumption[]>(mockConsumption);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);

    const [formData, setFormData] = useState({
        materialName: "",
        unit: "Bag" as "Bag" | "Kg" | "Ton",
        usedQuantity: "",
        location: "Site" as "Store" | "Site",
        activityLink: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.materialName) newErrors.materialName = "Required";
        if (!formData.usedQuantity) newErrors.usedQuantity = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newEntry: MaterialConsumption = {
            id: Date.now(),
            materialName: formData.materialName,
            unit: formData.unit,
            usedQuantity: parseFloat(formData.usedQuantity),
            location: formData.location,
            activityLink: formData.activityLink || "General Use",
            date: new Date().toISOString().split("T")[0],
            loggedBy: "Site Engineer",
        };

        setConsumptionList((prev) => [newEntry, ...prev]);
        toast.success("Consumption Recorded!");
        setIsModalOpen(false);
        setFormData({
            materialName: "",
            unit: "Bag",
            usedQuantity: "",
            location: "Site",
            activityLink: "",
        });
    };

    return (
        <>
            <Navbar
                title="Material Consumption"
                breadcrumb={["InfraPilot", "Engineer", "Material", "Consumption"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Inventory Outflow
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Material Consumption
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Track real-time material usage against specific site activities.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-rose-200 transition-all active:scale-95"
                    >
                        <span className="text-xl leading-none">+</span>
                        Log Consumption
                    </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-6">
                    {consumptionList.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                        >
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 font-black text-xl border border-rose-100">
                                            {item.materialName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                    {item.materialName}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100`}>
                                                    {item.unit}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                Activity: {item.activityLink} | Loc: {item.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Used Qty</p>
                                        <p className="text-2xl font-black text-rose-600">{item.usedQuantity} {item.unit}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12 py-8 border-y border-slate-50">
                                    <ProfileField label="ACTIVITY" value={item.activityLink} />
                                    <ProfileField label="DATE USED" value={item.date} />
                                    <ProfileField label="LOCATION" value={item.location} accent="text-rose-600" />
                                    <ProfileField label="LOGGED BY" value={item.loggedBy} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setSelectedConsumption(item)}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Usage Metrics →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedConsumption}
                onClose={() => setSelectedConsumption(null)}
                title="Consumption Usage Details"
                maxWidth="max-w-4xl"
            >
                {selectedConsumption && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 shadow-2xl shadow-rose-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedConsumption.materialName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                                        {selectedConsumption.materialName}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg">
                                            <span className="text-white text-xs font-black uppercase tracking-widest">Outflow Registered</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Execution Context</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="SITE ACTIVITY" value={selectedConsumption.activityLink} />
                                    <ProfileField label="DATE OF USE" value={selectedConsumption.date} />
                                    <ProfileField label="CONSUMED QTY" value={`${selectedConsumption.usedQuantity} ${selectedConsumption.unit}`} accent="text-rose-600" />
                                    <ProfileField label="UNIT MEASURE" value={selectedConsumption.unit} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedConsumption(null)}
                                className="px-12 py-3 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Close Metrics
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Log Material Consumption"
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8">
                    <form id="consumption-form" onSubmit={handleSubmit} className="space-y-12 italic-none">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Usage Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Material Name *</label>
                                    <input
                                        name="materialName"
                                        value={formData.materialName}
                                        onChange={handleInputChange}
                                        placeholder="Search material..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-600 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Used Quantity *</label>
                                    <input
                                        name="usedQuantity"
                                        type="number"
                                        value={formData.usedQuantity}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-600 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Linked Activity</label>
                                    <input
                                        name="activityLink"
                                        value={formData.activityLink}
                                        onChange={handleInputChange}
                                        placeholder="e.g. RCC Footing Block A"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-600 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Site">On-Site Area</option>
                                        <option value="Store">Main Store</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="consumption-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        Confirm Consumption
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default MaterialConsumptionPage;
