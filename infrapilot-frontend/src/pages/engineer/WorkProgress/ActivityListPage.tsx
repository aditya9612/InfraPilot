import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";

const initialActivities = [
    {
        id: 1,
        name: "Excavation",
        boqCode: "EX-001",
        plannedQty: "1200 m³",
        todayProgress: "85 m³",
        totalCompleted: "950 m³",
        remainingQty: "250 m³",
        percentage: 79,
        startDate: "2024-03-01",
        endDate: "2024-04-15",
        status: "On Track",
    },
    {
        id: 2,
        name: "RCC",
        boqCode: "CV-102",
        plannedQty: "450 m³",
        todayProgress: "0 m³",
        totalCompleted: "450 m³",
        remainingQty: "0 m³",
        percentage: 100,
        startDate: "2024-03-10",
        endDate: "2024-03-25",
        status: "Completed",
    },
    {
        id: 3,
        name: "Brickwork",
        boqCode: "CV-201",
        plannedQty: "180 m³",
        todayProgress: "12 m³",
        totalCompleted: "45 m³",
        remainingQty: "135 m³",
        percentage: 25,
        startDate: "2024-03-20",
        endDate: "2024-04-30",
        status: "Delay",
    },
];

const ActivityListPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const activities = initialActivities;
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

    const filteredActivities = activities.filter(
        (a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.boqCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar title="Project Velocity Dashboard" breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Work Progress", "Activities"]} />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter  mb-2">Project Execution Logic</h1>
                            <p className="text-slate-500 text-sm font-medium">Monitor and synchronize field progress with central project milestones.</p>
                        </div>
                    </div>

                    {/* Top Widgets */}
                    <div className="mb-10">
                        <h2 className="text-[10px] font-black text-slate-400  tracking-[0.3em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Velocity Vitals
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCard
                                title="Active Tasks"
                                value="12"
                                sub="Concurrent field activities"
                                accent="text-primary"
                            />
                            <StatCard
                                title="Progress Index"
                                value="68%"
                                sub="Aggregate completion"
                                accent="text-emerald-500" />
                            <StatCard
                                title="Critical Path"
                                value="04"
                                sub="Priority interventions"
                                accent="text-rose-500" />
                            <StatCard
                                title="Daily Vol"
                                value="450m³"
                                sub="Material deployment yield"
                                accent="text-blue-500" />
                        </div>
                    </div>


                    {/* Features Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[
                            {
                                name: "Resource Drift",
                                label: "Variance Analysis",
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ),
                                color: "text-blue-600",
                                bg: "bg-blue-50"
                            },
                            {
                                name: "Critical Path",
                                label: "Chronology Audit",
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ),
                                color: "text-emerald-600",
                                bg: "bg-emerald-50"
                            },
                            {
                                name: "Real-time Delta",
                                label: "Velocity Tracking",
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                ),
                                color: "text-purple-600",
                                bg: "bg-purple-50"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:translate-y-[-4px] group cursor-pointer active:scale-95">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                                        {feature.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-800  text-[10px] tracking-[0.2em]">{feature.name}</h3>
                                        <p className="text-xs font-bold text-slate-400  tracking-tight">{feature.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Tabs & Search */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                        <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit overflow-x-auto">
                            <button className="px-8 py-3 bg-white text-[10px] font-black  tracking-widest text-primary shadow-sm rounded-xl whitespace-nowrap">
                                Activity Ledger
                            </button>
                            <Link to="/engineer/progress/entry" className="px-8 py-3 text-[10px] font-black  tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                                Progress Synchronization
                            </Link>
                        </div>

                        <div className="relative w-full lg:w-96">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search activity or BOQ protocol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black  tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {filteredActivities.map((a) => (
                            <div
                                key={a.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedActivity(a)}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all ${a.status === "Completed" ? "bg-emerald-500" :
                                    a.status === "On Track" ? "bg-blue-600" :
                                        "bg-rose-500"
                                    }`} />

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1">BOQ Protocol {a.boqCode}</span>
                                            <span className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">{a.name}</span>
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] font-bold rounded-lg ml-auto ${a.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                                            a.status === "On Track" ? "bg-blue-50 text-blue-600" :
                                                "bg-rose-50 text-rose-600"
                                            }`}>{a.status}</span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Planned Quantity</span>
                                            <p className="text-[11px] font-black text-slate-700">{a.plannedQty}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Execution Window</span>
                                            <p className="text-[10px] font-black text-slate-500 italic">{a.startDate} → {a.endDate}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Today's Progress</span>
                                            <p className="text-[11px] font-black text-primary">{a.todayProgress}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Remaining</span>
                                            <p className="text-[11px] font-black text-rose-500">{a.remainingQty}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">Completion Trajectory</span>
                                            <span className="text-[10px] font-black text-slate-700">{a.percentage}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${a.percentage === 100 ? "bg-emerald-500" :
                                                    a.status === "Delay" ? "bg-rose-500" :
                                                        "bg-blue-600"
                                                    }`}
                                                style={{ width: `${a.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                    →
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Detail Modal */}
                    <Modal
                        isOpen={!!selectedActivity}
                        onClose={() => setSelectedActivity(null)}
                        title="Activity Lifecycle Intelligence"
                        maxWidth="max-w-2xl"
                    >
                        {selectedActivity && (
                            <div className="p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-300 tracking-[0.3em] uppercase mb-1 block">Core Identification</span>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{selectedActivity.name}</h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1 italic">BOQ System Identification: {selectedActivity.boqCode}</p>
                                    </div>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${selectedActivity.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                                        selectedActivity.status === "On Track" ? "bg-blue-50 text-blue-600" :
                                            "bg-rose-50 text-rose-600"
                                        }`}>
                                        {selectedActivity.status === "Completed" ? "✅" : selectedActivity.status === "Delay" ? "⚠️" : "⚡"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pb-10 border-b border-slate-100">
                                    <div className="p-8 bg-slate-50 rounded-[32px] space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Start Milestone</p>
                                        <p className="text-xl font-black text-slate-800">{selectedActivity.startDate}</p>
                                    </div>
                                    <div className="p-8 bg-slate-900 rounded-[32px] space-y-2 text-white">
                                        <p className="text-[9px] font-black text-white/40 tracking-widest uppercase">Projected Exit</p>
                                        <p className="text-xl font-black">{selectedActivity.endDate}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Operational Metrics</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Planned", value: selectedActivity.plannedQty },
                                            { label: "Completed", value: selectedActivity.totalCompleted },
                                            { label: "Differential", value: selectedActivity.remainingQty },
                                            { label: "Today's Yield", value: selectedActivity.todayProgress }
                                        ].map((stat, i) => (
                                            <div key={i} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl">
                                                <span className="text-[10px] font-black text-slate-400 tracking-tight">{stat.label}</span>
                                                <span className="text-xs font-black text-slate-800">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedActivity(null)}
                                    className="w-full py-6 bg-slate-900 text-white rounded-[24px] text-[11px] font-black tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-95 uppercase"
                                >
                                    Deactivate Intelligence View
                                </button>
                            </div>
                        )}
                    </Modal>
                </div>
            </PageTransition>
        </>
    );
};

export default ActivityListPage;
