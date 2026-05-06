import { useState, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import { 
  Plus, 
  Calendar,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layout,
  TrendingUp,
  Activity as ActivityIcon
} from "lucide-react";

// Types
interface Activity {
  id: number;
  boq_code: string;
  activity_name: string;
  unit: string;
  planned_quantity: number;
  total_completed: number;
  remaining_quantity: number;
  completion_percent: number;
  start_date: string;
  end_date: string;
  status: string;
}

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 1,
    boq_code: "BOQ-001",
    activity_name: "Excavation",
    unit: "Cum",
    planned_quantity: 500,
    total_completed: 320,
    remaining_quantity: 180,
    completion_percent: 64,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    status: "On Track"
  },
  {
    id: 2,
    boq_code: "BOQ-002",
    activity_name: "RCC Work",
    unit: "Cum",
    planned_quantity: 200,
    total_completed: 60,
    remaining_quantity: 140,
    completion_percent: 30,
    start_date: "2026-04-10",
    end_date: "2026-05-15",
    status: "Delay"
  },
  {
    id: 3,
    boq_code: "BOQ-003",
    activity_name: "Brickwork",
    unit: "Sqm",
    planned_quantity: 1200,
    total_completed: 1200,
    remaining_quantity: 0,
    completion_percent: 100,
    start_date: "2026-03-01",
    end_date: "2026-04-15",
    status: "On Track"
  },
  {
    id: 4,
    boq_code: "BOQ-004",
    activity_name: "Plastering",
    unit: "Sqm",
    planned_quantity: 800,
    total_completed: 0,
    remaining_quantity: 800,
    completion_percent: 0,
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    status: "Delay"
  }
];

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-100 text-success",
  "Delay": "bg-red-100 text-red-600",
  "Completed": "bg-blue-100 text-primary",
  "Not Started": "bg-slate-100 text-slate-500"
};

const DailyProgressEntryPage = () => {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Card specific local progress states
  const [localProgress, setLocalProgress] = useState<Record<number, number>>({});

  // Log Modal Form State
  const [logData, setLogData] = useState({
    activity_id: "",
    date: new Date().toISOString().split("T")[0],
    quantity: 0,
    remarks: ""
  });

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: activities.length,
      onTrack: activities.filter(a => a.status === "On Track" && a.completion_percent < 100).length,
      delayed: activities.filter(a => a.status === "Delay").length,
      completed: activities.filter(a => a.completion_percent === 100).length
    };
  }, [activities]);

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return "bg-emerald-500";
    if (percent >= 40) return "bg-blue-500";
    if (percent > 0) return "bg-amber-500";
    return "bg-slate-100";
  };

  const getStatusKey = (a: Activity) => {
    if (a.completion_percent === 100) return "Completed";
    if (a.completion_percent === 0) return "Not Started";
    return a.status;
  };

  const handleSaveCardProgress = (activityId: number) => {
    const qtyToAdd = localProgress[activityId];
    if (!qtyToAdd || qtyToAdd <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setActivities(prev => prev.map(a => {
      if (a.id === activityId) {
        const newTotal = a.total_completed + qtyToAdd;
        if (newTotal > a.planned_quantity) {
          toast.error("Total completed cannot exceed planned quantity!");
          return a;
        }
        const newPercent = Math.round((newTotal / a.planned_quantity) * 100);
        return {
          ...a,
          total_completed: newTotal,
          remaining_quantity: a.planned_quantity - newTotal,
          completion_percent: newPercent,
          status: newPercent >= 100 ? "On Track" : a.status
        };
      }
      return a;
    }));

    setLocalProgress(prev => ({ ...prev, [activityId]: 0 }));
    toast.success("Daily progress synced successfully!");
  };

  const handleLogModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logData.activity_id) {
        toast.error("Please select an activity");
        return;
    }
    setIsSubmitting(true);
    
    setTimeout(() => {
        const activityId = Number(logData.activity_id);
        const qtyToAdd = logData.quantity;

        setActivities(prev => prev.map(a => {
            if (a.id === activityId) {
                const newTotal = a.total_completed + qtyToAdd;
                if (newTotal > a.planned_quantity) {
                    toast.error("Exceeds planned quantity!");
                    return a;
                }
                const newPercent = Math.round((newTotal / a.planned_quantity) * 100);
                return {
                    ...a,
                    total_completed: newTotal,
                    remaining_quantity: a.planned_quantity - newTotal,
                    completion_percent: newPercent,
                    status: newPercent >= 100 ? "On Track" : a.status
                };
            }
            return a;
        }));

        toast.success("Project ledger updated!");
        setIsLogModalOpen(false);
        setIsSubmitting(false);
        setLogData({
            activity_id: "",
            date: new Date().toISOString().split("T")[0],
            quantity: 0,
            remarks: ""
        });
    }, 500);
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

  return (
    <>
      <Navbar title="Daily Progress Entry" breadcrumb={["Engineer", "Work Progress", "Field Logs"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Field Progress Terminal</h1>
            <p className="text-slate-500 text-sm italic-none font-inter">Record today's work progress for each active BOQ activity.</p>
          </div>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
          >
            <Plus className="w-4 h-4" />
            Provision Manual Log
          </button>
        </div>

        {/* ── Summary Stats ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <StatCard
            title="Active Tasks"
            value={stats.total.toString()}
            sub="In Field Ledger"
            accent="text-slate-800"
            icon={<Layout className="w-5 h-5" />}
          />
          <StatCard
            title="Compliance"
            value={`${Math.round((stats.completed / (stats.total || 1)) * 100)}%`}
            sub="Completion Rate"
            accent="text-emerald-500"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            title="Behind Schedule"
            value={stats.delayed.toString()}
            sub="Action Required"
            accent="text-rose-500"
            icon={<AlertCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Momentum"
            value="88%"
            sub="Execution Index"
            accent="text-blue-500"
            icon={<ActivityIcon className="w-5 h-5" />}
          />
        </div>

        {/* ── Filter Bar & Registry Container ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
          {/* Integrated Filter Bar */}
          <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-6 bg-slate-50/30 font-inter">
            <div className="flex items-center gap-4 w-full lg:w-auto font-inter">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl font-inter shadow-sm">
                  <Calendar className="w-5 h-5 text-primary font-inter" />
              </div>
              <div className="font-inter">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Reporting Cycle</p>
                  <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-sm font-black text-slate-800 outline-none font-inter cursor-pointer"
                  />
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 hidden lg:block font-inter" />
            <p className="text-slate-400 text-sm italic-none font-inter hidden lg:block">Synchronizing field intelligence for active BOQ items.</p>
          </div>

          <div className="p-8 bg-slate-50/20 font-inter">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-inter">
              {activities.length > 0 ? activities.map((a) => (
                <div key={a.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter group relative overflow-hidden text-inter">
                  {/* Subtle background decoration */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />
                  
                  <div className="relative z-10 font-inter">
                    <div className="flex items-center justify-between mb-6 font-inter">
                        <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider font-inter">{a.boq_code}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter ${statusBadge[getStatusKey(a)]}`}>
                            {getStatusKey(a)}
                        </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-6 font-inter tracking-tight italic-none">{a.activity_name}</h3>

                    {/* Progress Visualizer */}
                    <div className="mb-8 font-inter">
                        <div className="flex items-center justify-between mb-2 font-inter">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Intensity Index</span>
                            <span className="text-sm font-black text-slate-800 font-inter">{a.completion_percent}%</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2 overflow-hidden font-inter">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${getProgressColor(a.completion_percent)} font-inter`}
                                style={{ width: `${a.completion_percent}%` }}
                            />
                        </div>
                    </div>

                    {/* Logistics Stats */}
                    <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50/50 rounded-3xl mb-8 border border-slate-100 font-inter backdrop-blur-sm">
                        <div className="text-center font-inter">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Provisioned</p>
                            <p className="text-sm font-black text-slate-800 font-inter italic-none">{a.planned_quantity} <span className="text-[10px] text-slate-400 font-inter">{a.unit}</span></p>
                        </div>
                        <div className="text-center font-inter border-x border-slate-200 font-inter px-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Executed</p>
                            <p className="text-sm font-black text-blue-600 font-inter italic-none">{a.total_completed} <span className="text-[10px] text-slate-400 font-inter">{a.unit}</span></p>
                        </div>
                        <div className="text-center font-inter font-inter">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Remaining</p>
                            <p className="text-sm font-black text-slate-800 font-inter italic-none">{a.remaining_quantity} <span className="text-[10px] text-slate-400 font-inter">{a.unit}</span></p>
                        </div>
                    </div>

                    {/* Action Terminal */}
                    <div className="flex flex-col gap-6 font-inter">
                        <div className="font-inter">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter ml-1">Today's Execution Volume</label>
                            <div className="flex items-center gap-3 font-inter">
                                <div className="flex-1 relative font-inter">
                                    <input 
                                        type="number"
                                        min="0"
                                        placeholder="Enter quantity executed today..."
                                        value={localProgress[a.id] || ""}
                                        onChange={(e) => setLocalProgress({ ...localProgress, [a.id]: Number(e.target.value) })}
                                        className="w-full pl-5 pr-14 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-inter"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 font-inter uppercase">{a.unit}</span>
                                </div>
                                <button 
                                    onClick={() => handleSaveCardProgress(a.id)}
                                    className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 font-inter"
                                    title="Commit Progress"
                                >
                                    <Save className="w-5 h-5 font-inter" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Clock className="w-3.5 h-3.5 text-primary font-inter" />
                                <span className="font-bold font-inter italic-none">{a.start_date} → {a.end_date}</span>
                            </div>
                            {a.completion_percent === 100 && (
                                <div className="flex items-center gap-2 text-emerald-500 font-inter">
                                    <CheckCircle2 className="w-3.5 h-3.5 font-inter" />
                                    <span className="font-black uppercase tracking-widest font-inter">Target Achieved</span>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-inter text-inter">
                    <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6 font-inter" />
                    <h3 className="text-xl font-black text-slate-400 font-inter tracking-tight italic-none">No active items in field registry</h3>
                    <p className="text-slate-400 text-sm font-inter">Please provision activities in the primary ledger to begin field reporting.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </PageTransition>

      {/* Manual Log Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Provision Field Intelligence Log"
        maxWidth="max-w-lg"
        footer={
            <div className="flex gap-4 w-full px-6 pb-6 font-inter">
                <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all font-inter"
                >
                    Discard Log
                </button>
                <button
                    disabled={isSubmitting}
                    onClick={() => {
                        const form = document.getElementById("log-progress-form") as HTMLFormElement;
                        if (form) form.requestSubmit();
                    }}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                >
                    {isSubmitting ? "Committing..." : "Commit Field Log"}
                </button>
            </div>
        }
      >
        <form id="log-progress-form" onSubmit={handleLogModalSubmit} className="p-6 space-y-6 font-inter">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Log Information</h3>
                <div className="space-y-4 font-inter">
                    <div className="font-inter">
                        <label className={labelClasses}>Target Activity*</label>
                        <select
                            required
                            value={logData.activity_id}
                            onChange={(e) => setLogData({ ...logData, activity_id: e.target.value })}
                            className={inputClasses}
                        >
                            <option value="">Select Activity Reference</option>
                            {activities.map(a => (
                                <option key={a.id} value={a.id}>{a.activity_name} ({a.boq_code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-inter">
                        <div className="font-inter">
                            <label className={labelClasses}>Execution Date*</label>
                            <input
                                required
                                type="date"
                                value={logData.date}
                                onChange={(e) => setLogData({ ...logData, date: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="font-inter">
                            <label className={labelClasses}>Execution Qty*</label>
                            <input
                                required
                                type="number"
                                min="0"
                                placeholder="Qty"
                                value={logData.quantity || ""}
                                onChange={(e) => setLogData({ ...logData, quantity: Number(e.target.value) })}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                    <div className="font-inter">
                        <label className={labelClasses}>Execution Narrative</label>
                        <textarea
                            rows={4}
                            placeholder="Log any operational constraints or narrative observations..."
                            value={logData.remarks}
                            onChange={(e) => setLogData({ ...logData, remarks: e.target.value })}
                            className={`${inputClasses} resize-none`}
                        />
                    </div>
                </div>
            </div>
        </form>
      </Modal>
    </>
  );
};

export default DailyProgressEntryPage;
