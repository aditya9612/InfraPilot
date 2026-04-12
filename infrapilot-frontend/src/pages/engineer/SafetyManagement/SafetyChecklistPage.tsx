import { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
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
        toast.success("HSE Compliance Ledger Synchronized", { position: "top-right" });
    };

    return (
        <>
            <Navbar
                title="HSE Protocol Dashboard"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Safety"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Safety Audit Matrix</h2>
                        <p className="text-slate-500 text-sm font-medium">Daily verification of PPE and structural safety standards.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            SYNC COMPLIANCE
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Compliance Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Checklists Done"
                            value="12"
                            sub="Completed protocol logs"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Hazards Found"
                            value="03"
                            sub="Identified site risks"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Mitigations"
                            value="02"
                            sub="Corrective actions taken"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Safety Score"
                            value="98%"
                            sub="Protocol adherence"
                            accent="text-blue-500"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        HSE Compliance Ledger
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {checklist.map(item => (
                            <div key={item.id} className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden">
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all ${item.status === 'Yes' ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : item.status === 'No' ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]" : "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    }`} />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-[22px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[11px] font-black transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm ${item.status === 'Yes' ? 'text-emerald-600' : item.status === 'No' ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {item.item.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 block">PROTOCOL HSE-00{item.id}</span>
                                            <h3 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors uppercase leading-tight">{item.item}</h3>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border transition-all ${item.status === 'Yes' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : item.status === 'No' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {item.status === 'Yes' ? 'COMPLIANT' : item.status === 'No' ? 'VIOLATION' : 'PENDING'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-50 mt-auto">
                                    <button
                                        onClick={() => handleStatusChange(item.id, 'Yes')}
                                        className={`flex-1 py-3 rounded-2xl text-[9px] font-black tracking-widest transition-all ${item.status === 'Yes' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                    >PASS</button>
                                    <button
                                        onClick={() => handleStatusChange(item.id, 'No')}
                                        className={`flex-1 py-3 rounded-2xl text-[9px] font-black tracking-widest transition-all ${item.status === 'No' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600'}`}
                                    >FAIL</button>
                                    <button
                                        onClick={() => handleStatusChange(item.id, 'Pending')}
                                        className={`flex-1 py-3 rounded-2xl text-[9px] font-black tracking-widest transition-all ${item.status === 'Pending' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-300 hover:bg-amber-50 hover:text-amber-600'}`}
                                    >AUDIT</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>
        </>
    );
};

export default SafetyChecklistPage;
