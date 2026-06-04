import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { User, Settings as SettingsIcon, Bell, Globe, Upload, Trash2 } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import { settingsService } from "../../services/settingsService";
import { projectService } from "../../services/projectService";
import type { UserSettings, CompanySettings } from "../../types/settings";
import PageTransition from "../../components/common/PageTransition";
import Toggle from "../../components/common/Toggle";
import { useAuth } from "../../context/AuthContext";

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary shadow-sm border border-slate-100">
            {icon}
        </div>
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
    </div>
);

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";
    const [activeTab, setActiveTab] = useState<"general" | "personal" | "company">("general");
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Company Branding State
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const logoRef = useRef<HTMLInputElement>(null);
    const sigRef = useRef<HTMLInputElement>(null);

    // Form states
    const [language, setLanguage] = useState("English");
    const [timezone, setTimezone] = useState("IST (UTC+5:30)");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [unitSystem, setUnitSystem] = useState("Metric");
    const [massUnit, setMassUnit] = useState("kg");
    const [lengthUnit, setLengthUnit] = useState("m");
    const [notifications, setNotifications] = useState<Record<string, boolean>>({});
    const [preferences, setPreferences] = useState<Record<string, boolean>>({});
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [projectSearch, setProjectSearch] = useState("");

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [settingsData, profileData, companyData, projectsRes] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getProfile(),
                settingsService.getCompanySettings(),
                projectService.getProjects(100, 0)
            ]);

            const projectsList = Array.isArray(projectsRes) ? projectsRes : projectsRes.items || [];
            setProjects(projectsList);
            setSettings(settingsData);
            setProfile(profileData);
            setCompanySettings(companyData);

            if (profileData.profile_image) {
                setProfileImage(settingsService.resolveUrl(profileData.profile_image));
            }
            if (companyData.company_logo) {
                setCompanyLogo(settingsService.resolveUrl(companyData.company_logo));
            }
            if (companyData.signature_image) {
                setSignatureImage(settingsService.resolveUrl(companyData.signature_image));
            }

            setLanguage(settingsData.preferences?.language || "English");
            setTimezone(settingsData.preferences?.timezone || "IST (UTC+5:30)");
            setDateFormat(settingsData.preferences?.date_format || "DD/MM/YYYY");

            // Backend returns 'unit' as a string enum ('Kg'|'Feet'|'Meter').
            // We restore the full unit state from preferences if previously saved there.
            const savedPrefs = settingsData.preferences || {};
            setUnitSystem(savedPrefs.unitSystem || "Metric");
            setMassUnit(savedPrefs.massUnit || "kg");
            // Map backend unit string → length unit for UI
            const backendUnit = typeof settingsData.unit === 'string' ? settingsData.unit : "";
            setLengthUnit(savedPrefs.lengthUnit || (backendUnit === "Feet" ? "ft" : "m"));

            // notifications_enabled is a boolean from backend, restore granular state from preferences
            const savedNotifs = savedPrefs.notifications;
            setNotifications(savedNotifs || { email: true, push: true, sms: false, dsr: true, issues: true, materials: false });
            setPreferences(savedPrefs.ui || { autoSave: true, compactView: false, showWeather: true });
            setSelectedProject(settingsData.default_project_id || null);
        } catch (error) {
            console.error("Fetch Settings Error:", error);
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setProfileImage(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setSelectedFile(null);
        if (profile) setProfile({ ...profile, profile_image: null });
    };

    const toggleNotif = (key: string) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!settings || !profile) return;
        setIsSaving(true);
        const toastId = toast.loading("Saving settings...");
        try {
            // Map UI unit values to backend enum: 'Kg' | 'Feet' | 'Meter'
            const getBackendUnit = (): string => {
                const feetValues = ["ft", "in", "feet", "Feet"];
                const meterValues = ["m", "cm", "mm", "km", "Meter", "meter"];
                if (feetValues.includes(lengthUnit)) return "Feet";
                if (meterValues.includes(lengthUnit)) return "Meter";
                return "Kg"; // fallback for mass-only
            };

            const settingsData = {
                ...settings,
                default_project_id: selectedProject,
                unit: getBackendUnit(),  // maps to 'Kg' | 'Feet' | 'Meter'
                notifications_enabled: Object.values(notifications).some(Boolean), // boolean
                preferences: {
                    ...settings.preferences,
                    language, timezone, date_format: dateFormat,
                    unitSystem, massUnit, lengthUnit, // persist full unit state
                    notifications, ui: preferences     // persist granular notification/pref state
                }
            };
            const profileData = { ...profile, profile_image: selectedFile || profile.profile_image };
            await Promise.all([
                settingsService.updateSettings(settingsData),
                settingsService.updateProfile(profileData)
            ]);
            toast.success("Settings saved successfully!", { id: toastId });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCompanySave = async () => {
        if (!companySettings) return;
        setIsSaving(true);
        const toastId = toast.loading("Saving company profile...");
        try {
            await settingsService.updateCompanySettings(companySettings);
            toast.success("Company settings updated!", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Failed to save company settings", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCompanyImageUpload = async (type: 'logo' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const toastId = toast.loading(`Uploading ${type}...`);
        try {
            const res = await (type === 'logo' ? settingsService.uploadLogo(file) : settingsService.uploadSignature(file));
            const fullUrl = settingsService.resolveUrl(res.file_path);
            if (type === 'logo') {
                setCompanyLogo(fullUrl);
                setCompanySettings(prev => prev ? ({ ...prev, company_logo: res.file_path }) : null);
            } else {
                setSignatureImage(fullUrl);
                setCompanySettings(prev => prev ? ({ ...prev, signature_image: res.file_path }) : null);
            }
            toast.success(`${type === 'logo' ? 'Logo' : 'Signature'} updated!`, { id: toastId });
        } catch (error: any) {
            toast.error(`Failed to upload ${type}`, { id: toastId });
        }
    };

    const unitOptions = {
        system: ["Metric", "Imperial"],
        mass: ["kg", "g", "lb", "oz", "ton"],
        length: ["m", "cm", "mm", "in", "ft", "km"]
    };

    const notifItems = [
        { key: "email", label: "Email Alerts", icon: "📧", desc: "Receive daily summary via email" },
        { key: "sms", label: "SMS Alerts", icon: "📱", desc: "Critical site alerts via SMS" },
        { key: "push", label: "Push Notifications", icon: "🔔", desc: "Real-time app notifications" },
        { key: "dsr", label: "DSR Reminders", icon: "📋", desc: "Daily reminder to submit DSR" },
        { key: "issues", label: "Issue Alerts", icon: "⚠️", desc: "Notify on new high-priority issues" },
        { key: "materials", label: "Material Alerts", icon: "🏗️", desc: "Low stock threshold notifications" },
    ];

    const prefItems = [
        { key: "autoSave", label: "Auto Save", desc: "Auto-save form drafts every 60s" },
        { key: "compactView", label: "Compact View", desc: "Reduce padding for denser layout" },
        { key: "showWeather", label: "Show Weather Widget", desc: "Display weather on dashboard" },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar title="Settings" breadcrumb={["InfraPilot", "Admin", "Settings"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Preferences</p>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage your personal preferences and global company branding.</p>
                    </div>
                    <button
                        onClick={activeTab === "company" ? handleCompanySave : handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <SettingsIcon className="w-4 h-4" />
                        )}
                        {activeTab === "company" ? "Update Branding" : activeTab === "personal" ? "Save Profile" : "Save Settings"}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl w-fit mb-10 border border-slate-200 shadow-sm transition-all">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "general" ? "bg-slate-900 text-white shadow-xl scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                    >
                        ⚙️ General Settings
                    </button>
                    <button
                        onClick={() => setActiveTab("personal")}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "personal" ? "bg-slate-900 text-white shadow-xl scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                    >
                        👤 My Account
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab("company")}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "company" ? "bg-slate-900 text-white shadow-xl scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                        >
                            🏢 Company Settings
                        </button>
                    )}
                </div>

                {/* ── General Settings Tab ── */}
                {activeTab === "general" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Project Selection */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <SectionHeader title="Project Selection" icon={<SettingsIcon className="w-4 h-4" />} />
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Project</label>
                                <div className="relative">
                                    <select
                                        value={selectedProject || ""}
                                        onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">No Project Selected</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.project_name || p.name || `Project #${p.id}`}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <SettingsIcon className="w-3 h-3" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">Select a project to set it as your default for all reporting and dashboard views.</p>
                            </div>
                        </div>

                        {/* Units & Measurement */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <SectionHeader title="Units & Measurement" icon={<Globe className="w-4 h-4" />} />
                            <div className="space-y-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit System</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {unitOptions.system.map(u => (
                                            <button key={u} onClick={() => setUnitSystem(u)} className={`py-3 rounded-xl text-xs font-bold border transition-all ${unitSystem === u ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{u}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mass / Weight</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {unitOptions.mass.map(u => (
                                            <button key={u} onClick={() => setMassUnit(u)} className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${massUnit === u ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{u.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Length / Distance</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {unitOptions.length.map(u => (
                                            <button key={u} onClick={() => setLengthUnit(u)} className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${lengthUnit === u ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{u.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Units</p>
                                    <p className="text-sm font-black text-slate-800">{unitSystem} · {massUnit} · {lengthUnit}</p>
                                </div>
                            </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <SectionHeader title="Notification Settings" icon={<Bell className="w-4 h-4" />} />
                            <div className="space-y-4">
                                {notifItems.map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.icon}</span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${notifications[item.key] ? "text-emerald-600" : "text-slate-400"}`}>
                                                {notifications[item.key] ? "On" : "Off"}
                                            </span>
                                            <Toggle enabled={!!notifications[item.key]} onChange={() => toggleNotif(item.key)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* User Preferences */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <SectionHeader title="User Preferences" icon={<User className="w-4 h-4" />} />
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Language</label>
                                        <select value={language} onChange={e => setLanguage(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all appearance-none">
                                            {["English", "Hindi", "Marathi", "Tamil", "Telugu"].map(l => <option key={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timezone</label>
                                            <select value={timezone} onChange={e => setTimezone(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all appearance-none">
                                                {["IST (UTC+5:30)", "UTC", "EST (UTC-5)", "GST (UTC+4)"].map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date Format</label>
                                            <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all appearance-none">
                                                {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map(d => <option key={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {prefItems.map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${preferences[item.key] ? "text-emerald-600" : "text-slate-400"}`}>
                                                    {preferences[item.key] ? "On" : "Off"}
                                                </span>
                                                <Toggle enabled={!!preferences[item.key]} onChange={() => setPreferences(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── My Account Tab ── */}
                {activeTab === "personal" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Profile Section */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 lg:col-span-2">
                            <SectionHeader title="Profile & Account" icon={<User className="w-4 h-4" />} />
                            <div className="flex flex-col md:flex-row items-start gap-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-28 h-28 rounded-full border-4 border-slate-50 bg-slate-100 overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400 shadow-inner">
                                            {profileImage ? (
                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                profile?.full_name?.charAt(0) || "U"
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-white"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                                    </div>
                                    {profileImage && (
                                        <button onClick={handleRemoveImage} className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                        <input type="text" name="full_name" value={profile?.full_name || ""} onChange={handleProfileChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Designation</label>
                                        <input type="text" name="designation" value={profile?.designation || ""} onChange={handleProfileChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PAN Number</label>
                                        <input type="text" name="pan_number" value={profile?.pan_number || ""} onChange={handleProfileChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aadhaar Number</label>
                                        <input type="text" name="aadhaar_number" value={profile?.aadhaar_number || ""} onChange={handleProfileChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                                        <input type="text" name="address" value={profile?.address || ""} onChange={handleProfileChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Company Settings Tab ── */}
                {activeTab === "company" && (
                    <div className="space-y-8 pb-10">
                        {/* Branding Assets */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                                <SectionHeader title="Company Logo" icon={<Upload className="w-4 h-4" />} />
                                <div className="w-64 h-32 mx-auto bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                    {companyLogo ? (
                                        <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain p-4" />
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Logo</span>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <button onClick={() => logoRef.current?.click()} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">Change</button>
                                    </div>
                                </div>
                                <input type="file" hidden ref={logoRef} onChange={(e) => handleCompanyImageUpload('logo', e)} accept="image/*" />
                                <p className="mt-4 text-[10px] text-slate-400 font-medium">Recommended: 400x200px PNG (Transparent)</p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                                <SectionHeader title="Digital Signature" icon={<Upload className="w-4 h-4" />} />
                                <div className="w-64 h-32 mx-auto bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                    {signatureImage ? (
                                        <img src={signatureImage} alt="Signature" className="max-w-full max-h-full object-contain p-4" />
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Signature</span>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <button onClick={() => sigRef.current?.click()} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">Change</button>
                                    </div>
                                </div>
                                <input type="file" hidden ref={sigRef} onChange={(e) => handleCompanyImageUpload('signature', e)} accept="image/*" />
                                <p className="mt-4 text-[10px] text-slate-400 font-medium">Used for PDF invoices and official reports</p>
                            </div>
                        </div>

                        {/* Company Details */}
                        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
                            <SectionHeader title="Organization Identity & Legal" icon={<SettingsIcon className="w-4 h-4" />} />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</label>
                                    <input type="text" value={companySettings?.company_name || ""} onChange={e => setCompanySettings({ ...companySettings!, company_name: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="Enter full legal company name" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GST Number</label>
                                    <input type="text" value={companySettings?.gst_number || ""} onChange={e => setCompanySettings({ ...companySettings!, gst_number: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="22AAAAA0000A1Z5" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                                    <input type="email" value={companySettings?.email || ""} onChange={e => setCompanySettings({ ...companySettings!, email: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="contact@company.com" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile</label>
                                    <input type="tel" value={companySettings?.mobile_number || ""} onChange={e => setCompanySettings({ ...companySettings!, mobile_number: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="+91 98765 43210" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Number</label>
                                    <input type="tel" value={companySettings?.whatsapp_number || ""} onChange={e => setCompanySettings({ ...companySettings!, whatsapp_number: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="+91 98765 43210" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instagram Handle</label>
                                    <input type="text" value={companySettings?.instagram_handle || ""} onChange={e => setCompanySettings({ ...companySettings!, instagram_handle: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="@username" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Website</label>
                                    <input type="url" value={companySettings?.website || ""} onChange={e => setCompanySettings({ ...companySettings!, website: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="https://www.company.com" />
                                </div>
                                <div className="flex flex-col gap-1.5 lg:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                                    <input type="text" value={companySettings?.address || ""} onChange={e => setCompanySettings({ ...companySettings!, address: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="Enter registered business address" />
                                </div>
                            </div>

                            <div className="mt-10">
                                <SectionHeader title="Financial & Bank Details" icon={<Globe className="w-4 h-4" />} />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Holder Name</label>
                                        <input type="text" value={companySettings?.account_holder_name || ""} onChange={e => setCompanySettings({ ...companySettings!, account_holder_name: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="Exact name as in bank" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Name</label>
                                        <input type="text" value={companySettings?.bank_name || ""} onChange={e => setCompanySettings({ ...companySettings!, bank_name: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="Enter bank name" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</label>
                                        <input type="text" value={companySettings?.account_number || ""} onChange={e => setCompanySettings({ ...companySettings!, account_number: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="00000000000" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IFSC Code</label>
                                        <input type="text" value={companySettings?.ifsc_code || ""} onChange={e => setCompanySettings({ ...companySettings!, ifsc_code: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="SBIN0000000" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">UPI ID (VPA)</label>
                                        <input type="text" value={companySettings?.upi_id || ""} onChange={e => setCompanySettings({ ...companySettings!, upi_id: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all" placeholder="company@okaxis" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Terms & Conditions (Invoice Footer)</label>
                                <textarea rows={4} value={companySettings?.terms_conditions || ""} onChange={e => setCompanySettings({ ...companySettings!, terms_conditions: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary transition-all resize-none" placeholder="Standard terms for your company..." />
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button
                                    onClick={handleCompanySave}
                                    disabled={isSaving}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                >
                                    {isSaving ? "Syncing..." : "Update Global Branding"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </PageTransition>
        </div>
    );
};

export default SettingsPage;
