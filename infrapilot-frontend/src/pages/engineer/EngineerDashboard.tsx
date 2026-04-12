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

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter  mb-2">Skyline Tower A - Site Dashboard</h1>
                        <p className="text-slate-500 text-sm font-medium">Real-time site progress and resource monitoring.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black  tracking-widest shadow-sm">
                            <span className="text-xl">☀️</span>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black  leading-none mb-1">Weather</p>
                                <p className="text-xs font-black text-slate-700  tracking-tighter">Clear, 32°C</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Widgets */}
                <div className="mb-10">
                    <h2 className="text-[10px] font-black text-slate-400  tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Site Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Labor Today"
                            value="145"
                            sub="85 Skilled | 60 Unskilled"
                            accent="text-primary"
                        />
                        <StatCard
                            title="Active Activities"
                            value="12"
                            sub="Foundations, Column Casting"
                            accent="text-blue-500"
                        />
                        <StatCard
                            title="Material Stock"
                            value="OK"
                            sub="Cement: OK | Steel: Low"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Open Issues"
                            value="4"
                            sub="2 High Priority"
                            accent="text-rose-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Daily Work Summary */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 mb-4">Today's Work Summary</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-700 mb-1">Activity: Column Reinforcement Check</p>
                                <p className="text-xs text-slate-500">Checking reinforcement for columns C1-C15 at the 4th floor.</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded ">In Progress</span>
                                    <span className="text-[10px] text-slate-400 font-bold">Started: 09:00 AM</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-700 mb-1">Activity: Concrete Pouring - Retaining Wall</p>
                                <p className="text-xs text-slate-500">Pouring M35 grade concrete for the North-side retaining wall.</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded ">Completed</span>
                                    <span className="text-[10px] text-slate-400 font-bold">Finished: 02:30 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress % Widget */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <p className="text-sm font-bold text-slate-400  tracking-widest mb-6">Overall Progress</p>
                        <div className="relative w-40 h-40 flex items-center justify-center overflow-visible">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * 68) / 100} strokeLinecap="round" className="text-primary transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-800">68%</span>
                                <span className="text-[10px] font-bold text-slate-400 ">Completed</span>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="text-left p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold ">Planned</p>
                                <p className="text-sm font-bold text-slate-700">72%</p>
                            </div>
                            <div className="text-left p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold ">Variance</p>
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
