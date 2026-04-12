import { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const MaterialReceiptPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);


    const [formData, setFormData] = useState({
        // Material Data
        materialName: "",
        unit: "Bag",
        receivedQty: "",
        supplierName: "",
        invoiceNo: "",
        vehicleNo: "",
        receivedDate: new Date().toISOString().split("T")[0],
        location: "Store A",
        qualityCheck: "Pass",

        // Worker Attribution (Labor Metrics)
        workerName: "",
        workerAadhaar: "",
        contractorName: "",
        workType: "",
        attendance: "Present",
        inTime: "09:00",
        outTime: "18:00",
        workingHours: "9",
        overtime: "0",
        wageRate: "",
    });

    const [receipts, setReceipts] = useState([
        {
            id: 1,
            materialName: "Cement (OPC 53)",
            unit: "Bag",
            receivedQty: "240",
            supplierName: "UltraTech Ltd",
            invoiceNo: "INV-9821",
            vehicleNo: "MH-12-AQ-4532",
            receivedDate: "2024-03-20",
            location: "Store A",
            qualityCheck: "Pass",
            workerName: "Ram Singh",
            workerAadhaar: "4532-9821-1234",
            contractorName: "ABC Constructions",
            workType: "Skilled Operator",
            inTime: "09:00 AM",
            outTime: "06:00 PM",
            workingHours: "9",
            overtime: "0",
            wageRate: "650"
        },
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const formatAadhaar = (value: string) => {
        const val = value.replace(/\D/g, "").substring(0, 12);
        let formatted = "";
        for (let i = 0; i < val.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += "-";
            formatted += val[i];
        }
        return formatted;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "workerAadhaar") {
            setFormData(prev => ({ ...prev, [name]: formatAadhaar(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => {
                const upd = { ...prev };
                delete upd[name];
                return upd;
            });
        }
    };


    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        // Material Validations
        if (!formData.materialName) newErrors.materialName = "Required";
        if (!formData.receivedQty || Number(formData.receivedQty) <= 0) newErrors.receivedQty = "Required";
        if (!formData.supplierName) newErrors.supplierName = "Required";
        if (!formData.invoiceNo) newErrors.invoiceNo = "Required";

        // Worker Validations
        if (!formData.workerName) newErrors.workerName = "Required";
        if (formData.workerAadhaar && formData.workerAadhaar.replace(/-/g, "").length !== 12) {
            newErrors.workerAadhaar = "12-digit Aadhaar required";
        }
        if (!formData.wageRate || isNaN(Number(formData.wageRate))) newErrors.wageRate = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Validation failed. Check mandatory fields.");
            return;
        }

        const newReceipt = { ...formData, id: Date.now() };

        toast.loading("Synchronizing Inbound Logistics & Personnel Asset...", { id: "log-load" });
        setTimeout(() => {
            setReceipts([newReceipt, ...receipts]);
            toast.success("Transaction Secure & Verified!", { id: "log-load" });
            setIsModalOpen(false);
            handleReset();
        }, 1500);
    };

    const handleReset = () => {
        setFormData({
            materialName: "",
            unit: "Bag",
            receivedQty: "",
            supplierName: "",
            invoiceNo: "",
            vehicleNo: "",
            receivedDate: new Date().toISOString().split("T")[0],
            location: "Store A",
            qualityCheck: "Pass",
            workerName: "",
            workerAadhaar: "",
            contractorName: "",
            workType: "",
            attendance: "Present",
            inTime: "09:00",
            outTime: "18:00",
            workingHours: "9",
            overtime: "0",
            wageRate: "",
        });
        setErrors({});
    };

    return (
        <>
            <Navbar
                title="Inbound Operational Pulse"
                breadcrumb={["InfraPilot", "Material Intelligence", "Logistics & Supply"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Inbound Logistics Ledger</h2>
                        <p className="text-slate-500 text-sm font-medium">Real-time supply synchronization and verification.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + LOG RECEIPT
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Inbound Velocity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Units Received Today"
                            value="12"
                            sub="Supply Flowing"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Quality Baseline"
                            value="100%"
                            sub="Stable"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Operational Delta"
                            value="0.4%"
                            sub="Optimal"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Inventory Criticality"
                            value="02"
                            sub="Alert Profile"
                            accent="text-rose-600"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Logistics Reconciliation Ledger
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {receipts.map((r, idx) => (
                            <div key={idx} className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden cursor-pointer" onClick={() => setSelectedReceipt(r)}>
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]`} />

                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">INBOUND PROTOCOL #{idx + 100}</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tighter">{r.receivedDate}</span>
                                    </div>
                                    <span className={`px-4 py-1.5 text-[9px] font-black tracking-widest rounded-xl border transition-all ${r.qualityCheck === 'Pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5'}`}>
                                        QC: {r.qualityCheck.toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight group-hover:text-blue-600 transition-colors uppercase">{r.materialName}</h3>

                                <div className="space-y-6 flex-1">
                                    <div className="flex justify-between items-center bg-slate-50 rounded-[32px] p-8 border border-slate-100 uppercase">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Quantum Flow</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-blue-600 tracking-tighter uppercase">{r.receivedQty}</span>
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest uppercase">{r.unit}</span>
                                            </div>
                                        </div>
                                        <div className="w-[1px] h-10 bg-slate-200" />
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Sector</span>
                                            <span className="text-lg font-black text-slate-800 tracking-tighter uppercase uppercase">{r.location}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white rounded-[24px] border border-slate-50 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                                {r.workerName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[12px] font-black text-slate-800 tracking-tight uppercase uppercase">{r.workerName}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest uppercase">{r.contractorName}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">Shift</span>
                                                <span className="text-[11px] font-black text-blue-600">{r.workingHours} HRS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 pt-4 border-t border-slate-50 italic">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block mb-2">Supply Manifest</span>
                                        <p className="text-sm font-black text-slate-600 truncate mb-3">{r.supplierName.toUpperCase()}</p>
                                        <div className="flex items-center gap-4">
                                            <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-100 uppercase">INV: {r.invoiceNo}</span>
                                            <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-100 uppercase">PILOT: {r.vehicleNo || 'NA'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            {/* Admission Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Material & Personnel Operational Entry"
                maxWidth="max-w-5xl"
            >
                <div className="p-12 bg-white">
                    <form id="receipt-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Logistic Framework */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                <h3 className="admin-pulse-form-section-title">Supply Metadata</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Material Description</label>
                                    <select
                                        name="materialName"
                                        value={formData.materialName}
                                        onChange={handleChange}
                                        className={`admin-pulse-form-input ${errors.materialName ? 'border-rose-300' : ''}`}
                                    >
                                        <option value="">Select Resource...</option>
                                        <option>Cement (OPC 53)</option>
                                        <option>TMT Bars (12mm)</option>
                                        <option>Coarse Sand</option>
                                        <option>Crushed Stone (20mm)</option>
                                        <option>Bricks (Class A)</option>
                                    </select>
                                    {errors.materialName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.materialName}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Inbound Quantum</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            name="receivedQty"
                                            value={formData.receivedQty}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className={`admin-pulse-form-input ${errors.receivedQty ? 'border-rose-300' : ''}`}
                                        />
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className="admin-pulse-form-input !w-24 text-xs font-black uppercase"
                                        >
                                            <option>Bag</option>
                                            <option>MT</option>
                                            <option>CFT</option>
                                            <option>Nos</option>
                                        </select>
                                    </div>
                                    {errors.receivedQty && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.receivedQty}</p>}
                                </div>

                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Supplier Agency</label>
                                    <input
                                        type="text"
                                        name="supplierName"
                                        value={formData.supplierName}
                                        onChange={handleChange}
                                        placeholder="OFFICIAL ENTITY NAME"
                                        className={`admin-pulse-form-input ${errors.supplierName ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.supplierName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.supplierName}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Receipt Slot</label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black uppercase"
                                    >
                                        <option>Store A</option>
                                        <option>Store B</option>
                                        <option>Yard A</option>
                                        <option>Yard B</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Personnel Asset Matrix */}
                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-green-500" />
                                <h3 className="admin-pulse-form-section-title">Attribution Governance (Labor Data)</h3>
                            </div>

                            <div className="grid grid-cols-4 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Worker Name</label>
                                    <input
                                        type="text"
                                        name="workerName"
                                        value={formData.workerName}
                                        onChange={handleChange}
                                        placeholder="TRANSACTION PILOT NAME"
                                        className={`admin-pulse-form-input ${errors.workerName ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.workerName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.workerName}</p>}
                                </div>

                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">ID / Aadhaar</label>
                                    <input
                                        type="text"
                                        name="workerAadhaar"
                                        value={formData.workerAadhaar}
                                        onChange={handleChange}
                                        placeholder="1234-5678-9012"
                                        className={`admin-pulse-form-input font-mono ${errors.workerAadhaar ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.workerAadhaar && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.workerAadhaar}</p>}
                                </div>

                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Contractor Name</label>
                                    <input
                                        type="text"
                                        name="contractorName"
                                        value={formData.contractorName}
                                        onChange={handleChange}
                                        placeholder="PERSONNEL ENTITY"
                                        className="admin-pulse-form-input"
                                    />
                                </div>

                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Work Type</label>
                                    <input
                                        type="text"
                                        name="workType"
                                        value={formData.workType}
                                        onChange={handleChange}
                                        placeholder="e.g. SUPPLY OPERATOR"
                                        className="admin-pulse-form-input"
                                    />
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Attendance</label>
                                    <select name="attendance" value={formData.attendance} onChange={handleChange} className="admin-pulse-form-input font-black uppercase">
                                        <option>Present</option>
                                        <option>Absent</option>
                                    </select>
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Working Hours</label>
                                    <input type="number" name="workingHours" value={formData.workingHours} onChange={handleChange} className="admin-pulse-form-input text-center font-black" />
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Overtime</label>
                                    <input type="number" name="overtime" value={formData.overtime} onChange={handleChange} className="admin-pulse-form-input text-center text-blue-600 font-black" />
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Wage Rate (₹)</label>
                                    <input type="number" name="wageRate" value={formData.wageRate} onChange={handleChange} placeholder="0.00" className={`admin-pulse-form-input text-blue-600 font-black ${errors.wageRate ? 'border-rose-300' : ''}`} />
                                    {errors.wageRate && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.wageRate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Logistic Artifacts */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-rose-600" />
                                <h3 className="admin-pulse-form-section-title">Inventory Documentation Portfolio</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Bill / Invoice Number</label>
                                    <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} placeholder="INV-0000" className={`admin-pulse-form-input font-mono ${errors.invoiceNo ? 'border-rose-300' : ''}`} />
                                    {errors.invoiceNo && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.invoiceNo}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Vehicle Transport ID</label>
                                    <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="XX-00-XX-0000" className="admin-pulse-form-input font-mono" />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Estimated Disbursement</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">₹{(Number(formData.receivedQty || 0) * Number(formData.wageRate || 0)).toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Cancel</button>
                    <button type="submit" form="receipt-form" className="admin-pulse-btn-primary">Synchronize Supply Core</button>
                </div>
            </Modal>

            {/* Detailed View Modal */}
            <Modal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                title="Logistics & Personnel Intelligence"
                maxWidth="max-w-4xl"
            >
                {selectedReceipt && (
                    <div className="p-10 bg-white">
                        {/* Premium Banner */}
                        <div className="admin-pulse-details-banner">
                            <div className="admin-pulse-details-icon-container">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedReceipt.materialName}</h2>
                                    <span className={`admin-pulse-status-badge ${selectedReceipt.qualityCheck === 'Pass' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                        'bg-rose-500/20 text-rose-100 border-rose-500/30'
                                        } backdrop-blur-md border`}>
                                        QC: {selectedReceipt.qualityCheck.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase">{selectedReceipt.supplierName}</h3>
                                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Manifest Hash: LOG-{selectedReceipt.id}-PRO</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Left Column: Logistic Intelligence & Manifest */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Logistic Intelligence</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Quantum Received</span>
                                            <p className="admin-pulse-details-value">{selectedReceipt.receivedQty} <span className="text-xs font-bold text-slate-400">{selectedReceipt.unit.toUpperCase()}</span></p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Storage Sector</span>
                                            <p className="admin-pulse-details-value uppercase">{selectedReceipt.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Manifest Artifacts</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Invoice Reference</span>
                                            <p className="admin-pulse-details-value font-mono">{selectedReceipt.invoiceNo}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Transport Asset ID</span>
                                            <p className="admin-pulse-details-value font-mono">{selectedReceipt.vehicleNo || 'VERIFICATION PENDING'}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Synchronization Date</span>
                                            <p className="admin-pulse-details-value uppercase">{selectedReceipt.receivedDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Operational Pilot */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Operational Pilot</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                                            <div className="admin-pulse-details-group mb-6">
                                                <span className="admin-pulse-details-label">Primary Personnel</span>
                                                <p className="admin-pulse-details-value uppercase">{selectedReceipt.workerName}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="admin-pulse-details-group text-[10px]">
                                                    <span className="admin-pulse-details-label">Designation</span>
                                                    <p className="font-black text-slate-700 uppercase">{selectedReceipt.workType || 'OPERATOR'}</p>
                                                </div>
                                                <div className="admin-pulse-details-group text-right">
                                                    <span className="admin-pulse-details-label">Shift Length</span>
                                                    <p className="font-black text-blue-600 uppercase">{selectedReceipt.workingHours} HRS</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Controlling Entity</span>
                                            <p className="admin-pulse-details-value uppercase">{selectedReceipt.contractorName || 'INTERNAL ASSET'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Transaction Delta</span>
                                        <p className="text-2xl font-black text-slate-800 tracking-tighter italic">₹{(Number(selectedReceipt.receivedQty || 0) * Number(selectedReceipt.wageRate || 0)).toLocaleString()}.00</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic underline underline-offset-8">ENCRYPTED LOG: 0x9a2b-f41e-c789</span>
                            <button onClick={() => setSelectedReceipt(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12">
                                Terminate Intel Session
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialReceiptPage;
