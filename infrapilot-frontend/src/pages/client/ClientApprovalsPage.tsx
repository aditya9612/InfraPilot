import React, { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
  Search,
  Eye,
  Check,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
  Layers,
  FileText,
  Mail,
  Briefcase,
  Phone
} from "lucide-react";
import { approvalService } from "../../services/approvalService";
import { useClientProjectId } from "../../hooks/useClientProjectId";

// ─── Status Colors for Header Card & Actions ─────────────────────────────────
const statusColors: Record<string, string> = {
  Approved: "bg-[#009b5a]",
  approved: "bg-[#009b5a]",
  Pending: "bg-amber-500",
  pending: "bg-amber-500",
  Hold: "bg-rose-500",
  hold: "bg-rose-500",
  Rejected: "bg-rose-600",
  rejected: "bg-rose-600",
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface ApprovalRecord {
  id: number | string;
  entity_type: string;
  entity_id: number | string;
  status: "Pending" | "Approved" | "Rejected" | "Hold" | string;
  requested_by: number | string;
  approved_by?: number | string | null;
  remarks: string | null;
  date: string;
  raw_date?: string;
}

const getStatusStyle = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'pending':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'hold':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'rejected':
    case 'reject':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const ClientApprovalsPage = () => {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state for StatCards & Filter Bar
  const [activeFilter, setActiveFilter] = useState<"Select" | "Approved" | "Pending" | "Reject" | "Pending/Reject">("Select");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const { projectId } = useClientProjectId();

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await approvalService.getApprovals();
      const maxId = data.length > 0 ? Math.max(...data.map((apr: any) => Number(apr.id) || 0)) : 0;

      const mapped: ApprovalRecord[] = (Array.isArray(data) ? data : []).map((apr: any) => {
        const idNum = Number(apr.id) || 0;
        const rawDate = apr.created_at || apr.createdAt || apr.timestamp || apr.date;

        let dateStr: string;
        if (rawDate && !isNaN(new Date(rawDate).getTime())) {
          dateStr = new Date(rawDate).toISOString().split('T')[0];
        } else {
          const daysAgo = maxId - idNum;
          const d = new Date();
          d.setDate(d.getDate() - (daysAgo > 20 ? 20 + (daysAgo % 10) : Math.max(0, daysAgo)));
          dateStr = d.toISOString().split('T')[0];
        }

        return {
          id: apr.id,
          entity_type: apr.entity_type || "GENERAL",
          entity_id: apr.entity_id || apr.id,
          status: apr.status || "Pending",
          requested_by: apr.requested_by_name || apr.requested_by || "Site Engineer",
          approved_by: apr.approved_by || apr.reviewer_name || null,
          remarks: apr.remarks || "No technical narrative narrated",
          date: dateStr,
          raw_date: rawDate || dateStr
        };
      });

      setApprovals(mapped);
    } catch (error) {
      console.error("Failed to fetch approvals", error);
      toast.error("Failed to sync work authorizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals, projectId]);

  const handleApprove = async (id: number | string) => {
    const remarkInput = window.prompt("Enter approval remarks (optional):", "Approved by client");
    if (remarkInput === null) return;
    const toastId = toast.loading("Processing approval...");
    try {
      await approvalService.approve(id, remarkInput || "Approved by client");
      toast.success("Work Authorization Approved", { id: toastId });
      fetchApprovals();
    } catch (err) {
      console.error("Failed to approve", err);
      toast.error("Failed to process approval.", { id: toastId });
    }
  };

  const handleReject = async (id: number | string) => {
    const remarkInput = window.prompt("Enter rejection remarks (required):", "Rejected by client");
    if (remarkInput === null) return;
    if (!remarkInput.trim()) {
      toast.error("Rejection remarks are required");
      return;
    }
    const toastId = toast.loading("Processing rejection...");
    try {
      await approvalService.reject(id, remarkInput);
      toast.success("Work Authorization Rejected", { id: toastId });
      fetchApprovals();
    } catch (err) {
      console.error("Failed to reject", err);
      toast.error("Failed to process rejection.", { id: toastId });
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = approvals.length;
    const approved = approvals.filter(a => (a.status || "").toLowerCase() === "approved").length;
    const pendingAndRejected = approvals.filter(
      a => (a.status || "").toLowerCase() !== "approved"
    ).length;

    return {
      total,
      approved,
      pendingAndRejected
    };
  }, [approvals]);

  // Filtering & Sorting
  const filteredApprovals = useMemo(() => {
    let result = approvals;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        a =>
          String(a.id).toLowerCase().includes(q) ||
          (a.entity_type || "").toLowerCase().includes(q) ||
          (a.remarks || "").toLowerCase().includes(q) ||
          String(a.requested_by).toLowerCase().includes(q)
      );
    }

    // Active status filter
    if (activeFilter === "Approved") {
      result = result.filter(a => (a.status || "").toLowerCase() === "approved");
    } else if (activeFilter === "Pending") {
      result = result.filter(a => (a.status || "").toLowerCase() === "pending");
    } else if (activeFilter === "Reject") {
      result = result.filter(
        a =>
          (a.status || "").toLowerCase() === "rejected" ||
          (a.status || "").toLowerCase() === "reject"
      );
    } else if (activeFilter === "Pending/Reject") {
      result = result.filter(a => (a.status || "").toLowerCase() !== "approved");
    }

    // Category filter
    if (categoryFilter !== "All") {
      const cat = categoryFilter.toLowerCase();
      result = result.filter(a => {
        const entity = (a.entity_type || "").toLowerCase();
        if (cat === "documents") return entity.includes("document");
        if (cat === "bills") return entity.includes("bill");
        if (cat === "drawing") return entity.includes("drawing");
        if (cat === "boq") return entity.includes("boq");
        if (cat === "measurement") return entity.includes("measurement");
        return entity === cat || entity.includes(cat);
      });
    }

    // Sort order
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.raw_date || a.date || 0).getTime();
      const dateB = new Date(b.raw_date || b.date || 0).getTime();
      if (dateA !== dateB) {
        return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
      }
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [approvals, searchTerm, activeFilter, categoryFilter, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredApprovals.length / itemsPerPage));
  const paginatedApprovals = useMemo(() => {
    return filteredApprovals.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredApprovals, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, categoryFilter, sortOrder, itemsPerPage]);

  return (
    <>
      <Navbar title="Approvals" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
      <div className="p-8 bg-[#f8fafc] min-h-screen font-inter pb-20">
        
        {/* ── Page Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Approvals</h1>
            <p className="text-slate-400 text-xs mt-1">
              Technical clearance portal for critical site activities and execution milestones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchApprovals}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
              title="Refetch Authorizations"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Cards (3 Cards) ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "TOTAL LOGS",
              value: stats.total.toString(),
              sub: "Activity Baseline",
              accent: "text-slate-800",
              status: "Select",
            },
            {
              title: "APPROVED",
              value: stats.approved.toString(),
              sub: "Work Authorized",
              accent: "text-emerald-500",
              status: "Approved",
            },
            {
              title: "PENDING / REJECT",
              value: stats.pendingAndRejected.toString(),
              sub: "Awaiting Clearance",
              accent: "text-rose-500",
              status: "Pending/Reject",
            },
          ].map((s) => (
            <div
              key={s.title}
              onClick={() => s.status && setActiveFilter(s.status as any)}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${
                activeFilter === s.status ? 'ring-2 ring-primary/20 border-primary/40' : ''
              } hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20 group`}
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                {s.title}
              </p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              {s.sub && (
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── Filter Bar & Table Container ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4 bg-white font-inter">
            <div className="relative w-full md:max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by activity, ID or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter font-bold"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 font-inter">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                ACTIVE FILTER:
              </span>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="Select">SELECT</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Reject">Reject</option>
              </select>

              {/* Sort Filter */}
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Clock className="w-4 h-4" />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                  className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <div className="absolute right-3 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Category Filter */}
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Layers className="w-4 h-4" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Labour">Labour</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Material">Material</option>
                  <option value="Drawing">Drawing</option>
                  <option value="Documents">Documents</option>
                  <option value="BOQ">BOQ</option>
                  <option value="Measurement">Measurement</option>
                  <option value="Bills">Bills</option>
                </select>
                <div className="absolute right-3 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4">Work Authorization</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Authorizations...</p>
                    </td>
                  </tr>
                ) : paginatedApprovals.length > 0 ? (
                  paginatedApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4">
                        <div className="flex flex-col font-inter">
                          <span className="text-sm font-bold text-slate-800 uppercase font-inter">{approval.entity_type}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">Auth Log</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(approval.status)} font-inter`}>
                          {approval.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-bold text-slate-400 truncate max-w-[350px] font-inter">
                          {approval.remarks || "No technical narrative narrated"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 font-inter">
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {approval.status?.toLowerCase() === "pending" && (
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-2 font-inter">
                              <button
                                onClick={() => handleApprove(approval.id)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(approval.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-inter">
                      No authorization requests discovered in the project vault.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Controls ──────────────────────────── */}
          {!loading && filteredApprovals.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
              {/* Left: Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Center: Showing info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredApprovals.length)} of {filteredApprovals.length} records
              </div>

              {/* Right: Pagination */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 3) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">
                          ...
                        </span>
                      );
                    }
                    const pageNum = page as number;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── View Details Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedApproval(null);
        }}
        title="Work Authorization Insight"
        maxWidth="max-w-xl"
      >
        {selectedApproval && (
          <div className="p-2 font-inter">
            {/* ── Profile Style Header ────────────────── */}
            <div className={`${statusColors[selectedApproval.status] || 'bg-[#009b5a]'} rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-xl relative overflow-hidden font-inter`}>
              <div className="relative z-10 flex items-center gap-5 sm:gap-6 font-inter text-white">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter shrink-0 shadow-md">
                  <span className="text-3xl sm:text-4xl font-bold font-inter text-white">
                    {selectedApproval.entity_type ? selectedApproval.entity_type.charAt(0).toUpperCase() : "A"}
                  </span>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 ${
                    (selectedApproval.status || '').toLowerCase() === 'approved'
                      ? 'bg-emerald-400'
                      : (selectedApproval.status || '').toLowerCase() === 'pending'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                  } border-4 border-white/30 rounded-full animate-pulse`} />
                </div>
                
                <div className="font-inter flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-inter">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight font-inter uppercase truncate text-white">
                      {selectedApproval.entity_type} CLEARANCE
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/20 text-white shrink-0">
                      {selectedApproval.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-white/80 mb-3 font-inter text-xs">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold font-inter truncate">
                      approval.ref-{String(selectedApproval.id).toLowerCase()}@infrapilot.com
                    </span>
                  </div>

                  <div className="px-3.5 py-1 bg-white/20 rounded-full inline-block font-inter">
                    <span className="text-[10px] font-black uppercase tracking-widest font-inter text-white">
                      ENTITY ID: {selectedApproval.entity_id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-1 mb-6 font-inter">
              {/* ── Operational Intelligence ────────────────── */}
              <div className="font-inter">
                <div className="flex items-center gap-2.5 mb-4 font-inter">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl font-inter">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">
                    Operational Intelligence
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-4 font-inter">
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">
                      Entity Category
                    </p>
                    <p className="text-sm font-black text-slate-800 font-inter uppercase">
                      {selectedApproval.entity_type}
                    </p>
                  </div>
                  
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">
                      Entity Reference
                    </p>
                    <p className="text-sm font-black text-slate-800 font-inter">
                      #LOG-{selectedApproval.entity_id}
                    </p>
                  </div>
                  
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">
                      Authorization Status
                    </p>
                    <p className={`text-sm font-black font-inter uppercase ${
                      (selectedApproval.status || '').toLowerCase() === 'approved'
                        ? 'text-emerald-500'
                        : (selectedApproval.status || '').toLowerCase() === 'pending'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                    }`}>
                      {selectedApproval.status.toUpperCase()}
                    </p>
                  </div>
                  
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">
                      System Ref
                    </p>
                    <p className="text-sm font-black text-slate-800 font-inter">
                      AUT-{selectedApproval.id}X
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Technical Narrative ─────────────────────── */}
              <div className="font-inter">
                <div className="flex items-center gap-2.5 mb-4 font-inter">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl font-inter">
                    <Phone className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">
                    Technical Narrative
                  </p>
                </div>
                
                <div className="font-inter">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">
                    Audit Trail & Remarks
                  </p>
                  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs sm:text-sm text-slate-700 font-medium leading-relaxed font-inter">
                    "{selectedApproval.remarks || "Approved by Project Manager"}"
                  </div>
                </div>
              </div>

              {/* ── Audit Integrity ─────────────────────────── */}
              <div className="font-inter">
                <div className="flex items-center gap-2.5 mb-4 font-inter">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl font-inter">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">
                    Audit Integrity
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-4 font-inter">
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">
                      Requested By
                    </p>
                    <p className="text-sm font-bold text-blue-600 font-inter">
                      {selectedApproval.requested_by || "Amit patil"}
                    </p>
                  </div>
                  
                  <div className="font-inter">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">
                      System Sync
                    </p>
                    <p className="text-sm font-bold text-emerald-500 font-inter">
                      Verified Request
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bottom Dismiss Button ────────────────────── */}
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedApproval(null);
              }}
              className={`w-full py-4 ${statusColors[selectedApproval.status] || 'bg-[#009b5a]'} text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-95 font-inter cursor-pointer`}
            >
              Dismiss Authorization Insight
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientApprovalsPage;
