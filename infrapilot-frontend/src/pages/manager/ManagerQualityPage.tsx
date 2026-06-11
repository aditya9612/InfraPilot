import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { 
  ShieldCheck, 
  ClipboardCheck, 
  AlertOctagon, 
  Plus, 
  Filter, 
  Search,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Calendar,
  FileText,
  Clock,
  ArrowUpRight
} from "lucide-react";

const ManagerQualityPage = () => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || "inspections";

    const tabs = [
        { id: "inspections", label: "Inspections", icon: <ShieldCheck className="w-4 h-4" /> },
        { id: "checklists", label: "Quality Checklists", icon: <ClipboardCheck className="w-4 h-4" /> },
        { id: "ncr", label: "NCR (Non-Conformance)", icon: <AlertOctagon className="w-4 h-4" /> },
    ];

    const handleTabChange = (tabId: string) => {
        navigate(`/manager/quality/${tabId}`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar 
                title="Quality Assurance Hub" 
                breadcrumb={["Manager", "Quality", tabs.find(t => t.id === activeTab)?.label || "Inspections"]} 
            />

            <PageTransition className="p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Technical Governance</h1>
                            <p className="text-slate-500 mt-1">Ensuring engineering excellence and compliance across all site operations.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <Download className="w-4 h-4 text-primary" />
                            Reports
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4" />
                            {activeTab === "inspections" ? "Schedule Inspection" : activeTab === "checklists" ? "New Checklist" : "Raise NCR"}
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Pass Rate" 
                        value="94.2%" 
                        sub="+2.4% from last month" 
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    />
                    <StatCard 
                        title="Open NCRs" 
                        value="05" 
                        sub="3 Critical, 2 Major" 
                        accent="text-rose-500"
                        icon={<AlertOctagon className="w-5 h-5 text-rose-500" />}
                    />
                    <StatCard 
                        title="Inspections Done" 
                        value="128" 
                        sub="This quarter" 
                        accent="text-primary"
                        icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                    />
                    <StatCard 
                        title="Compliance Score" 
                        value="98/100" 
                        sub="Top tier performance" 
                        accent="text-blue-600"
                        icon={<ArrowUpRight className="w-5 h-5 text-blue-600" />}
                    />
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === t.id 
                                ? "text-primary bg-white shadow-sm" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                            }`}
                        >
                            <span className="relative z-10">{t.icon}</span>
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "inspections" && <InspectionsView />}
                        {activeTab === "checklists" && <ChecklistsView />}
                        {activeTab === "ncr" && <NCRView />}
                    </motion.div>
                </AnimatePresence>
            </PageTransition>
        </div>
    );
};

const InspectionsView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-800">Field Inspection Registry</h3>
                <div className="flex bg-white border border-slate-200 rounded-lg px-3 py-1.5 items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search inspections..." className="bg-transparent border-none outline-none text-xs w-48" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <th className="p-4">Inspection Subject</th>
                        <th className="p-4">Project / Zone</th>
                        <th className="p-4">Inspector</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Result</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {[
                        { id: "INS-402", subject: "Slab Reinforcement Check", project: "Skyline Residency", zone: "Block A - Floor 4", inspector: "Er. Ramesh K.", date: "Today, 10:30 AM", status: "Passed", score: "100%" },
                        { id: "INS-398", subject: "Plastering Quality Audit", project: "Metro Ph-II", zone: "Interior Sec 4", inspector: "Er. Sameer D.", date: "Yesterday", status: "Passed", score: "92%" },
                        { id: "INS-395", subject: "Electrical Conduit Layout", project: "Coastal Bridge", zone: "Pillar P12", inspector: "Er. Ananya R.", date: "12 June, 2024", status: "Passed with Comments", score: "85%" },
                        { id: "INS-390", subject: "Waterproofing Verification", project: "Green Valley", zone: "Basement Tank", inspector: "Er. Ramesh K.", date: "10 June, 2024", status: "Failed", score: "40%" },
                    ].map((ins, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-4">
                                <div className="text-sm font-bold text-slate-800">{ins.subject}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{ins.id}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-xs font-bold text-slate-700">{ins.project}</div>
                                <div className="text-[10px] text-slate-500">{ins.zone}</div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 uppercase">{ins.inspector.split(' ').pop()?.charAt(0)}</div>
                                    <div className="text-xs text-slate-600">{ins.inspector}</div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="text-xs text-slate-500">{ins.date}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    ins.status === "Passed" ? "bg-emerald-100 text-emerald-600" :
                                    ins.status === "Failed" ? "bg-rose-100 text-rose-600" :
                                    "bg-amber-100 text-amber-600"
                                }`}>{ins.status}</span>
                                <div className="text-[10px] font-black text-slate-400 mt-1">Score: {ins.score}</div>
                            </td>
                            <td className="p-4 text-right">
                                <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const ChecklistsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
            { title: "Concrete Pouring Checklist", cat: "Civil", items: 24, usage: "15 times/mo", icon: <CheckCircle2 className="text-emerald-500" /> },
            { title: "Fire Safety Compliance", cat: "Safety", items: 18, usage: "Daily", icon: <AlertCircle className="text-rose-500" /> },
            { title: "Finishing Quality Standards", cat: "Architecture", items: 42, usage: "Weekly", icon: <FileText className="text-primary" /> },
            { title: "HVAC Installation Steps", cat: "MEP", items: 15, usage: "On-demand", icon: <Clock className="text-amber-500" /> },
            { title: "Pre-Slab Inspection", cat: "Structural", items: 30, usage: "Per milestone", icon: <ShieldCheck className="text-blue-500" /> },
            { title: "Electrical Safety Audit", cat: "MEP", items: 22, usage: "Monthly", icon: <AlertOctagon className="text-orange-500" /> },
        ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                        {item.icon}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{item.cat}</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mb-6 uppercase">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {item.items} checkpoints</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.usage}</span>
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-colors">Edit Templates</button>
                    <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all">Start Audit</button>
                </div>
            </div>
        ))}
    </div>
);

const NCRView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
                { id: "NCR-2024-084", issue: "Honeycombing in Column C12", project: "Skyline Residency", severity: "Major", status: "Open", assignee: "Site Engineer Rahul", days: 3 },
                { id: "NCR-2024-079", issue: "Incorrect Rebar Spacing - Beam B4", project: "Metro Ph-II", severity: "Critical", status: "Under Review", assignee: "QC Lead Sameer", days: 1 },
                { id: "NCR-2024-072", issue: "Material Grade Mismatch (Aggregates)", project: "Coastal Bridge", severity: "Major", status: "Resolved", assignee: "Vendor Coordinator Sana", days: 5 },
                { id: "NCR-2024-068", issue: "Surface Cracks in Plasterboard", project: "Green Valley", severity: "Minor", status: "Closed", assignee: "Finishing Foreman Ali", days: 8 },
            ].map((ncr, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                <AlertOctagon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">{ncr.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        ncr.severity === "Critical" ? "bg-rose-100 text-rose-600" :
                                        ncr.severity === "Major" ? "bg-orange-100 text-orange-600" :
                                        "bg-blue-100 text-blue-600"
                                    }`}>{ncr.severity}</span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">{ncr.issue}</h4>
                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{ncr.project}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                ncr.status === "Closed" ? "bg-emerald-100 text-emerald-600" :
                                ncr.status === "Open" ? "bg-rose-100 text-rose-600" :
                                "bg-amber-100 text-amber-600"
                            }`}>{ncr.status}</span>
                            <div className="text-[10px] text-slate-400 font-bold mt-2 italic">{ncr.days} days aging</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                {ncr.assignee.split(' ').pop()?.charAt(0)}
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Assigned To: {ncr.assignee}</div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">View Report</button>
                            {ncr.status !== "Closed" && (
                                <button className="px-4 py-1.5 text-[11px] font-bold text-white bg-primary hover:bg-blue-600 rounded-lg transition-all shadow-sm shadow-primary/20">Take Action</button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="bg-slate-900 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                <ShieldCheck className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 max-w-lg">
                <h3 className="text-2xl font-bold text-white mb-2">Quality Maturity Matrix</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Holistic overview of site quality metrics. We have achieved a 15% reduction in recurring NCRs over the last 90 days following the implementation of pre-slab checklists.</p>
                <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex-1 text-center">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Rework Saved</div>
                        <div className="text-xl font-black text-white">₹8.5L</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex-1 text-center">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Compliance</div>
                        <div className="text-xl font-black text-white">96.8%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default ManagerQualityPage;
