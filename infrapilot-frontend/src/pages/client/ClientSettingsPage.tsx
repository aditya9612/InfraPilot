import Navbar from "../../components/common/Navbar";
import { useState, useEffect, useRef } from "react";
import { settingsService } from "../../services/settingsService";
import { projectService } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import type { UserProfile, UserSettings } from "../../types/settings";
import toast from "react-hot-toast";

const ClientSettingsPage = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [updating, setUpdating] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

    const { refreshUser } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState<UserSettings>({
        user_id: 0,
        default_project_id: null,
        notifications_enabled: true,
        preferences: {
            language: "English",
            timezone: "IST (UTC+5:30)",
            date_format: "DD/MM/YYYY",
            auto_save: true,
            compact_view: true,
            show_weather: true,
            auto_gps: true,
            notif_email: localStorage.getItem("client_notif_email") !== "false",
            notif_sms: localStorage.getItem("client_notif_sms") !== "false",
            notif_push: localStorage.getItem("client_notif_push") !== "false",
            notif_dsr: localStorage.getItem("client_notif_dsr") !== "false",
            notif_issue: localStorage.getItem("client_notif_issue") !== "false",
            notif_material: localStorage.getItem("client_notif_material") !== "false"
        },
        financial_year: "2025-26",
        currency: "INR",
        tax_settings: {},
        invoice_format: "standard",
        payment_terms: "30 days"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, settingsData, projectsResult] = await Promise.all([
                    settingsService.getProfile(),
                    settingsService.getSettings(),
                    projectService.getProjects(20, 0).catch(() => []),
                ]);
                const projectsList = Array.isArray(projectsResult) ? projectsResult : (projectsResult?.items || projectsResult?.data || []);
                setProjects(projectsList);

                if (projectsList.length > 0) {
                    const localSavedId = localStorage.getItem("client_selected_project_id");
                    const defaultPid = settingsData?.default_project_id || (localSavedId ? Number(localSavedId) : null) || projectsList[0]?.id || projectsList[0]?.project_id;
                    setActiveProjectId(Number(defaultPid));
                }
                setProfile(profileData);
                setPreviewUrl(null);
                setSelectedFile(null);

                setSettings({
                    ...settingsData,
                    currency: settingsData?.currency || "INR",
                    preferences: {
                        ...settingsData?.preferences,
                        language: settingsData?.preferences?.language || "English",
                        timezone: settingsData?.preferences?.timezone || "IST (UTC+5:30)",
                        date_format: settingsData?.preferences?.date_format || "DD/MM/YYYY",
                        auto_save: settingsData?.preferences?.auto_save ?? true,
                        compact_view: settingsData?.preferences?.compact_view ?? true,
                        show_weather: settingsData?.preferences?.show_weather ?? true,
                        auto_gps: settingsData?.preferences?.auto_gps ?? true,
                        notif_email: localStorage.getItem("client_notif_email") !== null ? localStorage.getItem("client_notif_email") === "true" : (settingsData?.preferences?.notif_email ?? true),
                        notif_sms: localStorage.getItem("client_notif_sms") !== null ? localStorage.getItem("client_notif_sms") === "true" : (settingsData?.preferences?.notif_sms ?? true),
                        notif_push: localStorage.getItem("client_notif_push") !== null ? localStorage.getItem("client_notif_push") === "true" : (settingsData?.preferences?.notif_push ?? true),
                        notif_dsr: localStorage.getItem("client_notif_dsr") !== null ? localStorage.getItem("client_notif_dsr") === "true" : (settingsData?.preferences?.notif_dsr ?? true),
                        notif_issue: localStorage.getItem("client_notif_issue") !== null ? localStorage.getItem("client_notif_issue") === "true" : (settingsData?.preferences?.notif_issue ?? true),
                        notif_material: localStorage.getItem("client_notif_material") !== null ? localStorage.getItem("client_notif_material") === "true" : (settingsData?.preferences?.notif_material ?? true)
                    }
                });
            } catch (err) {
                console.error("Failed to load settings data", err);
            } finally {
                setUpdating(false);
            }
        };
        fetchData();
    }, []);

    const togglePreference = (key: string) => {
        const newValue = !settings.preferences?.[key];
        
        setSettings(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [key]: newValue
            }
        }));

        // Persist immediately to localStorage to handle page refreshes even before save
        if (["notif_email", "notif_sms", "notif_push", "notif_dsr", "notif_issue", "notif_material"].includes(key)) {
            localStorage.setItem(`client_${key}`, String(newValue));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleRemovePhoto = () => {
        setProfile(p => p ? { ...p, profile_image: null } : null);
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSaveAll = async () => {
        try {
            setUpdating(true);
            const profileUpdateData = profile ? {
                ...profile,
                profile_image: selectedFile || profile.profile_image
            } : null;

            const projectChanged = activeProjectId !== settings.default_project_id;

            // Run both calls but handle errors individually
            let profileRes: any = null;
            let settingsError: any = null;
            let profileError: any = null;

            try {
                await settingsService.updateSettings({
                    ...settings,
                    default_project_id: activeProjectId
                });
                
                // Persist notification preferences locally to ensure consistency across refreshes
                localStorage.setItem("client_notif_email", String(settings.preferences?.notif_email ?? true));
                localStorage.setItem("client_notif_sms", String(settings.preferences?.notif_sms ?? true));
                localStorage.setItem("client_notif_push", String(settings.preferences?.notif_push ?? true));
                localStorage.setItem("client_notif_dsr", String(settings.preferences?.notif_dsr ?? true));
                localStorage.setItem("client_notif_issue", String(settings.preferences?.notif_issue ?? true));
                localStorage.setItem("client_notif_material", String(settings.preferences?.notif_material ?? true));
            } catch (err: any) {
                console.error("Settings update failed:", err.response?.data || err.message);
                settingsError = err;
            }

            if (profileUpdateData) {
                try {
                    profileRes = await settingsService.updateProfile(profileUpdateData);
                } catch (err: any) {
                    console.error("Profile update failed:", err.response?.data || err.message);
                    profileError = err;
                }
            }

            // Sync updated profile image with global auth context (Sidebar/Navbar)
            if (profileRes) {
                refreshUser({
                    name: profileRes.full_name,
                    profile_image: profileRes.profile_image
                });
            }

            if (settingsError && profileError) {
                toast.error("Failed to save settings.");
            } else if (settingsError) {
                toast.success("Profile saved! Settings sync pending.");
            } else if (profileError) {
                toast.success("Settings saved! Profile sync pending.");
            } else {
                toast.success("All settings saved successfully!");
            }
            setSelectedFile(null);

            if (projectChanged && !settingsError) {
                setTimeout(() => window.location.reload(), 500);
            }
        } catch (err: any) {
            console.error("handleSaveAll unexpected error:", err);
            toast.error("Failed to save settings.");
        } finally {
            setUpdating(false);
        }
    };

    const getActiveProjectName = () => {
        const p = projects.find(proj => (proj.id || proj.project_id) === activeProjectId);
        return p?.name || p?.project_name || "New sara city";
    };

    const formatDisplayDate = (dateStr: any) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        const format = settings.preferences?.date_format || "DD/MM/YYYY";
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();

        switch (format) {
            case "MM/DD/YYYY": return `${m}/${d}/${y}`;
            case "YYYY-MM-DD": return `${y}-${m}-${d}`;
            case "DD/MM/YYYY":
            default: return `${d}/${m}/${y}`;
        }
    };

    return (
        <>
            <Navbar title="Settings" breadcrumb={["InfraPilot", "Client", "Portal Settings"]} />
            <div className="p-8 bg-slate-50 min-h-screen font-inter pb-20">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Preferences</p>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Settings</h1>
                        <p className="text-slate-400 font-medium mt-1 text-sm">Configure your project, units, notifications, and personal preferences.</p>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        disabled={updating}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        {updating ? "Saving..." : "Save Settings"}
                    </button>
                </div>

                {/* Current Configuration Bar */}
                <div className="mb-12">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current Configuration</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { label: "Active Project", value: getActiveProjectName(), sub: "Primary project workspace", color: "text-blue-600" },
                            { label: "Notifications", value: `${[settings.preferences?.notif_email, settings.preferences?.notif_sms, settings.preferences?.notif_push, settings.preferences?.notif_dsr, settings.preferences?.notif_issue, settings.preferences?.notif_material].filter(Boolean).length} / 6`, sub: "Channels enabled", color: "text-amber-500" },
                            { label: "Language", value: settings.preferences?.language || "English", sub: settings.preferences?.timezone || "IST (UTC+5:30)", color: "text-slate-800" },
                        ].map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{card.label}</p>
                                <p className={`text-lg font-black tracking-tight ${card.color}`}>{card.value}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{card.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Profile & Account Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-white">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Profile & Account</h2>
                            </div>
                        </div>
                        <div className="p-10 flex flex-col md:flex-row gap-12">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <div className="shrink-0 flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white overflow-hidden">
                                        {previewUrl || profile?.profile_image ? (
                                            <img
                                                src={previewUrl || settingsService.resolveUrl(profile?.profile_image ?? null) || ''}
                                                className="w-full h-full object-cover"
                                                alt="Profile"
                                            />
                                        ) : (
                                            profile?.full_name?.charAt(0) || "Z"
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </button>
                                </div>
                                <button
                                    onClick={handleRemovePhoto}
                                    className="text-[11px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-2 uppercase tracking-widest transition-all"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Remove
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {[
                                    { label: "Full Name", key: "full_name", value: profile?.full_name },
                                    { label: "Designation", key: "designation", value: profile?.designation },
                                    { label: "Email Address", key: "email", value: profile?.email, locked: true },
                                    { label: "Mobile Number", key: "mobile_number", value: profile?.mobile_number, locked: true },
                                    { label: "PAN Number", key: "pan_number", value: profile?.pan_number },
                                    { label: "Aadhaar Number", key: "aadhaar_number", value: profile?.aadhaar_number },
                                    { label: "Role", key: "role", value: profile?.role },
                                    { label: "Joining Date", key: "joining_date", value: profile?.joining_date, type: "date" },
                                ].map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                        <div className="relative">
                                            <input
                                                type={field.key === 'joining_date' ? 'text' : (field.type || "text")}
                                                value={field.key === 'joining_date' ? formatDisplayDate(field.value) : (field.value || "")}
                                                onChange={(e) => {
                                                    if (field.key !== 'joining_date' && !field.locked) {
                                                        setProfile(p => p ? { ...p, [field.key]: e.target.value } : null);
                                                    }
                                                }}
                                                readOnly={field.key === 'joining_date' || field.locked}
                                                className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all ${field.key === 'joining_date' ? 'cursor-pointer' : field.locked ? 'cursor-not-allowed opacity-60 select-none bg-slate-100/50' : ''}`}
                                            />
                                            {field.key === 'joining_date' && (
                                                <>
                                                    <input
                                                        type="date"
                                                        value={field.value || ""}
                                                        onChange={(e) => setProfile(p => p ? { ...p, [field.key]: e.target.value } : null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                    <input
                                        type="text"
                                        value={profile?.address || "Pune"}
                                        onChange={(e) => setProfile(p => p ? { ...p, address: e.target.value } : null)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2 mt-4 p-6 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Account Status</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">Toggle active status of this profile</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${profile?.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {profile?.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <button
                                            onClick={() => setProfile(p => p ? { ...p, is_active: !p.is_active } : null)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${profile?.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${profile?.is_active ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex justify-end mt-4">
                                    <button onClick={handleSaveAll} disabled={updating} className="px-8 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        Save Profile Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Selection */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-center gap-3 mb-8">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Project Selection</h2>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Project</label>
                            <select
                                value={activeProjectId ?? ''}
                                onChange={(e) => {
                                    const newId = Number(e.target.value);
                                    setActiveProjectId(newId);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.project_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Notifications & Preferences Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Notification Settings</h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: "Email Alerts", sub: "Receive daily summary via email", icon: "📧", key: "notif_email" },
                                    { label: "SMS Alerts", sub: "Critical site alerts via SMS", icon: "📱", key: "notif_sms" },
                                    { label: "Push Notifications", sub: "Real-time app notifications", icon: "🔔", key: "notif_push" },
                                    { label: "DSR Reminders", sub: "Daily reminder to submit DSR", icon: "📋", key: "notif_dsr" },
                                    { label: "Issue Alerts", sub: "Notify on new high-priority issues", icon: "⚠️", key: "notif_issue" },
                                    { label: "Material Alerts", sub: "Low stock threshold notifications", icon: "🏗️", key: "notif_material" },
                                ].map((n, i) => {
                                    const isActive = settings.preferences?.[n.key] ?? true;
                                    return (
                                        <div key={i} className="group p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">{n.icon}</div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 tracking-tight">{n.label}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{n.sub}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black tracking-widest uppercase ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>{isActive ? 'On' : 'Off'}</span>
                                                <button
                                                    onClick={() => togglePreference(n.key)}
                                                    className={`w-10 h-5 rounded-full relative transition-all ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isActive ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="space-y-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">User Preferences</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                                        <select
                                            value={settings.preferences?.language || "English"}
                                            onChange={(e) => setSettings(s => ({ ...s, preferences: { ...s.preferences, language: e.target.value } }))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option>English</option>
                                            <option>Hindi</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Timezone</label>
                                            <select
                                                value={settings.preferences?.timezone || "IST (UTC+5:30)"}
                                                onChange={(e) => setSettings(s => ({ ...s, preferences: { ...s.preferences, timezone: e.target.value } }))}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option>IST (UTC+5:30)</option>
                                                <option>UTC</option>
                                                <option>EST (UTC-5)</option>
                                                <option>GST (UTC+4)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Format</label>
                                            <select
                                                value={settings.preferences?.date_format || "DD/MM/YYYY"}
                                                onChange={(e) => setSettings(s => ({ ...s, preferences: { ...s.preferences, date_format: e.target.value } }))}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option>DD/MM/YYYY</option>
                                                <option>MM/DD/YYYY</option>
                                                <option>YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { label: "Auto Save", sub: "Auto-save form drafts every 60s", key: "auto_save" },
                                            { label: "Compact View", sub: "Reduce padding for denser layout", key: "compact_view" },
                                            { label: "Show Weather Widget", sub: "Display weather on dashboard", key: "show_weather" },
                                            { label: "Auto GPS Capture", sub: "Capture GPS on DSR form open", key: "auto_gps" },
                                        ].map((p, i) => {
                                            const isActive = settings.preferences?.[p.key] ?? true;
                                            return (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 tracking-tight">{p.label}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{p.sub}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[9px] font-black tracking-widest uppercase ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                            {isActive ? 'On' : 'Off'}
                                                        </span>
                                                        <button
                                                            onClick={() => togglePreference(p.key)}
                                                            className={`w-10 h-5 rounded-full relative transition-all ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                        >
                                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isActive ? 'left-6' : 'left-1'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-amber-50/50 border border-amber-100/50 rounded-2xl flex items-start gap-4">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">⚠️</div>
                                <div>
                                    <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-1">Admin-Restricted Settings</p>
                                    <p className="text-[10px] text-amber-600/70 font-medium leading-relaxed">Global project configuration and security settings are restricted to Admin/Project Director roles. Contact your administrator for changes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex justify-end pt-12 items-center gap-8 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Last Audit Logged: Yesterday 4:32 PM</p>
                        <button onClick={handleSaveAll} disabled={updating} className="px-12 py-5 bg-[#0f172a] text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            {updating ? "Saving All..." : "Save All Settings"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClientSettingsPage;
