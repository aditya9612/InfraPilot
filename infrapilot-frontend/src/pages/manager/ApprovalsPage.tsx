import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ApprovalDetailsModal from "../../components/dashboard/ApprovalDetailsModal";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { Eye, Check, X, Search, RotateCcw, Plus } from "lucide-react";
import { approvalService } from "../../services/approvalService";
import type { ApprovalItem } from "../../services/approvalService";
import { useProject } from "../../context/ProjectContext";
import { boqService } from "../../services/boqService";
import { drawingService } from "../../services/drawingService";
import { documentService } from "../../services/documentService";
import { equipmentService } from "../../services/equipmentService";

const ApprovalsPage = () => {
    const location = useLocation();
    const { selectedProjectId } = useProject();

    const [activeTab, setActiveTab] = useState<"Pending" | "Approved" | "Rejected">("Pending");
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [entityFilter, setEntityFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [viewingApproval, setViewingApproval] = useState<ApprovalItem | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [usersMap, setUsersMap] = useState<Record<string, string>>({});

    // Create approval modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        entity_type: "boq",
        entity_id: "",
        remarks: "",
    });

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

    // Entity items for dropdown — fetched based on selected entity type
    const [entityItems, setEntityItems] = useState<{ id: number; label: string }[]>([]);
    const [isLoadingEntities, setIsLoadingEntities] = useState(false);

    useEffect(() => {
        const fetchEntityItems = async () => {
            if (!isCreateModalOpen) return;
            setIsLoadingEntities(true);
            setEntityItems([]);
            setCreateForm(p => ({ ...p, entity_id: "" }));
            try {
                const pid = selectedProjectId || undefined;
                let items: { id: number; label: string }[] = [];

                switch (createForm.entity_type) {
                    case "boq": {
                        if (pid) {
                            const data = await boqService.getBoqsByProject(pid);
                            items = (Array.isArray(data) ? data : []).map((b: any) => ({
                                id: b.id,
                                label: `${b.item_name} (ID: ${b.id})`,
                            }));
                        }
                        break;
                    }
                    case "drawing": {
                        if (pid) {
                            const data = await drawingService.getVersions(pid);
                            items = (Array.isArray(data) ? data : []).map((d: any) => ({
                                id: d.id,
                                label: `${d.drawing_name || d.title || `Drawing #${d.id}`} (ID: ${d.id})`,
                            }));
                        }
                        break;
                    }
                    case "document": {
                        if (pid) {
                            const res = await documentService.listDocuments({ project_id: pid, limit: 100 });
                            const docs = Array.isArray(res) ? res : (res as any).items || [];
                            items = docs.map((d: any) => ({
                                id: d.id,
                                label: `${d.title || `Document #${d.id}`} (ID: ${d.id})`,
                            }));
                        }
                        break;
                    }
                    case "equipment": {
                        const res = await equipmentService.listEquipment();
                        const equips = Array.isArray(res) ? res : (res as any).items || [];
                        items = equips.map((e: any) => ({
                            id: e.id,
                            label: `${e.name || e.equipment_name || `Equipment #${e.id}`} (ID: ${e.id})`,
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
    }, [createForm.entity_type, isCreateModalOpen, selectedProjectId]);

    const fetchApprovals = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await approvalService.getApprovals();
            const filteredByProject = selectedProjectId
                ? data.filter(a => a.project_id === selectedProjectId || !a.project_id)
                : data;
            setApprovals(filteredByProject);

            // Note: /users endpoints require Admin role — skip API resolution.
            // Columns display raw value: name string if API returns one, else "User #id".
            // Permanent fix: backend should include names directly in approvals response.

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

        const result = approvals.filter(a => {
            const matchesStatus = a.status === activeTab;
            const matchesEntity = entityFilter === "all"
                || (a.entity_type || "").toLowerCase() === entityFilter.toLowerCase();
            const matchesSearch =
                (a.project_name || "").toLowerCase().includes(term) ||
                (String(usersMap[String(a.requested_by)] || a.requested_by || "")).toLowerCase().includes(term) ||
                (a.entity_type || "").toLowerCase().includes(term) ||
                (a.detail || "").toLowerCase().includes(term);
            return matchesStatus && matchesEntity && matchesSearch;
        });

        return [...result].sort((a, b) =>
            sortOrder === "latest" ? b.id - a.id : a.id - b.id
        );
    }, [approvals, searchTerm, entityFilter, sortOrder, activeTab, usersMap]);

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

    const handleExport = () => {
        const headers = ["ID", "Entity Type", "Entity ID", "Status", "Requested By", "Approved By", "Remarks"];
        const csvData = filteredApprovals.map(a => [
            a.id,
            a.entity_type || "",
            a.entity_id || "",
            a.status || "",
            usersMap[String(a.requested_by)] || a.requested_by_name || a.requested_by || "-",
            a.approved_by ? (usersMap[String(a.approved_by)] || a.approved_by) : "-",
            (a.remarks || a.detail || "").replace(/,/g, ";"),
        ].join(","));
        const csvContent = [headers.join(","), ...csvData].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `approvals_report_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Report exported successfully!");
    };

    return (
        <>
            <Navbar title="Approval Center" breadcrumb={["Manager", "Approvals", activeTab]} />

            <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Oversight & Approvals</h1>
                        <p className="text-slate-500 text-sm">Review critical site requests and authorize resource deployment.</p>
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

                {/* Tabs */}

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
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                {(["Pending", "Approved", "Rejected"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                                            activeTab === tab
                                                ? "bg-white text-primary shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={entityFilter}
                                onChange={e => setEntityFilter(e.target.value)}
                                className={`px-3 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${
                                    entityFilter !== "all"
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                            >
                                <option value="all">All Types</option>
                                <option value="drawing">Drawing</option>
                                <option value="document">Document</option>
                                <option value="equipment">Equipment</option>
                                <option value="boq">BOQ</option>
                                <option value="bill">Bill</option>
                                <option value="measurement">Measurement</option>
                            </select>
                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as "latest" | "oldest")}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="latest">Latest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
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
                                    <th className="px-6 py-4">Entity Type & ID</th>
                                    <th className="px-6 py-4">Requested By</th>
                                    <th className="px-6 py-4">Summary Detail</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Approved By</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
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
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{item.entity_type}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium tracking-widest">ID: {item.entity_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                                {usersMap[String(item.requested_by)] || item.requested_by_name || (String(item.requested_by).match(/^\d+$/) ? `User #${item.requested_by}` : item.requested_by) || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                                                {item.remarks || item.detail || "No details provided"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${item.status === "Approved" ? "bg-emerald-100 text-emerald-600" : item.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                {item.approved_by
                                                    ? (usersMap[String(item.approved_by)] || item.reviewer_name || (String(item.approved_by).match(/^\d+$/) ? `User #${item.approved_by}` : String(item.approved_by)))
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setViewingApproval({
                                                                ...item,
                                                                requested_by_name: usersMap[String(item.requested_by)] || item.requested_by_name,
                                                                reviewer_name: item.approved_by ? (usersMap[String(item.approved_by)] || item.reviewer_name) : item.reviewer_name
                                                            });
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
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No {activeTab} records found</p>
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
