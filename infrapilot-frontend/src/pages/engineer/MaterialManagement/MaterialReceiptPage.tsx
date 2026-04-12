import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const receiptHistory = [
    {
        id: "RCP-7701",
        date: "2026-04-12",
        material_name: "OPC 43 Grade Cement",
        unit: "Bag",
        opening_stock: 450,
        received_quantity: 500,
        used_quantity: 0,
        closing_stock: 950,
        supplier_name: "UltraTech Cement Ltd",
        bill_number: "UT/2026/0991",
        location: "Main Store",
        status: "Verified",
        remarks: "Quality check passed. Stacked in bay 4.",
    },
    {
        id: "RCP-7700",
        date: "2026-04-11",
        material_name: "TMT Steel 12mm",
        unit: "Ton",
        opening_stock: 12.5,
        received_quantity: 8.0,
        used_quantity: 0,
        closing_stock: 20.5,
        supplier_name: "Tata Tiscon",
        bill_number: "TT/ST-4421",
        location: "Site Yard",
        status: "Verified",
        remarks: "Standard length verification done.",
    },
];

const MaterialReceiptPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    const [formData, setFormData] = useState({
        receipt_date: new Date().toISOString().split("T")[0],
        material_name: "",
        unit: "Bag",
        opening_stock: "",
        received_quantity: "",
        used_quantity: "0",
        closing_stock: "",
        supplier_name: "",
        bill_number: "",
        location: "Store",
        remarks: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.material_name) newErrors.material_name = "Required";
        if (!formData.received_quantity) newErrors.received_quantity = "Required";
        if (!formData.supplier_name) newErrors.supplier_name = "Required";
        if (!formData.bill_number) newErrors.bill_number = "Required";

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

            // Auto-calculate closing stock if opening and received are present
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

        toast.loading("Registering Material Inflow...", { id: "rcp-sub" });
        setTimeout(() => {
            toast.success("Receipt Protocol Registered!", { id: "rcp-sub" });
            setIsFormModalOpen(false);
            setFormData({
                receipt_date: new Date().toISOString().split("T")[0],
                material_name: "",
                unit: "Bag",
                opening_stock: "",
                received_quantity: "",
                used_quantity: "0",
                closing_stock: "",
                supplier_name: "",
                bill_number: "",
                location: "Store",
                remarks: "",
            });
        }, 1500);
    };

    return (
        <>
            <Navbar
                title="Material Receipt Ledger"
                breadcrumb={["InfraPilot", "Procurement", "Inbound Registry"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">
                            Inbound Material Intelligence
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Comprehensive tracking of project supplies, procurement validation, and inventory synchronization.
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            + LOG RECEIPT
                        </button>
                    </div>
                </div>

                <section className="mb-10">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Inventory Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Receipts Today"
                            value="08"
                            sub="+2 since 9:00 AM"
                            accent="text-primary"
                        />
                        <StatCard
                            title="Verified Inbound"
                            value="1,450"
                            sub="Units processed"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Pending Audit"
                            value="03"
                            sub="Quality Review"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Supply Alerts"
                            value="00"
                            sub="Zero Rejections"
                            accent="text-rose-500"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Inbound Registry Protocol
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        {receiptHistory.map((receipt) => (
                            <div
                                key={receipt.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedReceipt(receipt)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter">
                                            {receipt.id}
                                        </span>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                            {receipt.status}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">
                                            {receipt.date}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Material Identification
                                            </span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">
                                                {receipt.material_name}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Quantity / Unit
                                            </span>
                                            <p className="text-[11px] font-black text-emerald-600">
                                                {receipt.received_quantity} {receipt.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Supplier / Entity
                                            </span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">
                                                {receipt.supplier_name.substring(0, 20)}...
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Bill No. / Location
                                            </span>
                                            <p className="text-[10px] font-bold text-primary italic">
                                                {receipt.bill_number} | {receipt.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">
                                                Stock Delta (Opening → Closing)
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-500">
                                                {receipt.opening_stock} → {receipt.closing_stock} {receipt.unit}
                                            </p>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-400 italic max-w-md truncate">
                                            "{receipt.remarks}"
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
                title="Material Receipt Protocol"
                maxWidth="max-w-5xl"
            >
                <div className="admin-pulse-modal-body bg-white p-10">
                    <form id="receipt-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Component 1: Core Identification */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Core Material Identification
                                </h3>
                            </div>
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-6 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Material Name
                                    </label>
                                    <input
                                        type="text"
                                        name="material_name"
                                        value={formData.material_name}
                                        onChange={handleChange}
                                        placeholder="e.g. OPC 43 GRADE CEMENT"
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
                                        Quantity Unit
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black cursor-pointer appearance-none bg-slate-50 border-transparent hover:bg-slate-100 transition-colors"
                                    >
                                        <option value="Bag">Bag</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Ton">Ton</option>
                                        <option value="Cum">Cum</option>
                                        <option value="Nos">Nos</option>
                                    </select>
                                </div>
                                <div className="col-span-6 lg:col-span-3 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Registry Date
                                    </label>
                                    <input
                                        type="date"
                                        name="receipt_date"
                                        value={formData.receipt_date}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black tracking-tight"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Component 2: Stock Dynamics */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Stock Matrix Dynamics
                                </h3>
                            </div>
                            <div className="grid grid-cols-4 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase">
                                        Opening Stock
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
                                <div className="admin-pulse-form-group relative">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-emerald-600">
                                        Received Qty
                                    </label>
                                    <input
                                        type="number"
                                        name="received_quantity"
                                        value={formData.received_quantity}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`admin-pulse-form-input font-black text-center text-xl border-emerald-100 focus:border-emerald-300 focus:ring-emerald-50 ${errors.received_quantity ? "border-rose-300" : ""
                                            }`}
                                    />
                                    {errors.received_quantity && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-2 px-1 text-center">
                                            {errors.received_quantity}
                                        </p>
                                    )}
                                </div>
                                <div className="admin-pulse-form-group opacity-60">
                                    <label className="admin-pulse-form-label uppercase">
                                        Used (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        name="used_quantity"
                                        value={formData.used_quantity}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="admin-pulse-form-input font-black text-center text-xl bg-slate-50/50"
                                    />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase text-blue-600">
                                        Closing Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="closing_stock"
                                        value={formData.closing_stock}
                                        readOnly
                                        className="admin-pulse-form-input font-black text-center text-xl bg-blue-50/30 border-blue-100 text-blue-700 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Component 3: Logistics Intelligence */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Logistics Intelligence
                                </h3>
                            </div>
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-5 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Supplier / Vendor Name
                                    </label>
                                    <input
                                        type="text"
                                        name="supplier_name"
                                        value={formData.supplier_name}
                                        onChange={handleChange}
                                        placeholder="e.g. ULTRATECH CEMENT LTD"
                                        className={`admin-pulse-form-input font-black uppercase ${errors.supplier_name ? "border-rose-300" : ""
                                            }`}
                                    />
                                </div>
                                <div className="col-span-6 lg:col-span-4 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase">
                                        Bill / Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        name="bill_number"
                                        value={formData.bill_number}
                                        onChange={handleChange}
                                        placeholder="e.g. INV-2026-X1"
                                        className={`admin-pulse-form-input font-black uppercase ${errors.bill_number ? "border-rose-300" : ""
                                            }`}
                                    />
                                </div>
                                <div className="col-span-6 lg:col-span-3 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase">
                                        Sub-Location (Store/Site)
                                    </label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black"
                                    >
                                        <option value="Store">Main Store</option>
                                        <option value="Site">Site Yard</option>
                                        <option value="Stockyard">Material Stockyard</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Component 4: Final Certification */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none">
                                    Field Remarks & Certification
                                </h3>
                            </div>
                            <div className="admin-pulse-form-group">
                                <label className="admin-pulse-form-label uppercase">
                                    Engineer Validation Remarks
                                </label>
                                <textarea
                                    name="remarks"
                                    rows={2}
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    placeholder="e.g. MATERIALS VERIFIED FOR QUALITY AND QUANTITY AS PER DC."
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
                        Discard Registry
                    </button>
                    <button
                        type="submit"
                        form="receipt-form"
                        className="admin-pulse-button-primary px-12 py-5 font-black tracking-widest !rounded-[24px] uppercase"
                    >
                        Register Receipt Protocol
                    </button>
                </div>
            </Modal>

            {/* Detail View Modal */}
            <Modal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                title="Material Inbound Intelligence"
                maxWidth="max-w-4xl"
            >
                {selectedReceipt && (
                    <div className="p-10 bg-white">
                        <div className="admin-pulse-details-banner !bg-blue-600">
                            <div className="admin-pulse-details-icon-container">📦</div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none text-white">
                                        {selectedReceipt.id}
                                    </h2>
                                    <span className="admin-pulse-status-badge bg-white/20 text-white border border-white/30 backdrop-blur-md">
                                        {selectedReceipt.status}
                                    </span>
                                </div>
                                <p className="text-blue-100/80 text-sm font-bold tracking-tight mb-1">
                                    Bill No: {selectedReceipt.bill_number}
                                </p>
                                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Registry Date: {selectedReceipt.date}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title">
                                            Material Specification
                                        </h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase">
                                                Material Name
                                            </span>
                                            <p className="admin-pulse-details-value uppercase">
                                                {selectedReceipt.material_name}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">
                                                    Supplier
                                                </span>
                                                <p className="admin-pulse-details-value uppercase">
                                                    {selectedReceipt.supplier_name}
                                                </p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">
                                                    Inbound Location
                                                </span>
                                                <p className="admin-pulse-details-value uppercase">
                                                    {selectedReceipt.location}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                        <h3 className="admin-pulse-details-section-title">
                                            Inventory Logistics
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase">
                                                Opening Stock
                                            </span>
                                            <p className="admin-pulse-details-value">
                                                {selectedReceipt.opening_stock} {selectedReceipt.unit}
                                            </p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase text-emerald-600">
                                                Received Qty
                                            </span>
                                            <p className="admin-pulse-details-value text-emerald-600">
                                                + {selectedReceipt.received_quantity} {selectedReceipt.unit}
                                            </p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase text-rose-500">
                                                Used Qty
                                            </span>
                                            <p className="admin-pulse-details-value text-rose-500">
                                                - {selectedReceipt.used_quantity} {selectedReceipt.unit}
                                            </p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label uppercase text-blue-600">
                                                Closing Stock
                                            </span>
                                            <p className="admin-pulse-details-value text-blue-600">
                                                {selectedReceipt.closing_stock} {selectedReceipt.unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Audit Remarks
                                        </span>
                                        <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                                            "{selectedReceipt.remarks}"
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100">
                                    <span className="admin-pulse-details-label text-blue-600 mb-2 uppercase">
                                        Procurement Integrity
                                    </span>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-500">Invoice Match</span>
                                            <span className="text-emerald-600 font-black">100% SECURED</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-500">Quality Clearance</span>
                                            <span className="text-emerald-600 font-black">CERTIFIED</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                                ARCHIVAL REF: MAT-{selectedReceipt.id}-2026
                            </span>
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[11px] font-black tracking-widest hover:bg-black transition-all uppercase"
                            >
                                Close Protocol Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialReceiptPage;
