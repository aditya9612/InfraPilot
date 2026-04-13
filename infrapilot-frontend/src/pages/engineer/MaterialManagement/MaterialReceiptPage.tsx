import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialReceipt {
    id: number;
    materialName: string;
    unit: "Bag" | "Kg" | "Ton";
    receivedQuantity: number;
    supplierName: string;
    billNumber: string;
    location: "Store" | "Site";
    date: string;
    receivedBy: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockReceipts: MaterialReceipt[] = [
    {
        id: 1,
        materialName: "UltraTech Cement",
        unit: "Bag",
        receivedQuantity: 500,
        supplierName: "Aggarwal Traders",
        billNumber: "INV-2024-001",
        location: "Store",
        date: "2026-04-13",
        receivedBy: "John Doe",
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        receivedQuantity: 5,
        supplierName: "Steel Corp India",
        billNumber: "SC-9982",
        location: "Site",
        date: "2026-04-12",
        receivedBy: "Jane Smith",
    },
    {
        id: 3,
        materialName: "River Sand",
        unit: "Ton",
        receivedQuantity: 20,
        supplierName: "Local Suppliers",
        billNumber: "LS-4421",
        location: "Site",
        date: "2026-04-11",
        receivedBy: "Michael Roe",
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

const MaterialReceiptPage = () => {
    const [receiptList, setReceiptList] = useState<MaterialReceipt[]>(mockReceipts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceipt | null>(null);

    const [formData, setFormData] = useState({
        materialName: "",
        unit: "Bag" as "Bag" | "Kg" | "Ton",
        receivedQuantity: "",
        supplierName: "",
        billNumber: "",
        location: "Store" as "Store" | "Site",
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
        if (!formData.materialName) newErrors.materialName = "Required";
        if (!formData.receivedQuantity) newErrors.receivedQuantity = "Required";
        if (!formData.supplierName) newErrors.supplierName = "Required";
        if (!formData.billNumber) newErrors.billNumber = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newEntry: MaterialReceipt = {
            id: Date.now(),
            materialName: formData.materialName,
            unit: formData.unit,
            receivedQuantity: parseFloat(formData.receivedQuantity),
            supplierName: formData.supplierName,
            billNumber: formData.billNumber,
            location: formData.location,
            date: new Date().toISOString().split("T")[0],
            receivedBy: "Site Engineer", // Auth context user name would go here
        };

        setReceiptList((prev) => [newEntry, ...prev]);
        toast.success("Material Receipt Recorded!");
        setIsModalOpen(false);
        setFormData({
            materialName: "",
            unit: "Bag",
            receivedQuantity: "",
            supplierName: "",
            billNumber: "",
            location: "Store",
        });
    };

    return (
        <>
            <Navbar
                title="Material Receipt"
                breadcrumb={["InfraPilot", "Engineer", "Material", "Receipt"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Inventory Inflow
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Material Receipt
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Log new material arrivals, verify bills, and assign storage locations.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                        <span className="text-xl leading-none">+</span>
                        New Receipt Entry
                    </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-6">
                    {receiptList.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                        >
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400 font-black text-xl border border-blue-100">
                                            {item.materialName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                    {item.materialName}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100`}>
                                                    {item.unit}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                Bill No: {item.billNumber} | Loc: {item.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Received Qty</p>
                                        <p className="text-2xl font-black text-slate-800">{item.receivedQuantity} {item.unit}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12 py-8 border-y border-slate-50">
                                    <ProfileField label="SUPPLIER" value={item.supplierName} />
                                    <ProfileField label="DATE RECEIVED" value={item.date} />
                                    <ProfileField label="LOCATION" value={item.location} accent="text-blue-600" />
                                    <ProfileField label="RECEIVED BY" value={item.receivedBy} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Digitally Logged • {item.date}
                                    </span>
                                    <button
                                        onClick={() => setSelectedReceipt(item)}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Metrics →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal (Gradient Banner Style) */}
            <Modal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                title="Material Receipt Details"
                maxWidth="max-w-4xl"
            >
                {selectedReceipt && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedReceipt.materialName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-2xl font-black text-white tracking-tight">
                                            {selectedReceipt.materialName}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg">
                                            <span className="text-amber-400 text-sm">★</span>
                                            <span className="text-xs font-black text-white tracking-wide">QC Verified Arrival</span>
                                        </div>
                                        <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                                            BILL ID: {selectedReceipt.billNumber}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Bill & Supplier Info</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="MATERIAL NAME" value={selectedReceipt.materialName} />
                                    <ProfileField label="SUPPLIER NAME" value={selectedReceipt.supplierName} />
                                    <ProfileField label="BILL NUMBER" value={selectedReceipt.billNumber} mono />
                                    <ProfileField label="DATE OF RECEIPT" value={selectedReceipt.date} />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Quantity & Logistics</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="RECEIVED QUANTITY" value={`${selectedReceipt.receivedQuantity} ${selectedReceipt.unit}`} accent="text-blue-600" />
                                    <ProfileField label="STORAGE LOCATION" value={selectedReceipt.location} />
                                    <ProfileField label="UNIT MEASURE" value={selectedReceipt.unit} />
                                    <ProfileField label="LOGGED BY" value={selectedReceipt.receivedBy} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="px-12 py-3 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setErrors({}); }}
                title="Record Material Receipt"
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8">
                    <form id="receipt-form" onSubmit={handleSubmit} className="space-y-12 italic-none">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Inflow Context</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Material Name *</label>
                                    <input
                                        name="materialName"
                                        value={formData.materialName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. UltraTech Cement"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.materialName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Supplier Name *</label>
                                    <input
                                        name="supplierName"
                                        value={formData.supplierName}
                                        onChange={handleInputChange}
                                        placeholder="Enter supplier/vendor name"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.supplierName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Bill / Invoice Number *</label>
                                    <input
                                        name="billNumber"
                                        value={formData.billNumber}
                                        onChange={handleInputChange}
                                        placeholder="INV-XXXX-XXXX"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.billNumber ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Storage Location</label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Store">Main Store</option>
                                        <option value="Site">On-Site Area</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Quantities</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Unit of Measure</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none appearance-none"
                                    >
                                        <option value="Bag">Bags</option>
                                        <option value="Kg">Kilograms (Kg)</option>
                                        <option value="Ton">Tons</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Received Quantity *</label>
                                    <input
                                        name="receivedQuantity"
                                        type="number"
                                        value={formData.receivedQuantity}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.receivedQuantity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all font-inter"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="receipt-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        Record Bill Receipt
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default MaterialReceiptPage;
