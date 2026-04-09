import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        currentProject: "Grand Residency Ph-1",
        units: "Meter",
        notifications: {
            email: true,
            sms: false,
            app: true,
            reminders: true
        },
        preferences: {
            darkMode: false,
            language: "English",
            autoSave: true
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast.success("Settings saved successfully!", { position: 'top-right', icon: '⚙️' });
            setIsSaving(false);
        }, 1200);
    };

    const toggleNotification = (key: keyof typeof settings.notifications) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
        }));
    };

    const togglePreference = (key: keyof typeof settings.preferences) => {
        setSettings(prev => {
            const value = prev.preferences[key];
            if (typeof value === "boolean") {
                return {
                    ...prev,
                    preferences: { ...prev.preferences, [key]: !value }
                };
            }
            return prev;
        });
    };

    return (
        <>
            <Navbar title="Account Settings" breadcrumb={["Engineer", "Settings"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen pb-24">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Configuration</h1>
                            <p className="text-slate-500 text-sm">Personalize your site operations and application interface.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full md:w-auto justify-center bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 1. Project Selection */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Project Selection
                            </h2>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Site Context</label>
                                <select
                                    value={settings.currentProject}
                                    onChange={(e) => setSettings(prev => ({ ...prev, currentProject: e.target.value }))}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23cbd5e1\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.25rem' }}
                                >
                                    <option>Grand Residency Ph-1</option>
                                    <option>Skyline Towers</option>
                                    <option>Metro Station - Zone A</option>
                                    <option>Industrial Shed Extension</option>
                                </select>
                                <p className="mt-4 text-[11px] font-medium text-slate-400">Switching project context will update all dashboards and logs.</p>
                            </div>
                        </div>

                        {/* 2. Units (Kg / Feet / Meter) */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Measurement Units
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {['Kg', 'Feet', 'Meter'].map(unit => (
                                    <button
                                        key={unit}
                                        onClick={() => setSettings(prev => ({ ...prev, units: unit }))}
                                        className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${settings.units === unit ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-6 text-[11px] font-medium text-slate-400 italic font-serif leading-relaxed">System-wide measurements will be calculated and displayed in your preferred unit.</p>
                        </div>

                        {/* 3. Notification Settings */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 md:col-span-2 group transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Notification Gateway
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { key: 'email', label: 'Email Alerts', sub: 'Weekly Summaries' },
                                    { key: 'sms', label: 'SMS Updates', sub: 'Urgent Blockades' },
                                    { key: 'app', label: 'App Push', sub: 'Real-time DSR' },
                                    { key: 'reminders', label: 'Reminders', sub: 'Daily Log Deadline' }
                                ].map((notif) => {
                                    const key = notif.key as keyof typeof settings.notifications;
                                    const isActive = settings.notifications[key];
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => toggleNotification(key)}
                                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full mb-1 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{notif.label}</p>
                                            <p className="text-[10px] font-medium text-slate-500 leading-tight">{notif.sub}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. User Preferences */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 md:col-span-2 group transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Personal Preferences
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm">💾</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Auto-save Progress</p>
                                            <p className="text-xs font-medium text-slate-400">Save DSR drafts automatically every 2 minutes</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => togglePreference('autoSave')}
                                        className={`w-14 h-8 rounded-full relative p-1 transition-all ${settings.preferences.autoSave ? 'bg-primary' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all absolute top-1 ${settings.preferences.autoSave ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm">🌓</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Dark Interaction Mode</p>
                                            <p className="text-xs font-medium text-slate-400">Enable high-contrast dark theme (Admin Only)</p>
                                        </div>
                                    </div>
                                    <button className="w-14 h-8 bg-slate-200 rounded-full relative p-1 cursor-not-allowed">
                                        <div className="w-6 h-6 bg-white rounded-full absolute left-1 top-1"></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default SettingsPage;
