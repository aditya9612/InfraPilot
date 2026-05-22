import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { Upload, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";
import { settingsService } from "../../services/settingsService";
import { projectService } from "../../services/projectService";
import type {
    UserSettings,
    UserProfile,
    UpdateSettingsRequest
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

const SettingsPage = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ── Profile State ───────────────────────────────────────────────────
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Settings State ──────────────────────────────────────────────────
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const location = useLocation();

    useEffect(() => {
        if (location.hash === "#profile") {
            const element = document.getElementById("profile");
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [location]);
    const [unitSystem, setUnitSystem] = useState("Metric");
    const [massUnit, setMassUnit] = useState("Kg");
    const [lengthUnit, setLengthUnit] = useState("Meter");
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        dsrReminders: true,
        issueAlerts: true,
        materialAlerts: false,
    });
    const [preferences, setPreferences] = useState({
        autoSave: true,
        compactView: false,
        showWeather: true,
        showGPS: true,
    });

    const [language, setLanguage] = useState("English");
    const [timezone, setTimezone] = useState("IST (UTC+5:30)");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

    // Financial & Unit Settings
    const [financialYear, setFinancialYear] = useState("2025-26");
    const [currency, setCurrency] = useState("INR");

    // ─── DATA FETCHING ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        console.log("Fetching settings and profile data...");
        try {
            const [settingsRes, profileRes, projectsRes] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getProfile(),
                projectService.getProjects(100, 0)
            ]);

            setSettings(settingsRes);
            setProfile(profileRes);
            setProjects(Array.isArray(projectsRes) ? projectsRes : (projectsRes.items || []));

            // Map Settings
            setSelectedProject(settingsRes.default_project_id);
            setLengthUnit(settingsRes.unit || "Meter");
            setFinancialYear(settingsRes.financial_year || "2025-26");
            setCurrency(settingsRes.currency || "INR");

            // Map Preferences from settingsRes
            if (settingsRes.preferences) {
                const prefs = settingsRes.preferences;
                if (prefs.language) setLanguage(prefs.language);
                if (prefs.timezone) setTimezone(prefs.timezone);
                if (prefs.dateFormat) setDateFormat(prefs.dateFormat);
                if (prefs.unitSystem) setUnitSystem(prefs.unitSystem);
                if (prefs.massUnit) setMassUnit(prefs.massUnit);
                if (prefs.autoSave !== undefined) setPreferences(p => ({ ...p, autoSave: prefs.autoSave }));
                if (prefs.compactView !== undefined) setPreferences(p => ({ ...p, compactView: prefs.compactView }));
                if (prefs.showWeather !== undefined) setPreferences(p => ({ ...p, showWeather: prefs.showWeather }));
                if (prefs.showGPS !== undefined) setPreferences(p => ({ ...p, showGPS: prefs.showGPS }));
            }
            // Map Profile
            setProfileImage(profileRes.profile_image);

            // Map Profile Image (Handle relative paths)
            const resolvedPath = settingsService.resolveUrl(profileRes.profile_image);
            console.log("Settings Refresh - Resolved Image URL:", resolvedPath);
            setProfileImage(resolvedPath);

            console.log("Data sync complete:", { settingsRes, profileRes });
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
            setSelectedFile(file);
            const imageUrl = URL.createObjectURL(file);
            setProfileImage(imageUrl);
            toast.success("Profile photo selected.");
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Profile photo removed.");
    };

    const unitOptions = {
        system: ["Metric", "Imperial"],
        mass: ["Kg", "Feet", "Meter"],
        length: ["Meter", "Feet", "Inch", "Cm"],
    };

    const toggleNotif = (key: keyof typeof notifications) => {
        setNotifications((prev: typeof notifications) => ({ ...prev, [key]: !prev[key] }));
    };

    const notifItems = [
        { key: "emailAlerts" as const, label: "Email Alerts", desc: "Receive daily summary via email", icon: "📧" },
        { key: "smsAlerts" as const, label: "SMS Alerts", desc: "Critical site alerts via SMS", icon: "📱" },
        { key: "pushNotifications" as const, label: "Push Notifications", desc: "Real-time app notifications", icon: "🔔" },
        { key: "dsrReminders" as const, label: "DSR Reminders", desc: "Daily reminder to submit DSR", icon: "📋" },
        { key: "issueAlerts" as const, label: "Issue Alerts", desc: "Notify on new high-priority issues", icon: "⚠️" },
        { key: "materialAlerts" as const, label: "Material Alerts", desc: "Low stock threshold notifications", icon: "🏗️" },
    ];

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences((prev: typeof preferences) => ({ ...prev, [key]: !prev[key] }));
    };

    const prefItems = [
        { key: "autoSave" as const, label: "Auto Save", desc: "Auto-save form drafts every 60s" },
        { key: "compactView" as const, label: "Compact View", desc: "Reduce padding for denser layout" },
        { key: "showWeather" as const, label: "Show Weather Widget", desc: "Display weather on dashboard" },
        { key: "showGPS" as const, label: "Auto GPS Capture", desc: "Capture GPS on DSR form open" },
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
        const toastId = toast.loading("Syncing configuration…");
        try {
            // 1. Prepare Settings Update
            const settingsData: UpdateSettingsRequest = {
                default_project_id: selectedProject,
                unit: lengthUnit,
                notifications_enabled: notifications.emailAlerts || notifications.pushNotifications,
                preferences: {
                    ...preferences,
                    language,
                    timezone,
                    dateFormat,
                    unitSystem,
                    massUnit
                },
                financial_year: financialYear,
                currency: currency,
                tax_settings: settings.tax_settings || {},
                invoice_format: settings.invoice_format || "standard",
                payment_terms: settings.payment_terms || "30 days"
            };

            // 2. Prepare Profile Update (with sanitization)
            const profileData: any = {
                full_name: profile.full_name,
                role: profile.role,
                mobile_number: profile.mobile_number.replace(/\D/g, ""),
                email: profile.email,
                address: profile.address,
                pan_number: profile.pan_number.toUpperCase(),
                aadhaar_number: profile.aadhaar_number.replace(/\D/g, ""),
                designation: profile.designation,
                joining_date: profile.joining_date,
                is_active: profile.is_active,
                // Include the actual file if selected
                profile_image: selectedFile || undefined
            };

            console.log("Syncing All Settings...", { settingsData, profileData });

            const [updatedSettings, updatedProfile] = await Promise.all([
                settingsService.updateSettings(settingsData),
                settingsService.updateProfile(profileData)
            ]);

            console.log("Profile Update Success - Response Image:", updatedProfile.profile_image);

            // Update local state immediately with returned data from API
            setSettings(updatedSettings);
            setProfile(updatedProfile);
            setProfileImage(settingsService.resolveUrl(updatedProfile.profile_image));
            setSelectedFile(null);

            // Refetch fresh configurations from backend to keep everything fully synced
            await fetchData();

            toast.success("Account settings synchronized!", { id: toastId });
            console.log("Settings synchronization complete.");
        } catch (error: any) {
            console.error("Save Settings Error:", error);
            const errorMsg = error.response?.data?.message || "Failed to sync changes. Please try again.";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

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
        <>
            <Navbar
                title="Settings"
                breadcrumb={["InfraPilot", "Engineer", "Settings"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 h-[calc(100vh-64px)] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 md:mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Preferences
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Settings
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Configure your project, units, notifications, and personal preferences.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        Save Settings
                    </button>
                </div>

                {/* ── Stat Cards ───────────────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Current Configuration
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Project</p>
                            <p className="text-base font-bold text-primary truncate">
                                {projects.find(p => p.id === selectedProject)?.project_name || `ID: ${selectedProject}`}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Primary project workspace</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Unit System</p>
                            <p className="text-base font-bold text-emerald-500">{unitSystem}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{massUnit} · {lengthUnit}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notifications</p>
                            <p className="text-base font-bold text-amber-500">
                                {Object.values(notifications).filter(Boolean).length} / {Object.keys(notifications).length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Channels enabled</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Language</p>
                            <p className="text-base font-bold text-slate-700">{language}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{timezone}</p>
                        </div>
                    </div>
                </div>

                {/* ── Main Settings Grid ───────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <div id="profile" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
                        <SectionHeader
                            title="Profile & Account"
                            icon={<User className="w-4 h-4" />}
                        />
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-100 overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400 shadow-sm">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.full_name?.charAt(0) || "U"
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-white"
                                        title="Upload Photo"
                                    >
                                        <Upload className="w-3.5 h-3.5" strokeWidth={3} />
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
                                        <Trash2 className="w-3 h-3" /> Remove
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={profile?.full_name || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Designation</label>
                                        <input
                                            type="text"
                                            name="designation"
                                            value={profile?.designation || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile?.email || ""}
                                            disabled
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mobile Number</label>
                                        <input
                                            type="tel"
                                            name="mobile_number"
                                            value={profile?.mobile_number || ""}
                                            disabled
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PAN Number</label>
                                        <input
                                            type="text"
                                            name="pan_number"
                                            value={profile?.pan_number || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aadhaar Number</label>
                                        <input
                                            type="text"
                                            name="aadhaar_number"
                                            value={profile?.aadhaar_number || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={profile?.role || ""}
                                            readOnly
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                                            title="Role cannot be changed manually"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joining Date</label>
                                        <input
                                            type="date"
                                            name="joining_date"
                                            value={profile?.joining_date || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={profile?.address || ""}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Account Status</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Toggle active status of this profile</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${profile?.is_active ? "text-emerald-600" : "text-rose-500"}`}>
                                                {profile?.is_active ? "Active" : "Inactive"}
                                            </span>
                                            <Toggle
                                                enabled={profile?.is_active || false}
                                                onChange={() => setProfile(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null)}
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end mt-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-60"
                                        >
                                            {isSaving ? (
                                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            Save Profile Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─ 1. Project Selection ──────────────────────────────── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <SectionHeader
                            title="Project Selection"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            }
                        />

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Active Project
                                </label>
                                <select
                                    value={selectedProject || ""}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setSelectedProject(val === "" ? null : Number(val));
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select Project (None)</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ─ 2. Units ──────────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <SectionHeader
                            title="Units"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            }
                        />

                        <div className="space-y-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit System</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {unitOptions.system.map(u => (
                                        <button
                                            key={u}
                                            onClick={() => setUnitSystem(u)}
                                            className={`py-3 rounded-xl text-xs font-bold border transition-all ${unitSystem === u
                                                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Mass / Weight
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {unitOptions.mass.map(u => (
                                        <button
                                            key={u}
                                            onClick={() => setMassUnit(u)}
                                            className={`py-3 rounded-xl text-xs font-bold border transition-all ${massUnit === u
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Length / Distance
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {unitOptions.length.map(u => (
                                        <button
                                            key={u}
                                            onClick={() => setLengthUnit(u)}
                                            className={`py-3 rounded-xl text-xs font-bold border transition-all ${lengthUnit === u
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Units</p>
                                    <p className="text-sm font-black text-slate-800">{unitSystem} · {massUnit} · {lengthUnit}</p>
                                </div>
                                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-base">⚖️</div>
                            </div>
                        </div>
                    </div>

                    {/* ─ 3. Notification Settings ──────────────────────────── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <SectionHeader
                            title="Notification Settings"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            }
                        />

                        <div className="space-y-3">
                            {notifItems.map(item => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{item.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${notifications[item.key] ? "text-emerald-600" : "text-slate-400"}`}>
                                            {notifications[item.key] ? "On" : "Off"}
                                        </span>
                                        <Toggle
                                            enabled={notifications[item.key]}
                                            onChange={() => toggleNotif(item.key)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─ 4. User Preferences ───────────────────────────────── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
                        <SectionHeader
                            title="User Preferences"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Language</label>
                                <select
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    {["English", "Hindi", "Marathi", "Tamil", "Telugu"].map(l => (
                                        <option key={l}>{l}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timezone</label>
                                    <select
                                        value={timezone}
                                        onChange={e => setTimezone(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        {["IST (UTC+5:30)", "UTC", "EST (UTC-5)", "GST (UTC+4)"].map(t => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Format</label>
                                    <select
                                        value={dateFormat}
                                        onChange={e => setDateFormat(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map(d => (
                                            <option key={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {prefItems.map(item => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${preferences[item.key] ? "text-emerald-600" : "text-slate-400"}`}>
                                            {preferences[item.key] ? "On" : "Off"}
                                        </span>
                                        <Toggle
                                            enabled={preferences[item.key]}
                                            onChange={() => togglePref(item.key)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 lg:mt-auto">
                            <span className="text-lg shrink-0">⚠️</span>
                            <div>
                                <p className="text-xs font-bold text-amber-700 mb-0.5">Admin-Restricted Settings</p>
                                <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                                    Global project configuration and security settings are restricted to Admin/Project Director roles. Contact your administrator for changes.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Bottom Save Bar ──────────────────────────────────────── */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-slate-900 hover:bg-black disabled:opacity-60 text-white text-[11px] font-black rounded-2xl tracking-[0.1em] transition-all shadow-xl uppercase active:scale-95"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        Save All Settings
                    </button>
                </div>

            </PageTransition>
        </>
    );
};

export default SettingsPage;

