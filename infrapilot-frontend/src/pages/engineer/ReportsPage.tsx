import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const reportTypes = [
    {
        id: "daily",
        name: "Daily Site Report",
        description: "Complete summary of activities, labor, and materials used in the last 24 hours.",
        icon: "📋",
        color: "bg-blue-50 text-blue-600",
        lastGenerated: "2026-04-08 08:30 AM",
        size: "1.2 MB",
        data: {
            title: "Daily Activities Log",
            date: "April 08, 2026",
            metrics: [
                { label: "Total Labor", value: "142 workers" },
                { label: "Concrete Poured", value: "120 m³" },
                { label: "Steel Fixed", value: "8.5 Tons" },
                { label: "Safety Incidents", value: "0" }
            ]
        }
    },
    {
        id: "weekly",
        name: "Weekly Progress Report",
        description: "Multi-day timeline analysis, milestome achievement vs planning for the current week.",
        icon: "📅",
        color: "bg-emerald-50 text-emerald-600",
        lastGenerated: "2026-04-06 10:00 AM",
        size: "4.5 MB",
        data: {
            title: "Weekly Execution Summary",
            date: "Week 14, 2026",
            metrics: [
                { label: "Planned Progress", value: "85%" },
                { label: "Actual Progress", value: "82%" },
                { label: "Man-hours Consumed", value: "4,800 hrs" },
                { label: "Procured Value", value: "₹45.2 Lakhs" }
            ]
        }
    },
    {
        id: "labor",
        name: "Labor & Attendance Report",
        description: "Detailed breakdown of workforce mobilization, wage rates, and OT logs.",
        icon: "👷",
        color: "bg-amber-50 text-amber-600",
        lastGenerated: "2026-04-08 07:15 AM",
        size: "0.8 MB",
        data: {
            title: "Personnel Audit Log",
            date: "April 08, 2026",
            metrics: [
                { label: "Skilled", value: "45" },
                { label: "Unskilled", value: "88" },
                { label: "Operator", value: "9" },
                { label: "Overtime Hours", value: "24 hrs" }
            ]
        }
    },
    {
        id: "material",
        name: "Material Consumption Audit",
        description: "Stock reconciliation report including Opening, Received, Used, and Closing balances.",
        icon: "🏗️",
        color: "bg-indigo-50 text-indigo-600",
        lastGenerated: "2026-04-07 05:45 PM",
        size: "2.1 MB",
        data: {
            title: "Inventory Reconciliation",
            date: "April 07, 2026",
            metrics: [
                { label: "Cement Consumed", value: "450 Bags" },
                { label: "Steel Consumed", value: "12 Tons" },
                { label: "Aggregates used", value: "320 m³" },
                { label: "Closing Balance Value", value: "₹1.2 Cr" }
            ]
        }
    },
    {
        id: "issue",
        name: "Blockade & Issue Analytics",
        description: "Summary of site delays, material shortages, and unresolved technical issues.",
        icon: "⚠️",
        color: "bg-rose-50 text-rose-600",
        lastGenerated: "2026-04-08 11:30 AM",
        size: "0.5 MB",
        data: {
            title: "Constraint Analysis Report",
            date: "April 08, 2026",
            metrics: [
                { label: "Open Critical Issues", value: "3" },
                { label: "Material Shortages", value: "2 items" },
                { label: "Weather Delays", value: "4 hrs" },
                { label: "Manpower Shortfall", value: "6%" }
            ]
        }
    },
];

const ReportsPage = () => {
    const [loadingReport, setLoadingReport] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    const handleDownload = (report: any) => {
        setLoadingReport(`${report.id}-download`);
        setTimeout(() => {
            toast.success(`${report.name} downloaded successfully!`, { position: 'top-right', icon: '📥' });
            setLoadingReport(null);
        }, 1500);
    };

    const handleView = (report: any) => {
        setSelectedReport(report);
    };

    return (
        <>
            <Navbar title="Management Reports" breadcrumb={["Engineer", "Reports"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics & Summaries</h1>
                        <p className="text-slate-500 text-sm">Generate and export detailed data for management review and site audits.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reportTypes.map(report => (
                            <div key={report.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-3xl shadow-sm ${report.color} transform group-hover:rotate-12 transition-transform`}>
                                        {report.icon}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">File Size</p>
                                        <p className="text-xs font-bold text-slate-500">{report.size}</p>
                                    </div>
                                </div>

                                <div className="relative z-10 mb-8 flex-1">
                                    <h3 className="font-black text-slate-800 text-xl mb-3 tracking-tight group-hover:text-primary transition-colors leading-tight">{report.name}</h3>
                                    <p className="text-sm font-medium text-slate-400 leading-relaxed line-clamp-2">{report.description}</p>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="pt-6 border-t border-slate-50">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Last Generated</p>
                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            {report.lastGenerated}
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <button
                                            onClick={() => handleView(report)}
                                            className="w-full sm:flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all order-2 sm:order-1"
                                        >
                                            View Report
                                        </button>
                                        <button
                                            onClick={() => handleDownload(report)}
                                            disabled={!!loadingReport}
                                            className="w-full sm:flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                                        >
                                            {loadingReport === `${report.id}-download` ? (
                                                <>
                                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    Download
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Viewer Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                            onClick={() => setSelectedReport(null)}
                        ></div>
                        <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedReport.color}`}>{selectedReport.name}</span>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{selectedReport.data.date}</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{selectedReport.data.title}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-12">
                                    {selectedReport.data.metrics.map((m: any, i: number) => (
                                        <div key={i} className="p-5 md:p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{m.label}</p>
                                            <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{m.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            handleDownload(selectedReport);
                                            setSelectedReport(null);
                                        }}
                                        className="flex-1 bg-primary text-white py-5 rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Export to PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PageTransition>
        </>
    );
};

export default ReportsPage;
