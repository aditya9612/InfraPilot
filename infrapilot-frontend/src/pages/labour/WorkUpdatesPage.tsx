import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { Camera, Clipboard, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkUpdatesPage: React.FC = () => {
    const [progress, setProgress] = useState('');
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

    const handlePhotoUpload = (type: 'before' | 'after') => {
        // Mock upload
        const mockUrl = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400";
        if (type === 'before') {
            setBeforePhotos(prev => [...prev, mockUrl]);
            toast.success("Before photo uploaded!");
        } else {
            setAfterPhotos(prev => [...prev, mockUrl]);
            toast.success("After photo uploaded!");
        }
    };

    const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
        if (type === 'before') {
            setBeforePhotos(prev => prev.filter((_, i) => i !== index));
        } else {
            setAfterPhotos(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = () => {
        if (!progress || beforePhotos.length === 0 || afterPhotos.length === 0) {
            toast.error("Please fill in all details and upload photos!");
            return;
        }
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: 'Submitting update...',
                success: 'Daily update submitted successfully!',
                error: 'Could not submit update.',
            }
        ).then(() => {
            setProgress('');
            setBeforePhotos([]);
            setAfterPhotos([]);
        });
    };

    return (
        <>
            <Navbar title="Work Updates" breadcrumb={['InfraPilot', 'Labour', 'Daily Update']} />
            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen font-inter pb-32">
                <div className="w-full h-full space-y-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Today's Progress</h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2 ml-1">Submit your site updates and photos</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Session: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                        {/* Main Content Area */}
                        <div className="xl:col-span-8 space-y-10">
                            {/* Daily Progress Info */}
                            <section className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 rounded-[22px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                                        <TrendingUp className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Work Details</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Describe your accomplishments</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={progress}
                                        onChange={(e) => setProgress(e.target.value)}
                                        placeholder="Example: Completed brickwork for 2 rooms on Level 2 section A. All reinforcement inspections cleared..."
                                        className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[35px] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-base font-bold text-slate-700 min-h-[220px] placeholder:text-slate-300 resize-none shadow-inner"
                                    />
                                    <div className="absolute right-6 bottom-6 flex items-center gap-2">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${progress.length > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {progress.length} characters
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Before Photos */}
                                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Before Work</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Initial site state</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-indigo-50 rounded-full">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{beforePhotos.length} / 4</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        {beforePhotos.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-[28px] overflow-hidden group shadow-sm border border-slate-50">
                                                <img src={url} alt="Before" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <button 
                                                        onClick={() => handleRemovePhoto('before', i)}
                                                        className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-rose-500 text-white transition-all transform hover:rotate-12 flex items-center justify-center backdrop-blur-md border border-white/30"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {beforePhotos.length < 4 && (
                                            <button 
                                                onClick={() => handlePhotoUpload('before')}
                                                className="aspect-square rounded-[28px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group/btn bg-slate-50/50"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                                    <Camera className="w-6 h-6 text-indigo-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Photo</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* After Photos */}
                                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 tracking-tight">After Work</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Final completion state</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-emerald-50 rounded-full">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{afterPhotos.length} / 4</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        {afterPhotos.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-[28px] overflow-hidden group shadow-sm border border-slate-50">
                                                <img src={url} alt="After" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <button 
                                                        onClick={() => handleRemovePhoto('after', i)}
                                                        className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-rose-500 text-white transition-all transform hover:rotate-12 flex items-center justify-center backdrop-blur-md border border-white/30"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {afterPhotos.length < 4 && (
                                            <button 
                                                onClick={() => handlePhotoUpload('after')}
                                                className="aspect-square rounded-[28px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group/btn bg-slate-50/50"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                                    <Camera className="w-6 h-6 text-emerald-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Photo</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Summary & Submit Sidebar */}
                        <div className="xl:col-span-4 h-fit space-y-8 sticky top-24">
                            <div className="bg-slate-900 p-10 rounded-[50px] text-white shadow-2xl shadow-slate-200 border border-slate-800 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <h2 className="text-2xl font-black mb-10 tracking-tight">Summary</h2>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 transition-colors hover:bg-white/[0.08]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Words</span>
                                        </div>
                                        <span className="text-xl font-black">{progress.split(' ').filter(x => x).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 transition-colors hover:bg-white/[0.08]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <Camera className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Media</span>
                                        </div>
                                        <span className="text-xl font-black">{beforePhotos.length + afterPhotos.length}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    className="w-full mt-10 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-[30px] font-black uppercase tracking-[0.25em] text-[11px] shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                                >
                                    Submit Update <CheckCircle className="w-5 h-5" />
                                </button>
                                <p className="text-[9px] font-bold text-center text-slate-500 mt-6 uppercase tracking-widest opacity-60 italic">Your update will be reviewed by Site Engineer</p>
                            </div>

                            <div className="bg-amber-50 p-10 rounded-[50px] border border-amber-100 relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Clipboard className="w-32 h-32 text-amber-900" />
                                </div>
                                <div className="flex items-center gap-4 text-amber-600 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <Clipboard className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Guidelines</h3>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        "Use natural site light for photos",
                                        "Clear debris before 'after' photo",
                                        "Mention exact level/section",
                                        "Note any material shortages"
                                    ].map((guide, i) => (
                                        <li key={i} className="flex gap-4 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                                            <p className="text-xs font-bold text-amber-800 tracking-tight leading-relaxed">{guide}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default WorkUpdatesPage;
