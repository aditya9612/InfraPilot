import { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const MaterialConsumptionPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedConsumption, setSelectedConsumption] = useState<any>(null);

    const [formData, setFormData] = useState({
        // Consumption Core
        materialName: "",
        quantity: "",
        unit: "Bag",
        location: "Block A - Ground Floor",
        activity: "Brickwork & Plastering",
        engineer: "Er. Amit Kumar",
        wastage: "0",

        // Worker Attribution (Labor Metrics) - 9 Fields
        workerName: "",
        workerAadhaar: "",
        contractorName: "",
        workType: "",
        attendance: "Present",
        inTime: "08:30",
        outTime: "17:30",
        workingHours: "9",
        overtime: "0",
        wageRate: "",
    });

    const [consumptions, setConsumptions] = useState([
        {
            id: 1,
            materialName: "Cement (OPC 53)",
            quantity: "45",
            unit: "Bag",
            location: "Sector 4 - Foundation",
            activity: "Raft Concreting",
            date: "2024-03-20",
            workerName: "Suresh Meena",
            contractorName: "Quality Civil Works",
            workingHours: "9",
            wastage: "2"
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
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.materialName) newErrors.materialName = "Required";
        if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = "Required";
        if (!formData.workerName) newErrors.workerName = "Required";
        if (!formData.wageRate) newErrors.wageRate = "Required";
        if (formData.workerAadhaar && formData.workerAadhaar.replace(/-/g, "").length !== 12) {
            newErrors.workerAadhaar = "12-digit Aadhaar required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Protocol Validation Failed.");
            return;
        }

        const newEntry = { ...formData, id: Date.now(), date: new Date().toISOString().split("T")[0] };

        toast.loading("Reconciling Resource Depletion...", { id: "cons-load" });
        setTimeout(() => {
            setConsumptions([newEntry, ...consumptions]);
            toast.success("Depletion Synchronized!", { id: "cons-load" });
            setIsModalOpen(false);
            handleReset();
        }, 1500);
    };

    const handleReset = () => {
        setFormData({
            materialName: "",
            quantity: "",
            unit: "Bag",
            location: "Block A - Ground Floor",
            activity: "Brickwork & Plastering",
            engineer: "Er. Amit Kumar",
            wastage: "0",
            workerName: "",
            workerAadhaar: "",
            contractorName: "",
            workType: "",
            attendance: "Present",
            inTime: "08:30",
            outTime: "17:30",
            workingHours: "9",
            overtime: "0",
            wageRate: "",
        });
        setErrors({});
    };

    return (
        <>
            <Navbar
                title="Depletion Entry Protocol"
                breadcrumb={["InfraPilot", "Resource Lifecycle", "Consumption"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Utilization Ledger</h2>
                        <p className="text-slate-500 text-sm font-medium">Resource expenditure tracking with workforce attribution.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + LOG USAGE
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Consumption Dynamics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Volume Expended Today"
                            value="420"
                            sub="Active Depletion"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Labor Productivity"
                            value="88%"
                            sub="High Yield"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Wastage Delta"
                            value="1.2%"
                            sub="Controlled"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Pending Requisition"
                            value="05"
                            sub="Stock Low"
                            accent="text-amber-500"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Operational Expenditure History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {consumptions.map((c, idx) => (
                            <div key={idx}
                                className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden cursor-pointer"
                                onClick={() => setSelectedConsumption(c)}
                            >
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]`} />

                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">DEPLETION LOG #{idx + 100}</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tighter">{c.date}</span>
                                    </div>
                                    <span className="px-5 py-2 text-[9px] font-black tracking-widest rounded-xl border border-rose-100 bg-rose-50 text-rose-600 uppercase shadow-sm shadow-rose-500/5">
                                        RESOURCED
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight group-hover:text-rose-600 transition-colors">{c.materialName}</h3>

                                <div className="space-y-6 flex-1">
                                    <div className="flex justify-between items-center bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Expenditure</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-rose-600 tracking-tighter">{c.quantity}</span>
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{c.unit}</span>
                                            </div>
                                        </div>
                                        <div className="w-[1px] h-10 bg-slate-200" />
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Locale</span>
                                            <span className="text-lg font-black text-slate-800 tracking-tighter uppercase">{c.location.split(' - ')[0]}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white rounded-[24px] border border-slate-50 shadow-sm">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                                    {c.workerName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[12px] font-black text-slate-800 tracking-tight uppercase">{c.workerName}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.contractorName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">Context</span>
                                                    <span className="text-[11px] font-black text-rose-600 uppercase italic">{c.activity}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">Effort</span>
                                                    <span className="text-[11px] font-black text-slate-800">{c.workingHours} HRS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 pt-4 border-t border-slate-50 italic">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Wastage Parameter</span>
                                            <span className="text-[11px] font-black text-rose-500 uppercase tracking-tight">{c.wastage} {c.unit} DELTA</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400">Resource depletion verified via site telemetry.</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            {/* Utilization Admission Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Utilization Reconciliation Protocol"
                maxWidth="max-w-5xl"
            >
                <div className="p-12 bg-white">
                    <form id="consumption-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Resource Depletion Core */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                                <h3 className="text-[14px] font-black text-slate-800 tracking-widest uppercase">Resource Depletion Matrix</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Material Resource</label>
                                    <select
                                        name="materialName"
                                        value={formData.materialName}
                                        onChange={handleChange}
                                        className={`admin-pulse-form-input ${errors.materialName ? 'border-rose-300' : ''}`}
                                    >
                                        <option value="">Select Resource for Depletion...</option>
                                        <option>Cement (OPC 53)</option>
                                        <option>TMT Bars (12mm)</option>
                                        <option>Coarse Sand</option>
                                        <option>Bricks (Class A)</option>
                                    </select>
                                    {errors.materialName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.materialName}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Volume Expended</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className={`admin-pulse-form-input ${errors.quantity ? 'border-rose-300' : ''}`}
                                        />
                                        <select name="unit" value={formData.unit} onChange={handleChange} className="admin-pulse-form-input !w-24 text-xs font-bold italic">
                                            <option>Bag</option>
                                            <option>MT</option>
                                            <option>Nos</option>
                                        </select>
                                    </div>
                                    {errors.quantity && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.quantity}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Deployment Locale</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. BUILDING A" className="admin-pulse-form-input" />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Target Activity</label>
                                    <input type="text" name="activity" value={formData.activity} onChange={handleChange} placeholder="e.g. CONCRETING" className="admin-pulse-form-input" />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Engineer In-Charge</label>
                                    <input type="text" name="engineer" value={formData.engineer} onChange={handleChange} placeholder="NAME" className="admin-pulse-form-input" />
                                </div>
                            </div>
                        </div>

                        {/* Labor Attribution Governance */}
                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-[14px] font-black text-slate-800 tracking-widest uppercase">Worker Identification & Shift Data</h3>
                            </div>

                            <div className="grid grid-cols-4 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Worker Name</label>
                                    <input type="text" name="workerName" value={formData.workerName} onChange={handleChange} placeholder="FULL OPERATIONAL NAME" className={`admin-pulse-form-input ${errors.workerName ? 'border-rose-300' : ''}`} />
                                    {errors.workerName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.workerName}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">ID / Aadhaar</label>
                                    <input type="text" name="workerAadhaar" value={formData.workerAadhaar} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" className={`admin-pulse-form-input font-mono ${errors.workerAadhaar ? 'border-rose-300' : ''}`} />
                                    {errors.workerAadhaar && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.workerAadhaar}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Contractor Name</label>
                                    <input type="text" name="contractorName" value={formData.contractorName} onChange={handleChange} placeholder="ENTITY" className="admin-pulse-form-input" />
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Work Category</label>
                                    <input type="text" name="workType" value={formData.workType} onChange={handleChange} placeholder="e.g. SKILLED LABOR" className="admin-pulse-form-input" />
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Attendance</label>
                                    <select name="attendance" value={formData.attendance} onChange={handleChange} className="admin-pulse-form-input">
                                        <option>Present</option>
                                        <option>Absent</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group ">
                                    <label className="admin-pulse-form-label  ">Shift Start (IN)</label>
                                    <input type="time" name="inTime" value={formData.inTime} onChange={handleChange} className="admin-pulse-form-input" />
                                </div>
                                <div className="admin-pulse-form-group ">
                                    <label className="admin-pulse-form-label  ">Shift End (OUT)</label>
                                    <input type="time" name="outTime" value={formData.outTime} onChange={handleChange} className="admin-pulse-form-input" />
                                </div>
                                <div className="admin-pulse-form-group ">
                                    <label className="admin-pulse-form-label  ">Shift Hours</label>
                                    <input type="number" name="workingHours" value={formData.workingHours} onChange={handleChange} className="admin-pulse-form-input text-center" />
                                </div>
                                <div className="admin-pulse-form-group ">
                                    <label className="admin-pulse-form-label  ">Overtime</label>
                                    <input type="number" name="overtime" value={formData.overtime} onChange={handleChange} className="admin-pulse-form-input text-center text-blue-600" />
                                </div>
                                <div className="admin-pulse-form-group ">
                                    <label className="admin-pulse-form-label admin-pulse-form-required  ">Wage Rate</label>
                                    <input type="number" name="wageRate" value={formData.wageRate} onChange={handleChange} className={`admin-pulse-form-input text-blue-600 ${errors.wageRate ? 'border-rose-300' : ''}`} />
                                    {errors.wageRate && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.wageRate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Audit Details */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-[14px] font-black text-slate-800 tracking-widest uppercase">Operational Audit & Wastage</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group ">
                                    <label className="admin-pulse-form-label  ">Wastage Volume</label>
                                    <input type="number" name="wastage" value={formData.wastage} onChange={handleChange} className="admin-pulse-form-input text-amber-600" />
                                </div>
                            </div>

                            {/* Estimated Cost Summary */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Est. Consumption Value</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">₹{(Number(formData.quantity || 0) * Number(formData.wageRate || 450)).toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Cancel</button>
                    <button type="submit" form="consumption-form" className="admin-pulse-btn-primary">Synchronize Depletion Log</button>
                </div>
            </Modal>
            {selectedConsumption && (
                <Modal
                    isOpen={!!selectedConsumption}
                    onClose={() => setSelectedConsumption(null)}
                    title="Utilization Reconciliation Intelligence"
                    maxWidth="max-w-4xl"
                >
                    <div className="p-10 bg-white">
                        {/* Premium Banner */}
                        <div className="admin-pulse-details-banner bg-rose-900 border-rose-800">
                            <div className="admin-pulse-details-icon-container bg-rose-600">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedConsumption.materialName}</h2>
                                    <div className="text-right">
                                        <p className="text-4xl font-black text-white tracking-tighter leading-none">{selectedConsumption.quantity}</p>
                                        <span className="text-[10px] font-black text-rose-300 tracking-[0.2em] uppercase">{selectedConsumption.unit.toUpperCase()} VERIFIED DEPLETION</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Operational Expenditure Log</h3>
                                    <span className="px-3 py-1 bg-rose-950 text-rose-400 rounded-lg text-[9px] font-black tracking-[0.2em] border border-rose-800">
                                        {selectedConsumption.date} SYNC
                                    </span>
                                </div>
                                <p className="text-rose-200/40 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Depletion Hash: CONS-{selectedConsumption.id}-RECON</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-12">
                            {/* Left Column: Depletion & Audit */}
                            <div className="col-span-3 space-y-10 font-black uppercase">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Depletion Intelligence</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label">Deployment Locale</span>
                                                <p className="text-xl font-black text-slate-800 italic">{selectedConsumption.location}</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label">Target Activity</span>
                                                <p className="text-xl font-black text-rose-600 italic">{selectedConsumption.activity}</p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-200 my-6" />
                                        <div className="flex items-center justify-between">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label block mb-2">Resource Expenditure</span>
                                                <p className="text-3xl font-black text-slate-800 tracking-tighter italic">{selectedConsumption.quantity} {selectedConsumption.unit.toUpperCase()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="admin-pulse-details-label block mb-2">Wastage Delta</span>
                                                <p className="text-xl font-black text-rose-500 italic">{selectedConsumption.wastage} {selectedConsumption.unit.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Operational Audit Governance</h3>
                                    </div>
                                    <div className="p-8 bg-amber-50/30 rounded-[32px] border border-amber-100 italic">
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase">
                                            "Resource depletion for <span className="text-amber-700">{selectedConsumption.materialName}</span> at <span className="text-amber-700">{selectedConsumption.location}</span> has been reconciled against site telemetry and verified by force articulators. Wastage parameter within nominal threshold of <span className="text-rose-600">{selectedConsumption.wastage} {selectedConsumption.unit}</span>."
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Workforce */}
                            <div className="col-span-2 space-y-10 font-black uppercase">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Force Attribution</h3>
                                    </div>
                                    <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 min-h-[350px] shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-600/20 transition-all"></div>
                                        <div className="space-y-8 relative z-10">
                                            <div>
                                                <span className="admin-pulse-details-label mb-2 block text-slate-400">Force Articulator</span>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-700 flex items-center justify-center text-sm font-black text-slate-900 shadow-xl">
                                                        {selectedConsumption.workerName.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <p className="text-2xl font-black text-white tracking-tighter italic">{selectedConsumption.workerName}</p>
                                                </div>
                                            </div>
                                            <div className="pt-8 border-t border-slate-800">
                                                <span className="admin-pulse-details-label mb-2 block text-slate-400">Master Contractor</span>
                                                <p className="text-2xl font-black text-rose-400 tracking-tighter italic">{selectedConsumption.contractorName}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-8">
                                                <div>
                                                    <span className="admin-pulse-details-label mb-1 block text-slate-500">Effort Metrics</span>
                                                    <p className="text-xl font-black text-white italic">{selectedConsumption.workingHours} HRS</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="admin-pulse-details-label mb-1 block text-slate-500">Date Logged</span>
                                                    <p className="text-base font-black text-slate-400 italic">{selectedConsumption.date}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.5)]"></div>
                                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">DEPLETION SYNCED: STATION 04</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">EXPENDITURE PROTOCOL ARCHIVED BY INFRAPILOT CORE</span>
                            <button onClick={() => setSelectedConsumption(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                Archive Dossier
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default MaterialConsumptionPage;
