import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { Camera, Clipboard, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkUpdatesPage: React.FC = () => {
    const [progress, setProgress] = useState('');
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

    // --- Rich List state for Before / After ---
    interface WorkItem {
        id: string;
        text: string;
        photo?: string;
        status: 'prior' | 'today';
        isCompleted?: boolean;
    }

    const [beforeTasks, setBeforeTasks] = useState<WorkItem[]>([
        { id: '1', text: 'Wall reinforcement on Section C', status: 'prior' },
        { id: '2', text: 'Setup scaffolding for Level 3', status: 'prior' }
    ]);
    const [afterTasks, setAfterTasks] = useState<WorkItem[]>([]);

    const [priorPhotos] = useState<string[]>([
        "https://images.unsplash.com/photo-1503387762-592dee581106?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400"
    ]);

    const [beforeInput, setBeforeInput] = useState('');
    const [afterInput, setAfterInput] = useState('');

    const addItem = (type: 'before' | 'after') => {
        const val = type === 'before' ? beforeInput.trim() : afterInput.trim();
        if (!val) return;
        const newItem: WorkItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: val,
            status: 'today'
        };
        if (type === 'before') {
            setBeforeTasks(prev => [...prev, newItem]);
            setBeforeInput('');
        } else {
            setAfterTasks(prev => [...prev, newItem]);
            setAfterInput('');
        }
    };

    const removeItem = (type: 'before' | 'after', id: string) => {
        if (type === 'before') setBeforeTasks(prev => prev.filter(item => item.id !== id));
        else setAfterTasks(prev => prev.filter(item => item.id !== id));
    };

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
            setBeforeTasks([]);
            setAfterTasks([]);
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

                            {/* Before & After Cards */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">

                                {/* ── Before Work Card ── */}
                                <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Before Work</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Initial site state</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-indigo-50 rounded-full">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{beforePhotos.length} / 4</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {beforePhotos.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-[24px] overflow-hidden group shadow-sm border border-slate-50">
                                                <img src={url} alt="Before" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <button
                                                        onClick={() => handleRemovePhoto('before', i)}
                                                        className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-rose-500 text-white transition-all transform hover:rotate-12 flex items-center justify-center backdrop-blur-md border border-white/30"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {beforePhotos.length < 4 && (
                                            <button
                                                onClick={() => handlePhotoUpload('before')}
                                                className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group/btn bg-slate-50/50"
                                            >
                                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                                    <Camera className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Photo</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100" />

                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prior Tasks & Reference</p>
                                            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">from yesterday</span>
                                        </div>
                                        
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                            {priorPhotos.map((url, i) => (
                                                <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                                    <img src={url} alt="Prior" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={beforeInput}
                                                    onChange={e => setBeforeInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addItem('before')}
                                                    placeholder="Add initial observation..."
                                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                                                />
                                                <button
                                                    onClick={() => addItem('before')}
                                                    className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm shadow-indigo-200"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <ul className="flex flex-col gap-2">
                                                {beforeTasks.map((item) => (
                                                    <li key={item.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 group/item border transition-all ${item.status === 'prior' ? 'bg-slate-50/50 border-slate-100' : 'bg-indigo-50/30 border-indigo-100 animate-in fade-in slide-in-from-left-2'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${item.status === 'prior' ? 'bg-slate-300' : 'bg-indigo-400'}`} />
                                                        <div className="flex-1">
                                                            <span className={`text-xs font-bold leading-snug ${item.status === 'prior' ? 'text-slate-500' : 'text-indigo-900'}`}>{item.text}</span>
                                                            {item.status === 'prior' && <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1">Pending from yesterday</p>}
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem('before', item.id)}
                                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 shrink-0"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* ── After Work Card ── */}
                                <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm transition-all hover:shadow-md flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 tracking-tight">After Work</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Final completion state</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-emerald-50 rounded-full">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{afterPhotos.length} / 4</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {afterPhotos.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-[24px] overflow-hidden group shadow-sm border border-slate-50">
                                                <img src={url} alt="After" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <button
                                                        onClick={() => handleRemovePhoto('after', i)}
                                                        className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-rose-500 text-white transition-all transform hover:rotate-12 flex items-center justify-center backdrop-blur-md border border-white/30"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {afterPhotos.length < 4 && (
                                            <button
                                                onClick={() => handlePhotoUpload('after')}
                                                className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group/btn bg-slate-50/50"
                                            >
                                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                                    <Camera className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Photo</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100" />

                                    <div className="flex flex-col gap-6">
                                        {/* Prior Reference in After Card */}
                                        <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference: Prior State</p>
                                            </div>
                                            
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                                                {priorPhotos.map((url, i) => (
                                                    <div key={i} className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white shadow-sm opacity-50">
                                                        <img src={url} alt="Prior" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>

                                            <ul className="flex flex-col gap-2">
                                                {beforeTasks.filter(t => t.status === 'prior').map((item) => (
                                                    <li key={item.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100">
                                                        <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                        <span className="text-[10px] font-bold text-slate-500 truncate">{item.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="border-t border-slate-100" />

                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed Today</p>
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>

                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={afterInput}
                                                    onChange={e => setAfterInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addItem('after')}
                                                    placeholder="Add specific completion..."
                                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                                                />
                                                <button
                                                    onClick={() => addItem('after')}
                                                    className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm shadow-emerald-200"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <ul className="flex flex-col gap-2">
                                                {afterTasks.length > 0 ? (
                                                    afterTasks.map((item) => (
                                                        <li key={item.id} className="flex items-start gap-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl px-4 py-3 group/item animate-in fade-in slide-in-from-right-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                                            <span className="flex-1 text-xs font-bold text-emerald-900 leading-snug">{item.text}</span>
                                                            <button
                                                                onClick={() => removeItem('after', item.id)}
                                                                className="opacity-0 group-hover/item:opacity-100 transition-opacity text-emerald-300 hover:text-rose-500 shrink-0"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <div className="py-8 border-2 border-dashed border-slate-50 rounded-[30px] flex flex-col items-center justify-center gap-2 opacity-40">
                                                        <Clipboard className="w-6 h-6 text-slate-300" />
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No completions added</p>
                                                    </div>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Summary & Submit Sidebar */}
                        <div className="xl:col-span-4 h-fit space-y-8 sticky top-24">
                            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <h2 className="text-2xl font-black mb-10 tracking-tight text-slate-800">Summary</h2>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Words</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-800">{progress.split(' ').filter(x => x).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <Camera className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Media</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-800">{beforePhotos.length + afterPhotos.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <CheckCircle className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Items</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-800">{beforeTasks.length + afterTasks.length}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    className="w-full mt-10 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-[30px] font-black uppercase tracking-[0.25em] text-[11px] text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                                >
                                    Submit Update <CheckCircle className="w-5 h-5" />
                                </button>
                                <p className="text-[9px] font-bold text-center text-slate-400 mt-6 uppercase tracking-widest opacity-80 italic">Your update will be reviewed by Site Engineer</p>
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
