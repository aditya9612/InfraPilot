import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import PageTransition from "../../components/common/PageTransition";

const EngineerDashboard = () => {
    return (
        <>
            <Navbar
                title="Site Overview"
                breadcrumb={["InfraPilot", "Engineer", "Dashboard"]}
            />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Skyline Tower A - Site Dashboard</h1>
                        <p className="text-slate-500 text-sm">Real-time site progress and resource monitoring.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm">
                            <span className="text-xl">☀️</span>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Weather</p>
                                <p className="text-xs font-bold text-slate-700">Clear, 32°C</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Labor Today"
                        value="145"
                        sub="85 Skilled | 60 Unskilled"
                        accent="text-primary"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    />
                    <StatCard
                        title="Active Activities"
                        value="12"
                        sub="Foundations, Column Casting"
                        accent="text-blue-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                    <StatCard
                        title="Material Stock"
                        value="OK"
                        sub="Cement: OK | Steel: Low"
                        accent="text-emerald-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    />
                    <StatCard
                        title="Open Issues"
                        value="4"
                        sub="2 High Priority"
                        accent="text-rose-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Daily Work Summary */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Today's Work Summary</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-700 mb-1">Activity: Column Reinforcement Check</p>
                                <p className="text-xs text-slate-500">Checking reinforcement for columns C1-C15 at the 4th floor.</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded uppercase">In Progress</span>
                                    <span className="text-[10px] text-slate-400 font-bold">Started: 09:00 AM</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-700 mb-1">Activity: Concrete Pouring - Retaining Wall</p>
                                <p className="text-xs text-slate-500">Pouring M35 grade concrete for the North-side retaining wall.</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded uppercase">Completed</span>
                                    <span className="text-[10px] text-slate-400 font-bold">Finished: 02:30 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress % Widget */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Overall Progress</p>
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * 68) / 100} strokeLinecap="round" className="text-primary transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-800">68%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="text-left p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Planned</p>
                                <p className="text-sm font-bold text-slate-700">72%</p>
                            </div>
                            <div className="text-left p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Variance</p>
                                <p className="text-sm font-bold text-rose-500">-4%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default EngineerDashboard;
