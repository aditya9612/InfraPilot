import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialReceipt {
    id: number;
    materialName: string;
    unit: string;
    openingStock: number;
    receivedQuantity: number;
    usedQuantity: number;
    closingStock: number;
    supplier: string;
    billNumber: string;
    date: string;
    location: string;
    totalAmount: number;
    paymentStatus: "Paid" | "Pending" | "Partial";
    verificationStatus: "Verified" | "Pending QC";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockReceipts: MaterialReceipt[] = [
    {
        id: 1,
        materialName: "UltraTech Cement",
        unit: "Bag",
        openingStock: 1000,
        receivedQuantity: 500,
        usedQuantity: 120, // Cumulative used at site
        closingStock: 1380, // 1000 + 500 - 120
        supplier: "Global Builders",
        billNumber: "INV-2026-001",
        date: "2026-04-14",
        location: "Main Store",
        totalAmount: 175000,
        paymentStatus: "Paid",
        verificationStatus: "Verified",
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        openingStock: 15,
        receivedQuantity: 5,
        usedQuantity: 1.5,
        closingStock: 18.5,
        supplier: "Iron Traders",
        billNumber: "INV-2026-042",
        date: "2026-04-13",
        location: "Block-A Yard",
        totalAmount: 245000,
        paymentStatus: "Pending",
        verificationStatus: "Pending QC",
    },
];

const initialFormData = {
    materialName: "",
    unit: "Bag",
    receivedQuantity: "",
    supplier: "",
    billNumber: "",
    location: "Main Store",
    totalAmount: "",
    paymentStatus: "Pending" as "Paid" | "Pending" | "Partial",
    openingStock: "100", // Defaulting for demo
};

const MaterialReceiptPage = () => {
    const [receipts, setReceipts] = useState<MaterialReceipt[]>(mockReceipts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceipt | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All Status");

    // Summary stats
    const totalSpent = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const pendingQC = receipts.filter(r => r.verificationStatus === "Pending QC").length;
    const pendingPayment = receipts.filter(r => r.paymentStatus === "Pending").length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.materialName.trim()) errs.materialName = "Material Name is required";
        if (!formData.receivedQuantity || Number(formData.receivedQuantity) <= 0) errs.receivedQuantity = "Invalid Quantity";
        if (!formData.supplier.trim()) errs.supplier = "Supplier is required";
        if (!formData.totalAmount || Number(formData.totalAmount) < 0) errs.totalAmount = "Invalid Amount";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenEdit = (receipt: MaterialReceipt) => {
        setFormMode("edit");
        setEditId(receipt.id);
        setFormData({
            materialName: receipt.materialName,
            unit: receipt.unit,
            receivedQuantity: receipt.receivedQuantity.toString(),
            supplier: receipt.supplier,
            billNumber: receipt.billNumber,
            location: receipt.location,
            totalAmount: receipt.totalAmount.toString(),
            paymentStatus: receipt.paymentStatus,
            openingStock: receipt.openingStock.toString(),
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
        const used = formMode === "edit" ? receipts.find(r => r.id === editId)?.usedQuantity || 0 : 0;
        const closing = opening + received - used;

        const entryData: MaterialReceipt = {
            id: formMode === "edit" ? editId! : Date.now(),
            materialName: formData.materialName,
            unit: formData.unit,
            openingStock: opening,
            receivedQuantity: received,
            usedQuantity: used,
            closingStock: closing,
            supplier: formData.supplier,
            billNumber: formData.billNumber,
            date: new Date().toISOString().split("T")[0],
            location: formData.location,
            totalAmount: Number(formData.totalAmount),
            paymentStatus: formData.paymentStatus,
            verificationStatus: formMode === "edit" ? receipts.find(r => r.id === editId)?.verificationStatus || "Pending QC" : "Pending QC",
        };

        if (formMode === "edit") {
            setReceipts(prev => prev.map(r => r.id === editId ? entryData : r));
            toast.success("Shipment data updated");
        } else {
            setReceipts(prev => [entryData, ...prev]);
            toast.success("Shipment logged & Stock updated");
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (id: number) => {
        setReceiptToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!receiptToDelete) return;
        setReceipts(prev => prev.filter(r => r.id !== receiptToDelete));
        toast.success("Shipment record deleted");
        setIsDeleteModalOpen(false);
        setReceiptToDelete(null);
    };

    const filteredList = useMemo(() => {
        return receipts.filter((item) => {
            const matchesSearch = item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === "All Status" || item.verificationStatus === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [receipts, searchTerm, filterStatus]);

    return (
        <>
            <Navbar title="Material Receipt" breadcrumb={["InfraPilot", "Engineer", "Inventory", "Receipt"]} />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">Field Documentation Registry</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Material Receipt</h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">Inbound logistics tracking, supplier invoicing, and automatic stock updates.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter active:scale-95"
                    >
                        <span className="text-lg leading-none font-inter">+</span>
                        Lodge Shipment
                    </button>
                </div>

                {/* ── Summary Stats (DSR Style) ───────────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">Receipt Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Logged</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{receipts.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Inbound Shipments</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Spent</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter tabular-nums">₹{(totalSpent / 1000).toFixed(1)}K</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Commercial Value</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Pending QC</p>
                            <p className="text-2xl font-bold text-amber-500 font-inter">{pendingQC}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Verification Required</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Unpaid Dues</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">{pendingPayment}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Pending Settlements</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar (DSR Exact Parity) ────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 font-inter">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap font-inter">Logistics Filters</span>
                    </div>

                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    <div className="flex flex-col gap-0.5 min-w-[200px] font-inter">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-inter">Search Registry</label>
                        <div className="relative font-inter">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Ref # or Supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-[150px] font-inter">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-inter">Verify Status</label>
                        <div className="relative font-inter">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-inter pr-8"
                            >
                                <option>All Status</option>
                                <option>Verified</option>
                                <option>Pending QC</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-inter">
                                <svg className="w-3.5 h-3.5 font-inter" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Registry Grid (DSR Card Style) ───────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter underline-none">
                        {filteredList.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col underline-none">
                                <div className="flex items-center justify-between mb-1 font-inter">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MRN #{item.id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.verificationStatus === "Verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                        {item.verificationStatus}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2 italic-none uppercase tracking-wider">{item.date} · {item.location}</p>
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1 tracking-tight">{item.materialName}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed line-clamp-1 mb-4 italic-none uppercase tracking-wider">{item.supplier} · Bill #{item.billNumber}</p>

                                <div className="grid grid-cols-2 gap-3 mt-auto border-t border-slate-50 pt-4 font-inter">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Received</p>
                                        <p className="text-2xl font-bold text-blue-600 font-inter tabular-nums">{item.receivedQuantity}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-inter">{item.unit}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Stock Balance</p>
                                        <p className="text-2xl font-bold text-emerald-600 font-inter tabular-nums">{item.closingStock}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium font-inter">Calculated Closing</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setSelectedReceipt(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                        <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                    </div>
                                    <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageTransition>

            {/* Shipment Modal (Absolute DSR Parity) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formMode === "create" ? "New Material Purchase Entry" : "Modify Receipt Registry"} maxWidth="max-w-5xl">
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="shipment-form" onSubmit={handleSubmit} className="space-y-10 text-inter">
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Material Identity</h3>
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
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Opening Stock <span className="text-slate-400">(Pre-Shipment)</span></label>
                                    <input name="openingStock" type="number" value={formData.openingStock} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 font-bold font-inter" />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Received Quantity <span className="text-rose-500">*</span></label>
                                    <input name="receivedQuantity" type="number" value={formData.receivedQuantity} onChange={handleChange} placeholder="0.00" className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.receivedQuantity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`} />
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Commercial Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Supplier Name <span className="text-rose-500">*</span></label>
                                    <input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Iron Traders Pvt Ltd" className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.supplier ? "border-rose-300 bg-rose-50" : "border-slate-200"}`} />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Bill Number</label>
                                    <input name="billNumber" value={formData.billNumber} onChange={handleChange} placeholder="INV-2026-X" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter" />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Total Amount (INR)</label>
                                    <input name="totalAmount" type="number" value={formData.totalAmount} onChange={handleChange} placeholder="0" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter" />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">Location (Store / Site)</label>
                                    <input name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 font-inter focus:ring-blue-500 transition-all" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 font-inter">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-[13px] font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-inter shadow-sm uppercase tracking-wider">Cancel</button>
                    <button type="submit" form="shipment-form" className="px-8 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 font-inter">
                        {formMode === "create" ? "Record Purchase Entry" : "Update Registry"}
                    </button>
                </div>
            </Modal>

            {/* Insight Modal (Showing All Required Fields) */}
            <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Inbound Logistics Insight" maxWidth="max-w-xl">
                {selectedReceipt && (
                    <div className="bg-white p-6 italic-none text-inter">
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 font-inter">Shipment Analysis</p>
                                <div className="flex items-center justify-between mb-8 font-inter">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedReceipt.materialName}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner font-inter">
                                        <svg className="w-6 h-6 opacity-40 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Volume</p>
                                        <p className="text-xl font-black">{selectedReceipt.receivedQuantity} {selectedReceipt.unit}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Impact</p>
                                        <p className="text-xl font-black">+ STOCK UP</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 mb-10 px-1 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Comprehensive Stock Flow</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 border-blue-500 pl-6">
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Opening Stock</p><p className="text-sm font-black text-slate-600 font-inter tabular-nums">{selectedReceipt.openingStock}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Received</p><p className="text-sm font-black text-emerald-600 font-inter tabular-nums">+{selectedReceipt.receivedQuantity}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Used (To Date)</p><p className="text-sm font-black text-rose-500 font-inter tabular-nums">-{selectedReceipt.usedQuantity}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Closing Stock</p><p className="text-sm font-black text-slate-900 font-inter tabular-nums">{selectedReceipt.closingStock}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Supplier</p><p className="text-sm font-black text-slate-800 font-inter">{selectedReceipt.supplier}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill No</p><p className="text-sm font-black text-slate-800 font-inter">{selectedReceipt.billNumber}</p></div>
                                    <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Location</p><p className="text-sm font-black text-slate-800 font-inter">{selectedReceipt.location}</p></div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedReceipt(null)} className="flex-1 w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter">Close Insight</button>
                    </div>
                )}
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setReceiptToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Shipment Record"
                message="Are you sure you want to delete this material receipt? This will affect your current stock levels and financial logs."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default MaterialReceiptPage;
