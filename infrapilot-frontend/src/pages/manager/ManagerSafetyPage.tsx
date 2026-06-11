import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import {
  AlertOctagon,
  ClipboardCheck,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  ArrowUpRight,
  MoreVertical,
  Download,
  Clock,
} from "lucide-react";

const ManagerSafetyPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "incidents";

  const tabs = [
    { id: "incidents", label: "Incidents", icon: <AlertOctagon className="w-4 h-4" /> },
    { id: "corrective-actions", label: "Corrective Actions", icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  const handleTabChange = (tabId: string) => {
    navigate(`/manager/safety/${tabId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        title="Safety Management"
        breadcrumb={["Manager", "Safety", tabs.find(t => t.id === activeTab)?.label || "Incidents"]}
      />

      <PageTransition className="p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Safety Hub</h1>
              <p className="text-slate-500 mt-1">Monitor site incidents and drive corrective actions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Download className="w-4 h-4 text-primary" />
              Reports
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              {activeTab === "incidents" ? "Log Incident" : "Add Action"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Open Incidents"
            value="12"
            sub="5 Critical"
            accent="text-rose-500"
            icon={<AlertOctagon className="w-5 h-5 text-rose-500" />}
          />
          <StatCard
            title="Resolved"
            value="87"
            sub="This month"
            accent="text-emerald-500"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          />
          <StatCard
            title="Avg. Resolution Time"
            value="3.2d"
            sub="From incident to close"
            accent="text-primary"
            icon={<Clock className="w-5 h-5 text-primary" />}
          />
          <StatCard
            title="Safety Score"
            value="92/100"
            sub="Compliance index"
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
                activeTab === t.id ? "text-primary bg-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
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
            {activeTab === "incidents" && <IncidentsView />}
            {activeTab === "corrective-actions" && <CorrectiveActionsView />}
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </div>
  );
};

const IncidentsView = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
      <div className="flex items-center gap-4">
        <h3 className="font-bold text-slate-800">Site Incident Log</h3>
        <div className="flex bg-white border border-slate-200 rounded-lg px-3 py-1.5 items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search incidents..." className="bg-transparent border-none outline-none text-xs w-48" />
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
            <th className="p-4">Incident ID</th>
            <th className="p-4">Description</th>
            <th className="p-4">Site / Zone</th>
            <th className="p-4">Reported By</th>
            <th className="p-4">Date</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {[
            { id: "INC-101", desc: "Scaffold collapse", site: "Tower A", reporter: "John D.", date: "Today, 09:15", status: "Open" },
            { id: "INC-098", desc: "Electrical fire", site: "Block B", reporter: "Sara K.", date: "Yesterday", status: "Closed" },
            { id: "INC-095", desc: "Slip hazard", site: "Ground Floor", reporter: "Mike L.", date: "12 Jun", status: "In Review" },
          ].map((inc, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
              <td className="p-4"><div className="text-sm font-bold text-slate-800">{inc.id}</div></td>
              <td className="p-4"><div className="text-xs text-slate-600">{inc.desc}</div></td>
              <td className="p-4"><div className="text-xs text-slate-600">{inc.site}</div></td>
              <td className="p-4"><div className="text-xs text-slate-600">{inc.reporter}</div></td>
              <td className="p-4"><div className="text-xs text-slate-500">{inc.date}</div></td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  inc.status === "Open" ? "bg-rose-100 text-rose-600" :
                  inc.status === "Closed" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                }`}>{inc.status}</span>
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

const CorrectiveActionsView = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[
      { title: "Scaffold Reinforcement", incident: "INC-101", status: "Planned", due: "2 weeks" },
      { title: "Electrical System Audit", incident: "INC-098", status: "Completed", due: "-" },
      { title: "Floor Slip Mats", incident: "INC-095", status: "In Progress", due: "5 days" },
    ].map((act, i) => (
      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
        <h4 className="font-bold text-slate-800 mb-2">{act.title}</h4>
        <p className="text-xs text-slate-500 mb-2">Related: {act.incident}</p>
        <div className="flex items-center justify-between text-sm">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            act.status === "Completed" ? "bg-emerald-100 text-emerald-600" :
            act.status === "Planned" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
          }`}>{act.status}</span>
          <span className="text-slate-400">Due: {act.due}</span>
        </div>
      </div>
    ))}
  </div>
);

export default ManagerSafetyPage;
