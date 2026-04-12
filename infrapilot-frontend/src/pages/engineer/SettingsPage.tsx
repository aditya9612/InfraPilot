import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        currentProject: "Grand Residency Ph-1",
        units: "SI Units (Metric)",
        notifications: {
            email: true,
            sms: false,
            app: true,
            reminders: true
        },
        preferences: {
            darkMode: false,
            language: "English (Global)",
            autoSave: true
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast.success("Protocol configurations synchronized", { position: 'top-right', icon: '⚙️' });
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
        <div className="engineer-module text-slate-900">
            <Navbar title="Identity & Protocols" breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Account", "Settings"]} />

            <PageTransition className="p-8 bg-slate-50 min-h-screen relative font-inter pb-32">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-16">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter  mb-2">Protocol Architecture</h1>
                            <p className="text-slate-500 font-medium tracking-tight">Profile management, notification preferences, and security protocols.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full xl:w-[160px] bg-primary text-white py-4 rounded-2xl text-[10px] font-black tracking-[0.4em] shadow-2xl shadow-primary/20 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            Sync Configuration
                        </button>
                    </div>
                    {/* Top Widgets */}
                    <div className="mb-10">
                        <h2 className="text-[10px] font-black text-slate-400  tracking-[0.3em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Protocol Health Vitals
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCard
                                title="Config Drift"
                                value="0%"
                                sub="Protocol alignment"
                                accent="text-emerald-500"
                                icon="🛡️"
                            />
                            <StatCard
                                title="Security Index"
                                value="High"
                                sub="Auth encryption"
                                accent="text-primary"
                                icon="🔒"
                            />
                            <StatCard
                                title="Sync Frequency"
                                value="120s"
                                sub="Data buffering"
                                accent="text-blue-500"
                                icon="🔄"
                            />
                            <StatCard
                                title="Session State"
                                value="Active"
                                sub="Identity verified"
                                accent="text-slate-800"
                                icon="🆔"
                            />
                        </div>
                    </div>



                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* 1. Technical Context */}
                        <div className="lg:col-span-12 xl:col-span-5 space-y-10">
                            <div className="relative bg-white rounded-[40px] p-12 shadow-sm border border-slate-100 flex flex-col gap-10 group overflow-hidden">
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]`} />

                                <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    Registry Context
                                </h2>

                                <div className="space-y-8">
                                    <div>
                                        <label className="admin-pulse-form-label">Active Deployment Environment</label>
                                        <select
                                            value={settings.currentProject}
                                            onChange={(e) => setSettings(prev => ({ ...prev, currentProject: e.target.value }))}
                                            className="admin-pulse-form-input cursor-pointer"
                                        >
                                            <option>Grand Residency Ph-1</option>
                                            <option>Skyline Towers</option>
                                            <option>Metro Station - Zone A</option>
                                            <option>Industrial Shed Extension</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="admin-pulse-form-label">Metrics Calibration</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['SI Units (Metric)', 'Imperial Systems'].map(unit => (
                                                <button
                                                    key={unit}
                                                    onClick={() => setSettings(prev => ({ ...prev, units: unit }))}
                                                    className={`py-5 rounded-2xl text-[10px] font-black tracking-widest transition-all border ${settings.units === unit ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-slate-600 hover:border-slate-200'}`}
                                                >
                                                    {unit.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary-like detail within card */}
                                    <div className="admin-pulse-form-summary mt-12">
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Calibration State</span>
                                            <p className="text-xl font-black text-slate-800 tracking-tighter mt-1">{settings.units.toUpperCase()}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative bg-slate-900 rounded-[40px] p-12 shadow-2xl shadow-slate-900/20 text-white overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <h2 className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase mb-10 relative z-10">Telemetry Engine</h2>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[32px] border border-white/10 group/item hover:bg-white/10 transition-all">
                                        <div>
                                            <p className="text-[10px] font-black text-white tracking-widest uppercase mb-1">Auto-Sync Ledger</p>
                                            <p className="text-[10px] font-medium text-white/40 italic">Buffer DSR drafts locally every 120s</p>
                                        </div>
                                        <button
                                            onClick={() => togglePreference('autoSave')}
                                            className={`w-14 h-8 rounded-full relative p-1 transition-all ${settings.preferences.autoSave ? 'bg-blue-600' : 'bg-white/10'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all absolute top-1 ${settings.preferences.autoSave ? 'left-7' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[32px] border border-white/10 opacity-40 cursor-not-allowed">
                                        <div>
                                            <p className="text-[10px] font-black text-white tracking-widest uppercase mb-1">Low-Light Interface</p>
                                            <p className="text-[10px] font-medium text-white/40 italic">High-contrast dark mode protocols</p>
                                        </div>
                                        <div className="w-14 h-8 bg-white/10 rounded-full relative p-1">
                                            <div className="w-6 h-6 bg-white/40 rounded-full absolute left-1 top-1"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Notification Architecture */}
                        <div className="lg:col-span-12 xl:col-span-7 relative bg-white rounded-[40px] p-12 shadow-sm border border-slate-100 flex flex-col group overflow-hidden">
                            <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]`} />

                            <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-12 flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Communication Thresholds
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { key: 'email', label: 'Email Stream', sub: 'Weekly Intelligence Briefing', icon: '📧' },
                                    { key: 'sms', label: 'Terminal SMS', sub: 'Critical Structural Blockades', icon: '📱' },
                                    { key: 'app', label: 'Native Push', sub: 'Real-time DSR Sync Feedback', icon: '🔔' },
                                    { key: 'reminders', label: 'Protocol Reminders', sub: 'Deployment Log Deadlines', icon: '⏰' }
                                ].map((notif) => {
                                    const key = notif.key as keyof typeof settings.notifications;
                                    const isActive = settings.notifications[key];
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => toggleNotification(key)}
                                            className={`p-10 rounded-[40px] flex flex-col items-center text-center gap-4 transition-all duration-500 cursor-pointer group border ${isActive ? 'bg-emerald-50/50 border-emerald-100 shadow-xl shadow-emerald-500/5' : 'bg-slate-50 border-slate-50 grayscale opacity-60'}`}
                                        >
                                            <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">{notif.icon}</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 tracking-tighter uppercase mb-1">{notif.label}</p>
                                                <p className="text-[10px] font-bold text-slate-400 italic max-w-[160px] mx-auto leading-relaxed">"{notif.sub}"</p>
                                            </div>
                                            <div className={`mt-4 px-8 py-2 rounded-2xl text-[9px] font-black tracking-widest uppercase transition-all ${isActive ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(5,150,105,0.3)]' : 'bg-slate-200 text-slate-400'}`}>
                                                {isActive ? 'SYNCHRONIZED' : 'DISABLED'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-16 p-8 bg-rose-50/50 rounded-[32px] border border-rose-100 flex items-start gap-6">
                                <div className="w-14 h-14 bg-rose-600 rounded-[20px] flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div className="pt-1">
                                    <p className="text-sm font-black text-rose-800 tracking-tight uppercase mb-1">Administrative Privileges Restricted</p>
                                    <p className="text-[11px] font-bold text-rose-600/80 leading-relaxed italic">System-level updates and global personnel configurations are restricted to the Project Director. Engineers can only modify localized site context and individual notification streams.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default SettingsPage;
