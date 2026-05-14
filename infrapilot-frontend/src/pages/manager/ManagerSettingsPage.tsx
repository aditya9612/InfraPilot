import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { Upload, Trash2, User, Globe, Bell, Layout, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { settingsService } from "../../services/settingsService";
import type {
    UserSettings,
    UserProfile,
    UpdateSettingsRequest,
    UpdateProfileRequest
} from "../../types/settings";

// ─── Toggle Switch ──────────────────────────────────────────────────────────────

const Toggle = ({
    enabled,
    onChange,
}: {
    enabled: boolean;
    onChange: () => void;
}) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${enabled ? "bg-blue-600" : "bg-slate-200"}`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${enabled ? "translate-x-6" : "translate-x-0"}`}
        />
    </button>
);

// ─── Section Header ─────────────────────────────────────────────────────────────

const SectionHeader = ({
    icon,
    title,
}: {
    icon: React.ReactNode;
    title: string;
}) => (
    <div className="flex items-center gap-2.5 mb-6">
        <span className="text-slate-500">{icon}</span>
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
            {title}
        </span>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const ManagerSettingsPage = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ── Profile State ───────────────────────────────────────────────────
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Settings State ──────────────────────────────────────────────────
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [massUnit, setMassUnit] = useState("Kg");
    const [lengthUnit, setLengthUnit] = useState("Meter");
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        dsrReminders: true,
        issueAlerts: true,
        materialAlerts: true,
    });
    const [preferences, setPreferences] = useState({
        autoSave: true,
        compactView: false,
        showWeather: true,
        showGPS: true,
    });

    const [language, setLanguage] = useState("English");
    const timezone = "IST (UTC+5:30)";
    const dateFormat = "DD/MM/YYYY";

    // Financial & Unit Settings
    const [financialYear, setFinancialYear] = useState("2025-26");
    const [currency, setCurrency] = useState("INR");

    // ─── DATA FETCHING ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [settingsRes, profileRes] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getProfile()
            ]);

            setSettings(settingsRes);
            setProfile(profileRes);

            // Map Settings
            setSelectedProject(settingsRes.default_project_id);
            setLengthUnit(settingsRes.unit || "Meter");
            setFinancialYear(settingsRes.financial_year || "2025-26");
            setCurrency(settingsRes.currency || "INR");

            // Map Profile
            setProfileImage(profileRes.profile_image);

        } catch (error) {
            console.error("Failed to fetch settings/profile", error);
            toast.error("Failed to sync account settings");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setProfileImage(imageUrl);
            toast.success("Profile photo updated temporarily.");
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Profile photo removed.");
    };

    const toggleNotif = (key: keyof typeof notifications) => {
        setNotifications((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    const notifItems = [
        { key: "emailAlerts" as const, label: "Email Alerts", desc: "Receive summary reports via email", icon: "📧" },
        { key: "smsAlerts" as const, label: "SMS Alerts", desc: "Critical site alerts via SMS", icon: "📱" },
        { key: "pushNotifications" as const, label: "Push Notifications", desc: "Real-time app notifications", icon: "🔔" },
        { key: "issueAlerts" as const, label: "High-Priority Issues", desc: "Notify on critical site delays", icon: "⚠️" },
        { key: "materialAlerts" as const, label: "Procurement Alerts", desc: "Notify on material approval requests", icon: "🏗️" },
    ];

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    const prefItems = [
        { key: "autoSave" as const, label: "Auto Save", desc: "Auto-save approval drafts" },
        { key: "compactView" as const, label: "Compact Dashboards", desc: "High-density data visualization" },
        { key: "showWeather" as const, label: "Weather Forecast", desc: "Show site weather conditions" },
    ];

    const projects = [
        { id: 101, name: "Skyline Tower A" },
        { id: 102, name: "Grand Residency Phase 1" },
        { id: 103, name: "Metro Station Ph-IV" },
    ];

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (!profile) return;
        setProfile({ ...profile, [name]: value } as UserProfile);
    };

    // ── Save ─────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!profile || !settings) return;

        setIsSaving(true);
        const toastId = toast.loading("Syncing Manager Preferences…");
        try {
            const settingsData: UpdateSettingsRequest = {
                default_project_id: selectedProject,
                unit: lengthUnit,
                notifications_enabled: notifications.emailAlerts || notifications.pushNotifications,
                preferences: { ...preferences, language, timezone, dateFormat },
                financial_year: financialYear,
                currency: currency,
                tax_settings: settings.tax_settings || {},
                invoice_format: settings.invoice_format || "standard",
                payment_terms: settings.payment_terms || "30 days"
            };

            const profileData: UpdateProfileRequest = {
                full_name: profile.full_name,
                role: profile.role,
                mobile_number: profile.mobile_number.replace(/\D/g, ""),
                email: profile.email,
                address: profile.address,
                pan_number: profile.pan_number?.toUpperCase() || "",
                aadhaar_number: profile.aadhaar_number?.replace(/\D/g, "") || "",
                designation: profile.designation,
                joining_date: profile.joining_date,
                is_active: profile.is_active
            };

            await Promise.all([
                settingsService.updateSettings(settingsData),
                settingsService.updateProfile(profileData)
            ]);

            toast.success("Manager settings updated!", { id: toastId });
            fetchData();
        } catch (error) {
            console.error("Save Manager Settings Error:", error);
            toast.error("Failed to save changes", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar
                title="Manager Configuration"
                breadcrumb={["InfraPilot", "Manager", "Settings"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-16">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Governance & Control
                        </p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Personal Settings
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Configure your oversight parameters and personal profile.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-black transition-all font-inter uppercase tracking-widest active:scale-95"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        Sync Changes
                    </button>
                </div>

                {/* ── Main Settings Grid ───────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ─ 1. Profile Core ──────────────────────────────── */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 lg:col-span-2">
                        <SectionHeader
                            title="Manager Profile"
                            icon={<User className="w-4 h-4" />}
                        />
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                            <div className="flex flex-col items-center gap-4 shrink-0">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-3xl border-4 border-slate-50 bg-slate-100 overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-400 shadow-inner">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.full_name?.charAt(0) || "P"
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-4 border-white"
                                        title="Upload Photo"
                                    >
                                        <Upload className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                {profileImage && (
                                    <button
                                        onClick={handleRemoveImage}
                                        className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Remove Photo
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={profile?.full_name || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Designation</label>
                                        <input
                                            type="text"
                                            name="designation"
                                            value={profile?.designation || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all opacity-70 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile?.email || ""}
                                            disabled
                                            className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 opacity-70 cursor-not-allowed focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Mobile</label>
                                        <input
                                            type="tel"
                                            name="mobile_number"
                                            value={profile?.mobile_number || ""}
                                            disabled
                                            className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 opacity-70 cursor-not-allowed focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─ 2. Global Preferences ──────────────────────────────── */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <SectionHeader
                            title="App Context"
                            icon={<Globe className="w-4 h-4" />}
                        />
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Multi-Site View</label>
                                <select
                                    value={selectedProject || ""}
                                    onChange={e => setSelectedProject(Number(e.target.value))}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Consolidated Portfolio</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                                    <select
                                        value={language}
                                        onChange={e => setLanguage(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
                                    >
                                        <option>English</option>
                                        <option>Hindi</option>
                                        <option>Marathi</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mass Unit</label>
                                    <select
                                        value={massUnit}
                                        onChange={e => setMassUnit(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
                                    >
                                        <option>Kg</option>
                                        <option>Ton</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─ 3. Governance Notifications ──────────────────────────── */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <SectionHeader
                            title="Oversight Alerts"
                            icon={<Bell className="w-4 h-4" />}
                        />
                        <div className="space-y-4">
                            {notifItems.map(item => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-slate-100/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl">{item.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{item.label}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Toggle
                                        enabled={notifications[item.key]}
                                        onChange={() => toggleNotif(item.key)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─ 4. Interface Preferences ───────────────────────────────── */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
                        <SectionHeader
                            title="UI Preferences"
                            icon={<Layout className="w-4 h-4" />}
                        />
                        <div className="space-y-4">
                            {prefItems.map(item => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.desc}</p>
                                    </div>
                                    <Toggle
                                        enabled={preferences[item.key]}
                                        onChange={() => togglePref(item.key)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Restricted Notice */}
                        <div className="flex items-start gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100 mt-auto">
                            <ShieldAlert className="w-6 h-6 text-blue-500 shrink-0" />
                            <div>
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Corporate Policy</p>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                    Base project configuration and tax parameters are managed by the Project Director. Contact central IT for restricted overrides.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </PageTransition>
        </>
    );
};

export default ManagerSettingsPage;
