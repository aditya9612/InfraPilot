import React, { useState, useRef, useEffect } from 'react';
import { User, Check, Trash2, Upload, Calendar, MapPin, Settings as SettingsIcon, Bell, Mail, Phone, Smartphone, AlertTriangle, Landmark, ShieldCheck, Edit2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import { projectService } from '../../services/projectService';

const LabourSettingsPage: React.FC = () => {
    // Core States
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [defaultProjectId, setDefaultProjectId] = useState<number | null>(null);

    // Form States (Profiles)
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [designation, setDesignation] = useState('');
    const [role, setRole] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [accountStatus, setAccountStatus] = useState(true);

    // Form States (Settings)
    const [unitSystem, setUnitSystem] = useState<'Metric' | 'Imperial'>('Metric');
    const [massUnit, setMassUnit] = useState('Meter'); 
    const [distanceUnit, setDistanceUnit] = useState('Meter');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [currency, setCurrency] = useState('INR');

    const [notifSettings, setNotifSettings] = useState({
        email: true,
        sms: false,
        app: true
    });

    const [userPrefs, setUserPrefs] = useState({
        language: 'English',
        timezone: 'IST (UTC+5:30)',
        dateFormat: 'DD/MM/YYYY',
        autoSave: false,
        compactView: false,
        showWeather: true,
        autoGps: true
    });

    const [bankDetails, setBankDetails] = useState({
        accountNumber: '•••• •••• 5678',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        upiId: 'labour@upi'
    });

    const [isEditingBank, setIsEditingBank] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [profileData, settingsData, projectsData] = await Promise.all([
                settingsService.getProfile(),
                settingsService.getSettings(),
                projectService.getProjects(50, 0)
            ]);

            // Profile Mapping
            setName(profileData.full_name || '');
            setMobile(profileData.mobile_number || '');
            setEmail(profileData.email || '');
            setAddress(profileData.address || '');
            setPanNumber(profileData.pan_number || '');
            setAadhaarNumber(profileData.aadhaar_number || '');
            setDesignation(profileData.designation || '');
            setRole(profileData.role || '');
            setJoiningDate(profileData.joining_date || '');
            setAccountStatus(profileData.is_active !== false);
            setProfilePic(settingsService.resolveUrl(profileData.profile_image));

            // Settings Mapping
            setSettings(settingsData);
            setDefaultProjectId(settingsData.default_project_id);
            setNotificationsEnabled(settingsData.notifications_enabled);
            setCurrency(settingsData.currency || 'INR');
            if (settingsData.unit) {
                setDistanceUnit(settingsData.unit);
                setMassUnit(settingsData.unit);
            }

            // Projects Mapping
            const projectItems = Array.isArray(projectsData) ? projectsData : (projectsData.items || []);
            setProjects(projectItems);

        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load some profile data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const updated = await settingsService.updateProfile({ profile_image: file });
                setProfilePic(settingsService.resolveUrl(updated.profile_image));
                toast.success("Profile photo updated");
            } catch (error) {
                toast.error("Failed to upload photo");
            }
        }
    };

    const handleRemovePhoto = async () => {
        try {
            await settingsService.updateProfile({ profile_image: null });
            setProfilePic(null);
            toast.success("Profile photo removed");
        } catch (error) {
            toast.error("Failed to remove photo");
        }
    };

    const handleSaveProfile = async () => {
        try {
            await settingsService.updateProfile({
                full_name: name,
                mobile_number: mobile,
                email: email,
                address: address,
                pan_number: panNumber,
                aadhaar_number: aadhaarNumber,
                designation: designation,
                role: role,
                joining_date: joiningDate,
                is_active: accountStatus
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleSaveBankDetails = async () => {
        try {
            // Simulate API call
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            setIsEditingBank(false);
            toast.success("Bank details updated successfully!");
        } catch (error) {
            toast.error("Failed to update bank details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await settingsService.updateSettings({
                unit: distanceUnit,
                notifications_enabled: notificationsEnabled,
                currency: currency,
                financial_year: settings?.financial_year || '2025-26',
                payment_terms: settings?.payment_terms || '30 days',
                invoice_format: settings?.invoice_format || 'standard',
                default_project_id: defaultProjectId,
                preferences: settings?.preferences || {}
            });
            toast.success("Settings updated successfully!");
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing User Matrix...</p>
                </div>
            </div>
        );
    }

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
                            onClick={handleSaveSettings}
                            className="bg-[#0062ff] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-100 transition-all active:scale-95"
                        >
                            <Check className="w-4 h-4" /> Save Settings
                        </button>
                    </div>

                    {/* Current Configuration Row */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">CURRENT CONFIGURATION</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { 
                                    label: 'ACTIVE PROJECT', 
                                    value: projects.find(p => p.id === defaultProjectId)?.project_name || 'No Project Selected', 
                                    sub: projects.find(p => p.id === defaultProjectId)?.business_id || 'DEFAULT WORKSPACE', 
                                    color: 'text-[#0062ff]' 
                                },
                                { label: 'UNIT SYSTEM', value: 'Metric', sub: 'FEET · METER', color: 'text-emerald-500' },
                                { label: 'NOTIFICATIONS', value: notificationsEnabled ? 'ENABLED' : 'DISABLED', sub: 'CHANNELS ENABLED', color: 'text-orange-400' },
                                { label: 'LANGUAGE', value: 'English', sub: 'IST (UTC+5:30)', color: 'text-slate-800' },
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
                            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                <User className="w-4 h-4" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">PROFILE & ACCOUNT</h2>
                            </div>

                            <div className="flex flex-col xl:flex-row gap-16">
                                {/* Profile Img Controls */}
                                <div className="flex flex-col items-center gap-4 py-4 min-w-[200px]">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-xl">
                                            {profilePic ? (
                                                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-12 h-12 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-1 right-1 w-10 h-10 bg-[#0062ff] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                                    </div>
                                    <button 
                                        onClick={handleRemovePhoto}
                                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 hover:text-rose-600"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> REMOVE
                                    </button>
                                </div>

                                {/* Form Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    {[
                                        { label: 'FULL NAME', value: name, setter: setName },
                                        { label: 'DESIGNATION', value: designation, setter: setDesignation },
                                        { label: 'EMAIL ADDRESS', value: email, setter: setEmail },
                                        { label: 'MOBILE NUMBER', value: mobile, setter: setMobile },
                                        { label: 'PAN NUMBER', value: panNumber, setter: setPanNumber },
                                        { label: 'AADHAAR NUMBER', value: aadhaarNumber, setter: setAadhaarNumber },
                                        { label: 'ROLE', value: role, setter: setRole },
                                        { label: 'JOINING DATE', value: joiningDate, setter: setJoiningDate, isDate: true },
                                    ].map((field, i) => (
                                        <div key={i} className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={field.value} 
                                                    onChange={e => field.setter(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                                />
                                                {field.isDate && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ADDRESS</label>
                                        <input 
                                            type="text" 
                                            value={address} 
                                            onChange={e => setAddress(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>
                                    
                                    {/* Account Status Toggle in Form */}
                                    <div className="md:col-span-2 mt-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">Account Status</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle active status of this profile</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ACTIVE</span>
                                            <button 
                                                onClick={() => setAccountStatus(!accountStatus)}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${accountStatus ? 'bg-[#0062ff]' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${accountStatus ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 flex justify-end pt-4">
                                        <button 
                                            onClick={handleSaveProfile}
                                            className="bg-[#111827] text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95"
                                        >
                                            <Check className="w-4 h-4" /> SAVE PROFILE SETTINGS
                                        </button>
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
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">SECURITY VERIFIED</p>
                                        <p className="text-[10px] font-bold text-indigo-600/70 leading-relaxed mt-1">Your payment details are encrypted and stored securely. Only authorized payroll personnel can view this information.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    {!isEditingBank ? (
                                        <button 
                                            onClick={() => setIsEditingBank(true)}
                                            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-[#111827] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Bank Details
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setIsEditingBank(false)}
                                                className="px-8 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveBankDetails}
                                                className="px-10 py-3 bg-[#0062ff] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Save Details
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
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {projects.map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => setDefaultProjectId(p.id)}
                                                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer group hover:-translate-y-1 ${defaultProjectId === p.id ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10' : 'border-slate-50 border-dashed hover:border-blue-100 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${defaultProjectId === p.id ? 'text-blue-600' : 'text-slate-400'}`}>{p.business_id}</p>
                                                    {defaultProjectId === p.id && (
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-2 group-hover:text-blue-700 transition-colors">{p.project_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" />
                                                    {p.city}, {p.state}
                                                </p>
                                            </div>
                                        ))}
                                        {projects.length === 0 && (
                                            <div className="py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                                                <MapPin className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">No Projects Found</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed text-center italic">Select the primary project workspace you are currently assigned to. This will affect your default dashboard views.</p>
                                </div>
                            </div>

                            {/* Units Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <SettingsIcon className="w-4 h-4" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">UNITS</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UNIT SYSTEM</label>
                                        <div className="flex bg-slate-50 p-1 rounded-xl w-full">
                                            <button 
                                                onClick={() => setUnitSystem('Metric')}
                                                className={`flex-1 py-3 px-6 rounded-lg text-xs font-black transition-all ${unitSystem === 'Metric' ? 'bg-[#111827] text-white shadow-lg' : 'text-slate-400'}`}
                                            >
                                                Metric
                                            </button>
                                            <button 
                                                onClick={() => setUnitSystem('Imperial')}
                                                className={`flex-1 py-3 px-6 rounded-lg text-xs font-black transition-all ${unitSystem === 'Imperial' ? 'bg-[#111827] text-white shadow-lg' : 'text-slate-400'}`}
                                            >
                                                Imperial
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">MASS / WEIGHT</label>
                                        <div className="flex gap-2">
                                            {['Kg', 'Feet', 'Meter'].map(u => (
                                                <button 
                                                    key={u}
                                                    onClick={() => setMassUnit(u)}
                                                    className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all border ${massUnit === u ? 'bg-[#0062ff] text-white border-transparent shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-50 hover:bg-slate-50'}`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LENGTH / DISTANCE</label>
                                        <div className="flex gap-2">
                                            {['Meter', 'Feet', 'Inch', 'Cm'].map(u => (
                                                <button 
                                                    key={u}
                                                    onClick={() => setDistanceUnit(u)}
                                                    className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all border ${distanceUnit === u ? 'bg-[#0062ff] text-white border-transparent shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-50 hover:bg-slate-50'}`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notification Settings Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <Bell className="w-4 h-4" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">NOTIFICATION SETTINGS</h2>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { id: 'email', label: 'Email Alerts', sub: 'Receive daily summary via email', icon: Mail },
                                        { id: 'sms', label: 'SMS Alerts', sub: 'Critical site alerts via SMS', icon: Phone },
                                        { id: 'app', label: 'App Notifications', sub: 'Real-time application alerts', icon: Smartphone },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between px-2 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                                    <item.icon className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 tracking-tight">{item.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.sub}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${notifSettings[item.id as keyof typeof notifSettings] ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                    {notifSettings[item.id as keyof typeof notifSettings] ? 'ON' : 'OFF'}
                                                </span>
                                                <button 
                                                    onClick={() => setNotifSettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifSettings] }))}
                                                    className={`w-10 h-5 rounded-full relative transition-colors ${notifSettings[item.id as keyof typeof notifSettings] ? 'bg-[#0062ff]' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${notifSettings[item.id as keyof typeof notifSettings] ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User Preferences Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-10">
                                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
                                    <User className="w-4 h-4" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">USER PREFERENCES</h2>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LANGUAGE</label>
                                        <input type="text" value={userPrefs.language} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">TIMEZONE</label>
                                            <input type="text" value={userPrefs.timezone} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-xs font-black text-slate-700 outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">DATE FORMAT</label>
                                            <input type="text" value={userPrefs.dateFormat} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-xs font-black text-slate-700 outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        {[
                                            { id: 'autoSave', label: 'Auto Save', sub: 'Auto-save form drafts every 60s' },
                                            { id: 'compactView', label: 'Compact View', sub: 'Reduce padding for denser layout' },
                                            { id: 'showWeather', label: 'Show Weather Widget', sub: 'Display weather on dashboard' },
                                            { id: 'autoGps', label: 'Auto GPS Capture', sub: 'Capture GPS on DSR form open' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 tracking-tight">{item.label}</p>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.sub}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${userPrefs[item.id as keyof typeof userPrefs] ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                        {userPrefs[item.id as keyof typeof userPrefs] ? 'ON' : 'OFF'}
                                                    </span>
                                                    <button 
                                                        onClick={() => setUserPrefs(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof userPrefs] }))}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${userPrefs[item.id as keyof typeof userPrefs] ? 'bg-[#0062ff]' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${userPrefs[item.id as keyof typeof userPrefs] ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 flex gap-4">
                                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">ADMIN-RESTRICTED SETTINGS</p>
                                            <p className="text-[10px] font-bold text-orange-600/70 leading-relaxed mt-1">Global project configuration and security settings are restricted to Admin/Project Director roles. Contact your administrator for changes.</p>
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
                            onClick={handleSaveSettings}
                            className="bg-[#111827] hover:bg-slate-800 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all active:scale-95"
                        >
                            <Check className="w-5 h-5" /> SAVE ALL SETTINGS
                        </button>
                    </div>

                </div>
            </PageTransition>
        </>
    );
};

export default LabourSettingsPage;
