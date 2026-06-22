import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ApprovalDetailsModal from "../../components/dashboard/ApprovalDetailsModal";
import toast from "react-hot-toast";
import { Eye, Check, X, Loader2 } from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import { approvalService } from "../../services/approvalService";
import type { ApprovalItem } from "../../services/approvalService";
import { userService } from "../../services/userService";

const ApprovalsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityCategory, setEntityCategory] = useState<string>("all");
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingApproval, setViewingApproval] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const PAGE_SIZE = 8;

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await approvalService.getApprovals();
      setApprovals(data);
    } catch (error) {
      toast.error("Failed to fetch approvals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch users once to build an id→name lookup map
    userService.getAllUsers(100, 0).then((data) => {
      const list = Array.isArray(data) ? data : data?.items || data?.users || [];
      const map: Record<number, string> = {};
      list.forEach((u: any) => {
        const uid = u.user_id ?? u.id;
        if (uid) map[uid] = u.full_name || u.name || u.username || u.email || `User ${uid}`;
      });
      setUsersMap(map);
    }).catch(() => {/* silently ignore */ });
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Reset to page 0 on filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter, entityCategory]);

  const filteredApprovals = Array.isArray(approvals) ? approvals.filter(a => {
    const type = (a.entity_type || "").toUpperCase();
    // 1. Entity Type Filtering
    if (entityCategory !== "all" && type !== entityCategory.toUpperCase()) return false;

    // 2. Status filter
    if (statusFilter !== "all" && (a.status || "").toLowerCase() !== statusFilter) return false;

    // 3. Search Term Filtering
    const searchStr = searchTerm.toLowerCase();
    return (
      a.entity_type?.toLowerCase().includes(searchStr) ||
      a.remarks?.toLowerCase().includes(searchStr) ||
      a.entity_id?.toString().includes(searchStr)
    );
  }) : [];

  const sortedApprovals = useMemo(() => {
    return [...filteredApprovals].sort((a, b) => {
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [filteredApprovals, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedApprovals.length / PAGE_SIZE));
  const pagedApprovals = sortedApprovals.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleApprove = async (id: number) => {
    try {
      await approvalService.approve(id, "Approved via Admin Dashboard");
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "Approved" } : a));
      toast.success("Request approved successfully!");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await approvalService.reject(id, "Rejected via Admin Dashboard");
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "Rejected" } : a));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.error("Request rejected.");
    } catch (error) {
      toast.error("Failed to reject request");
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

    setIsLoading(true);
    try {
      await Promise.all(selectedIds.map(id =>
        approvalService.approve(id, "Bulk approved via Admin Dashboard")
      ));

      setApprovals(prev => prev.map(a =>
        selectedIds.includes(a.id) ? { ...a, status: "Approved" } : a
      ));

      setSelectedIds([]);
      toast.success(`Successfully approved ${selectedIds.length} requests!`);
    } catch (error) {
      toast.error("Failed to approve some requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["ID", "EntityType", "EntityID", "Status", "RequestedBy", "ApprovedBy", "Remarks"];
    const csvData = filteredApprovals.map(a =>
      [a.id, a.entity_type, a.entity_id, a.status, a.requested_by, a.approved_by || "-", a.remarks || ""].join(",")
    );
    const csvContent = [headers.join(","), ...csvData].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `approvals_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully!");
  };


  return (
    <>
      <Navbar title="Approvals & Workflow" breadcrumb={["Admin", "Approvals", "Requests"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Approval Requests</h1>
            <p className="text-slate-500 text-sm">Review and authorize site requests across all categories with unified filtering.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              Export Report
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={selectedIds.length === 0}
              className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${selectedIds.length > 0
                ? "bg-primary text-white shadow-primary/20 hover:bg-blue-600"
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }`}
            >
              Approve Multiple {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
          </div>
        </div>

        {/* Approval Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Pending Requests"
            value={filteredApprovals.filter(a => a.status?.toLowerCase() === "pending").length.toString()}
            sub="Action Required"
            accent="text-amber-500"
          />
          <StatCard
            title="Approved Total"
            value={filteredApprovals.filter(a => a.status?.toLowerCase() === "approved").length.toString()}
            sub="Successfully processed"
            accent="text-emerald-500"
          />
          <StatCard
            title="Total Rejected"
            value={filteredApprovals.filter(a => a.status?.toLowerCase() === "rejected").length.toString()}
            sub="Denied requests"
            accent="text-rose-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by type, id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <select
                value={entityCategory}
                onChange={(e) => setEntityCategory(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 pr-8"
              >
                <option value="all">Every Type</option>
                {Array.from(new Set(approvals.map(a => a.entity_type?.toUpperCase()).filter(Boolean))).sort().map(type => (
                  <option key={type} value={type?.toLowerCase()}>{type}</option>
                ))}
              </select>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 pr-8"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
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
                  <th className="px-6 py-4">Entity Type & ID</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Remarks / Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Approved By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedApprovals.map((item) => (
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
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{item.entity_type}</span>
                        <span className="text-[10px] text-slate-400 font-medium tracking-widest">ID: {item.entity_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {usersMap[item.requested_by] || `User ID: ${item.requested_by}`}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs truncate">{item.remarks || "No remarks provided"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${item.status?.toLowerCase() === "approved" ? "bg-emerald-100 text-emerald-600" :
                        item.status?.toLowerCase() === "pending" ? "bg-amber-100 text-amber-600" :
                          "bg-rose-100 text-rose-600"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {item.approved_by ? (usersMap[item.approved_by] || item.approved_by) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 items-center">
                        <button
                          onClick={() => {
                            setViewingApproval(item);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {item.status?.toLowerCase() === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Reject"
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

          {/* Pagination */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {sortedApprovals.length > 0 ? currentPage * PAGE_SIZE + 1 : 0}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedApprovals.length)} of {sortedApprovals.length} Requests
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                {currentPage + 1}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
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
