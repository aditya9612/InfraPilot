import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialChecklists = [
    { id: 1, name: "End of Day Site Security", type: "Daily", items: ["Check all main gates", "Verify equipment lockup", "Backup CCTV logs", "Lights off in Block A"], status: "Pending", remarks: "Security guard to verify finally." },
    { id: 2, name: "Column Casting Preparation", type: "Activity", items: ["Check shuttering alignment", "Verify reinforcement as per drawing", "Slump test kit ready", "Vibrator functional check"], status: "Done", remarks: "Approved by structural engineer." },
    { id: 3, name: "Batching Plant Startup", type: "Daily", items: ["Check aggregate moisture", "Calibrate weighing scales", "Verify water supply", "Admixture level check"], status: "Pending", remarks: "Awaiting calibration tech." },
];

const ChecklistsPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<typeof initialChecklists[0] | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "Daily",
        items: ["", ""], // Initial 2 empty items
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
        if (formData.items.length <= 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Checklist name is required";

        const filledItems = formData.items.filter(i => i.trim() !== "");
        if (filledItems.length === 0) newErrors.items = "At least one checklist item is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill required fields", { position: "top-right" });
            return;
        }
        toast.success("Checklist saved successfully!", { position: "top-right" });
        setShowForm(false);
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            name: "",
            type: "Daily",
            items: ["", ""],
            status: "Pending",
            remarks: ""
        });
        setErrors({});
    };

    return (
        <>
            <Navbar title="Checklists & Inspections" breadcrumb={["Engineer", "Checklists"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Standardized Checks</h1>
                            <p className="text-slate-500 text-sm">Ensure all quality and operational protocols are followed.</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'}`}
                        >
                            {showForm ? 'Cancel Entry' : '+ Create New Checklist'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="mb-12 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Define Inspection Protocol
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.name ? 'text-rose-500' : 'text-slate-400'}`}>Checklist Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Scaffolding Inspection - West Wing"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.name ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                        {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Checklist Type</label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px] appearance-none"
                                        >
                                            <option>Daily</option>
                                            <option>Activity</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${errors.items ? 'text-rose-500' : 'text-slate-400'}`}>Protocol Item List</label>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.items.map((item, index) => (
                                            <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                                                <div className="w-8 h-[48px] bg-slate-50 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-100 italic">{index + 1}</div>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleItemChange(index, e.target.value)}
                                                    placeholder="Specify point of inspection..."
                                                    className="flex-1 px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-primary/10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="w-12 h-[48px] flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.items && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.items}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[52px]">
                                            {['Pending', 'Done'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, status: s }))}
                                                    className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${formData.status === s ? (s === 'Done' ? 'bg-emerald-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md') : 'text-slate-400'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remarks / Observations</label>
                                        <input
                                            type="text"
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            placeholder="General comments about findings..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 max-w-md ml-auto">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        Clear Draft
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                                    >
                                        Finalize & Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {initialChecklists.map(c => (
                            <div key={c.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${c.type === 'Daily' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                                        {c.type} Checklist
                                    </span>
                                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${c.status === 'Done' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {c.status}
                                    </div>
                                </div>
                                <h3 className="font-black text-slate-800 text-xl mb-4 tracking-tight leading-tight group-hover:text-primary transition-colors">{c.name}</h3>

                                <div className="space-y-4 mb-8 flex-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protocol Points</p>
                                    <div className="space-y-2">
                                        {c.items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-md border border-slate-100 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 line-clamp-1">{item}</p>
                                            </div>
                                        ))}
                                        {c.items.length > 3 && (
                                            <p className="text-[10px] font-black text-primary tracking-widest mt-2">{c.items.length - 3} MORE POINTS</p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Remarks</p>
                                        <p className="text-[10px] text-slate-400 italic font-medium line-clamp-1">"{c.remarks || "No notes."}"</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedChecklist(c)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm group/btn"
                                    >
                                        <svg className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Premium Detail Modal */}
                    {selectedChecklist && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedChecklist(null)}>
                            <div
                                className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-0 relative">
                                    {/* Premium Header - Admin Style */}
                                    <div className="relative overflow-hidden bg-primary p-8 md:p-10 text-white shadow-xl">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl shadow-xl shrink-0">
                                                <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                                                    {selectedChecklist.name.charAt(0)}
                                                </span>
                                            </div>

                                            <div className="text-center md:text-left space-y-2 flex-1">
                                                <div className="flex flex-col md:flex-row items-center gap-3">
                                                    <h3 className="text-2xl font-black tracking-tight">{selectedChecklist.name}</h3>
                                                    <span className={`px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedChecklist.status === 'Pending' ? 'text-amber-200' : 'text-emerald-300'}`}>
                                                        {selectedChecklist.status}
                                                    </span>
                                                </div>
                                                <p className="text-white/70 text-sm font-bold flex items-center justify-center md:justify-start gap-2 italic">
                                                    {selectedChecklist.type} Protocol | Ref: #CHK-0{selectedChecklist.id}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => setSelectedChecklist(null)}
                                                className="absolute top-0 right-0 md:relative md:top-auto md:right-auto w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 md:p-10 max-h-[60vh] overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                            {/* Protocol Overview */}
                                            <Section
                                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                                                title="Full Checklist Items"
                                                fullWidth
                                            >
                                                <div className="grid grid-cols-1 gap-3">
                                                    {selectedChecklist.items.map((item, index) => (
                                                        <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
                                                            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-emerald-200">
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-slate-300 uppercase tracking-tighter">Point {index + 1}</p>
                                                                <p className="text-sm font-bold text-slate-700">{item}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Section>

                                            {/* Remarks & Notes */}
                                            <Section
                                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
                                                title="Engineering Remarks"
                                                fullWidth
                                            >
                                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100/30">
                                                    <p className="text-sm font-bold text-amber-900 leading-relaxed italic italic">
                                                        "{selectedChecklist.remarks || "No critical observations were recorded for this checklist session."}"
                                                    </p>
                                                </div>
                                            </Section>

                                            <div className="md:col-span-2 grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[24px]">
                                                <InfoItem label="Inspection Type" value={selectedChecklist.type} />
                                                <InfoItem label="Compliance Status" value={selectedChecklist.status} valueClass={selectedChecklist.status === 'Done' ? 'text-emerald-600' : 'text-amber-600'} />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedChecklist(null)}
                                            className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-black hover:-translate-y-1 transition-all active:scale-95"
                                        >
                                            Dismiss Protocol View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>
        </>
    );
};

// --- Helper Components for Premium Detail View ---

const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, fullWidth?: boolean }> = ({ icon, title, children, fullWidth }) => (
    <div className={`space-y-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="text-primary">{icon}</div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h4>
        </div>
        <div className="space-y-4 pt-1">
            {children}
        </div>
    </div>
);

const InfoItem: React.FC<{ label: string, value: string, valueClass?: string }> = ({ label, value, valueClass }) => (
    <div className="group">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">{label}</p>
        <p className={`text-sm font-bold text-slate-800 ${valueClass}`}>{value || '—'}</p>
    </div>
);

export default ChecklistsPage;
