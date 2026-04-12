import React, { useState, useEffect } from "react";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import toast from "react-hot-toast";

const DSRPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");

    const [formData, setFormData] = useState({
        report_date: new Date().toISOString().split("T")[0],
        projectName: "Skyline Tower A",
        site_location: "Sector 45, Gurgaon",
        weather: "Clear",
        work_done: "",
        work_planned: "",
        labour_count_skilled: "",
        labour_count_unskilled: "",
        contractor_name: "",
        machinery_used: "",
        material_received: "",
        material_consumed: "",
        issues: "",
        safety_observations: "",
        remarks: "",
        gps_location: "Fetching...",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photos, setPhotos] = useState<File[]>([]);

    const [dsrHistory] = useState([
        {
            id: "DSR-1024",
            date: "2026-04-10",
            project: "Skyline Tower A",
            status: "Verified",
            laborSkilled: 45,
            laborUnskilled: 75,
            issues: "None",
            weather: "Clear",
            workDone: "Raft casting completed for Block A",
            workPlanned: "Column reinforcement for Level 1",
            contractor: "L&T Construction",
            machinery: "Excavator EX-200, Concrete Pump",
            materialReceived: "500 Bags OPC Cement",
            materialConsumed: "320 Bags OPC Cement",
            safety: "All PPE protocols followed.",
            remarks: "Progress ahead of schedule.",
            gps: "28.4595° N, 77.0266° E",
            siteLocation: "Sector 45, Gurgaon"
        },
        {
            id: "DSR-1023",
            date: "2026-04-09",
            project: "Skyline Tower A",
            status: "Verified",
            laborSkilled: 40,
            laborUnskilled: 75,
            issues: "Slight delay in material delivery",
            weather: "Cloudy",
            workDone: "Excavation for basement reach P2",
            workPlanned: "Finish excavation and start blinding",
            contractor: "L&T Construction",
            machinery: "JCB 3DX, Dumper T-12",
            materialReceived: "Steel 12 Tons",
            materialConsumed: "Steel 2 Tons",
            safety: "Minor trip hazard identified and cleared.",
            remarks: "Material vendor notified of delay.",
            gps: "28.4595° N, 77.0266° E",
            siteLocation: "Sector 45, Gurgaon"
        },
    ]);

    useEffect(() => {
        if (isFormModalOpen) {
            captureGPS();
        }
    }, [isFormModalOpen]);

    const captureGPS = () => {
        setGpsStatus("capturing");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lng = position.coords.longitude.toFixed(6);
                    setFormData(prev => ({ ...prev, gps_location: `${lat}° N, ${lng}° E` }));
                    setGpsStatus("captured");
                },
                (error) => {
                    console.error("GPS Error:", error);
                    setGpsStatus("error");
                    setFormData(prev => ({ ...prev, gps_location: "Access Denied" }));
                    toast.error("Location access denied.");
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setGpsStatus("error");
            setFormData(prev => ({ ...prev, gps_location: "Not Supported" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.projectName) newErrors.projectName = "Required";
        if (!formData.site_location) newErrors.site_location = "Required";
        if (!formData.contractor_name) newErrors.contractor_name = "Required";
        if (!formData.work_done) newErrors.work_done = "Required";
        if (!formData.labour_count_skilled) newErrors.labour_count_skilled = "Required";
        if (!formData.labour_count_unskilled) newErrors.labour_count_unskilled = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setPhotos([...photos, ...Array.from(e.target.files)]);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        toast.loading("Synchronizing DSR Registry...", { id: "dsr-sub" });
        setTimeout(() => {
            toast.success("Report Protocol Registered!", { id: "dsr-sub" });
            setIsFormModalOpen(false);
            setPhotos([]);
            setFormData({
                report_date: new Date().toISOString().split("T")[0],
                projectName: "Skyline Tower A",
                site_location: "Sector 45, Gurgaon",
                weather: "Clear",
                work_done: "",
                work_planned: "",
                labour_count_skilled: "",
                labour_count_unskilled: "",
                contractor_name: "",
                machinery_used: "",
                material_received: "",
                material_consumed: "",
                issues: "",
                safety_observations: "",
                remarks: "",
                gps_location: "Fetching...",
            });
        }, 1500);
    };

    return (
        <>
            <Navbar
                title="Daily Site Ledger"
                breadcrumb={["InfraPilot", "Field Archive", "DSR Operational Hub"]}
                            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Site Performance Intel</h1>
                        <p className="text-slate-500 text-sm font-medium">Comprehensive field documentation and operational synchronization across project verticals.</p>
                    </div><div className="flex gap-1">
                        <button 
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + CREATE PROTOCOL
                        </button>
                    </div>
                   
                </div>

                <section className="mb-10">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Field Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Submissions"
                            value="124"
                            sub="+3 this month"
                            accent="text-primary"
                        />
                        <StatCard
                            title="HSE Compliance"
                            value="100%"
                            sub="Protocol Active"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Workforce Avg"
                            value="118"
                            sub="Syncing..."
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Constraint Logs"
                            value="02"
                            sub="High Priority"
                            accent="text-rose-500"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Operational Record Ledger
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        {dsrHistory.map((report) => (
                            <div
                                key={report.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedReport(report)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter">{report.id}</span>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded">{report.status}</span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{report.date}</span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Contractor / Entity</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{report.contractor}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Labor Force</span>
                                            <p className="text-[11px] font-black text-slate-700">S: {report.laborSkilled} | U: {report.laborUnskilled}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Weather</span>
                                            <p className="text-[11px] font-black text-primary uppercase">{report.weather}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">GPS Vector</span>
                                            <p className="text-[10px] font-mono text-slate-400">{report.gps}</p>
                                        </div>
                    
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Core Work Summary</span>
                                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic">"{report.workDone}"</p>
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

            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title="Operational Registry Protocol"
                maxWidth="max-w-5xl"
            >
                <div className="admin-pulse-modal-body bg-white p-10">
                    <form id="dsr-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Phase 1: Context Mastery */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800  tracking-widest leading-none">Context & Location Intel</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Project Identification</label>
                                    <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} placeholder="e.g. SKYLINE TOWERS PHASE 2" className={`admin-pulse-form-input font-black  ${errors.projectName ? 'border-rose-300' : ''}`} />
                                    {errors.projectName && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.projectName}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Registry Date</label>
                                    <input type="date" name="report_date" value={formData.report_date} onChange={handleChange} className="admin-pulse-form-input font-black" />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Site Coordinates / Location</label>
                                    <input type="text" name="site_location" value={formData.site_location} onChange={handleChange} placeholder="e.g. ZONE B, SECTOR 4" className={`admin-pulse-form-input font-black  ${errors.site_location ? 'border-rose-300' : ''}`} />
                                    {errors.site_location && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.site_location}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Weather Delta</label>
                                    <select name="weather" value={formData.weather} onChange={handleChange} className="admin-pulse-form-input font-black  appearance-none cursor-pointer">
                                        <option>Clear / Optimal</option>
                                        <option>Cloudy / Overcast</option>
                                        <option>Rainy / High Moisture</option>
                                        <option>Extreme Heat / Stress</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">GPS Vector (Auto-Capture)</label>
                                    <div className="relative">
                                        <input type="text" value={formData.gps_location} readOnly className="admin-pulse-form-input font-mono text-[10px] bg-slate-50 border-dashed tracking-normal" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${gpsStatus === 'captured' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                            <span className="text-[8px] font-black text-slate-400  tracking-widest">{gpsStatus === 'captured' ? 'Secured' : 'Syncing'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phase 2: Execution Dynamics */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800  tracking-widest leading-none">Operational Dynamics</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Work Accomplished Today</label>
                                    <textarea name="work_done" rows={3} value={formData.work_done} onChange={handleChange} placeholder="DOCUMENT DETAILED MILESTONES..." className={`admin-pulse-form-input font-black  resize-none ${errors.work_done ? 'border-rose-300' : ''}`} />
                                    {errors.work_done && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.work_done}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Future Forecast (Tomorrow)</label>
                                    <textarea name="work_planned" rows={3} value={formData.work_planned} onChange={handleChange} placeholder="ANTICIPATED OBJECTIVES..." className="admin-pulse-form-input font-black  resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Phase 3: Logistics & Assets */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800  tracking-widest leading-none">Logistics & Asset Ledger</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Contractor Entity</label>
                                    <input type="text" name="contractor_name" value={formData.contractor_name} onChange={handleChange} placeholder="e.g. L&T INFRA" className={`admin-pulse-form-input font-black  ${errors.contractor_name ? 'border-rose-300' : ''}`} />
                                    {errors.contractor_name && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.contractor_name}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Machinery Deployment</label>
                                    <input type="text" name="machinery_used" value={formData.machinery_used} onChange={handleChange} placeholder="e.g. TOWER CRANE TC-1, CONCRETE PUMP..." className="admin-pulse-form-input font-black " />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Material Inflow (Received)</label>
                                    <input type="text" name="material_received" value={formData.material_received} onChange={handleChange} placeholder="e.g. 500 BAGS CEMENT" className="admin-pulse-form-input font-black " />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Material Outflow (Consumed)</label>
                                    <input type="text" name="material_consumed" value={formData.material_consumed} onChange={handleChange} placeholder="e.g. 320 BAGS CEMENT" className="admin-pulse-form-input font-black " />
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Operational Constraint Delta</label>
                                    <input type="text" name="issues" value={formData.issues} onChange={handleChange} placeholder="e.g. SITE ACCESS BLOCKADE" className="admin-pulse-form-input font-black " />
                                </div>
                            </div>
                        </div>

                        {/* Phase 4: Workforce & HSE */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800  tracking-widest leading-none">Workforce & HSE Protocol</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">Skilled Force</label>
                                    <input type="number" name="labour_count_skilled" value={formData.labour_count_skilled} onChange={handleChange} className="admin-pulse-form-input font-black text-center text-xl" />
                                    {errors.labour_count_skilled && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1 text-center">{errors.labour_count_skilled}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-label-required">General workforce</label>
                                    <input type="number" name="labour_count_unskilled" value={formData.labour_count_unskilled} onChange={handleChange} className="admin-pulse-form-input font-black text-center text-xl" />
                                    {errors.labour_count_unskilled && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1 text-center">{errors.labour_count_unskilled}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">HSE Observations</label>
                                    <input type="text" name="safety_observations" value={formData.safety_observations} onChange={handleChange} placeholder="e.g. PPE COMPLIANT" className="admin-pulse-form-input font-black " />
                                </div>
                                <div className="col-span-4 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Engineer Strategic Remarks</label>
                                    <textarea name="remarks" rows={2} value={formData.remarks} onChange={handleChange} className="admin-pulse-form-input font-black  resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Phase 5: Optical Vault */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                                <h3 className="text-[13px] font-black text-slate-800  tracking-widest leading-none">Optical Evidence Vault</h3>
                            </div>
                            <div className="flex flex-wrap gap-6">
                                {photos.map((_, i) => (
                                    <div key={i} className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center relative overflow-hidden group">
                                        <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white  tracking-widest">Enlarge</span>
                                        </div>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-600 hover:bg-blue-50/10 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                    <input type="file" multiple onChange={handlePhotoUpload} className="hidden" />
                                    <span className="text-2xl font-black text-slate-300 group-hover:text-blue-600 group-hover:scale-125 transition-transform">+</span>
                                    <span className="text-[9px] font-black text-slate-400  tracking-widest group-hover:text-blue-600 mt-1">Capture</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="admin-pulse-modal-footer bg-slate-50/50 p-10 border-t border-slate-50 flex items-center justify-end gap-6">
                    <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-10 py-5 text-[11px] font-black text-slate-400  tracking-widest hover:text-slate-600 transition-all ">Discard Protocol</button>
                    <button type="submit" form="dsr-form" className="admin-pulse-button-primary px-12 py-5 font-black  tracking-widest !rounded-[24px]">REGISTER FIELD PROTOCOL</button>
                </div>
            </Modal>

            {/* Detailed View Modal */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Daily Site Intelligence Details"
                maxWidth="max-w-4xl"
            >
                {selectedReport && (
                    <div className="p-10 bg-white">
                        {/* Premium Banner */}
                        <div className="admin-pulse-details-banner">
                            <div className="admin-pulse-details-icon-container">
                                📄
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none">{selectedReport.id}</h2>
                                    <span className="admin-pulse-status-badge bg-white/20 text-white border border-white/30 backdrop-blur-md">
                                        {selectedReport.status}
                                    </span>
                                </div>
                                <p className="text-blue-100/80 text-sm font-bold tracking-tight mb-1">Project: {selectedReport.project}</p>
                                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Category: OPT-DSR-SECURE</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Left Column: Strategic Operations */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Strategic Operations</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Work Done (Today)</span>
                                            <p className="admin-pulse-details-value">{selectedReport.workDone}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Target Objectives (Tomorrow)</span>
                                            <p className="admin-pulse-details-value text-slate-500 font-medium italic">{selectedReport.workPlanned}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Logistics & Asset Hub</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Contractor Entity</span>
                                            <p className="admin-pulse-details-value">{selectedReport.contractor}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Machinery Deployment</span>
                                            <p className="admin-pulse-details-value">{selectedReport.machinery}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Material Inflow</span>
                                            <p className="admin-pulse-details-value text-emerald-600">{selectedReport.materialReceived}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Material Consumption</span>
                                            <p className="admin-pulse-details-value text-rose-600">{selectedReport.materialConsumed}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Workforce & Environment */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Workforce Dynamics</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Force Deployment</span>
                                            <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                                {selectedReport.laborSkilled + selectedReport.laborUnskilled}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold text-slate-500">S: <span className="text-blue-600">{selectedReport.laborSkilled}</span></p>
                                            <p className="text-[11px] font-bold text-slate-500">U: <span className="text-slate-800">{selectedReport.laborUnskilled}</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Site Climate & Location</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Weather Delta</span>
                                            <p className="admin-pulse-details-value">{selectedReport.weather}</p>
                                        </div>
                                        <div className="admin-pulse-details-group text-right">
                                            <span className="admin-pulse-details-label">GPS Vector</span>
                                            <p className="admin-pulse-details-value font-mono text-xs">{selectedReport.gps}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-rose-50/50 rounded-[32px] border border-rose-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/20 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:scale-150" />
                                    <span className="admin-pulse-details-label text-rose-600 mb-2">HSE Compliance & Remarks</span>
                                    <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">"{selectedReport.safety}"</p>
                                    <p className="text-[11px] font-medium text-slate-400 mt-4 leading-relaxed">{selectedReport.remarks}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">DSR ARCHIVAL REFERENCE: INFRA-{selectedReport.id}-2026</span>
                            <button onClick={() => setSelectedReport(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12">
                                Close Intelligence Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default DSRPage;
