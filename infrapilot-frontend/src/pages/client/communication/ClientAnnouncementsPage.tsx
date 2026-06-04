import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { alertService, type Alert } from "../../../services/alertService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import toast from "react-hot-toast";

const ClientAnnouncementsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("All");
  
  // Create Alert State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAlert, setNewAlert] = useState({
    message: "",
    alert_type: ""
  });
  const [errors, setErrors] = useState({
    message: ""
  });

  const { projectId } = useClientProjectId();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      const filtered = projectId 
        ? data.filter(a => a.project_id === projectId)
        : data;
      setAlerts(filtered);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [projectId]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    let hasError = false;
    const newErrors = { message: "" };
    
    if (!newAlert.message.trim()) {
      newErrors.message = "Announcement message is required";
      hasError = true;
    }
    
    if (!newAlert.alert_type) {
      toast.error("Please select a notification priority");
      return;
    }
    
    setErrors(newErrors);
    if (hasError) return;

    if (!projectId) return toast.error("No active project selected");

    try {
      setSubmitting(true);
      
      // Resolve real user_id from session
      const userString = localStorage.getItem("infrapilot_user");
      let userId = 1; // Fallback
      if (userString) {
        try {
          const user = JSON.parse(userString);
          userId = user.user_id || user.id || 1;
        } catch (e) {}
      }

      const payload = {
        project_id: Number(projectId),
        alert_type: newAlert.alert_type,
        message: newAlert.message,
        user_id: userId
      };

      console.log("Broadcasting alert with payload:", payload);
      await alertService.createAlert(payload);
      
      toast.success("Alert broadcasted successfully");
      setIsModalOpen(false);
      setNewAlert({ message: "", alert_type: "" });
      setErrors({ message: "" });
      fetchAlerts();
    } catch (err: any) {
      console.error("Broadcast failure detail:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to broadcast alert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await alertService.markAlertRead(id);
      toast.success("Marked as read");
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await alertService.deleteAlert(id);
      toast.success("Announcement deleted");
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  const filteredAlerts = (selectedType === "All" 
    ? alerts 
    : alerts.filter(a => a.alert_type === selectedType)
  ).sort((a, b) => {
    // Sort unread ('active') to the top
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Within the same status, sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (type: string) => {
    if (type === 'Critical' || type === 'MaterialDelay') return 'bg-red-50 text-red-600';
    if (type === 'Warning') return 'bg-amber-50 text-amber-600';
    return 'bg-blue-50 text-blue-600';
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Communication", "Announcements"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Official Project Announcements</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Important project updates, mobilization notices, and official company communications</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Broadcast Alert
            </button>

            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 h-[56px] items-center">
              {["All", "MaterialDelay", "Announcement", "Safety"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedType === t 
                    ? "bg-slate-800 text-white shadow-lg" 
                    : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-6xl mx-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">establishing secure channel...</p>
             </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((ann) => (
              <div key={ann.id} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-blue-500/5 group relative flex flex-col md:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                       {ann.status === 'active' && (
                         <div className="relative flex items-center justify-center mr-1">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                         </div>
                       )}
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Update</p>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getPriorityColor(ann.alert_type)}`}>
                      {ann.alert_type}
                    </div>
                    <p className="text-[9px] text-slate-400 font-black">{formatDate(ann.created_at)}</p>
                  </div>

                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-3">{ann.message}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">S</div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Published via System Oracle</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleMarkRead(ann.id)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                    title="Mark as Read"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(ann.id)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                    title="Delete Announcement"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 border-dashed">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No {selectedType} priority announcements found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Broadcast New Announcement"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateAlert} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Message</label>
            <textarea 
              value={newAlert.message}
              onChange={(e) => {
                setNewAlert(prev => ({ ...prev, message: e.target.value }));
                if (errors.message) setErrors(prev => ({ ...prev, message: "" }));
              }}
              placeholder="Enter the official project notification..."
              className={`w-full bg-slate-50 border ${errors.message ? 'border-red-500 bg-red-50/10' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all min-h-[120px] resize-none`}
            />
            {errors.message && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                {errors.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Priority</label>
            <select 
              value={newAlert.alert_type}
              onChange={(e) => setNewAlert(prev => ({ ...prev, alert_type: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select Notification</option>
              <option value="Announcement">General Announcement</option>
              <option value="MaterialDelay">Material Constraint / Delay</option>
              <option value="Safety">Safety Protocol Update</option>
            </select>
          </div>

          <div className="pt-4 flex gap-4">
             <button 
               type="button"
               onClick={() => setIsModalOpen(false)}
               className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
             >
               Cancel
             </button>
             <button 
               type="submit"
               disabled={submitting}
               className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
             >
               {submitting ? "Broadcasting..." : "Confirm & Broadcast"}
             </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ClientAnnouncementsPage;
