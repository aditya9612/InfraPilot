import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ApprovalDetailsModal from "../../components/dashboard/ApprovalDetailsModal";
import toast from "react-hot-toast";
import { Eye, Check, X } from "lucide-react";

// Mock data for Project Managers (Focus on Site Execution)
const initialApprovalsData = [
    { id: 1, type: "Material Request", requestedBy: "Arjun Mehta", project: "Skyline Tower A", detail: "500 Bags Cement", status: "Pending", approvedBy: "-", date: "2026-05-10" },
    { id: 2, type: "Site Expense", requestedBy: "Sana Khan", project: "Metro Ph-II", detail: "₹15,000 Safety Gear", status: "Approved", approvedBy: "Manager", date: "2026-05-11" },
    { id: 3, type: "Labour Salary", requestedBy: "Rahul Deshpande", project: "Grand Vista Residency", detail: "₹2.5L Weekly Wages", status: "Pending", approvedBy: "-", date: "2026-05-12" },
];

const ApprovalsPage = () => {
    const location = useLocation();
    const subPage = location.pathname.split("/").pop() || "requests";

    const [searchTerm, setSearchTerm] = useState("");
    const [approvals, setApprovals] = useState(initialApprovalsData);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [viewingApproval, setViewingApproval] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const filteredApprovals = approvals.filter(a =>
        a.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleApprove = (id: number) => {
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "Approved", approvedBy: "Manager" } : a));
        toast.success("Request approved and synchronized with ERP.");
    };

    const handleReject = (id: number) => {
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "Rejected", approvedBy: "Manager" } : a));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        toast.error("Request rejected.");
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredApprovals.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredApprovals.map(a => a.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;

        setApprovals(prev => prev.map(a => {
            if (selectedIds.includes(a.id) && a.status === "Pending") {
                return { ...a, status: "Approved", approvedBy: "Manager" };
            }
            return a;
        }));

        setSelectedIds([]);
        toast.success(`${selectedIds.length} site requests approved.`);
    };

    return (
        <>
            <Navbar title="Approval Center" breadcrumb={["Manager", "Approvals", subPage.charAt(0).toUpperCase() + subPage.slice(1)]} />

            <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Oversight & Approvals</h1>
                        <p className="text-slate-500 text-sm">Review critical site requests and authorize resource deployment.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkApprove}
                            disabled={selectedIds.length === 0}
                            className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${selectedIds.length > 0
                                    ? "bg-primary text-white shadow-primary/20 hover:bg-blue-600"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                }`}
                        >
                            Approve Selected {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>
                    </div>
                </div>

                {/* Approval Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Active Requests" value={approvals.filter(a => a.status === "Pending").length.toString()} sub="Requiring your attention" accent="text-amber-500" />
                    <StatCard title="Approved by You" value={approvals.filter(a => a.approvedBy === "Manager").length.toString()} sub="This week" accent="text-emerald-500" />
                    <StatCard title="Site Efficiency" value="94.2%" sub="Oversight score" accent="text-primary" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                            checked={filteredApprovals.length > 0 && selectedIds.length === filteredApprovals.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Request Type</th>
                                    <th className="px-6 py-4">Site Engineer</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Summary</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredApprovals.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(item.id) ? "bg-primary/[0.02]" : ""}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-primary focus:ring-primary"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-700">{item.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{item.requestedBy}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-primary/80">{item.project}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.detail}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${item.status === "Approved" ? "bg-emerald-100 text-emerald-600" : item.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 items-center">
                                                <button
                                                    onClick={() => {
                                                        setViewingApproval(item);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                {item.status === "Pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(item.id)}
                                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        >
                                                            <Check className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(item.id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            <ApprovalDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingApproval(null);
                }}
                approval={viewingApproval}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </>
    );
};

export default ApprovalsPage;
