import React, { useState, useRef, useEffect } from 'react';
import { User, Check, Trash2, Upload, Calendar, MapPin, AlertTriangle, Landmark, ShieldCheck, Loader2, Edit2, Sliders, Bell, Mail, Smartphone, Phone } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import { projectService } from '../../services/projectService';
import type { UserProfile, UserSettings, UpdateProfileRequest, UpdateSettingsRequest } from '../../types/settings';

const LabourSettingsPage: React.FC = () => {
    const { refreshUser } = useAuth();
    
    // Loading States
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Edit Modes
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingBank, setIsEditingBank] = useState(false);

    // Profile State
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

    // Settings State
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [projects, setProjects] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bank Details (Local state for now as it's not in the requested APIs)
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '•••• •••• 5678',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        upiId: 'labour@upi'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [profileData, settingsData, projectsData] = await Promise.all([
                settingsService.getProfile(),
                settingsService.getSettings(),
                projectService.getProjects(100)
            ]);
            
            setProfile(profileData);
            setSettings(settingsData);
            
            // Map projects from wrapper or array
            const itemList = Array.isArray(projectsData) ? projectsData : (projectsData.items || []);
            setProjects(itemList);
            
            if (profileData.profile_image) {
                setProfilePicPreview(settingsService.resolveUrl(profileData.profile_image));
            }
        } catch (error: any) {
            console.error("Failed to fetch settings data:", error);
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicPreview(reader.result as string);
                toast.success("Photo selected");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setProfileImageFile(null);
        setProfilePicPreview(null);
        if (profile) {
            setProfile({ ...profile, profile_image: null });
        }
    };

    const handleSave = async () => {
        if (!profile || !settings) return;
        
        setIsSaving(true);
        const saveToast = toast.loading("Saving settings...");
        
        try {
            // 1. Prepare and Update Profile
            const profileUpdate: UpdateProfileRequest = {
                full_name: profile.full_name,
                designation: profile.designation,
                email: profile.email,
                mobile_number: profile.mobile_number,
                pan_number: profile.pan_number,
                aadhaar_number: profile.aadhaar_number,
                role: profile.role,
                joining_date: profile.joining_date,
                address: profile.address,
                is_active: profile.is_active,
                // Handle image update: File if new upload, null if removed, undefined if unchanged
                profile_image: profileImageFile ? profileImageFile : (profilePicPreview === null ? null : undefined)
            };

            // 2. Prepare and Update Settings
            const safePreferences = settings.preferences || {};
            const settingsUpdate: UpdateSettingsRequest = {
                default_project_id: settings.default_project_id ? Number(settings.default_project_id) : null,
                unit: settings.unit,
                notifications_enabled: settings.notifications_enabled,
                preferences: safePreferences,
                financial_year: settings.financial_year,
                currency: settings.currency,
                invoice_format: settings.invoice_format,
                payment_terms: settings.payment_terms,
                tax_settings: settings.tax_settings || {} 
            };

            await Promise.all([
                settingsService.updateProfile(profileUpdate),
                settingsService.updateSettings(settingsUpdate)
            ]);

            toast.success("Settings saved successfully!", { id: saveToast });
            setIsEditingProfile(false);
            if (refreshUser && profile) {
                refreshUser({
                    name: profile.full_name,
                    mobile: profile.mobile_number,
                    profile_image: profilePicPreview
                });
            }
            await fetchData(); // Refresh local state
        } catch (error: any) {
            console.error("Save failed:", error);
            const errorData = error.response?.data;
            const errorMessage = typeof errorData === 'string' 
                ? errorData 
                : (errorData?.message || errorData?.detail || error.message);
            
            toast.error(`Failed to save: ${errorMessage}`, { id: saveToast, duration: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBank = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsEditingBank(false);
            toast.success("Bank details updated successfully");
        }, 800);
    };

    return (
        <>
            <Navbar 
                title="Labour Settings" 
                breadcrumb={['Labour', 'Settings']} 
            />
            <PageTransition className="bg-[#f8fafc] min-h-screen font-inter">
                <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-12 pb-24">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PREFERENCES</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h1>
                            <p className="text-sm font-bold text-slate-400">Configure your project, units, notifications, and personal preferences.</p>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className={`${isSaving ? 'opacity-70 cursor-not-allowed' : 'bg-[#0062ff] hover:bg-blue-700 shadow-blue-100 active:scale-95'} text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isSaving ? 'SAVING...' : 'Save Settings'}
                        </button>
                    </div>

                    {/* Current Configuration Row */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">CURRENT CONFIGURATION</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { 
                                    label: 'ACTIVE PROJECT', 
                                    value: projects.find(p => p.id === settings?.default_project_id)?.name || 'Default Project', 
                                    sub: 'PRIMARY PROJECT WORKSPACE', 
                                    color: 'text-[#0062ff]' 
                                },
                                { 
                                    label: 'UNIT SYSTEM', 
                                    value: settings?.unit || 'Metric', 
                                    sub: 'MEASUREMENT STANDARD', 
                                    color: 'text-emerald-500' 
                                },
                                { 
                                    label: 'NOTIFICATIONS', 
                                    value: settings?.notifications_enabled ? 'ENABLED' : 'DISABLED', 
                                    sub: 'SYSTEM CHANNELS', 
                                    color: 'text-orange-400' 
                                },
                                { 
                                    label: 'FINANCIAL YEAR', 
                                    value: settings?.financial_year || '2025-26', 
                                    sub: `CURRENCY: ${settings?.currency || 'INR'}`, 
                                    color: 'text-slate-800' 
                                },
                            ].map((config, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{config.label}</p>
                                    <p className={`text-lg font-black tracking-tight ${config.color}`}>{config.value}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">{config.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sections Container */}
                    <div className="space-y-8">
                        
                        {/* Profile & Account Section */}
                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                            <div className="flex items-center justify-between gap-3 text-slate-400 border-b border-slate-50 pb-8 mb-8">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5" />
                                    <h2 className="text-[12px] font-black uppercase tracking-[0.2em]">PROFILE & ACCOUNT</h2>
                                </div>
                                {!isEditingProfile && (
                                    <button 
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-[10px] font-black text-[#0062ff] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                                {/* Profile Img Controls - Left Column */}
                                <div className="flex flex-col items-center gap-6 py-4 min-w-[240px]">
                                    <div className="relative">
                                        <div className="w-40 h-40 rounded-full overflow-hidden border-[6px] border-slate-50 shadow-2xl relative group">
                                            {profilePicPreview ? (
                                                <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                                    <User className="w-16 h-16 text-slate-200" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-2 right-2 w-11 h-11 bg-[#0062ff] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                                    </div>
                                    <button 
                                        onClick={handleRemovePhoto}
                                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> REMOVE
                                    </button>
                                </div>

                                {/* Form Fields - Right Column */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                    {[
                                        { label: 'FULL NAME', value: profile?.full_name || '', key: 'full_name' },
                                        { label: 'DESIGNATION', value: profile?.designation || '', key: 'designation' },
                                        { label: 'EMAIL ADDRESS', value: profile?.email || '', key: 'email' },
                                        { label: 'MOBILE NUMBER', value: profile?.mobile_number || '', key: 'mobile_number' },
                                        { label: 'PAN NUMBER', value: profile?.pan_number || '', key: 'pan_number' },
                                        { label: 'AADHAAR NUMBER', value: profile?.aadhaar_number || '', key: 'aadhaar_number' },
                                        { label: 'ROLE', value: profile?.role || '', key: 'role', disabled: true },
                                        { label: 'JOINING DATE', value: profile?.joining_date || '', key: 'joining_date', isDate: true },
                                    ].map((field, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                            <div className="relative">
                                                <input 
                                                    type={field.isDate ? "date" : "text"} 
                                                    value={field.value} 
                                                    disabled={field.disabled || !isEditingProfile}
                                                    onChange={e => profile && setProfile({ ...profile, [field.key]: e.target.value })}
                                                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-100/50 transition-all ${field.disabled || !isEditingProfile ? 'opacity-70 cursor-not-allowed bg-slate-50/50' : 'hover:border-slate-200'}`}
                                                />
                                                {field.isDate && <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ADDRESS</label>
                                        <input 
                                            type="text" 
                                            value={profile?.address || ''} 
                                            disabled={!isEditingProfile}
                                            onChange={e => profile && setProfile({ ...profile, address: e.target.value })}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-100/50 transition-all ${!isEditingProfile ? 'opacity-70 cursor-not-allowed bg-slate-50/50' : 'hover:border-slate-200'}`}
                                        />
                                    </div>
                                    
                                    {/* Account Status Card */}
                                    <div className="md:col-span-2 mt-8 p-6 bg-slate-50/30 rounded-[24px] border border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-900 tracking-tight">Account Status</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">TOGGLE ACTIVE STATUS OF THIS PROFILE</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${profile?.is_active ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                {profile?.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                            <button 
                                                onClick={() => profile && setProfile({ ...profile, is_active: !profile.is_active })}
                                                disabled={!isEditingProfile}
                                                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${profile?.is_active ? 'bg-[#0062ff] shadow-lg shadow-blue-100' : 'bg-slate-300'} ${!isEditingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${profile?.is_active ? 'translate-x-7' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 flex justify-end gap-5 pt-8">
                                        {isEditingProfile && (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setIsEditingProfile(false);
                                                        fetchData();
                                                    }}
                                                    className="px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="bg-[#111827] text-white px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-70"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    {isSaving ? 'SAVING...' : 'SAVE PROFILE SETTINGS'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lower Cards Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Bank Details Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Landmark className="w-4 h-4" />
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">BANK DETAILS</h2>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ACCOUNT NUMBER</label>
                                        <input 
                                            type="text" 
                                            value={bankDetails.accountNumber} 
                                            disabled={!isEditingBank}
                                            onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-mono ${!isEditingBank ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">BANK NAME</label>
                                        <input 
                                            type="text" 
                                            value={bankDetails.bankName} 
                                            disabled={!isEditingBank}
                                            onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all ${!isEditingBank ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">IFSC CODE</label>
                                        <input 
                                            type="text" 
                                            value={bankDetails.ifscCode} 
                                            disabled={!isEditingBank}
                                            onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all uppercase ${!isEditingBank ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UPI ID</label>
                                        <input 
                                            type="text" 
                                            value={bankDetails.upiId} 
                                            disabled={!isEditingBank}
                                            onChange={e => setBankDetails({...bankDetails, upiId: e.target.value})}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all ${!isEditingBank ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">SECURITY VERIFIED</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-600/70 leading-relaxed mt-1">Your payment details are encrypted and stored securely. Only authorized payroll personnel can view this information.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    {!isEditingBank ? (
                                        <button 
                                            onClick={() => setIsEditingBank(true)}
                                            className="px-8 py-3.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Bank Details
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setIsEditingBank(false)}
                                                className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveBank}
                                                disabled={isSaving}
                                                className="px-8 py-3.5 bg-[#0062ff] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
                                            >
                                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                Save Bank Details
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Project Selection Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <MapPin className="w-4 h-4" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">PROJECT SELECTION</h2>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ACTIVE PROJECT</label>
                                    <select 
                                        value={settings?.default_project_id || ''}
                                        onChange={e => settings && setSettings({ ...settings, default_project_id: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select a default project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        This project will be loaded automatically across the dashboard and task reporting modules.
                                    </p>
                                </div>
                                <div className="h-10" />
                            </div>

                            {/* Units Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <Sliders className="w-4 h-4" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">UNITS</h2>
                                </div>
                                
                                <div className="space-y-8">
                                    {/* Unit System */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UNIT SYSTEM</label>
                                        <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full border border-slate-100 shadow-sm">
                                            {['Meter', 'Feet'].map(sys => (
                                                <button 
                                                    key={sys}
                                                    onClick={() => settings && setSettings({ ...settings, unit: sys })}
                                                    className={`flex-1 py-3.5 px-6 rounded-xl text-xs font-black transition-all ${settings?.unit === sys ? 'bg-[#111827] text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {sys === 'Meter' ? 'Metric' : 'Imperial'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mass/Weight */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">MASS / WEIGHT</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Kg', 'Feet', 'Meter'].map(u => (
                                                <button 
                                                    key={u}
                                                    onClick={() => {
                                                        if (!settings) return;
                                                        setSettings({ 
                                                            ...settings, 
                                                            preferences: { ...settings.preferences, mass_unit: u } 
                                                        });
                                                    }}
                                                    className={`py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all border ${settings?.preferences?.mass_unit === u ? 'bg-[#1e61ff] text-white border-[#1e61ff] shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Length/Distance */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LENGTH / DISTANCE</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {['Meter', 'Feet', 'Inch', 'Cm'].map(u => (
                                                <button 
                                                    key={u}
                                                    onClick={() => {
                                                        if (!settings) return;
                                                        setSettings({ 
                                                            ...settings, 
                                                            preferences: { ...settings.preferences, length_unit: u } 
                                                        });
                                                    }}
                                                    className={`py-4 rounded-xl text-[11px] font-black tracking-widest transition-all border ${settings?.preferences?.length_unit === u ? 'bg-[#1e61ff] text-white border-[#1e61ff] shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">CURRENT UNITS</p>
                                            <p className="text-sm font-black text-slate-800">
                                                {settings?.unit || 'Metric'} • {settings?.preferences?.mass_unit || 'Feet'} • {settings?.preferences?.length_unit || 'Feet'}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                            <span className="text-lg">⚖️</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notification Settings Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <Bell className="w-5 h-5" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">NOTIFICATION SETTINGS</h2>
                                </div>
                                <div className="space-y-8">
                                    {[
                                        { id: 'email_alerts', label: 'Email Alerts', sub: 'RECEIVE DAILY SUMMARY VIA EMAIL', icon: Mail },
                                        { id: 'sms_alerts', label: 'SMS Alerts', sub: 'CRITICAL SITE ALERTS VIA SMS', icon: Phone },
                                        { id: 'push_notifications', label: 'App Notifications', sub: 'REAL-TIME APPLICATION ALERTS', icon: Smartphone },
                                    ].map((item, i) => {
                                        const isEnabled = !!settings?.preferences?.[item.id];
                                            
                                        return (
                                            <div key={i} className="flex items-center justify-between group transition-all duration-300">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all duration-300 overflow-hidden">
                                                        <item.icon className="w-5 h-5 text-slate-400 group-hover:text-[#0062ff] transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 tracking-tight">{item.label}</p>
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.05em] leading-relaxed mt-0.5">{item.sub}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 pr-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest w-8 text-right transition-colors ${isEnabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                        {isEnabled ? 'ON' : 'OFF'}
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            if (!settings) return;
                                                            const prefs = settings.preferences || {};
                                                            setSettings({ 
                                                                ...settings, 
                                                                preferences: { ...prefs, [item.id]: !isEnabled } 
                                                            });
                                                        }}
                                                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isEnabled ? 'bg-[#0062ff]' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-4" /> {/* Bottom spacing as requested earlier */}
                            </div>

                            {/* User Preferences Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <User className="w-4 h-4" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">USER PREFERENCES</h2>
                                </div>
                                <div className="space-y-10">
                                    {/* Basic Prefs Row */}
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LANGUAGE</label>
                                            <select 
                                                value={settings?.preferences?.language || 'English'}
                                                onChange={e => {
                                                    if (!settings) return;
                                                    const prefs = settings.preferences || {};
                                                    setSettings({ ...settings, preferences: { ...prefs, language: e.target.value } });
                                                }}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none appearance-none cursor-pointer"
                                            >
                                                <option>English</option>
                                                <option>Hindi</option>
                                                <option>Marathi</option>
                                            </select>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">TIMEZONE</label>
                                                <select 
                                                    value={settings?.preferences?.timezone || 'IST (UTC+5:30)'}
                                                    onChange={e => {
                                                        if (!settings) return;
                                                        const prefs = settings.preferences || {};
                                                        setSettings({ ...settings, preferences: { ...prefs, timezone: e.target.value } });
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option>IST (UTC+5:30)</option>
                                                    <option>EST (UTC-5:00)</option>
                                                    <option>GMT (UTC+0:00)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">DATE FORMAT</label>
                                                <select 
                                                    value={settings?.preferences?.date_format || 'DD/MM/YYYY'}
                                                    onChange={e => {
                                                        if (!settings) return;
                                                        const prefs = settings.preferences || {};
                                                        setSettings({ ...settings, preferences: { ...prefs, date_format: e.target.value } });
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option>DD/MM/YYYY</option>
                                                    <option>MM/DD/YYYY</option>
                                                    <option>YYYY/MM/DD</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Functionality Toggles */}
                                    <div className="space-y-6">
                                        {[
                                            { id: 'auto_save', label: 'Auto Save', sub: 'Auto-save form drafts every 60s' },
                                            { id: 'compact_view', label: 'Compact View', sub: 'Reduce padding for denser layout' },
                                            { id: 'weather_widget', label: 'Show Weather Widget', sub: 'Display weather on dashboard' },
                                            { id: 'gps_capture', label: 'Auto GPS Capture', sub: 'Capture GPS on DSR form open' },
                                        ].map((item, i) => {
                                            const isEnabled = !!settings?.preferences?.[item.id];
                                            return (
                                                <div key={i} className="flex items-center justify-between group">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 tracking-tight">{item.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.sub}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest w-8 text-right ${isEnabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                            {isEnabled ? 'ON' : 'OFF'}
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                if (!settings) return;
                                                                setSettings({ 
                                                                    ...settings, 
                                                                    preferences: { ...settings.preferences, [item.id]: !isEnabled } 
                                                                });
                                                            }}
                                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isEnabled ? 'bg-[#0062ff] shadow-lg shadow-blue-100' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Admin Restricted Footer */}
                                    <div className="p-6 rounded-3xl bg-[#fff8eb] border border-[#ffe9cc] flex gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#ffe9cc] flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-6 h-6 text-[#ff9000]" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-[#854d0e] uppercase tracking-widest mb-1">ADMIN-RESTRICTED SETTINGS</p>
                                            <p className="text-[11px] font-bold text-[#b45309]/70 leading-relaxed">Global project configuration and security settings are restricted to Admin/Project Director roles. Contact your administrator for changes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-12 border-t border-slate-100 mt-20">
                        <div className="px-6 py-2 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            LAST AUDIT LOGGED: YESTERDAY 4:32 PM
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className={`${isSaving ? 'opacity-70 cursor-not-allowed' : 'bg-[#111827] hover:bg-slate-800 active:scale-95'} text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all`}
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            {isSaving ? 'SAVING ALL...' : 'SAVE ALL SETTINGS'}
                        </button>
                    </div>

                </div>
            </PageTransition>
        </>
    );
};

export default LabourSettingsPage;
