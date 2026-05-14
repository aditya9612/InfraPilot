import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import api from "../../services/api";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(true);

  // Profile data
  const [profile, setProfile] = useState<any>({
    user_id: null,
    full_name: "",
    role: "",
    mobile_number: "",
    email: "",
    address: "",
    pan_number: "",
    aadhaar_number: "",
    profile_image: "",
    designation: "",
    joining_date: "",
    is_active: true
  });

  // Settings data
  const [settings, setSettings] = useState<any>({
    user_id: null,
    default_project_id: null,
    unit: "Meter",
    notifications_enabled: true,
    preferences: {},
    financial_year: "2025-26",
    currency: "INR",
    tax_settings: {},
    invoice_format: "standard",
    payment_terms: "30 days"
  });

  const sections = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "billing", label: "Subscription", icon: "💳" },
  ];

  useEffect(() => {
    Promise.all([
      api.get("/settings"),
      api.get("/settings/profile")
    ]).then(([settingsRes, profileRes]) => {
      if (settingsRes.data) setSettings(settingsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch settings/profile", err);
      toast.error("Failed to load settings data");
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    try {
      if (activeSection === "general") {
        await Promise.all([
          api.put("/settings", settings),
          api.put("/settings/profile", profile)
        ]);
        toast.success("Profile and Settings saved successfully!");
      } else if (activeSection === "notifications") {
        await api.put("/settings", settings);
        toast.success("Notification preferences saved!");
      } else {
        toast.success("Settings saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings/profile", err);
      toast.error("Failed to save changes");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar title="System Settings" breadcrumb={["Admin", "Configuration", "Settings"]} />
        <PageTransition className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </PageTransition>
      </>
    );
  }

  return (
    <>
      <Navbar title="System Settings" breadcrumb={["Admin", "Configuration", "Settings"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferences</p>
                </div>
                <div className="p-2 space-y-1">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === s.id ?
                        "bg-primary text-white shadow-lg shadow-primary/20" :
                        "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      <span>{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                      {sections.find(s => s.id === activeSection)?.label} Settings
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Manage your platform experience and security.</p>
                  </div>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="p-8">
                  {activeSection === "general" && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span> Profile Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                            <input type="text" value={profile.full_name || ""} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Email</label>
                            <input type="email" value={profile.email || ""} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Mobile Number</label>
                            <input type="text" value={profile.mobile_number || ""} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Address</label>
                            <input type="text" value={profile.address || ""} onChange={e => setProfile({ ...profile, address: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">PAN Number</label>
                            <input type="text" value={profile.pan_number || ""} onChange={e => setProfile({ ...profile, pan_number: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Aadhaar Number</label>
                            <input type="text" value={profile.aadhaar_number || ""} onChange={e => setProfile({ ...profile, aadhaar_number: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" />
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Localization & Formats
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Currency</label>
                            <select value={settings.currency || "INR"} onChange={e => setSettings({ ...settings, currency: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none">
                              <option value="INR">INR (₹)</option>
                              <option value="Dollar">USD ($)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Unit</label>
                            <select value={settings.unit || "Meter"} onChange={e => setSettings({ ...settings, unit: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none">
                              <option value="Meter">Meter</option>
                              <option value="Feet">Feet</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Financial Year</label>
                            <input type="text" value={settings.financial_year || ""} onChange={e => setSettings({ ...settings, financial_year: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Invoice Format</label>
                            <select value={settings.invoice_format || "standard"} onChange={e => setSettings({ ...settings, invoice_format: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none">
                              <option value="standard">Standard</option>
                              <option value="detailed">Detailed</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Payment Terms</label>
                            <input type="text" value={settings.payment_terms || ""} onChange={e => setSettings({ ...settings, payment_terms: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" />
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeSection === "notifications" && (
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Global Preferences
                      </h3>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Enable All Notifications</p>
                          <p className="text-[10px] text-slate-500 font-medium">Toggle global system notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings.notifications_enabled} onChange={e => setSettings({ ...settings, notifications_enabled: e.target.checked })} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
                        <span className="w-2 h-2 rounded-full border border-slate-300"></span> Additional Preferences
                      </h3>
                      {[
                        { title: "Daily Summary", desc: "Receive a snapshot of all site activities every morning." },
                        { title: "Budget Alerts", desc: "Get notified immediately when a project exceeds 90% budget." },
                        { title: "Labour Attendance", desc: "Weekly reports on workforce attendance across all sites." }
                      ].map((n, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60 pointer-events-none">
                          <div>
                            <p className="text-sm font-bold text-slate-700">{n.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{n.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} disabled />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-400"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === "security" && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Password Policy
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Current Password</label>
                            <input type="password" placeholder="••••••••" className="w-full max-w-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">New Password</label>
                            <input type="password" placeholder="••••••••" className="w-full max-w-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                          </div>
                        </div>
                      </section>

                      <section className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                          <div>
                            <p className="text-sm font-bold text-primary">Two-Factor Authentication (2FA)</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Secure your account with an extra layer of protection.</p>
                          </div>
                          <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">Enable 2FA</button>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeSection === "billing" && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">💎</div>
                      <h3 className="text-lg font-bold text-slate-800">Enterprise Plan</h3>
                      <p className="text-sm text-slate-500 mt-1 mb-6">Your next billing date is <span className="font-bold text-slate-700">May 20, 2026</span></p>
                      <button className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Manage Billing</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </PageTransition >
    </>
  );
};

export default SettingsPage;
