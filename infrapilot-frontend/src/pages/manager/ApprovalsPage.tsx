import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ApprovalDetailsModal from "../../components/dashboard/ApprovalDetailsModal";
import toast from "react-hot-toast";
import { Eye, Check, X, Search, RotateCcw } from "lucide-react";
import { approvalService } from "../../services/approvalService";
import type { ApprovalItem } from "../../services/approvalService";
import { useProject } from "../../context/ProjectContext";

const ApprovalsPage = () => {
    const location = useLocation();
    const subPage = location.pathname.split("/").pop() || "requests";
    const { selectedProjectId } = useProject();

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [viewingApproval, setViewingApproval] = useState<ApprovalItem | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchApprovals = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await approvalService.getApprovals();
            // Filter by context if applicable
            const filteredByProject = selectedProjectId
                ? data.filter(a => a.project_id === selectedProjectId || !a.project_id)
                : data;
            setApprovals(filteredByProject);
        } catch (error) {
            toast.error("Cloud synchronization failed. Using local vault.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    const filteredApprovals = useMemo(() => {
        const term = searchTerm.toLowerCase();
        // Determine status filter based on route
        let statusFilter = "Pending";
        if (subPage === "history" || subPage === "approved") statusFilter = "Approved";
        if (subPage === "rejected") statusFilter = "Rejected";

        return approvals.filter(a => {
            const matchesStatus = a.status === statusFilter;
            const matchesSearch =
                (a.project_name || "").toLowerCase().includes(term) ||
                (a.requested_by || "").toLowerCase().includes(term) ||
                (a.entity_type || "").toLowerCase().includes(term) ||
                (a.detail || "").toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [approvals, searchTerm, subPage]);

    const handleApprove = async (id: number, remarks: string = "Approved by Project Manager") => {
        try {
            await approvalService.approve(id, remarks);
            toast.success("Request authorized successfully.");
            fetchApprovals();
        } catch (err) {
            toast.error("Authorization sync failed.");
        }
    };

    const handleReject = async (id: number, remarks: string = "Rejected by Project Manager") => {
        try {
            await approvalService.reject(id, remarks);
            toast.error("Request rejected.");
            fetchApprovals();
        } catch (err) {
            toast.error("Rejection sync failed.");
        }
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

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;

        const pendingCount = selectedIds.length;
        const toastId = toast.loading(`Authorizing ${pendingCount} site requests...`);

        try {
            await Promise.all(selectedIds.map(id => approvalService.approve(id, "Bulk approved by PM")));
            toast.success(`${pendingCount} site requests approved.`, { id: toastId });
            setSelectedIds([]);
            fetchApprovals();
        } catch (err) {
            toast.error("Bulk authorization encountered issues.", { id: toastId });
        }
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Active Requests" value={approvals.filter(a => a.status === "Pending").length.toString()} sub="Requiring attention" accent="text-amber-500" />
                    <StatCard title="Approved" value={approvals.filter(a => a.status === "Approved").length.toString()} sub="Total historical" accent="text-emerald-500" />
                    <StatCard title="Rejected" value={approvals.filter(a => a.status === "Rejected").length.toString()} sub="Total denied" accent="text-rose-500" />
                    <StatCard title="Oversight Score" value="98.4%" sub="Site efficiency" accent="text-primary" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by site engineer, project or summary..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchApprovals()} className="p-2 text-slate-400 hover:text-primary transition-colors border border-slate-100 rounded-lg" title="Refresh">
                                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
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
                                    <th className="px-6 py-4">Entity Type</th>
                                    <th className="px-6 py-4">Site Engineer</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Summary Detail</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <div className="inline-block w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin mb-2"></div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Registry...</p>
                                        </td>
                                    </tr>
                                ) : filteredApprovals.length > 0 ? (
                                    filteredApprovals.map((item) => (
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
                                                <span className="text-xs font-bold text-slate-700">{item.entity_type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{item.requested_by}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-primary/80">{item.project_name || "Global"}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">{item.detail}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${item.status === "Approved" ? "bg-emerald-100 text-emerald-600" : item.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"}`}>
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No {subPage} records found</p>
                                        </td>
                                    </tr>
                                )}
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
