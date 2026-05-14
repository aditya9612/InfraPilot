import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const ClientSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: "Mock Client",
    email: "client@infrapilot.com",
    mobile_number: "+91 98765 43210",
    company: "Skyline Ventures"
  });

  const [notifications, setNotifications] = useState([
    { label: "Email Notifications", desc: "Weekly summaries and financial milestones", enabled: true },
    { label: "SMS Alerts", desc: "Critical safety notices and final approvals", enabled: true },
    { label: "App Push", desc: "Daily site photo updates and team messages", enabled: false },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      toast.success("Settings saved successfully (Mock Mode).");
      setSaving(false);
    }, 800);
  };

  const toggleNotification = (index: number) => {
    const newNotifications = [...notifications];
    newNotifications[index].enabled = !newNotifications[index].enabled;
    setNotifications(newNotifications);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Scanning Profile...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Portal Settings"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Portal Settings</h1>
          <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Customize your profile, notifications, and security preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile & Language */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Client Profile */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-6 mb-10">
                 <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/10">
                    {profile.full_name.charAt(0) || "S"}
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Client Profile</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your identity and contact across InfraPilot</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 italic">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 italic">Primary Email</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 italic">Contact Number</label>
                  <input 
                    type="text" 
                    value={profile.mobile_number} 
                    onChange={(e) => setProfile({...profile, mobile_number: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 italic">Company / Organization</label>
                  <input 
                    type="text" 
                    value={profile.company} 
                    onChange={(e) => setProfile({...profile, company: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-inner" 
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update Profile Details"}
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {notifications.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                    <div className="pr-10">
                      <p className="text-sm font-bold text-slate-800 tracking-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-widest leading-none">{item.desc}</p>
                    </div>
                    <div 
                      onClick={() => toggleNotification(i)}
                      className={`w-14 h-7 rounded-full p-1 transition-all duration-300 cursor-pointer relative shadow-inner ${item.enabled ? "bg-primary" : "bg-slate-300"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${item.enabled ? "translate-x-7" : "translate-x-0"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Language & Password */}
          <div className="space-y-8">
            
            {/* Language Selection */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">Display Language</h2>
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold mb-1">CHOOSE PREFERRED LANGUAGE</p>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                   <option>English (US / UK)</option>
                   <option>Hindi (हिन्दी)</option>
                   <option>Marathi (मराठी)</option>
                   <option>Gujarati (ગુજરાતી)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium italic">Changes will reflect across the portal and notifications.</p>
              </div>
            </div>

            {/* Security / Password */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-8 text-red-500">Security & Password</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <input type="password" placeholder="••••••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-red-400 transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <input type="password" placeholder="••••••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-red-400 transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                   <input type="password" placeholder="••••••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-red-400 transition-all shadow-inner" />
                </div>
                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-red-500/10 hover:bg-slate-800 transition-colors mt-2">
                   Update Secure Password
                </button>
              </div>
            </div>

            {/* Save All Button */}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? "Saving Changes..." : "Save All Global Settings"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientSettingsPage;
