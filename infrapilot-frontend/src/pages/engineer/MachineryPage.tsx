import React, { useState } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const MachineryPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [formData, setFormData] = useState({
        equipmentName: "",
        equipmentId: "",
        operatorName: "",
        workingHours: "",
        idleHours: "0",
        fuelUsed: "",
        condition: "Good",
        rentalCost: "",
        maintenanceDate: "",
        startTime: "08:00",
        endTime: "16:00",
        remarks: "",
    });

    const [fleet, setFleet] = useState([
        { id: 1, name: "JCB Excavator 4DX (Heavy Duty)", equipmentId: "MC-001", operator: "Suresh P.", hours: 8.5, idle: 1.2, fuel: "45.8L", condition: "Good", rentalCost: "18500", maintenanceDate: "2024-04-20", remarks: "Excavation completed for Zone A; hydraulic pressure stable." },
        { id: 2, name: "Tower Crane L-Class (Phase 1)", equipmentId: "MC-022", operator: "Vinod K.", hours: 10, idle: 0, fuel: "Grid-Sync", condition: "Good", rentalCost: "25000", maintenanceDate: "2024-05-15", remarks: "Heavy lifting ops; wind speed within safety threshold." },
        { id: 3, name: "Concrete Mixer M30 (Batch A)", equipmentId: "MC-015", operator: "Rahul B.", hours: 5.2, idle: 3.5, fuel: "15.2L", condition: "Repair", rentalCost: "5500", maintenanceDate: "2024-04-05", remarks: "Drum maintenance needed; bearing friction detected." },
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
        if (!formData.equipmentName.trim()) newErrors.equipmentName = "Required";
        if (!formData.equipmentId.trim()) newErrors.equipmentId = "Required";
        if (!formData.operatorName.trim()) newErrors.operatorName = "Required";
        if (!formData.workingHours) newErrors.workingHours = "Required";
        if (!formData.fuelUsed.trim()) newErrors.fuelUsed = "Required";
        if (!formData.rentalCost) newErrors.rentalCost = "Required";
        if (!formData.maintenanceDate) newErrors.maintenanceDate = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newAsset = {
            ...formData,
            id: Date.now(),
            name: formData.equipmentName,
            hours: Number(formData.workingHours),
            idle: Number(formData.idleHours),
            fuel: formData.fuelUsed,
            operator: formData.operatorName,
        };

        toast.loading("Logging Telemetry...", { id: "machine-load" });
        setTimeout(() => {
            setFleet([newAsset, ...fleet]);
            toast.success("Telemetry Logged!", { id: "machine-load" });
            setIsModalOpen(false);
            setFormData({
                equipmentName: "",
                equipmentId: "",
                operatorName: "",
                workingHours: "",
                idleHours: "0",
                fuelUsed: "",
                condition: "Good",
                rentalCost: "",
                maintenanceDate: "",
                startTime: "08:00",
                endTime: "16:00",
                remarks: "",
            });
        }, 1200);
    };

    return (
        <>
            <Navbar
                title="Fleet Telematics"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Master Fleet Deployment</h2>
                        <p className="text-slate-500 text-sm font-medium">Monitor operational uptime, fuel efficiency, and maintenance cycles.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + LOG TELEMETRY
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        Fleet Intelligence
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Active Units"
                            value="12 / 14"
                            sub="Equipment uptime"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Health Index"
                            value="92%"
                            sub="Fleet integrity"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Fuel Velocity"
                            value="84%"
                            sub="Burn rate optimal"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Daily Capex"
                            value="₹48.5K"
                            sub="Operational cost"
                            accent="text-rose-600"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Active Deployment Ledger
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {fleet.map(m => (
                            <div key={m.id} className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden cursor-pointer" onClick={() => setSelectedAsset(m)}>
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all ${m.condition === 'Good' ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                    }`} />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-blue-600 transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm px-2 text-center leading-tight font-black uppercase">
                                            {m.equipmentId}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 block">ASSET {m.id} | PILOT: {m.operator}</span>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-tight uppercase">{m.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase tracking-widest">{m.equipmentId}</p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border transition-all ${m.condition === 'Good' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                        }`}>
                                        {m.condition === 'Good' ? 'OPERATIONAL' : 'DOWNTIME'}
                                    </span>
                                </div>

                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 grid grid-cols-2 gap-8 uppercase">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">Operational Yield</span>
                                        <p className="text-3xl font-black tracking-tighter text-slate-800 italic">{m.hours}h <span className="text-sm font-bold text-slate-400">active</span></p>
                                        <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-widest underline underline-offset-4 decoration-amber-200">{m.idle}h idle state</p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-8">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">Energy Portfolio</span>
                                        <p className="text-xl font-black tracking-tight text-blue-600 italic">{m.fuel}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Efficiency index stable</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-4 pt-2 border-t border-slate-50 mt-auto uppercase">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Service Schedule</span>
                                        <span className="text-sm font-black text-slate-700 tracking-tighter italic underline underline-offset-4 decoration-slate-200">{m.maintenanceDate}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Daily CapEx</span>
                                        <span className="text-xl font-black text-slate-900 tracking-tighter italic">₹{Number(m.rentalCost).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Asset Telemetry Log"
                maxWidth="max-w-5xl"
            >
                <div className="p-12 bg-white">
                    <form id="machinery-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Identification */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                <h3 className="admin-pulse-form-section-title">Asset Identification</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Equipment Model Name</label>
                                    <input
                                        type="text"
                                        name="equipmentName"
                                        value={formData.equipmentName}
                                        onChange={handleChange}
                                        placeholder="e.g. JCB Excavator 4DX"
                                        className={`admin-pulse-form-input ${errors.equipmentName ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.equipmentName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.equipmentName}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Equipment ID / Tag</label>
                                    <input
                                        type="text"
                                        name="equipmentId"
                                        value={formData.equipmentId}
                                        onChange={handleChange}
                                        placeholder="MC-001"
                                        className={`admin-pulse-form-input font-black uppercase text-blue-600 ${errors.equipmentId ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.equipmentId && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.equipmentId}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Pilot / Operator Name</label>
                                    <input
                                        type="text"
                                        name="operatorName"
                                        value={formData.operatorName}
                                        onChange={handleChange}
                                        placeholder="Authority Name"
                                        className={`admin-pulse-form-input ${errors.operatorName ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.operatorName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.operatorName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Operational Cycle */}
                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-amber-500" />
                                <h3 className="admin-pulse-form-section-title">Operational Cycle</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required text-center block">Working Hours</label>
                                    <input
                                        type="number"
                                        name="workingHours"
                                        value={formData.workingHours}
                                        onChange={handleChange}
                                        placeholder="0.0"
                                        className={`admin-pulse-form-input !text-center text-xl font-black ${errors.workingHours ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.workingHours && <p className="text-[10px] font-bold text-rose-500 mt-2 text-center">{errors.workingHours}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label text-center block">Idle Hours</label>
                                    <input
                                        type="number"
                                        name="idleHours"
                                        value={formData.idleHours}
                                        onChange={handleChange}
                                        placeholder="0.0"
                                        className="admin-pulse-form-input !text-center text-xl font-black text-amber-500 bg-white/50"
                                    />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required text-center block">Fuel (Ltrs)</label>
                                    <input
                                        type="text"
                                        name="fuelUsed"
                                        value={formData.fuelUsed}
                                        onChange={handleChange}
                                        placeholder="eg. 45L"
                                        className={`admin-pulse-form-input !text-center text-xl font-black text-blue-600 ${errors.fuelUsed ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.fuelUsed && <p className="text-[10px] font-bold text-rose-500 mt-2 text-center">{errors.fuelUsed}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Health & Yield */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-green-500" />
                                <h3 className="admin-pulse-form-section-title">Health & Yield</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label uppercase font-black text-[10px]">Asset Health Status</label>
                                    <select
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleChange}
                                        className="admin-pulse-form-input font-black uppercase"
                                    >
                                        <option value="Good">In Service (Good)</option>
                                        <option value="Repair">Maintenance Required</option>
                                        <option value="Breakdown">Breakdown (Grounded)</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Rental / Yield (₹)</label>
                                    <input
                                        type="number"
                                        name="rentalCost"
                                        value={formData.rentalCost}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className={`admin-pulse-form-input font-black italic ${errors.rentalCost ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.rentalCost && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.rentalCost}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Next Service</label>
                                    <input
                                        type="date"
                                        name="maintenanceDate"
                                        value={formData.maintenanceDate}
                                        onChange={handleChange}
                                        className={`admin-pulse-form-input font-black ${errors.maintenanceDate ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.maintenanceDate && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.maintenanceDate}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label font-black text-[10px]">Technical Remarks</label>
                                    <input
                                        type="text"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        placeholder="Optional technical notes"
                                        className="admin-pulse-form-input italic"
                                    />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Asset Operational Cost</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">₹{Number(formData.rentalCost || 0).toLocaleString()}.00</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Discard</button>
                    <button type="submit" form="machinery-form" className="admin-pulse-btn-primary">Synchronize Asset Data</button>
                </div>
            </Modal>

            {/* Detailed View Modal */}
            <Modal
                isOpen={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
                title="Asset Intelligence Dossier"
                maxWidth="max-w-4xl"
            >
                {selectedAsset && (
                    <div className="p-10 bg-white uppercase">
                        {/* Premium Banner */}
                        <div className="admin-pulse-details-banner">
                            <div className="admin-pulse-details-icon-container">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedAsset.name}</h2>
                                    <span className={`admin-pulse-status-badge ${selectedAsset.condition === 'Good' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                        'bg-rose-500/20 text-rose-100 border-rose-500/30 animate-pulse'
                                        } backdrop-blur-md border`}>
                                        {selectedAsset.condition.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase">{selectedAsset.equipmentId}</h3>
                                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Asset Hash: FLT-{selectedAsset.id}-SYNC</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Left Column: Operational Yield */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Operational Yield</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-8 font-black uppercase">
                                        <div className="grid grid-cols-2 gap-8 mb-6">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Active Runtime</span>
                                                <p className="text-4xl font-black text-slate-800 tracking-tighter italic">{selectedAsset.hours}H</p>
                                            </div>
                                            <div className="admin-pulse-details-group text-right">
                                                <span className="admin-pulse-details-label uppercase">Idle Frequency</span>
                                                <p className="text-2xl font-black text-amber-500 tracking-tighter italic">{selectedAsset.idle}H</p>
                                            </div>
                                        </div>
                                        <div className="admin-pulse-details-group border-t border-slate-200 pt-6 font-black uppercase">
                                            <span className="admin-pulse-details-label uppercase mb-2 block">Energy Consumption</span>
                                            <div className="flex items-center justify-between">
                                                <p className="text-3xl font-black text-blue-600 tracking-tighter italic">{selectedAsset.fuel}</p>
                                                <span className="text-[10px] font-bold text-slate-400 italic">Fuel Efficiency Optimal</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Safety & Lifecycle</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-8 font-black uppercase">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Master Pilot</span>
                                            <p className="admin-pulse-details-value uppercase italic">{selectedAsset.operator}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Service Threshold</span>
                                            <p className="admin-pulse-details-value uppercase italic underline underline-offset-4 decoration-slate-200">{selectedAsset.maintenanceDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Narrative & Finance */}
                            <div className="space-y-10 font-black uppercase">
                                <div>
                                    <div className="admin-pulse-details-section-header font-black uppercase">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                        <h3 className="admin-pulse-details-section-title font-black uppercase">Technical Insights</h3>
                                    </div>
                                    <div className="p-8 bg-blue-50/30 rounded-[32px] border border-blue-100 min-h-[200px] font-black uppercase">
                                        <span className="admin-pulse-details-label mb-4 block underline underline-offset-4 decoration-blue-200 uppercase font-black">Remarks Portfolio</span>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic uppercase font-black">{selectedAsset.remarks}</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 flex items-center justify-between group overflow-hidden relative font-black uppercase">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all font-black uppercase"></div>
                                    <div className="flex flex-col gap-1 relative z-10 font-black uppercase">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest font-black uppercase">Daily Deployment Yield</span>
                                        <p className="text-3xl font-black text-white tracking-tighter italic font-black uppercase">₹{Number(selectedAsset.rentalCost).toLocaleString()}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg relative z-10 font-black uppercase ${selectedAsset.condition === 'Good' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black uppercase">TELEMETRY DATA VERIFIED BY INFRAPILOT CORE</span>
                            <button onClick={() => setSelectedAsset(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                Close Dossier
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MachineryPage;
