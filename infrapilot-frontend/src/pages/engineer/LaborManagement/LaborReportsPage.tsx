import React, { useState, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';

interface WageReportEntry {
    id: number;
    worker_name: string;
    id_aadhaar: string;
    contractor_name: string;
    days_present: number;
    working_hours: number;
    overtime_hours: number;
    total_wages: number;
}

const LaborReportsPage: React.FC = () => {
    const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for demonstration
    const mockReports: WageReportEntry[] = [
        {
            id: 1,
            worker_name: "Rajesh Kumar",
            id_aadhaar: "4521-8890-1122",
            contractor_name: "Apex Builders",
            days_present: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 6 : 24),
            working_hours: reportType === 'Daily' ? 8 : (reportType === 'Weekly' ? 48 : 192),
            overtime_hours: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 4 : 15),
            total_wages: reportType === 'Daily' ? 750 : (reportType === 'Weekly' ? 4500 : 18500)
        },
        {
            id: 2,
            worker_name: "Amit Singh",
            id_aadhaar: "7788-2233-4455",
            contractor_name: "Apex Builders",
            days_present: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 5 : 22),
            working_hours: reportType === 'Daily' ? 8 : (reportType === 'Weekly' ? 40 : 176),
            overtime_hours: reportType === 'Daily' ? 0 : (reportType === 'Weekly' ? 0 : 5),
            total_wages: reportType === 'Daily' ? 600 : (reportType === 'Weekly' ? 3500 : 16000)
        },
        {
            id: 3,
            worker_name: "Suresh Prajapati",
            id_aadhaar: "1122-3344-5566",
            contractor_name: "Vertex Infra",
            days_present: reportType === 'Daily' ? 1 : (reportType === 'Weekly' ? 6 : 26),
            working_hours: reportType === 'Daily' ? 8 : (reportType === 'Weekly' ? 52 : 208),
            overtime_hours: reportType === 'Daily' ? 2 : (reportType === 'Weekly' ? 8 : 20),
            total_wages: reportType === 'Daily' ? 900 : (reportType === 'Weekly' ? 5500 : 22000)
        }
    ];

    const filteredReports = useMemo(() => {
        return mockReports.filter(r =>
            r.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.contractor_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [mockReports, searchTerm]);

    const stats = useMemo(() => {
        const total = mockReports.reduce((acc, curr) => acc + curr.total_wages, 0);
        const avgPresent = mockReports.reduce((acc, curr) => acc + curr.days_present, 0) / mockReports.length;
        return { total, avgPresent: avgPresent.toFixed(1) };
    }, [mockReports]);

    const handleExportCSV = () => {
        const headers = ["ID", "Worker Name", "ID/Aadhaar", "Contractor", "Presence", "Hours", "Overtime", "Wages"];
        const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
        const rows = filteredReports.map(r => [
            escape(r.id), escape(r.worker_name), escape(r.id_aadhaar),
            escape(r.contractor_name), escape(r.days_present), escape(r.working_hours),
            escape(r.overtime_hours), escape(r.total_wages)
        ].join(","));
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Labor_Report_${reportType}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        const rows = filteredReports.map(r => `
            <tr>
                <td>${r.worker_name}</td>
                <td style="font-size: 8px;">${r.id_aadhaar}</td>
                <td>${r.contractor_name}</td>
                <td>${r.days_present}</td>
                <td>${r.working_hours}</td>
                <td>${r.overtime_hours}</td>
                <td style="font-weight: bold; color: #10b981;">₹${r.total_wages.toLocaleString()}</td>
            </tr>
        `).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Inter, Arial; padding: 30px; }
                    h1 { color: #2563eb; font-size: 20px; margin-bottom: 2px; }
                    p { color: #64748b; font-size: 11px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th { background: #2563eb; color: white; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <h1>Labor Wage Report — InfraPilot</h1>
                <p>Cycle: ${reportType} | Date: ${new Date().toLocaleDateString()} | Records: ${filteredReports.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Worker</th>
                            <th>Aadhaar</th>
                            <th>Contractor</th>
                            <th>Presence</th>
                            <th>Hours</th>
                            <th>OT</th>
                            <th>Total Wages</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;
        const win = window.open("", "_blank");
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 400);
        }
    };

    return (
        <>
            <Navbar
                title={`${reportType} Wage Report`}
                breadcrumb={["InfraPilot", "Engineer", "Labor", "Reports"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Financial Summaries
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Labor Wage Summary
                        </h1>
                        <p className="text-slate-500 text-sm font-medium font-inter">
                            Automated wage calculations including overtime and attendance streaks.
                        </p>
                    </div>
                </div>

                {/* ── Summary Stats ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Labor Insights
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Payout</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">₹{stats.total.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Aggregated across all workers</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Avg. Attendance</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">{stats.avgPresent} Days</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Per labor this {reportType.toLowerCase().replace('ly', '')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Report Period</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter uppercase">{reportType}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter italic-none">Cycle: Current {reportType.toLowerCase() === 'daily' ? 'day' : reportType.toLowerCase().replace('ly', '')}</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar (DSR Style) ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">
                    {/* Left: Purple Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">All Tasks Filters</span>
                    </div>

                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="flex flex-col gap-0.5 min-w-[200px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[130px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none transition-all cursor-pointer pr-8">
                                <option>All Status</option>
                                <option>Paid</option>
                                <option>Pending</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Filter Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filter</label>
                        <div className="relative">
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value as any)}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none transition-all cursor-pointer pr-8"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="ml-auto flex items-end pb-0.5 gap-2">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm font-inter"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>

                {/* ── Reports Grid ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    {filteredReports.map((report) => (
                        <div key={report.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all font-inter group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">{report.worker_name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.id_aadhaar}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">₹{report.total_wages.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-slate-400 uppercase tracking-wider">Contractor</span>
                                    <span className="text-slate-700 font-bold">{report.contractor_name}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-slate-400 uppercase tracking-wider">Presence Log</span>
                                    <span className="text-slate-700 font-bold">{report.days_present} Days</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-slate-400 uppercase tracking-wider">Base Hours</span>
                                    <span className="text-slate-700 font-bold">{report.working_hours} Hrs</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-slate-400 uppercase tracking-wider">Overtime</span>
                                    <span className="text-blue-600 font-bold">+{report.overtime_hours} Hrs</span>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-2.5 bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                                Export Details
                            </button>
                        </div>
                    ))}
                </div>

            </PageTransition>
        </>
    );
};

export default LaborReportsPage;
