import { motion } from "framer-motion";
import { CheckCircle2, Clock, PlayCircle, AlertTriangle } from "lucide-react";

interface Milestone {
    id: number;
    title: string;
    status: "Completed" | "In-Progress" | "Upcoming" | "Delayed";
    date: string;
    description: string;
}

const milestones: Milestone[] = [
    { id: 1, title: "Foundation & Piling", status: "Completed", date: "Jan 15, 2026", description: "Piling works for blocks A-D successfully completed. QC verified." },
    { id: 2, title: "Structural Phase I", status: "Completed", date: "Mar 10, 2026", description: "Ground floor and first floor structural slabs casted." },
    { id: 3, title: "MEP Rough-ins", status: "In-Progress", date: "Apr 25, 2026", description: "Electrical conduits and plumbing sleeves for Phase III slabs." },
    { id: 4, title: "Masonry L1-L5", status: "Delayed", date: "May 15, 2026", description: "Material supply delay impacting brickwork schedule." },
    { id: 5, title: "Finishing & Interior", status: "Upcoming", date: "Aug 20, 2026", description: "Scheduled mobilization of finishing teams." },
];

const ClientProgressTimeline = () => {
    return (
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Project Milestone Roadmap</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CRITICAL PATH & EXECUTION TIMELINE</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">ON TRACK: 85%</span>
                </div>
            </div>

            <div className="relative">
                {/* Timeline Stem */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-50" />

                <div className="space-y-12">
                    {milestones.map((ms, idx) => (
                        <motion.div
                            key={ms.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-8 relative group"
                        >
                            <div className="relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-xl transition-all duration-500 group-hover:scale-110 ${ms.status === "Completed" ? "bg-emerald-500 text-white" :
                                        ms.status === "In-Progress" ? "bg-blue-600 text-white animate-pulse" :
                                            ms.status === "Delayed" ? "bg-rose-500 text-white" :
                                                "bg-slate-100 text-slate-300"
                                    }`}>
                                    {ms.status === "Completed" && <CheckCircle2 className="w-5 h-5" />}
                                    {ms.status === "In-Progress" && <PlayCircle className="w-5 h-5" />}
                                    {ms.status === "Delayed" && <AlertTriangle className="w-5 h-5" />}
                                    {ms.status === "Upcoming" && <Clock className="w-5 h-5" />}
                                </div>
                            </div>

                            <div className="flex-1 pt-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className={`text-lg font-black tracking-tight ${ms.status === "Completed" ? "text-slate-400 line-through" :
                                                ms.status === "Delayed" ? "text-rose-600" : "text-slate-800"
                                            }`}>
                                            {ms.title}
                                        </h4>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${ms.status === "Delayed" ? "text-rose-400" : "text-slate-400"
                                            }`}>
                                            TARGET: {ms.date}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ms.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            ms.status === "In-Progress" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                ms.status === "Delayed" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                    "bg-slate-50 text-slate-400 border-slate-200"
                                        }`}>
                                        {ms.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                    {ms.description}
                                </p>

                                {ms.status === "In-Progress" && (
                                    <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Site Signal</span>
                                        </div>
                                        <button className="text-[10px] font-black text-blue-600 underline">LIVE EVIDENCE</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientProgressTimeline;
