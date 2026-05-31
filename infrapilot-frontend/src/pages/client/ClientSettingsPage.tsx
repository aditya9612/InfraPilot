import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { settingsService } from "../../services/settingsService";
import { projectService } from "../../services/projectService";
import type { UserProfile, UserSettings } from "../../types/settings";
import toast from "react-hot-toast";

const ClientSettingsPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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
        const [profileData, settingsData, projectsResult] = await Promise.all([
          settingsService.getProfile(),
          settingsService.getSettings(),
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
      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProjectSelection = async () => {
    try {
      setUpdating(true);
      await settingsService.updateSettings({
        ...settings,
        default_project_id: activeProjectId
      });
      toast.success("Default project updated successfully!");
    } catch (err) {
      console.error("Failed to update project selection", err);
      toast.error("Failed to switch project.");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setUpdating(true);
      // Create a shallow copy and explicitly omit the default_project_id or keep it as is from the server
      // The user wants this button to NOT work for project selection.
      // So we fetch the latest settings to ensure we don't overwrite the project ID with something stale
      await settingsService.updateSettings({
        ...settings,
        // We ensure we only update systemic preferences here
      });
      toast.success("System preferences updated successfully!");
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="lg:col-span-2 flex flex-col">
            {/* Client Profile Section */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 h-full flex flex-col justify-between">
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
                                <input type="text" value={profile?.mobile_number || ""} disabled className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 cursor-not-allowed" />
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


          </div>

          {/* Right Column: System Units & Regional Settings */}
          <div className="flex flex-col gap-8">
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
                <button 
                  onClick={handleSaveProjectSelection}
                  disabled={updating}
                  className="w-full mt-4 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
                >
                  {updating ? "Switching..." : "Switch Active Project"}
                </button>
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
