import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MachineryRecord {
    id: string;
    equipmentName: string;
    equipmentId: string;
    operatorName: string;
    workingHours: string;
    fuelUsed: string;
    condition: "Good" | "Repair";
    rentalCost: string;
    maintenanceDate: string;
    date: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const machineryHistory: MachineryRecord[] = [
    {
        id: "EQ-1001",
        equipmentName: "Excavator (JCB 3DX)",
        equipmentId: "JCB-001",
        operatorName: "Rahman Khan",
        workingHours: "8",
        fuelUsed: "45",
        condition: "Good",
        rentalCost: "15000",
        maintenanceDate: "2026-03-25",
        date: "2026-04-13",
    },
    {
        id: "EQ-1002",
        equipmentName: "Concrete Mixer",
        equipmentId: "MIX-042",
        operatorName: "Sunil Verma",
        workingHours: "6",
        fuelUsed: "12",
        condition: "Good",
        rentalCost: "5000",
        maintenanceDate: "2026-04-05",
        date: "2026-04-12",
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

const conditionColors: Record<string, string> = {
    Good: "bg-emerald-100 text-emerald-600",
    Repair: "bg-rose-100 text-rose-600",
};

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

const MachineryPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<MachineryRecord | null>(null);
    const [machineryList, setMachineryList] = useState<MachineryRecord[]>(machineryHistory);

    const [formData, setFormData] = useState({
        equipmentName: "",
        equipmentId: "",
        operatorName: "",
        workingHours: "",
        fuelUsed: "",
        condition: "Good" as "Good" | "Repair",
        rentalCost: "",
        maintenanceDate: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.equipmentName) newErrors.equipmentName = "Required";
        if (!formData.equipmentId) newErrors.equipmentId = "Required";
        if (!formData.operatorName) newErrors.operatorName = "Required";
        if (!formData.workingHours) newErrors.workingHours = "Required";
        if (!formData.fuelUsed) newErrors.fuelUsed = "Required";
        if (!formData.rentalCost) newErrors.rentalCost = "Required";
        if (!formData.maintenanceDate) newErrors.maintenanceDate = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields correctly.");
            return;
        }

        const newEntry: MachineryRecord = {
            id: `EQ-${1000 + machineryList.length + 1}`,
            ...formData,
            date: new Date().toISOString().split("T")[0],
        };

        setMachineryList((prev) => [newEntry, ...prev]);
        toast.success("Machinery Log Registered Successfully!");
        setIsFormModalOpen(false);
        setFormData({
            equipmentName: "",
            equipmentId: "",
            operatorName: "",
            workingHours: "",
            fuelUsed: "",
            condition: "Good",
            rentalCost: "",
            maintenanceDate: "",
        });
    };

    return (
        <>
            <Navbar
                title="Machinery & Equipment"
                breadcrumb={["InfraPilot", "Engineer", "Machinery"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Asset Management
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Heavy Machinery Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Monitor fuel consumption, utilization hours, and maintenance schedules.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Register Equipment Log
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Assets</p>
                        <p className="text-2xl font-bold text-slate-800">{machineryList.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Operational</p>
                        <p className="text-2xl font-bold text-emerald-500">{machineryList.filter(m => m.condition === "Good").length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Under Repair</p>
                        <p className="text-2xl font-bold text-rose-500">{machineryList.filter(m => m.condition === "Repair").length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Fuel Used</p>
                        <p className="text-2xl font-bold text-blue-600">{machineryList.reduce((acc, m) => acc + parseFloat(m.fuelUsed || "0"), 0)} Ltr</p>
                    </div>
                </div>

                {/* Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {machineryList.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedEquipment(item)}
                        >
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-lg border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all capitalize">
                                            {item.equipmentName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.equipmentName}</h3>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${conditionColors[item.condition]}`}>
                                                    {item.condition}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                ID: {item.equipmentId} | Operator: {item.operatorName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-800 tracking-tight">₹{parseFloat(item.rentalCost).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rental Cost</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                    <ProfileField label="WORKING HOURS" value={`${item.workingHours} Hrs`} accent="text-blue-600" />
                                    <ProfileField label="FUEL USED" value={`${item.fuelUsed} Ltr`} />
                                    <ProfileField label="MAINTENANCE" value={item.maintenanceDate} />
                                    <ProfileField label="ENTITY ID" value={item.id} mono />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Asset Registry • Verification Required
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Profile Metrics →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Contractor Profile Style - PIXEL PERFECT) ────────────────── */}
            <Modal
                isOpen={!!selectedEquipment}
                onClose={() => setSelectedEquipment(null)}
                title="Machinery Asset Profile"
                maxWidth="max-w-[1000px]"
            >
                {selectedEquipment && (
                    <div className="bg-white p-0 italic-none pb-8">
                        {/* ── Header Banner ── */}
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2.25rem] border border-white/30 shadow-inner relative">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedEquipment.equipmentName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">
                                            {selectedEquipment.equipmentName}
                                        </h3>
                                        <span className="px-3 py-1 rounded-[0.75rem] text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-md">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-emerald-400 text-sm">★</span>
                                        <p className="text-sm font-bold text-white tracking-wide">4.8 Performance Score</p>
                                    </div>
                                    <p className="text-sm font-semibold text-blue-100/80">
                                        Operator In-charge: <span className="text-white">{selectedEquipment.operatorName}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Content Sections ── */}
                        <div className="px-12 space-y-12">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold">A</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Equipment Profile</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="EQUIPMENT NAME" value={selectedEquipment.equipmentName} />
                                        <ProfileField label="EQUIPMENT ID" value={selectedEquipment.equipmentId} mono />
                                        <ProfileField label="OPERATOR NAME" value={selectedEquipment.operatorName} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold">F</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Financial & Performance</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="RENTAL COST" value={`₹${parseFloat(selectedEquipment.rentalCost).toLocaleString()}`} />
                                        <ProfileField label="WORKING HOURS" value={`${selectedEquipment.workingHours} Hours`} />
                                        <ProfileField label="FUEL CONSUMED" value={`${selectedEquipment.fuelUsed} Ltr`} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold">M</div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Maintenance Outreach</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
                                <ProfileField label="LAST MAINTENANCE" value={selectedEquipment.maintenanceDate} mono />
                                <ProfileField label="CONDITION" value={selectedEquipment.condition} accent={selectedEquipment.condition === "Good" ? "text-emerald-600" : "text-rose-500"} />
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="px-12 py-8 mt-12 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedEquipment(null)}
                                className="px-12 py-4 bg-[#0b1222] hover:bg-black text-white text-[13px] font-black rounded-2xl shadow-xl transition-all active:scale-95 tracking-wide uppercase"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (DSR Style Sectioned Form) ────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="Register New Equipment Log"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="machinery-form" onSubmit={handleSubmit} className="space-y-12">

                        {/* Section 1: Asset Identity */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Asset Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Equipment Name *</label>
                                    <input
                                        name="equipmentName"
                                        value={formData.equipmentName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Excavator"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.equipmentName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.equipmentName && <p className="text-[10px] text-rose-500 font-bold">{errors.equipmentName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Equipment ID *</label>
                                    <input
                                        name="equipmentId"
                                        value={formData.equipmentId}
                                        onChange={handleInputChange}
                                        placeholder="EQ-XXXX"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.equipmentId ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.equipmentId && <p className="text-[10px] text-rose-500 font-bold">{errors.equipmentId}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Operator Name *</label>
                                    <input
                                        name="operatorName"
                                        value={formData.operatorName}
                                        onChange={handleInputChange}
                                        placeholder="Name of operator"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.operatorName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.operatorName && <p className="text-[10px] text-rose-500 font-bold">{errors.operatorName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Performance Metrics */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Utilization & Efficiency</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Working Hours *</label>
                                    <input
                                        name="workingHours"
                                        type="number"
                                        value={formData.workingHours}
                                        onChange={handleInputChange}
                                        placeholder="Active hours today"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.workingHours ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.workingHours && <p className="text-[10px] text-rose-500 font-bold">{errors.workingHours}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Fuel Used (Ltr) *</label>
                                    <input
                                        name="fuelUsed"
                                        type="number"
                                        value={formData.fuelUsed}
                                        onChange={handleInputChange}
                                        placeholder="Liters consumed"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.fuelUsed ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.fuelUsed && <p className="text-[10px] text-rose-500 font-bold">{errors.fuelUsed}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Condition Status</label>
                                    <select
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Good">Good</option>
                                        <option value="Repair">Under Repair</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financials & Maintenance */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Financials & Schedule</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Rental Cost (₹ Day) *</label>
                                    <input
                                        name="rentalCost"
                                        type="number"
                                        value={formData.rentalCost}
                                        onChange={handleInputChange}
                                        placeholder="Daily rental rate"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.rentalCost ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.rentalCost && <p className="text-[10px] text-rose-500 font-bold">{errors.rentalCost}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Last Maintenance Date *</label>
                                    <input
                                        name="maintenanceDate"
                                        type="date"
                                        value={formData.maintenanceDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.maintenanceDate ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.maintenanceDate && <p className="text-[10px] text-rose-500 font-bold">{errors.maintenanceDate}</p>}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all font-inter"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        form="machinery-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 uppercase tracking-widest"
                    >
                        Register Log
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default MachineryPage;
