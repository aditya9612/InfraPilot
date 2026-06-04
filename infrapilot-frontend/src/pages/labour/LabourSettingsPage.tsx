import React, { useState } from 'react';
import {
    User,
    Bell,
    Languages,
    Volume2,
    LogOut,
    Shield,
    Phone,
    Briefcase,
    ChevronRight,
    Smartphone
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface MenuItem {
    icon: any;
    label: string;
    type: 'text' | 'select' | 'toggle' | 'badge' | 'link';
    value?: string | boolean;
    options?: string[];
    color?: string;
    onChange?: (val: any) => void;
}

const LabourSettingsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState('Hindi');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    const menuSections: { title: string; items: MenuItem[] }[] = [
        {
            title: "Profile Information",
            items: [
                { icon: User, label: "Name", value: user?.name || "Gopal Yadav", type: "text" },
                { icon: Phone, label: "Phone Number", value: "+91 98765 43210", type: "text" },
                { icon: Briefcase, label: "Skill Type", value: "Skilled Mason", type: "text" },
                { icon: Smartphone, label: "Worker ID", value: "WRK-SY-882", type: "text" },
            ]
        },
        {
            title: "Preferences",
            items: [
                {
                    icon: Languages,
                    label: "Language / भाषा",
                    value: language,
                    type: "select",
                    options: ['English', 'Hindi'],
                    onChange: (val: string) => { setLanguage(val); toast.success(`Language set to ${val}`); }
                },
                {
                    icon: Volume2,
                    label: "Voice Guidance",
                    value: isVoiceEnabled,
                    type: "toggle",
                    onChange: (val: boolean) => { setIsVoiceEnabled(val); toast.success(`Voice guidance ${val ? 'enabled' : 'disabled'}`); }
                },
                {
                    icon: Bell,
                    label: "Task Alerts",
                    value: notifications,
                    type: "toggle",
                    onChange: (val: boolean) => { setNotifications(val); toast.success(`Notifications ${val ? 'on' : 'off'}`); }
                },
            ]
        },
        {
            title: "Security & App",
            items: [
                { icon: Shield, label: "ID Verification Status", value: "Verified", type: "badge", color: "text-emerald-500 bg-emerald-50" },
                { icon: Shield, label: "Privacy Policy", type: "link" },
            ]
        }
    ];

    return (
        <>
            <Navbar
                title="Account Settings"
                breadcrumb={['InfraPilot', 'Labour', 'Settings']}
            />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-10 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-100 mb-4 border-4 border-white">
                            <span className="text-3xl font-black text-white">{user?.name?.charAt(0) || 'G'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{user?.name || 'Gopal Yadav'}</h1>
                        <p className="text-slate-500 text-sm font-medium">Site Personnel • Level 4 Worker</p>
                    </div>

                    <div className="space-y-8">
                        {menuSections.map((section, idx) => (
                            <div key={idx} className="space-y-4">
                                <h2 className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.title}</h2>
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                            </div>

                                            {item.type === 'text' && (
                                                <span className="text-sm font-medium text-slate-500">{item.value as string}</span>
                                            )}

                                            {item.type === 'badge' && (
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.color}`}>
                                                    {item.value as string}
                                                </span>
                                            )}

                                            {item.type === 'toggle' && (
                                                <button
                                                    onClick={() => item.onChange?.(!item.value)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${item.value ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${item.value ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            )}

                                            {item.type === 'select' && (
                                                <select
                                                    value={item.value as string}
                                                    onChange={(e) => item.onChange?.(e.target.value)}
                                                    className="bg-transparent text-sm font-bold text-indigo-600 outline-none cursor-pointer text-right"
                                                >
                                                    {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            )}

                                            {item.type === 'link' && (
                                                <ChevronRight className="w-5 h-5 text-slate-300" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 rounded-3xl font-black text-sm uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98] mb-12"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out of Account</span>
                        </button>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default LabourSettingsPage;
