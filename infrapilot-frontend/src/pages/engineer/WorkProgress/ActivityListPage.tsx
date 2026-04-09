import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";

const initialActivities = [
    {
        id: 1,
        name: "Excavation for Main Block",
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
        name: "PCC Foundation",
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
        name: "RCC Column Casting (Floor 1)",
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
    const [activities, setActivities] = useState(initialActivities);

    const handleStatusChange = (id: number, newStatus: string) => {
        setActivities(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    };

    const filteredActivities = activities.filter(
        (a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.boqCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar title="Activity List" breadcrumb={["Engineer", "Work Progress", "Activities"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Work Progress</h1>
                        <p className="text-slate-500 text-sm">Monitor and update progress for individual site activities.</p>
                    </div>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        {
                            name: "Site-wise Expense Tracking",
                            desc: "Track all expenses related to specific site",
                            behavior: "Should record expense date, type, amount, and category",
                            icon: "💰",
                            color: "text-blue-600",
                            bg: "bg-blue-50"
                        },
                        {
                            name: "Timeline Tracking",
                            desc: "Monitor project timeline",
                            behavior: "Should show project phases and completion progress",
                            icon: "⏱️",
                            color: "text-emerald-600",
                            bg: "bg-emerald-50"
                        },
                        {
                            name: "Work Progress %",
                            desc: "Track project completion percentage",
                            behavior: "System should calculate progress (0–100%)",
                            icon: "📊",
                            color: "text-purple-600",
                            bg: "bg-purple-50"
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-primary/20 group">
                            <div className={`w-12 h-12 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl`}>
                                {feature.icon}
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">{feature.name}</h3>
                            <p className="text-sm text-slate-500 mb-3">{feature.desc}</p>
                            <div className="pt-3 border-t border-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Behavior</p>
                                <p className="text-xs text-slate-600 italic">"{feature.behavior}"</p>
                            </div>
                        </div>
                    ))}
                </div>





                {/* Submenu Tabs */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                    <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                        Activity List
                    </button>
                    <Link to="/engineer/progress/entry" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                        Daily Progress Entry
                    </Link>
                </div>

                <div className="flex justify-start sm:justify-end mb-4">
                    <div className="relative w-full sm:w-80">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search activity or BOQ code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Activity Name & BOQ</th>
                                    <th className="px-6 py-4">Start / End Date</th>
                                    <th className="px-6 py-4">Planned Qty</th>
                                    <th className="px-6 py-4 text-center">Today</th>
                                    <th className="px-6 py-4">Remaining Qty</th>
                                    <th className="px-6 py-4">Completed / %</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredActivities.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div>
                                                <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{a.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{a.boqCode}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-slate-500">
                                                <p className="uppercase text-slate-400">S: {a.startDate}</p>
                                                <p className="uppercase text-slate-600">E: {a.endDate}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{a.plannedQty}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">{a.todayProgress}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{a.remainingQty}</td>
                                        <td className="px-6 py-4 min-w-[150px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                                    <span className={a.percentage === 100 ? 'text-emerald-500' : 'text-primary'}>{a.percentage}%</span>
                                                    <span>{a.totalCompleted}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${a.percentage === 100 ? 'bg-emerald-500' : a.status === 'Delay' ? 'bg-rose-500' : 'bg-primary'}`}
                                                        style={{ width: `${a.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={a.status}
                                                onChange={(e) => handleStatusChange(a.id, e.target.value)}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase outline-none cursor-pointer transition-colors ${a.status === "Completed" ? "bg-emerald-100 text-emerald-600 focus:ring-emerald-200" :
                                                    a.status === "On Track" ? "bg-blue-100 text-blue-600 focus:ring-blue-200" : "bg-rose-100 text-rose-600 focus:ring-rose-200"
                                                    }`}
                                            >
                                                <option>On Track</option>
                                                <option>Completed</option>
                                                <option>Delay</option>
                                                <option>Ahead</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default ActivityListPage;
