import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const reportTypes = [
    {
        id: "daily",
        name: "Daily Intelligence Ledger",
        description: "High-fidelity summary of operational throughput, personnel deployment, and site logistics.",
        icon: "📋",
        color: "bg-blue-50 text-blue-600",
        lastGenerated: "2026-04-08 08:30 AM",
        size: "1.2 MB",
        data: {
            title: "Operational Velocity Log",
            date: "April 08, 2026",
            metrics: [
                { label: "Mobilization", value: "142 Personnel" },
                { label: "Concrete Volume", value: "120 m³" },
                { label: "Steel Fixation", value: "8.5 Tons" },
                { label: "Safety Variance", value: "0 Delta" }
            ]
        }
    },
    {
        id: "weekly",
        name: "Weekly Strategy Audit",
        description: "Advanced trend analysis and milestone synchronization benchmarks for the current cycle.",
        icon: "📈",
        color: "bg-emerald-50 text-emerald-600",
        lastGenerated: "2026-04-06 10:00 AM",
        size: "4.5 MB",
        data: {
            title: "Performance Trajectory Summary",
            date: "Week 14, 2026",
            metrics: [
                { label: "Planned Uptime", value: "85%" },
                { label: "Actual Throughput", value: "82%" },
                { label: "Human Equity Consumed", value: "4,800 hrs" },
                { label: "Financial Exposure", value: "₹45.2 Lakhs" }
            ]
        }
    },
    {
        id: "labor",
        name: "Human Resource Analytics",
        description: "Comprehensive breakdown of workforce stratification, overheads, and shift efficiency.",
        icon: "👷",
        color: "bg-amber-50 text-amber-600",
        lastGenerated: "2026-04-08 07:15 AM",
        size: "0.8 MB",
        data: {
            title: "Workforce Deployment Audit",
            date: "April 08, 2026",
            metrics: [
                { label: "Skilled Force", value: "45 Units" },
                { label: "General Support", value: "88 Units" },
                { label: "Tech Operators", value: "9 Units" },
                { label: "Overtime Delta", value: "24 hrs" }
            ]
        }
    },
    {
        id: "material",
        name: "Inventory Reconciliation",
        description: "Real-time stock equilibrium report covering acquisition, consumption, and closing reserves.",
        icon: "🏗️",
        color: "bg-indigo-50 text-indigo-600",
        lastGenerated: "2026-04-07 05:45 PM",
        size: "2.1 MB",
        data: {
            title: "Material Flux Audit",
            date: "April 07, 2026",
            metrics: [
                { label: "Cement Outflow", value: "450 Bags" },
                { label: "Steel Outflow", value: "12 Tons" },
                { label: "Aggregate Flow", value: "320 m³" },
                { label: "Asset Valuation", value: "₹1.2 Cr" }
            ]
        }
    },
    {
        id: "issue",
        name: "Constraint Risk Analytics",
        description: "Deep-dive into site dependencies, blockade durations, and mitigation effectiveness.",
        icon: "⚠️",
        color: "bg-rose-50 text-rose-600",
        lastGenerated: "2026-04-08 11:30 AM",
        size: "0.5 MB",
        data: {
            title: "Structural Risk Breakdown",
            date: "April 08, 2026",
            metrics: [
                { label: "Active Blockades", value: "3 Critical" },
                { label: "Supply Gaps", value: "2 Lines" },
                { label: "Weather Impact", value: "4 hrs" },
                { label: "Manpower Variance", value: "6% Short" }
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
            toast.success(`${report.name} transmitted to storage`, { position: 'top-right', icon: '📥' });
            setLoadingReport(null);
        }, 1500);
    };

    return (
        <div className="engineer-module text-slate-900">
            <Navbar title="Executive Intelligence" breadcrumb={["InfraPilot", "Dashboard", "Engineer", "BI", "Reports"]} />

            <PageTransition className="p-8 bg-slate-50 min-h-screen relative font-inter">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tighter  mb-2">Management Intelligence Dash</h1>
                            <p className="text-slate-500 font-medium tracking-tight">Business intelligence, PDF generation, and operational performance reports.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toast.success("Retrieving archival data...", { position: "top-right" })}
                                className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black  tracking-[0.25em] hover:text-primary transition-all active:scale-95 shadow-xl shadow-slate-200/50"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                Filter Registry
                            </button>
                        </div>
                    </div>
                    {/* Top Widgets */}
                    <div className="mb-10">
                        <h2 className="text-[10px] font-black text-slate-400  tracking-[0.3em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            BI Intelligence Vitals
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCard
                                title="Total Reports"
                                value="42"
                                sub="Strategic intelligence"
                                accent="text-primary"
                                icon="📑"
                            />
                            <StatCard
                                title="Audit Pass Rate"
                                value="96%"
                                sub="Compliance baseline"
                                accent="text-emerald-500"
                                icon="🛡️"
                            />
                            <StatCard
                                title="Query Latency"
                                value="1.2s"
                                sub="Intelligence response"
                                accent="text-blue-500"
                                icon="⚡"
                            />
                            <StatCard
                                title="Data Storage"
                                value="15.4GB"
                                sub="Archival footprint"
                                accent="text-rose-500"
                                icon="💾"
                            />
                        </div>
                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {reportTypes.map(report => (
                            <div key={report.id} className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden">
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]`} />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm ${report.color}`}>
                                            {report.icon}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 block">REPORT TYPE: {report.id}</span>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-tight">{report.name}</h3>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Payload</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tighter">{report.size}</span>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 flex-1">
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-3">Strategy Directive</span>
                                    <p className="text-sm font-bold text-slate-500 leading-relaxed italic">"{report.description}"</p>
                                </div>

                                <div className="space-y-4 px-4 pt-2 border-t border-slate-50 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-2">Protocol Integrity</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></span>
                                            <span className="text-[11px] font-black text-slate-500 tracking-tight">{report.lastGenerated}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-800 rounded-2xl text-[10px] font-black tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        >INSPECT</button>
                                        <button
                                            onClick={() => handleDownload(report)}
                                            disabled={!!loadingReport}
                                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loadingReport === `${report.id}-download` ? '...' : 'EXPORT'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Intelligent Report Viewer Modal */}
                <Modal
                    isOpen={!!selectedReport}
                    onClose={() => setSelectedReport(null)}
                    title={selectedReport?.name || "Report Detail"}
                    maxWidth="max-w-2xl"
                >
                    {selectedReport && (
                        <div className="p-12 bg-white">
                            <div className="mb-12">
                                <div className="admin-pulse-form-section-header mb-4">
                                    <div className={`admin-pulse-form-section-indicator ${selectedReport.color.split(' ')[0]}`} />
                                    <h3 className="admin-pulse-form-section-title">{selectedReport.name}</h3>
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-4">{selectedReport.data.title}</h2>
                                <p className="text-slate-400 text-xs font-medium italic">Verified site data encapsulated for executive transmission.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                {selectedReport.data.metrics.map((m: any, i: number) => (
                                    <div key={i} className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-50 flex flex-col gap-2 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                        <p className="text-[9px] font-black text-slate-300 tracking-[0.2em] group-hover:text-blue-600 transition-colors uppercase">{m.label}</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tighter group-hover:scale-105 transition-transform origin-left">{m.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="admin-pulse-form-summary mb-12">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Report Temporal Meta</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{selectedReport.data.date.toUpperCase()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => {
                                        handleDownload(selectedReport);
                                        setSelectedReport(null);
                                    }}
                                    className="admin-pulse-btn-primary !w-full"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Transmit PDF Manifest
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

            </PageTransition>
        </div>
    );
};

export default ReportsPage;
