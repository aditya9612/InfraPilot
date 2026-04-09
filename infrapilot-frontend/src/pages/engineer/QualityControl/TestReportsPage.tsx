import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const testData = [
    { id: 1, testType: "Cube Test (7 Days)", activity: "Footing F1-F10", result: "21.5 N/mm²", standard: "20 N/mm²", status: "Pass", date: "2024-03-28" },
    { id: 2, testType: "Slump Test", activity: "Column Casting Plot A", result: "110 mm", standard: "80-120 mm", status: "Pass", date: "2024-04-01" },
    { id: 3, testType: "Cube Test (28 Days)", activity: "Foundation Raft", result: "28.2 N/mm²", standard: "30 N/mm²", status: "Fail", date: "2024-04-05" },
];

const TestReportsPage = () => {
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const handleDownload = (id: number, testName: string) => {
        setDownloadingId(id);
        const toastId = toast.loading(`Downloading ${testName}...`, { position: "top-right" });

        // Simulate secure file download
        setTimeout(() => {
            setDownloadingId(null);
            toast.success("Report downloaded successfully!", { id: toastId, position: "top-right" });
            console.log(`Report ${id} downloaded`);
        }, 1500);
    };

    return (
        <>
            <Navbar title="Quality Control" breadcrumb={["Engineer", "QC", "Test Reports"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quality Control</h1>
                        <p className="text-slate-500 text-sm">Monitor laboratory results and design compliance.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <Link to="/engineer/qc/inspection" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Inspection
                        </Link>
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Test Reports
                        </button>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-8 py-6">Test Type & Activity</th>
                                        <th className="px-6 py-6">Observed Result</th>
                                        <th className="px-6 py-6">Standard Value</th>
                                        <th className="px-6 py-6">Status</th>
                                        <th className="px-6 py-6">Date</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {testData.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{t.testType}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t.activity}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-sm font-black text-slate-800 tracking-tight">{t.result}</td>
                                            <td className="px-6 py-6">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Min Required</span>
                                                <span className="text-xs font-bold text-slate-600">{t.standard}</span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${t.status === 'Pass' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-500">{t.date}</td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => handleDownload(t.id, t.testType)}
                                                    disabled={downloadingId === t.id}
                                                    className={`p-3 rounded-xl transition-all ${downloadingId === t.id ? 'bg-slate-100 text-slate-400' : 'bg-primary/5 text-primary hover:bg-primary/10 active:scale-95'}`}
                                                    title="Download Lab Report"
                                                >
                                                    {downloadingId === t.id ? (
                                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default TestReportsPage;
