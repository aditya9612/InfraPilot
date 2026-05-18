import { useState, useMemo, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { masterService } from "../../../services/masterService";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layout,
  Filter,
  FileText,
  Briefcase,
  Mail
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

// INITIAL_ACTIVITIES removed for API fetch

const UNITS = ["Cum", "Sqm", "Rft", "Nos", "Kg", "Ton"];
const STATUSES = ["On Track", "Delay"];

const statusBadge: Record<string, string> = {
  "On Track": "bg-emerald-100 text-success",
  "Delay": "bg-red-100 text-red-600",
  "Completed": "bg-blue-100 text-primary",
  "Not Started": "bg-slate-100 text-slate-500"
};

const statusColors: Record<string, string> = {
  "On Track": "bg-emerald-600",
  "Delay": "bg-rose-600",
  "Completed": "bg-primary",
  "Not Started": "bg-slate-500"
};

const ActivityListPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch activities from Master Data
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const masterActs = await masterService.getEntities("activity-types");
        const mapped: Activity[] = masterActs.map((ma) => ({
          id: ma.id,
          boq_code: ma.unique_code,
          activity_name: ma.name,
          unit: ma.unit || "Cum",
          planned_quantity: 1000, // Placeholder as master data doesn't have quantities
          total_completed: 450,
          remaining_quantity: 550,
          completion_percent: 45,
          start_date: "2026-05-01",
          end_date: "2026-06-30",
          status: "On Track"
        }));
        setActivities(mapped);
      } catch (error) {
        toast.error("Failed to fetch activity list");
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const [formData, setFormData] = useState<Partial<Activity>>({
    activity_name: "",
    boq_code: "",
    planned_quantity: 0,
    unit: "Cum",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "On Track"
  });

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: activities.length,
      onTrack: activities.filter(a => a.status === "On Track").length,
      delayed: activities.filter(a => a.status === "Delay").length,
      completed: activities.filter(a => a.completion_percent === 100).length
    };
  }, [activities]);

  // Filter Logic
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.boq_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "All Status" || a.status === filterStatus || (filterStatus === "Completed" && a.completion_percent === 100);
      return matchSearch && matchStatus;
    });
  }, [activities, searchTerm, filterStatus]);

  // Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const newActivity: Activity = {
        ...(formData as Activity),
        id: Math.max(...activities.map(a => a.id), 0) + 1,
        total_completed: 0,
        remaining_quantity: formData.planned_quantity || 0,
        completion_percent: 0
      };
      setActivities([...activities, newActivity]);
      toast.success("Activity added successfully!");
      setIsAddModalOpen(false);
      setIsSubmitting(false);
      resetForm();
    }, 500);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setActivities(activities.map(a => a.id === selectedActivity?.id ? { ...a, ...formData } as Activity : a));
      toast.success("Activity updated successfully!");
      setIsEditModalOpen(false);
      setIsSubmitting(false);
      resetForm();
    }, 500);
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setActivities(activities.filter(a => a.id !== deleteId));
      toast.success("Activity deleted!");
      setIsDeleteModalOpen(false);
      setIsSubmitting(false);
    }, 500);
  };

  const resetForm = () => {
    setFormData({
      activity_name: "",
      boq_code: "",
      planned_quantity: 0,
      unit: "Cum",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      status: "On Track"
    });
    setSelectedActivity(null);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return "bg-emerald-500";
    if (percent >= 40) return "bg-blue-500";
    if (percent > 0) return "bg-amber-500";
    return "bg-transparent";
  };

  const getStatusKey = (a: Activity) => {
    if (a.completion_percent === 100) return "Completed";
    if (a.completion_percent === 0) return "Not Started";
    return a.status;
  };

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 font-inter";

  return (
    <>
      <Navbar title="Activity List" breadcrumb={["Engineer", "Work Progress", "Activity Ledger"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter text-inter">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Activity Management Ledger</h1>
            <p className="text-slate-500 text-sm italic-none font-inter">Track activities, BOQ progress and completion status.</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
          >
            <Plus className="w-4 h-4" />
            Add New Activity
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <StatCard
            title="Total Activities"
            value={stats.total.toString()}
            sub="Active BOQ Items"
            accent="text-slate-800"
            icon={<Layout className="w-5 h-5" />}
          />
          <StatCard
            title="On Track"
            value={stats.onTrack.toString()}
            sub="Optimal Momentum"
            accent="text-emerald-500"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Action Required"
            value={stats.delayed.toString()}
            sub="Critical Delays"
            accent="text-rose-500"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Fully Completed"
            value={stats.completed.toString()}
            sub="Closed Activities"
            accent="text-blue-500"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
        </div>

        {/* Filter Bar & Registry Container */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
          {/* Integrated Filter Bar */}
          <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search activity name or BOQ code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
              />
            </div>
            <div className="flex items-center gap-2 font-inter">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
              >
                <option value="All Status">All Status</option>
                <option value="On Track">On Track</option>
                <option value="Delay">Delay</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">BOQ Activity Details</th>
                  <th className="px-6 py-4 font-inter">Volume Analysis</th>
                  <th className="px-6 py-4 font-inter">Execution Status</th>
                  <th className="px-6 py-4 font-inter min-w-[180px]">Real-time Progress</th>
                  <th className="px-6 py-4 font-inter">Milestones</th>
                  <th className="px-6 py-4 text-right font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {filteredActivities.length > 0 ? filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                    <td className="px-6 py-4">
                      <div className="flex flex-col font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{a.activity_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{a.boq_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col font-inter">
                        <p className="text-[11px] font-black text-slate-800 font-inter">{a.planned_quantity} {a.unit}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">Target Volume</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusBadge[getStatusKey(a)]}`}>
                        {getStatusKey(a)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <div className="flex flex-col gap-1.5 font-inter">
                        <div className="flex items-center justify-between mb-0.5 font-inter">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-inter">Intensity</span>
                          <span className="text-xs font-black text-slate-700 font-inter">{a.completion_percent}%</span>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden font-inter">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(a.completion_percent)} font-inter`}
                            style={{ width: `${a.completion_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-inter">
                      <div className="flex flex-col font-inter">
                        <span className="text-[10px] font-bold text-slate-800 font-inter">{a.start_date}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-inter">To {a.end_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 font-inter">
                        <button
                          onClick={() => { setSelectedActivity(a); setIsViewModalOpen(true); }}
                          className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 font-inter ${statusColors[getStatusKey(a)]} shadow-primary/20`}
                        >
                          <Eye className="w-4 h-4 font-inter" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedActivity(a);
                            setFormData({
                              activity_name: a.activity_name,
                              boq_code: a.boq_code,
                              planned_quantity: a.planned_quantity,
                              unit: a.unit,
                              start_date: a.start_date,
                              end_date: a.end_date,
                              status: a.status
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                        >
                          <Edit2 className="w-4 h-4 font-inter" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(a.id); setIsDeleteModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                        >
                          <Trash2 className="w-4 h-4 font-inter" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                      No activity records found in the project ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </PageTransition>

      {/* Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Activity Intelligence Insight"
        maxWidth="max-w-xl"
      >
        {selectedActivity && (
          <div className="p-6 font-inter text-inter italic-none">
            {/* Profile Style Header */}
            <div className={`${statusColors[getStatusKey(selectedActivity)]} rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
              <div className="relative z-10 flex items-center gap-6 font-inter">
                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                  <span className="text-4xl font-black font-inter">A</span>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                </div>
                <div className="font-inter">
                  <div className="flex items-center gap-3 mb-2 font-inter">
                    <h3 className="text-2xl font-black tracking-tight font-inter">{selectedActivity.activity_name}</h3>
                    <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{getStatusKey(selectedActivity)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                    <Mail className="w-3 h-3" />
                    <span className="text-[11px] font-bold font-inter italic-none">activity.ref-{selectedActivity.boq_code}@infrapilot.com</span>
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                    <span className="text-[10px] font-black uppercase tracking-widest font-inter">PROGRESS: {selectedActivity.completion_percent}% COMPLETE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-2 mb-10 font-inter">
              {/* Operational Intelligence */}
              <div className="font-inter">
                <div className="flex items-center gap-2 mb-6 font-inter">
                  <div className="p-2 bg-blue-50 rounded-lg font-inter">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">BOQ Intelligence</p>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">BOQ Code</p>
                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedActivity.boq_code}</p>
                  </div>
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Measurement Unit</p>
                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedActivity.unit}</p>
                  </div>
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Execution Period</p>
                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedActivity.start_date} TO {selectedActivity.end_date}</p>
                  </div>
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Current Status</p>
                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{getStatusKey(selectedActivity)}</p>
                  </div>
                </div>
              </div>

              {/* Logistics */}
              <div className="font-inter">
                <div className="flex items-center gap-2 mb-6 font-inter">
                  <div className="p-2 bg-blue-50 rounded-lg font-inter">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Volume Logistics</p>
                </div>
                <div className="grid grid-cols-3 gap-6 font-inter">
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Planned Qty</p>
                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedActivity.planned_quantity} {selectedActivity.unit}</p>
                  </div>
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Completed</p>
                    <p className="text-sm font-black text-blue-600 font-inter italic-none">{selectedActivity.total_completed} {selectedActivity.unit}</p>
                  </div>
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Remaining</p>
                    <p className="text-sm font-black text-rose-600 font-inter italic-none">{selectedActivity.remaining_quantity} {selectedActivity.unit}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsViewModalOpen(false)}
              className={`w-full py-5 ${statusColors[getStatusKey(selectedActivity)]} text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 font-inter italic-none`}
            >
              Dismiss Activity Insight
            </button>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Activity"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex gap-4 w-full px-6 pb-6 font-inter">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all font-inter"
            >
              Discard
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => {
                const form = document.getElementById("add-activity-form") as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              {isSubmitting ? "Provisioning..." : "Provision Activity"}
            </button>
          </div>
        }
      >
        <form id="add-activity-form" onSubmit={handleAddSubmit} className="p-6 space-y-6 font-inter">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div className="md:col-span-2 font-inter">
                <label className={labelClasses}>Activity Narrative*</label>
                <input
                  required
                  type="text"
                  value={formData.activity_name}
                  onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. Reinforced Concrete Work for Pier 04"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>BOQ Reference*</label>
                <input
                  required
                  type="text"
                  value={formData.boq_code}
                  onChange={(e) => setFormData({ ...formData, boq_code: e.target.value })}
                  className={inputClasses}
                  placeholder="BOQ-001"
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Target Volume*</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.planned_quantity}
                  onChange={(e) => setFormData({ ...formData, planned_quantity: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Unit of Measure*</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={inputClasses}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Initial Status*</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={inputClasses}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Commencement Date*</label>
                <input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Expected Completion*</label>
                <input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Activity Logistics"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex gap-4 w-full px-6 pb-6 font-inter">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all font-inter"
            >
              Cancel Update
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => {
                const form = document.getElementById("edit-activity-form") as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              {isSubmitting ? "Updating..." : "Commit Changes"}
            </button>
          </div>
        }
      >
        <form id="edit-activity-form" onSubmit={handleEditSubmit} className="p-6 space-y-6 font-inter">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Update Activity Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div className="md:col-span-2 font-inter">
                <label className={labelClasses}>Activity Narrative*</label>
                <input
                  required
                  type="text"
                  value={formData.activity_name}
                  onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>BOQ Reference*</label>
                <input
                  required
                  type="text"
                  value={formData.boq_code}
                  onChange={(e) => setFormData({ ...formData, boq_code: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Target Volume*</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.planned_quantity}
                  onChange={(e) => setFormData({ ...formData, planned_quantity: Number(e.target.value) })}
                  className={inputClasses}
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Unit of Measure*</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={inputClasses}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Current Status*</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={inputClasses}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Commencement Date*</label>
                <input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="font-inter">
                <label className={labelClasses}>Expected Completion*</label>
                <input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Discard Activity Record"
        message="Are you sure you want to delete this activity record? This action will permanently remove the entry from the project ledger."
        confirmText={isSubmitting ? "Archiving..." : "Archive Record"}
        type="danger"
      />
    </>
  );
};

export default ActivityListPage;
