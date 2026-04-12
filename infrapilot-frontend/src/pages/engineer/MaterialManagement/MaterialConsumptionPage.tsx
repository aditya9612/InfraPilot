import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const usageHistory = [
    {
        id: "USG-8802",
        date: "2026-04-12",
        material_name: "OPC 43 Grade Cement",
        unit: "Bag",
        opening_stock: 950,
        received_quantity: 0,
        used_quantity: 120,
        closing_stock: 830,
        supplier_name: "Internal Transfer",
        bill_number: "USG-REQ-101",
        location: "Tower A - Level 4",
        status: "Logged",
        remarks: "Casting for floor slab.",
    },
    {
        id: "USG-8801",
        date: "2026-04-11",
        material_name: "TMT Steel 16mm",
        unit: "Ton",
        opening_stock: 20.5,
        received_quantity: 0,
        used_quantity: 4.5,
        closing_stock: 16.0,
        supplier_name: "Internal Transfer",
        bill_number: "USG-REQ-098",
        location: "Foundation Block B",
        status: "Logged",
        remarks: "Reinforcement work for pile caps.",
    },
];

const MaterialConsumptionPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedUsage, setSelectedUsage] = useState<any>(null);

    const [formData, setFormData] = useState({
        usage_date: new Date().toISOString().split("T")[0],
        material_name: "",
        unit: "Bag",
        opening_stock: "",
        received_quantity: "0",
        used_quantity: "",
        closing_stock: "",
        supplier_name: "Internal",
        bill_number: "NA",
        location: "Site",
        remarks: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.material_name) newErrors.material_name = "Required";
        if (!formData.used_quantity) newErrors.used_quantity = "Required";
        if (!formData.location) newErrors.location = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate closing stock
            if (name === "opening_stock" || name === "received_quantity" || name === "used_quantity") {
                const opening = parseFloat(updated.opening_stock) || 0;
                const received = parseFloat(updated.received_quantity) || 0;
                const used = parseFloat(updated.used_quantity) || 0;
                updated.closing_stock = (opening + received - used).toString();
            }

            return updated;
        });

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        toast.loading("Recording Material Consumption...", { id: "usg-sub" });
        setTimeout(() => {
            toast.success("Usage Protocol Registered!", { id: "usg-sub" });
            setIsFormModalOpen(false);
            setFormData({
                usage_date: new Date().toISOString().split("T")[0],
                material_name: "",
                unit: "Bag",
                opening_stock: "",
                received_quantity: "0",
                used_quantity: "",
                closing_stock: "",
                supplier_name: "Internal",
                bill_number: "NA",
                location: "Site",
                remarks: "",
            });
        }, 1500);
    };

    return (
        <>
            <Navbar
                title="Material Consumption Ledger"
                breadcrumb={["InfraPilot", "Operations", "Usage Registry"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">
                            Operational Material Depletion
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Real-time monitoring of resource utilization, field distribution, and stock reduction tracking.
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            + LOG USAGE
                        </button>
                    </div>
                </div>

                <section className="mb-10">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        Utilization Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Today's Consumption"
                            value="12"
                            sub="Units deployed"
                            accent="text-orange-600"
                        />
                        <StatCard
                            title="Critical Reserves"
                            value="04"
                            sub="Reorder required"
                            accent="text-rose-500"
                        />
                        <StatCard
                            title="Distribution Points"
                            value="07"
                            sub="Active site zones"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Waste Delta"
                            value="0.2%"
                            sub="Optimal usage"
                            accent="text-primary"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Usage Registry Protocol
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        {usageHistory.map((usage) => (
                            <div
                                key={usage.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedUsage(usage)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-600 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter">
                                            {usage.id}
                                        </span>
                                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                            {usage.status}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">
                                            {usage.date}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Resource Consumed
                                            </span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">
                                                {usage.material_name}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Usage Quantity
                                            </span>
                                            <p className="text-[11px] font-black text-orange-600">
                                                {usage.used_quantity} {usage.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Deployment Zone
                                            </span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">
                                                {usage.location}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Stock Delta
                                            </span>
                                            <p className="text-[10px] font-bold text-primary italic">
                                                {usage.opening_stock} → {usage.closing_stock} {usage.unit}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Internal Ref / Authority
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-500">
                                                {usage.bill_number} | {usage.supplier_name}
                                            </p>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-400 italic max-w-md truncate">
                                            "{usage.remarks}"
                                        </p>
                                    </div>
                                </div>
                                <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                    →
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            {/* Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title="Material Usage Protocol"
                maxWidth="max-w-5xl"
            >
                <div className="admin-pulse-modal-body bg-white p-10">
                    <form id="usage-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Component 1: Resource Intel */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Core Resource Intel
                                </h3>
                            </div>
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-6 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Resource Name
                                    </label>
                                    <input
                                        type="text"
                                        name="material_name"
                                        value={formData.material_name}
                                        onChange={handleChange}
                                        placeholder="e.g. TMT STEEL 16MM"
                                        className={`admin-pulse-form-input font-black uppercase ${errors.material_name ? "border-rose-300 ring-4 ring-rose-50" : ""
                                            }`}
                                    />
                                    {errors.material_name && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-2 px-1 lowercase">
                                            * {errors.material_name}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-6 lg:col-span-3 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Unit of Measure
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black cursor-pointer appearance-none bg-slate-50 border-transparent"
                                    >
                                        <option value="Bag">Bag</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Ton">Ton</option>
                                        <option value="Cum">Cum</option>
                                    </select>
                                </div>
                                <div className="col-span-6 lg:col-span-3 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Registry Date
                                    </label>
                                    <input
                                        type="date"
                                        name="usage_date"
                                        value={formData.usage_date}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Component 2: Depletion Dynamics */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Depletion & Delta Dynamics
                                </h3>
                            </div>
                            <div className="grid grid-cols-4 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase">
                                        Available Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="opening_stock"
                                        value={formData.opening_stock}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="admin-pulse-form-input font-black text-center text-xl bg-slate-50/50"
                                    />
                                </div>
                                <div className="admin-pulse-form-group opacity-40">
                                    <label className="admin-pulse-form-label uppercase">
                                        Received (Today)
                                    </label>
                                    <input
                                        type="number"
                                        name="received_quantity"
                                        value={formData.received_quantity}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="admin-pulse-form-input font-black text-center text-xl bg-slate-50/50"
                                    />
                                </div>
                                <div className="admin-pulse-form-group relative">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-orange-600">
                                        Deployed Qty
                                    </label>
                                    <input
                                        type="number"
                                        name="used_quantity"
                                        value={formData.used_quantity}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`admin-pulse-form-input font-black text-center text-xl border-orange-100 focus:border-orange-300 focus:ring-orange-50 ${errors.used_quantity ? "border-rose-300" : ""
                                            }`}
                                    />
                                    {errors.used_quantity && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-2 px-1 text-center">
                                            {errors.used_quantity}
                                        </p>
                                    )}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase text-slate-400">
                                        Remaining Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="closing_stock"
                                        value={formData.closing_stock}
                                        readOnly
                                        className="admin-pulse-form-input font-black text-center text-xl bg-slate-100/50 border-slate-200 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Component 3: Field Distribution */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Field Distribution Intelligence
                                </h3>
                            </div>
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-6 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Consumption / Target Site
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. BLOCK B - FOUNDATION PILE 14"
                                        className={`admin-pulse-form-input font-black uppercase ${errors.location ? "border-rose-300" : ""
                                            }`}
                                    />
                                </div>
                                <div className="col-span-12 lg:col-span-3 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase">
                                        Usage Request Ref
                                    </label>
                                    <input
                                        type="text"
                                        name="bill_number"
                                        value={formData.bill_number}
                                        onChange={handleChange}
                                        placeholder="e.g. REQ-772"
                                        className="admin-pulse-form-input font-black uppercase"
                                    />
                                </div>
                                <div className="col-span-12 lg:col-span-3 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase">
                                        Allocated Authority
                                    </label>
                                    <input
                                        type="text"
                                        name="supplier_name"
                                        value={formData.supplier_name}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Component 4: Remarks */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Strategic Utilization Remarks
                                </h3>
                            </div>
                            <div className="admin-pulse-form-group">
                                <label className="admin-pulse-form-label uppercase">
                                    Field Observations & Waste Tracking
                                </label>
                                <textarea
                                    name="remarks"
                                    rows={2}
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    placeholder="PROVIDE OPERATIONAL CONTEXT FOR THIS UTILIZATION..."
                                    className="admin-pulse-form-input font-black resize-none h-24"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="admin-pulse-modal-footer bg-slate-50/50 p-10 border-t border-slate-100 flex items-center justify-end gap-6">
                    <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        className="px-10 py-5 text-[11px] font-black text-slate-400 tracking-widest hover:text-slate-600 transition-all uppercase"
                    >
                        Abort Protocol
                    </button>
                    <button
                        type="submit"
                        form="usage-form"
                        className="bg-orange-600 shadow-orange-200 shadow-xl text-white px-12 py-5 font-black tracking-widest rounded-[24px] hover:bg-orange-700 transition-all uppercase"
                    >
                        Register Usage Protocol
                    </button>
                </div>
            </Modal>

            {/* Detail View Modal */}
            <Modal
                isOpen={!!selectedUsage}
                onClose={() => setSelectedUsage(null)}
                title="Material Utilization Intelligence"
                maxWidth="max-w-4xl"
            >
                {selectedUsage && (
                    <div className="p-10 bg-white">
                        <div className="admin-pulse-details-banner !bg-orange-600">
                            <div className="admin-pulse-details-icon-container">🔥</div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none text-white">
                                        {selectedUsage.id}
                                    </h2>
                                    <span className="admin-pulse-status-badge bg-white/20 text-white border border-white/30 backdrop-blur-md">
                                        {selectedUsage.status}
                                    </span>
                                </div>
                                <p className="text-orange-100/80 text-sm font-bold tracking-tight mb-1">
                                    Location: {selectedUsage.location}
                                </p>
                                <p className="text-orange-200/60 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Consumption Date: {selectedUsage.date}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-orange-600 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title">
                                            Resource Deployment
                                        </h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase">
                                                Resource Description
                                            </span>
                                            <p className="admin-pulse-details-value uppercase">
                                                {selectedUsage.material_name}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">
                                                    Reference Code
                                                </span>
                                                <p className="admin-pulse-details-value uppercase">
                                                    {selectedUsage.bill_number}
                                                </p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">
                                                    Authority
                                                </span>
                                                <p className="admin-pulse-details-value uppercase">
                                                    {selectedUsage.supplier_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-rose-500 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title">
                                            Stock Depletion Ledger
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase">
                                                Stock Pre-Usage
                                            </span>
                                            <p className="admin-pulse-details-value">
                                                {selectedUsage.opening_stock} {selectedUsage.unit}
                                            </p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase text-orange-600">
                                                Units Consumed
                                            </span>
                                            <p className="admin-pulse-details-value text-orange-600">
                                                {selectedUsage.used_quantity} {selectedUsage.unit}
                                            </p>
                                        </div>
                                        <div className="admin-pulse-details-group col-span-2 pt-4 border-t border-slate-50">
                                            <span className="admin-pulse-details-label uppercase text-slate-400">
                                                Remaining Site Inventory
                                            </span>
                                            <p className="text-2xl font-black text-slate-800">
                                                {selectedUsage.closing_stock} {selectedUsage.unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                                        Operational Remarks
                                    </span>
                                    <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                                        "{selectedUsage.remarks}"
                                    </p>
                                </div>

                                <div className="p-8 bg-orange-50/50 rounded-[32px] border border-orange-100">
                                    <span className="admin-pulse-details-label text-orange-600 mb-2 uppercase">
                                        Utilization Efficiency
                                    </span>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-500">Wastage Factor</span>
                                            <span className="text-emerald-600 font-black tracking-tight">0.12% (LOW)</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-500">Stock Integrity</span>
                                            <span className="text-emerald-600 font-black tracking-tight">VERIFIED</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                                USAGE ARCHIVAL ID: USG-{selectedUsage.id}-OPS
                            </span>
                            <button
                                onClick={() => setSelectedUsage(null)}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[11px] font-black tracking-widest hover:bg-black transition-all uppercase"
                            >
                                Close Usage Detail
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialConsumptionPage;
