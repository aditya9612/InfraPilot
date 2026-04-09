import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialChecklist = [
    { id: 1, item: "Hard Hats worn by all workers", status: "Yes" },
    { id: 2, item: "Safety Boots worn by all personnel", status: "Yes" },
    { id: 3, item: "High-Visibility Vests for all staff", status: "Yes" },
    { id: 4, item: "Scaffolding secure and inspected", status: "No" },
    { id: 5, item: "First Aid Kit accessible and stocked", status: "Yes" },
    { id: 6, item: "Electrical cables organized and safe", status: "Pending" },
    { id: 7, item: "Fall protection used for heights > 2m", status: "Yes" },
];

const SafetyChecklistPage = () => {
    const [checklist, setChecklist] = useState(initialChecklist);

    const handleStatusChange = (id: number, status: string) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const handleSave = () => {
        toast.success("Safety checklist updated successfully!", { position: "top-right" });
    };

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Checklist"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Safety Management</h1>
                        <p className="text-slate-500 text-sm">Verify PPE and site safety standards on a daily basis.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Safety Checklist
                        </button>
                        <Link to="/engineer/safety/incident" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Incident Report
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Critical Safety Compliance Log
                        </h2>
                        <button onClick={handleSave} className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                            Save Compliance Status
                        </button>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h2 className="font-bold text-slate-800 tracking-tight">Standard Safety Items</h2>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest">PASSED</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest">VIOLATION</span>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {checklist.map(item => (
                                <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm transition-all ${item.status === 'Yes' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' :
                                            item.status === 'No' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' :
                                                'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                                            }`}>
                                            {item.status === 'Yes' ? '✓' : item.status === 'No' ? '✗' : '!'}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 tracking-tight">{item.item}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {['Yes', 'No', 'Pending'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusChange(item.id, s)}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${item.status === s ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                                    }`}
                                            >
                                                {s === 'Yes' ? 'Pass' : s === 'No' ? 'Fail' : 'TBD'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default SafetyChecklistPage;
