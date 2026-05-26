import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { settingsService } from "../../services/settingsService";
import { projectService } from "../../services/projectService";
import { alertService, type Alert } from "../../services/alertService";
import type { UserProfile, UserSettings } from "../../types/settings";
import toast from "react-hot-toast";

const ClientSettingsPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  // System Settings State
  const [settings, setSettings] = useState<UserSettings>({
    user_id: 0,
    default_project_id: null,
    unit: "Meter",
    notifications_enabled: true,
    preferences: {},
    financial_year: "2025-26",
    currency: "Dollar",
    tax_settings: {},
    invoice_format: "standard",
    payment_terms: "30 days"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, settingsData, alertsData, projectsResult] = await Promise.all([
          settingsService.getProfile(),
          settingsService.getSettings(),
          alertService.getAlerts(),
          projectService.getProjects(50, 0).catch(() => [])
        ]);
        const projectsList = Array.isArray(projectsResult) ? projectsResult : (projectsResult?.items || projectsResult?.data || []);
        setProjects(projectsList);
        if (projectsList.length > 0) {
          const defaultPid = settingsData?.default_project_id || projectsList[0]?.id || projectsList[0]?.project_id;
          setActiveProjectId(defaultPid);
        }
        setProfile(profileData);
        setSettings({
            ...settingsData,
            unit: settingsData.unit || "Meter",
            financial_year: settingsData.financial_year || "2025-26",
            currency: settingsData.currency || "Dollar",
            notifications_enabled: settingsData.notifications_enabled ?? true
        });
        setAlerts(alertsData);
      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateSettings = async () => {
    try {
      setUpdating(true);
      await settingsService.updateSettings(settings);
      toast.success("System settings updated successfully!");
    } catch (err) {
      console.error("Failed to update settings", err);
      toast.error("Failed to update settings.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      setUpdating(true);
      await settingsService.updateProfile({
        full_name: profile.full_name,
        role: profile.role,
        mobile_number: profile.mobile_number,
        email: profile.email,
        address: profile.address,
        pan_number: profile.pan_number,
        aadhaar_number: profile.aadhaar_number,
        designation: profile.designation,
        joining_date: profile.joining_date,
        is_active: profile.is_active
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Portal Settings"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Portal Settings</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Customize your profile, notifications, and system preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Client Profile Section */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-6 mb-10 border-b border-slate-50 pb-8">
                {profile?.profile_image ? (
                  <img src={settingsService.resolveUrl(profile.profile_image) || ''} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white" />
                ) : (
                  <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl">
                    {profile?.full_name?.charAt(0) || "C"}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{profile?.full_name || "Client Profile"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-white bg-primary px-2 py-0.5 rounded-md uppercase tracking-widest">{profile?.role}</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-20">
                   <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identification */}
                    <div className="md:col-span-2">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Identification & Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input type="text" value={profile?.full_name || ""} onChange={(e) => setProfile(p => p ? { ...p, full_name: e.target.value } : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                                <input type="text" value={profile?.designation || ""} onChange={(e) => setProfile(p => p ? { ...p, designation: e.target.value } : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="md:col-span-2">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input type="email" value={profile?.email || ""} disabled className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                <input type="text" value={profile?.mobile_number || ""} onChange={(e) => setProfile(p => p ? { ...p, mobile_number: e.target.value } : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Office / Residential Address</label>
                                <input type="text" value={profile?.address || ""} onChange={(e) => setProfile(p => p ? { ...p, address: e.target.value } : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" />
                            </div>
                        </div>
                    </div>

                    {/* Government IDs */}
                    <div className="md:col-span-2">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Taxation & Compliance IDs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Number</label>
                                <input type="text" value={profile?.pan_number || ""} onChange={(e) => setProfile(p => p ? { ...p, pan_number: e.target.value } : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner uppercase" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhaar Number</label>
                                <input type="text" value={profile?.aadhaar_number || ""} onChange={(e) => setProfile(p => p ? { ...p, aadhaar_number: e.target.value } : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" />
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Account Active Since: <span className="text-slate-600">{profile?.joining_date}</span></p>
                    <button onClick={handleSaveProfile} disabled={updating} className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95">
                      {updating ? "Processing..." : "Update Private Profile"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Communication Control</h2>
              
              <div className="flex items-center justify-between p-8 bg-slate-50 rounded-2xl border border-slate-100 mb-10 transition-all hover:bg-emerald-50/30 group">
                <div className="pr-10">
                  <p className="text-sm font-black text-slate-800 tracking-tight">Enable Master Notifications</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest leading-none">Global toggle for all email, SMS and push notifications</p>
                </div>
                <div
                  onClick={() => setSettings(s => ({ ...s, notifications_enabled: !s.notifications_enabled }))}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 cursor-pointer relative shadow-inner ${settings.notifications_enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.notifications_enabled ? "translate-x-7" : "translate-x-0"}`} />
                </div>
              </div>

              {/* Dynamic Alerts List */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-1">Live Monitoring Alerts</h3>
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-20 bg-slate-50 rounded-2xl animate-pulse"></div>
                        <div className="h-20 bg-slate-50 rounded-2xl animate-pulse"></div>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                        <p className="text-slate-300 font-black uppercase tracking-widest text-[9px]">No active monitoring alerts reported</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                    {alert.alert_type === 'MaterialDelay' ? '📦' : '⚠️'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 tracking-tight leading-tight">{alert.message}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-widest">Active Delay</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">• Project ID: {alert.project_id}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">• {new Date(alert.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: System Units & Regional Settings */}
          <div className="space-y-8">
            {/* Project Selection */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <h2 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Project Selection</h2>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Project</label>
                <select
                  value={activeProjectId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setActiveProjectId(id);
                    setSettings(s => ({ ...s, default_project_id: id }));
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  {projects.length === 0 && <option value="">No projects available</option>}
                  {projects.map((p: any) => (
                    <option key={p.id || p.project_id} value={p.id || p.project_id}>
                      {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8 text-primary border-b border-slate-50 pb-4">System Preferences</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measurement Unit</label>
                  <select 
                    value={settings.unit} 
                    onChange={(e) => setSettings(s => ({ ...s, unit: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option>Meter</option>
                    <option>Feet</option>
                    <option>Metric System</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Financial Year</label>
                  <input 
                    type="text" 
                    value={settings.financial_year} 
                    onChange={(e) => setSettings(s => ({ ...s, financial_year: e.target.value }))}
                    placeholder="e.g. 2025-26" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Currency</label>
                  <select 
                    value={settings.currency} 
                    onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option>Dollar</option>
                    <option>INR (₹)</option>
                    <option>Euro (€)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Payment Terms</label>
                  <input 
                    type="text" 
                    value={settings.payment_terms} 
                    onChange={(e) => setSettings(s => ({ ...s, payment_terms: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" 
                  />
                </div>

                <button 
                  onClick={handleUpdateSettings} 
                  disabled={updating}
                  className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50"
                >
                  {updating ? "Saving Changes..." : "Apply System Settings"}
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  );
};

export default ClientSettingsPage;
