import React, { useState } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const ChecklistsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
    const [checklists, setChecklists] = useState([
        { id: 1, name: "Concrete Pouring - Foundation", items: ["Check forms", "Inspect rebar", "Verify slump test"], status: "Done", remarks: "All criteria met for Block A pour.", date: "2024-03-15" },
        { id: 2, name: "Post-Tensioning Audit", items: ["Verify strand layout", "Check duct integrity", "Anchor alignment"], status: "Pending", remarks: "Waiting for structural engineer.", date: "2024-03-20" },
        { id: 3, name: "Mechanical & Electrical Rough-in", items: ["Check conduit routing", "Verify box placement"], status: "Done", remarks: "Passed initial inspection.", date: "2024-04-01" },
    ]);

    const [formData, setFormData] = useState({
        name: "",
        items: [""],
        status: "Pending",
        remarks: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const upd = { ...prev };
                delete upd[name];
                return upd;
            });
        }
    };

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...formData.items];
        newItems[index] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, ""] }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, items: newItems }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Required";
        if (formData.items.some(item => !item.trim())) newErrors.items = "All items required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newChecklist = {
            id: Date.now(),
            ...formData,
            items: formData.items.filter(i => i.trim()),
            date: new Date().toISOString().split("T")[0]
        };

        toast.loading("Configuring Protocol...");
        setTimeout(() => {
            setChecklists([newChecklist, ...checklists]);
            toast.dismiss();
            toast.success("Protocol Registered!");
            setIsFormModalOpen(false);
            setFormData({
                name: "",
                items: [""],
                status: "Pending",
                remarks: ""
            });
        }, 1200);
    };

    return (
        <>
            <Navbar
                title="Compliance Vault"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Compliance"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Compliance Checkpoints</h1>
                        <p className="text-slate-500 text-sm font-medium">Maintain high-spec compliance through dynamic verification protocols and audit trails.</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + INITIATE AUDIT
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Audit Intelligence
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Audits"
                            value="284"
                            sub="+12 Today"
                            accent="text-primary"
                        />
                        <StatCard
                            title="Compliance"
                            value="98.2%"
                            sub="Optimum"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Pending"
                            value="14"
                            sub="Urgent"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Efficiency"
                            value="A+"
                            sub="High Spec"
                            accent="text-purple-600"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 mb-24">
                    {checklists.map((checklist) => (
                        <div
                            key={checklist.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                            onClick={() => setSelectedChecklist(checklist)}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600" />

                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs shadow-sm group-hover:rotate-6 transition-all">
                                📄
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">CP-{checklist.id}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest ${checklist.status === 'Done' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                                        {checklist.status}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{checklist.date}</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Protocol Specification</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{checklist.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Verification Points</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase">{checklist.items.length} Points</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Compliance Integrity</span>
                                        <p className={`text-[11px] font-black ${checklist.status === 'Done' ? 'text-emerald-600' : 'text-amber-600'} uppercase`}>{checklist.status === 'Done' ? 'CERTIFIED' : 'PENDING'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Vault Pulse</span>
                                        <p className="text-[11px] font-black text-blue-600 uppercase">ACTIVE SYNC</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Audit Narrative</span>
                                    <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"{checklist.remarks}"</p>
                                </div>
                            </div>

                            <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                →
                            </button>
                        </div>
                    ))}
                </div>

                <Modal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    title="Verification Protocol Initiation"
                    maxWidth="max-w-4xl"
                >
                    <div className="admin-pulse-modal-body p-12 bg-white">
                        <form id="checklist-form" onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-6">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                    <h3 className="admin-pulse-form-section-title">Metadata Profile</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required">Checklist Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. SLAB CASTING INSPECTION" className="admin-pulse-form-input font-black " />
                                        {errors.name && <p className="text-[10px] font-bold text-red-500 px-1">{errors.name}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required">Initial Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className="admin-pulse-form-input font-black appearance-none cursor-pointer">
                                            <option value="Pending">Pending Audit</option>
                                            <option value="Done">Fully Compliant</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="admin-pulse-form-section-header">
                                        <div className="admin-pulse-form-section-indicator bg-indigo-600" />
                                        <h3 className="admin-pulse-form-section-title">Verification Points</h3>
                                    </div>
                                    <button type="button" onClick={addItem} className="text-[10px] font-black text-blue-600  tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                        + Add Point
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0 ">{index + 1}</div>
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => handleItemChange(index, e.target.value)}
                                                placeholder="Identify verification parameter..."
                                                className="flex-1 admin-pulse-form-input font-bold"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="w-12 h-12 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {errors.items && <p className="text-[10px] font-bold text-red-500 text-center ">{errors.items}</p>}
                            </div>

                            <div className="space-y-6">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-slate-400" />
                                    <h3 className="admin-pulse-form-section-title">Engineering Remarks</h3>
                                </div>
                                <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} placeholder="Document deviations..." className="admin-pulse-form-input font-bold" />
                            </div>
                        </form>
                    </div>

                    <div className="admin-pulse-modal-footer bg-slate-50/50 p-12 border-t border-slate-100 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => setIsFormModalOpen(false)}
                            className="px-8 py-5 text-[11px] font-black text-slate-400  tracking-[0.2em] hover:text-slate-800 transition-all"
                        >
                            Discard Protocol
                        </button>
                        <button
                            type="submit"
                            form="checklist-form"
                            className="px-14 py-5 bg-primary text-white text-[11px] font-black  tracking-[0.3em] rounded-[24px] shadow-2xl shadow-primary/30 hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            Register Protocol
                        </button>
                    </div>
                </Modal>

                {selectedChecklist && (
                    <Modal
                        isOpen={!!selectedChecklist}
                        onClose={() => setSelectedChecklist(null)}
                        title="Verification Protocol Intelligence"
                        maxWidth="max-w-4xl"
                    >
                        <div className="p-10 bg-white">
                            {/* Premium Banner */}
                            <div className="admin-pulse-details-banner">
                                <div className="admin-pulse-details-icon-container bg-blue-600">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedChecklist.name}</h2>
                                        <span className={`admin-pulse-status-badge ${selectedChecklist.status === 'Done' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                            'bg-amber-500/20 text-amber-100 border-amber-500/30 animate-pulse'
                                            } backdrop-blur-md border`}>
                                            {selectedChecklist.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Compliance Protocol</h3>
                                        <span className="px-3 py-1 bg-slate-800 text-blue-400 rounded-lg text-[9px] font-black tracking-[0.2em] border border-slate-700">
                                            {selectedChecklist.items.length} VERIFICATION POINTS
                                        </span>
                                    </div>
                                    <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Protocol Hash: CP-{selectedChecklist.id}-VAULT</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-12">
                                {/* Verification Points Column */}
                                <div className="col-span-3 space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Verification Intelligence</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {selectedChecklist.items.map((item: string, i: number) => (
                                                <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:border-blue-200 transition-all group">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm shrink-0">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </div>
                                                    <p className="text-sm font-black text-slate-700 leading-tight uppercase italic">{item}</p>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-emerald-600 tracking-widest uppercase">Validated</span>
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] shadow-lg shadow-emerald-200">
                                                            ✓
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks & Actions Column */}
                                <div className="col-span-2 space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Engineering Artifact</h3>
                                        </div>
                                        <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 min-h-[350px] font-black uppercase shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
                                            <span className="admin-pulse-details-label mb-6 block underline underline-offset-4 decoration-slate-700 uppercase font-black text-slate-400">Deviation Narrative</span>
                                            <p className="text-base font-bold text-white leading-[1.8] italic uppercase font-black tracking-tight">
                                                "{selectedChecklist.remarks || "NO DEVIATIONS ENCOUNTERED. SYSTEM COMPLIANCE AT OPTIMUM LEVELS."}"
                                            </p>
                                            <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                                                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">AUDIT TIMESTAMP: {selectedChecklist.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between font-black uppercase">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-black">Compliance Integrity</span>
                                            <p className="text-2xl font-black text-slate-800 tracking-tighter italic font-black">{selectedChecklist.status === 'Done' ? 'CERTIFIED' : 'PENDING'}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedChecklist.status === 'Done' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-amber-600 shadow-amber-500/20'}`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">VERIFICATION PROTOCOL ARCHIVED IN COMPLIANCE VAULT</span>
                                <button onClick={() => setSelectedChecklist(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                    Archive Protocol
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </PageTransition >
        </>
    );
};

export default ChecklistsPage;
