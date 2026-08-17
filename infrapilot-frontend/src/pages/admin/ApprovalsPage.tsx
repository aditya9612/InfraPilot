import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ApprovalDetailsModal from "../../components/dashboard/ApprovalDetailsModal";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { Eye, Check, X, Loader2, Plus } from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import { approvalService } from "../../services/approvalService";
import type { ApprovalItem } from "../../services/approvalService";
import { userService } from "../../services/userService";
import { boqService } from "../../services/boqService";
import { drawingService } from "../../services/drawingService";
import { documentService } from "../../services/documentService";
import { equipmentService } from "../../services/equipmentService";

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

  // Create approval modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    entity_type: "boq",
    entity_id: "",
    remarks: "",
  });
  const [entityItems, setEntityItems] = useState<{ id: number; label: string }[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const ENTITY_TYPES = [
    { value: "boq", label: "BOQ" },
    { value: "drawing", label: "Drawing" },
    { value: "document", label: "Document" },
    { value: "equipment", label: "Equipment" },
    { value: "bill", label: "Bill" },
    { value: "measurement", label: "Measurement" },
    { value: "material", label: "Material Request" },
    { value: "expense", label: "Site Expense" },
    { value: "labour", label: "Labour Salary" },
  ];

  useEffect(() => {
    const fetchEntityItems = async () => {
      if (!isCreateModalOpen) return;
      setIsLoadingEntities(true);
      setEntityItems([]);
      setCreateForm(p => ({ ...p, entity_id: "" }));
      try {
        let items: { id: number; label: string }[] = [];
        switch (createForm.entity_type) {
          case "boq": {
            const data = await boqService.getBoqs({ limit: 100, offset: 0 });
            const list = data.items || [];
            items = list.map((b: any) => ({
              id: b.id, label: `${b.item_name || b.name || `BOQ Item`} (ID: ${b.id})`,
            }));
            break;
          }
          case "drawing": {
            // Drawings API strictly requires project_id. We fetch projects first to get all drawings.
            try {
              const { projectService } = await import("../../services/projectService");
              const pData = await projectService.getProjects(50, 0);
              const projects = Array.isArray(pData) ? pData : (pData.items || pData.data || []);

              const allDrawings = await Promise.all(
                projects.map((p: any) => drawingService.getList({ project_id: p.id, limit: 100 }).catch(() => []))
              );

              const flatDrawings = allDrawings.flat();
              items = flatDrawings.map((d: any) => ({
                id: d.id, label: `${d.drawing_name || d.title || `Drawing #${d.id}`} (Project: ${projects.find((p: any) => p.id === d.project_id)?.project_name || d.project_id}) (ID: ${d.id})`,
              }));
            } catch (err) {
              console.warn("Failed to fetch drawings for approval dropdown:", err);
            }
            break;
          }
          case "document": {
            const res = await documentService.listDocuments({ limit: 100 });
            const docs = Array.isArray(res) ? res : (res as any).items || [];
            items = docs.map((d: any) => ({
              id: d.id, label: `${d.title || `Document #${d.id}`} (ID: ${d.id})`,
            }));
            break;
          }
          case "equipment": {
            const res = await equipmentService.listEquipment();
            const equips = Array.isArray(res) ? res : (res as any).items || [];
            items = equips.map((e: any) => ({
              id: e.id, label: `${e.name || e.equipment_name || `Equipment #${e.id}`} (ID: ${e.id})`,
            }));
            break;
          }
          default:
            items = [];
        }
        setEntityItems(items);
      } catch {
        setEntityItems([]);
      } finally {
        setIsLoadingEntities(false);
      }
    };
    fetchEntityItems();
  }, [createForm.entity_type, isCreateModalOpen]);

  const handleCreateApproval = async () => {
    if (!createForm.entity_id.trim()) { toast.error("Entity ID is required"); return; }
    setIsCreating(true);
    try {
      await approvalService.createApproval({
        entity_type: createForm.entity_type,
        entity_id: Number(createForm.entity_id),
        remarks: createForm.remarks || `Approval request for ${createForm.entity_type} #${createForm.entity_id}`,
      });
      toast.success("Approval request created successfully!");
      setIsCreateModalOpen(false);
      setCreateForm({ entity_type: "boq", entity_id: "", remarks: "" });
      fetchApprovals();
    } catch {
      toast.error("Failed to create approval request");
    } finally {
      setIsCreating(false);
    }
  };

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
        if (uid != null) map[Number(uid)] = u.full_name || u.name || u.username || u.email || `User ${uid}`;
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
      String(a.entity_type || "").toLowerCase().includes(searchStr) ||
      String(a.remarks || "").toLowerCase().includes(searchStr) ||
      String(a.entity_id || "").toLowerCase().includes(searchStr)
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
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Approval
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={selectedIds.length === 0}
              className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${selectedIds.length > 0
                ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600"
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
                <option value="all">Every Type</option>
                <option value="boq">BOQ</option>
                <option value="ra bill">RA Bill</option>
                <option value="final measurement">Final Measurement</option>
                <option value="purchase order">Purchase Order</option>
                <option value="document">Document</option>
                <option value="drawing">Drawing</option>
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
                      {usersMap[Number(item.requested_by)] || item.requested_by || "-"}
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
                      {item.approved_by ? (usersMap[Number(item.approved_by)] || item.approved_by) : "-"}
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

      {/* Create Approval Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateForm({ entity_type: "boq", entity_id: "", remarks: "" }); }}
        title="Create Approval Request"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              onClick={() => { setIsCreateModalOpen(false); setCreateForm({ entity_type: "boq", entity_id: "", remarks: "" }); }}
              disabled={isCreating}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateApproval}
              disabled={isCreating}
              className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isCreating ? "Creating..." : "Create Request"}
            </button>
          </>
        }
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Entity Type <span className="text-rose-500">*</span></label>
            <select
              value={createForm.entity_type}
              onChange={e => setCreateForm(p => ({ ...p, entity_type: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
            >
              {ENTITY_TYPES.map(et => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              {ENTITY_TYPES.find(e => e.value === createForm.entity_type)?.label || "Entity"} <span className="text-rose-500">*</span>
            </label>
            {isLoadingEntities ? (
              <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              <select
                value={createForm.entity_id}
                onChange={e => setCreateForm(p => ({ ...p, entity_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                <option value="">
                  {entityItems.length === 0
                    ? `No ${createForm.entity_type} items found`
                    : `Select ${ENTITY_TYPES.find(e => e.value === createForm.entity_type)?.label}`}
                </option>
                {entityItems.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Remarks</label>
            <textarea
              value={createForm.remarks}
              onChange={e => setCreateForm(p => ({ ...p, remarks: e.target.value }))}
              placeholder="Reason for approval request..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ApprovalsPage;
