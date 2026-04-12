import { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const IncidentReportPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<any>(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        safetyChecklistStatus: "Compliant",
        ppeCompliance: "Full",
        violationType: "",
        incidentDescription: "",
        injuryDetails: "None",
        actionTaken: "",
        responsiblePerson: "Karan Singh",
    });

    const [incidents, setIncidents] = useState([
        {
            id: 201,
            date: "2024-04-10",
            safetyChecklistStatus: "Non-Compliant",
            ppeCompliance: "Partial",
            violationType: "Fall Hazard",
            incidentDescription: "Scaffold board slipped during plastering in Zone B.",
            injuryDetails: "Minor abrasion on right forearm",
            actionTaken: "Immediate first aid applied, scaffold re-secured with hooks.",
            responsiblePerson: "Karan Singh"
        },
        {
            id: 202,
            date: "2024-04-09",
            safetyChecklistStatus: "Compliant",
            ppeCompliance: "None",
            violationType: "PPE Violation",
            incidentDescription: "Worker found without hard hat near heavy machinery entrance.",
            injuryDetails: "None",
            actionTaken: "Gate access revoked for 2 hours, safety retraining conducted.",
            responsiblePerson: "Karan Singh"
        },
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
        if (!formData.date) newErrors.date = "Required";
        if (!formData.violationType) newErrors.violationType = "Required";
        if (!formData.incidentDescription.trim()) newErrors.incidentDescription = "Required";
        if (!formData.actionTaken.trim()) newErrors.actionTaken = "Required";
        if (!formData.responsiblePerson.trim()) newErrors.responsiblePerson = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Safety Protocol Parameters Incomplete.");
            return;
        }

        const newIncident = {
            ...formData,
            id: Date.now(),
        };

        toast.loading("Synchronizing Safety Intelligence Log...", { id: "safety-load" });
        setTimeout(() => {
            setIncidents([newIncident, ...incidents]);
            toast.success("HSE Protocol Logged!", { id: "safety-load" });
            setIsModalOpen(false);
            handleReset();
        }, 1200);
    };

    const handleReset = () => {
        setFormData({
            date: new Date().toISOString().split("T")[0],
            safetyChecklistStatus: "Compliant",
            ppeCompliance: "Full",
            violationType: "",
            incidentDescription: "",
            injuryDetails: "None",
            actionTaken: "",
            responsiblePerson: "Karan Singh",
        });
        setErrors({});
    };

    return (
        <>
            <Navbar
                title="HSE Intelligence"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Safety"]}
                            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Safety Mishap Ledger</h1>
                        <p className="text-slate-500 text-sm font-medium">Documenting protocol violations, site injuries, and corrective diagnostics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + REPORT INCIDENT
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        HSE Vitals (Active)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Safe Man-Hours"
                            value="14.2k"
                            sub="LTI Free Cycle"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Total Deviations"
                            value="02"
                            sub="30d Flux"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Unresolved NCs"
                            value="01"
                            sub="Requires Closure"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="PPE Compliance"
                            value="98.4%"
                            sub="Site Benchmark"
                            accent="text-primary"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Incident Audit Matrix
                    </h2>
                    <div className="grid grid-cols-1 gap-6 mb-24">
                        {incidents.map((item) => (
                            <div
                                key={item.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedIncident(item)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-rose-500" />

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">HSE-{item.id}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${item.ppeCompliance === 'Full' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                                            PPE: {item.ppeCompliance.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{item.date}</span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Violation Classification</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{item.violationType}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Clinical Impact</span>
                                            <p className={`text-[11px] font-black ${item.injuryDetails !== 'None' ? 'text-rose-600' : 'text-blue-600'} uppercase`}>{item.injuryDetails}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Remediation Owner</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{item.responsiblePerson}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Audit Status</span>
                                            <p className={`text-[11px] font-black ${item.safetyChecklistStatus === 'Compliant' ? 'text-emerald-600' : 'text-rose-600'} uppercase`}>{item.safetyChecklistStatus}</p>
                                        </div>
                    
                                    </div>

                                    <div className="pt-2">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Incident Narrative Matrix</span>
                                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"{item.incidentDescription}"</p>
                                    </div>
                                </div>

                                <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                    →
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="HSE Mishap Protocol Recording"
                    maxWidth="max-w-5xl"
                >
                    <div className="p-12 bg-white">
                        <form id="incident-form" onSubmit={handleSubmit} className="space-y-12">
                            <div className="space-y-8">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.4)]" />
                                    <h3 className="admin-pulse-form-section-title">Incident Scope Identification</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-8">
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-required">Event Date</label>
                                        <input type="date" name="date" value={formData.date} onChange={handleChange} className={`admin-pulse-form-input ${errors.date ? 'border-rose-300' : ''}`} />
                                        {errors.date && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.date}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group col-span-2">
                                        <label className="admin-pulse-form-label admin-pulse-form-required">Violation Classification</label>
                                        <select
                                            name="violationType"
                                            value={formData.violationType}
                                            onChange={handleChange}
                                            className={`admin-pulse-form-input cursor-pointer ${errors.violationType ? 'border-rose-300' : ''}`}
                                        >
                                            <option value="">Select Violation Type...</option>
                                            <option>Fall from Height Hazard</option>
                                            <option>PPE Protocol Violation</option>
                                            <option>Machinery Operational Mishap</option>
                                            <option>Electrical Safety Breach</option>
                                            <option>Environmental Spill Event</option>
                                            <option>Fire Safety NC</option>
                                        </select>
                                        {errors.violationType && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.violationType}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-slate-800" />
                                    <h3 className="admin-pulse-form-section-title">Safety Compliance Baseline</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">Safety Checklist Status</label>
                                        <select name="safetyChecklistStatus" value={formData.safetyChecklistStatus} onChange={handleChange} className="admin-pulse-form-input font-black uppercase">
                                            <option>Compliant</option>
                                            <option>Non-Compliant</option>
                                            <option>Not Applicable</option>
                                        </select>
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">PPE Compliance State</label>
                                        <select name="ppeCompliance" value={formData.ppeCompliance} onChange={handleChange} className="admin-pulse-form-input font-black uppercase">
                                            <option>Full</option>
                                            <option>Partial</option>
                                            <option>None</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 ">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-rose-600" />
                                    <h3 className="admin-pulse-form-section-title !text-rose-600">Event Context & Clinical Impact</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="admin-pulse-form-group col-span-2">
                                        <label className="admin-pulse-form-label admin-pulse-form-required">Incident Description Matrix</label>
                                        <textarea name="incidentDescription" rows={3} value={formData.incidentDescription} onChange={handleChange} placeholder="DESCRIBE THE CRITICAL SEQUENCE OF EVENTS..." className={`admin-pulse-form-input resize-none p-6 ${errors.incidentDescription ? 'border-rose-300' : ''}`} />
                                        {errors.incidentDescription && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.incidentDescription}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group col-span-2">
                                        <label className="admin-pulse-form-label">Personnel Injury Details</label>
                                        <input type="text" name="injuryDetails" value={formData.injuryDetails} onChange={handleChange} placeholder="e.g. Laceration on left palm" className="admin-pulse-form-input uppercase font-bold" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 bg-slate-900 -mx-12 p-12 text-white italic">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-white" />
                                    <h3 className="admin-pulse-form-section-title !text-white">Action Protocol & Responsibility</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label !text-slate-400 admin-pulse-form-required">Immediate Remediation Taken</label>
                                        <input type="text" name="actionTaken" value={formData.actionTaken} onChange={handleChange} placeholder="ACTION EXECUTED" className={`admin-pulse-form-input !bg-slate-800 !border-slate-700 !text-white uppercase ${errors.actionTaken ? 'border-rose-500' : ''}`} />
                                        {errors.actionTaken && <p className="text-[10px] font-bold text-rose-400 mt-2 ">{errors.actionTaken}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label !text-slate-400 admin-pulse-form-required">Responsible Authority</label>
                                        <input type="text" name="responsiblePerson" value={formData.responsiblePerson} onChange={handleChange} className={`admin-pulse-form-input !bg-slate-800 !border-slate-700 !text-white uppercase ${errors.responsiblePerson ? 'border-rose-500' : ''}`} />
                                        {errors.responsiblePerson && <p className="text-[10px] font-bold text-rose-400 mt-2 ">{errors.responsiblePerson}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">HSE Severity Assessment</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{formData.injuryDetails !== 'None' ? 'CRITICAL INCIDENT' : 'PROTOCOL DEVIATION'}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.injuryDetails !== 'None' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Discard Mishap Log</button>
                        <button type="button" onClick={handleReset} className="admin-pulse-btn-text !text-blue-600 underline">Reset Values</button>
                        <button type="submit" form="incident-form" className="admin-pulse-btn-primary !bg-rose-600 hover:!bg-rose-700 shadow-rose-500/30">Synchronize HSE Log</button>
                    </div>
                </Modal>

                <Modal
                    isOpen={!!selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    title="HSE Incident Intelligence"
                    maxWidth="max-w-4xl"
                >
                    {selectedIncident && (
                        <div className="p-10 bg-white">
                            <div className="admin-pulse-details-banner !from-rose-600 !to-rose-800">
                                <div className="admin-pulse-details-icon-container !bg-white/10 !text-rose-100 backdrop-blur-md">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedIncident.violationType}</h2>
                                        <span className={`admin-pulse-status-badge ${selectedIncident.ppeCompliance === 'Full' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                            'bg-rose-500/20 text-rose-100 border-rose-500/30 animate-pulse'
                                            } backdrop-blur-md border`}>
                                            PPE: {selectedIncident.ppeCompliance.toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-rose-100/80 tracking-tight mb-2 uppercase">Safety Checklist: {selectedIncident.safetyChecklistStatus}</h3>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Safety Log: HSE-{selectedIncident.id}-CORE</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Event Identification</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label">Incident Date</span>
                                                <p className="admin-pulse-details-value">{selectedIncident.date}</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label">Checklist Status</span>
                                                <p className={`admin-pulse-details-value ${selectedIncident.safetyChecklistStatus === 'Compliant' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedIncident.safetyChecklistStatus.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Diagnostics & Narrative</h3>
                                        </div>
                                        <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                                            <span className="admin-pulse-details-label mb-3 block">Incident Description Matrix</span>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{selectedIncident.incidentDescription}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Remediation Protocol</h3>
                                        </div>
                                        <div className="space-y-8">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label">Corrective Action Taken</span>
                                                <p className="admin-pulse-details-value uppercase text-blue-600">{selectedIncident.actionTaken}</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label">Responsible HSE Authority</span>
                                                <p className="admin-pulse-details-value uppercase">{selectedIncident.responsiblePerson}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-rose-50/50 rounded-[32px] border border-rose-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Clinical Impact Summary</span>
                                            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-rose-200">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </div>
                                        <p className="text-xl font-black text-slate-800 tracking-tight uppercase">{selectedIncident.injuryDetails}</p>
                                        <p className="text-[10px] font-bold text-rose-400 mt-1 uppercase italic tracking-wider">
                                            {selectedIncident.injuryDetails !== 'None' ? 'MEDICAL INTERVENTION TRIGGERED' : 'PROTOCOL REINFORCEMENT REQUIRED'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">HSE-SYSTEM-AUTH: SECURE-LOG-v3.1</span>
                                <button onClick={() => setSelectedIncident(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12">
                                    Acknowledge & Close
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </PageTransition>
        </>
    );
};

export default IncidentReportPage;
