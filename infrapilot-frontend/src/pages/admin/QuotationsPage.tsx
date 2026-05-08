import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit3,
    Trash2,
    CheckCircle,
    Clock,
    XCircle,
    Download
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const QuotationsPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const mockQuotations = [
        {
            id: "QTN-2024-001",
            client: "Sandeep Sir",
            project: "Gravity Wall Work",
            date: "2024-05-15",
            amount: 4560000,
            status: "Approved"
        },
        {
            id: "QTN-2024-002",
            client: "Indore Municipal Corp",
            project: "Site Preparation",
            date: "2024-05-18",
            amount: 1250000,
            status: "Pending"
        },
        {
            id: "QTN-2024-003",
            client: "John Doe",
            project: "Residential Fencing",
            date: "2024-05-20",
            amount: 85000,
            status: "Draft"
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Approved": return "bg-emerald-100 text-emerald-600";
            case "Pending": return "bg-amber-100 text-amber-600";
            case "Draft": return "bg-slate-100 text-slate-600";
            case "Declined": return "bg-rose-100 text-rose-600";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Approved": return <CheckCircle className="w-3 h-3" />;
            case "Pending": return <Clock className="w-3 h-3" />;
            case "Draft": return <FileText className="w-3 h-3" />;
            case "Declined": return <XCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <>
            <Navbar title="Quotations / Estimates" breadcrumb={["Dashboard", "Invoices", "Quotations"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Client Quotations</h1>
                            <p className="text-slate-500 text-sm">Manage and track all project proposals and estimates.</p>
                        </div>
                        <button
                            onClick={() => navigate("/admin/invoices/create")} // Reusing create invoice for now as they are similar
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Create New Quotation
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Client or Project..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
                                    <Filter className="w-4 h-4" /> Filter
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
                                    <Download className="w-4 h-4" /> Export
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Quotation ID</th>
                                        <th className="px-6 py-4">Client / Project</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {mockQuotations.map((q) => (
                                        <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">{q.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-slate-700">{q.client}</p>
                                                    <p className="text-xs text-slate-400">{q.project}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-slate-500">{q.date}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-slate-700">₹{q.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getStatusColor(q.status)}`}>
                                                    {getStatusIcon(q.status)}
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing 3 of 12 quotations</p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50" disabled>Prev</button>
                                <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default QuotationsPage;
