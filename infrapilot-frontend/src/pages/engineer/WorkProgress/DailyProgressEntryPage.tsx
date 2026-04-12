import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const DailyProgressEntryPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [formData, setFormData] = useState({
        activityName: "",
        boqCode: "",
        plannedQty: "",
        todayProgress: "",
        totalCompleted: "",
        remainingQty: "",
        percentage: "",
        startDate: "",
        endDate: "",
        status: "On Track",
        remarks: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [activeActivities] = useState([
        { name: "Excavation for Main Block", boq: "CV-201", progress: 65, status: "On Track", planned: 1500, done: 975, remaining: 525, start: "2026-04-01", end: "2026-04-10" },
        { name: "RCC Column Casting", boq: "CV-205", progress: 42, status: "Ahead", planned: 200, done: 84, remaining: 116, start: "2026-04-05", end: "2026-04-15" },
        { name: "Brickwork - Floor 1", boq: "CV-310", progress: 12, status: "Delay", planned: 1200, done: 144, remaining: 1056, start: "2026-04-07", end: "2026-04-20" },
    ]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.activityName) newErrors.activityName = "Required";
        if (!formData.boqCode) newErrors.boqCode = "Required";
        if (!formData.todayProgress) newErrors.todayProgress = "Required";
        if (!formData.plannedQty) newErrors.plannedQty = "Required";
        if (!formData.startDate) newErrors.startDate = "Required";
        if (!formData.endDate) newErrors.endDate = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let updatedData = { ...formData, [name]: value };

        if (errors[name]) {
            setErrors(prev => {
                const upd = { ...prev };
                delete upd[name];
                return upd;
            });
        }

        if (name === "todayProgress" || name === "plannedQty") {
            const planned = parseFloat(name === "plannedQty" ? value : formData.plannedQty) || 0;
            const today = parseFloat(name === "todayProgress" ? value : formData.todayProgress) || 0;
            const previousCompleted = 500; // Mock calculation base
            const total = previousCompleted + today;
            const remaining = Math.max(0, planned - total);
            const percent = planned > 0 ? Math.min(100, Math.round((total / planned) * 100)) : 0;

            updatedData = {
                ...updatedData,
                totalCompleted: total.toString(),
                remainingQty: remaining.toString(),
                percentage: percent.toString()
            };
        }
        setFormData(updatedData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        toast.loading("Syncing Progress Data...", { id: "progress-sub" });
        setTimeout(() => {
            toast.success("Progress Synchronized!", { id: "progress-sub" });
            setIsModalOpen(false);
            setFormData({
                activityName: "",
                boqCode: "",
                plannedQty: "",
                todayProgress: "",
                totalCompleted: "",
                remainingQty: "",
                percentage: "",
                startDate: "",
                endDate: "",
                status: "On Track",
                remarks: ""
            });
        }, 1500);
    };

    return (
        <>
            <Navbar
                title="Execution Metrics"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Execution"]}
                            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Operational Velocity</h1>
                        <p className="text-slate-500 text-sm font-medium">Real-time tracking of milestones, BOQ compliance, and site efficiency.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + SYNC PROGRESS
                        </button>
                    </div>
                </div>

                <section className="mb-10">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Performance Core
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Yield Rate"
                            value="84%"
                            sub="Activity fulfillment"
                            accent="text-primary"
                        />
                        <StatCard
                            title="Integrity"
                            value="100%"
                            sub="Data verified"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Milestones"
                            value="12"
                            sub="Upcoming phase"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Critical Path"
                            value="02"
                            sub="Active delays"
                            accent="text-rose-500"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Execution Ledger
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {activeActivities.map((activity, idx) => (
                            <div key={idx} className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden cursor-pointer" onClick={() => setSelectedActivity(activity)}>
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all ${activity.status === 'Ahead' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                    activity.status === 'Delay' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' :
                                        'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                    }`} />

                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">EXECUTION THRESHOLD #{idx + 101}</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tighter uppercase">{activity.boq}</span>
                                    </div>
                                    <span className={`px-4 py-1.5 text-[9px] font-black tracking-widest rounded-xl border transition-all ${activity.status === 'Ahead' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' :
                                        activity.status === 'Delay' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5' :
                                            'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-500/5'
                                        }`}>
                                        {activity.status.toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight group-hover:text-blue-600 transition-colors min-h-[4rem]">{activity.name}</h3>

                                <div className="space-y-6 flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Quantum Fulfillment</span>
                                        <span className="text-2xl font-black text-slate-800 tracking-tighter">{activity.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full transition-all duration-[1500ms] ${activity.status === 'Ahead' ? 'bg-emerald-500' :
                                                activity.status === 'Delay' ? 'bg-rose-500' :
                                                    'bg-blue-600'
                                                }`}
                                            style={{ width: `${activity.progress}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-[32px] p-8 border border-slate-100 mt-6 font-inter">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Executed</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-slate-800 tracking-tighter">{activity.done}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QTY</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">Remaining</span>
                                            <div className="flex items-baseline gap-1 justify-end">
                                                <span className="text-xl font-black text-slate-600 tracking-tighter">{activity.remaining}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QTY</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 pt-4 border-t border-slate-50 italic">
                                        <div className="flex justify-between items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">Genesis</span>
                                                <span className="text-[11px] font-black text-slate-600 italic tracking-tighter">{activity.start}</span>
                                            </div>
                                            <div className="w-8 h-px bg-slate-100" />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">Deadline</span>
                                                <span className="text-[11px] font-black text-slate-600 italic tracking-tighter">{activity.end}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            {/* Sync Progress Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Synchronize Field Progress"
                maxWidth="max-w-5xl"
            >
                <div className="p-12 bg-white">
                    <form id="progress-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Activity Framework */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                <h3 className="admin-pulse-form-section-title">Activity Framework</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Activity Name</label>
                                    <select
                                        name="activityName"
                                        value={formData.activityName}
                                        onChange={handleChange}
                                        className={`admin-pulse-form-input ${errors.activityName ? 'border-rose-300' : ''}`}
                                    >
                                        <option value="">Select Activity...</option>
                                        <option>Excavation</option>
                                        <option>RCC Work</option>
                                        <option>Brickwork</option>
                                        <option>Plastering</option>
                                        <option>Flooring</option>
                                    </select>
                                    {errors.activityName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.activityName}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">BOQ Code</label>
                                    <input
                                        type="text"
                                        name="boqCode"
                                        value={formData.boqCode}
                                        onChange={handleChange}
                                        placeholder="e.g. CV-201"
                                        className={`admin-pulse-form-input font-mono ${errors.boqCode ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.boqCode && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.boqCode}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Planned Quantity</label>
                                    <input
                                        type="number"
                                        name="plannedQty"
                                        value={formData.plannedQty}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`admin-pulse-form-input text-blue-600 ${errors.plannedQty ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.plannedQty && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.plannedQty}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Execution Velocity */}
                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-green-500" />
                                <h3 className="admin-pulse-form-section-title">Execution Velocity</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Today's Progress</label>
                                    <input
                                        type="number"
                                        name="todayProgress"
                                        value={formData.todayProgress}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`admin-pulse-form-input text-2xl ${errors.todayProgress ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.todayProgress && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.todayProgress}</p>}
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Total Completed</label>
                                    <input type="text" readOnly value={formData.totalCompleted} className="admin-pulse-form-input bg-white/50 border-dashed" />
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Remaining Quantity</label>
                                    <input type="text" readOnly value={formData.remainingQty} className="admin-pulse-form-input bg-white/50 border-dashed" />
                                </div>

                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">% Completion</label>
                                    <div className="relative">
                                        <input type="text" readOnly value={`${formData.percentage}%`} className="admin-pulse-form-input text-blue-600 font-black border-blue-200 bg-blue-50/20" />
                                        <div className="absolute bottom-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${formData.percentage}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline & Status */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-amber-500" />
                                <h3 className="admin-pulse-form-section-title">Timeline & Status</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="admin-pulse-form-input" />
                                    {errors.startDate && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.startDate}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="admin-pulse-form-input" />
                                    {errors.endDate && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.endDate}</p>}
                                </div>

                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Status Override</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="admin-pulse-form-input">
                                        <option>On Track</option>
                                        <option>Ahead of Schedule</option>
                                        <option>Slight Delay</option>
                                        <option>Critical Delay</option>
                                    </select>
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Phase Completion Status</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{formData.percentage || 0}% Reached</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Cancel</button>
                    <button type="submit" form="progress-form" className="admin-pulse-btn-primary">Synchronize Milestone Progress</button>
                </div>
            </Modal>

            {/* Detailed View Modal */}
            <Modal
                isOpen={!!selectedActivity}
                onClose={() => setSelectedActivity(null)}
                title="Activity Execution Intelligence"
                maxWidth="max-w-4xl"
            >
                {selectedActivity && (
                    <div className="p-10 bg-white">
                        {/* Premium Banner */}
                        <div className="admin-pulse-details-banner">
                            <div className="admin-pulse-details-icon-container">
                                {selectedActivity.status === 'Ahead' ? '🚀' : selectedActivity.status === 'Delay' ? '⚠️' : '🏗️'}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedActivity.boq}</h2>
                                    <span className={`admin-pulse-status-badge ${selectedActivity.status === 'Ahead' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                        selectedActivity.status === 'Delay' ? 'bg-rose-500/20 text-rose-100 border-rose-500/30' :
                                            'bg-blue-500/20 text-blue-100 border-blue-500/30'
                                        } backdrop-blur-md border`}>
                                        {selectedActivity.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase">{selectedActivity.name}</h3>
                                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Operational Vector: INFRA-EXEC-SYNC</p>
                            </div>
                    
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Left Column: Quantum Fulfillment */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Quantum Fulfillment</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Planned Quantity</span>
                                            <p className="admin-pulse-details-value">{selectedActivity.planned} QTY</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Actual Executed</span>
                                            <p className="admin-pulse-details-value text-blue-600">{selectedActivity.done} QTY</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Remaining Balance</span>
                                            <p className="admin-pulse-details-value text-slate-400">{selectedActivity.remaining} QTY</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Completion Radius</span>
                                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{selectedActivity.progress}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Velocity Marker</span>
                                        <p className="text-sm font-black text-slate-800 italic">"Progressing within protocol thresholds."</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Temporal Mapping */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Temporal Mapping</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Genesis Date</span>
                                            <p className="admin-pulse-details-value">{selectedActivity.start}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Deadline Buffer</span>
                                            <p className="admin-pulse-details-value">{selectedActivity.end}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Status Remarks</h3>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 italic">
                                        <p className="text-[13px] font-bold text-slate-600 leading-relaxed">
                                            "{selectedActivity.status === 'Ahead' ? 'Performance exceeding baseline expectations. Resource allocation optimal.' :
                                                selectedActivity.status === 'Delay' ? 'Operational bottlenecks identified in resource inflow. Mitigating critical path delays.' :
                                                    'Execution following planned trajectory with minor fluctuations.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">EXECUTION HASH: 8f2b-{selectedActivity.boq}-4d92</span>
                            <button onClick={() => setSelectedActivity(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12">
                                Close Execution Intel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default DailyProgressEntryPage;
