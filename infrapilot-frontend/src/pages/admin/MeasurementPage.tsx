import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/common/ConfirmModal";
import Modal from "../../components/common/Modal";
import { measurementService } from "../../services/measurementService";
import { projectService } from "../../services/projectService";
import type { Measurement } from "../../types/measurement";
import type { Project } from "../../types/project";
import toast from "react-hot-toast";
import SortDropdown from "../../components/common/SortDropdown";
import {
  Ruler,
  Trash2,
  Plus,
  Search,
  Edit3,
  Eye,
  ChevronDown,
  Info
} from "lucide-react";
import { boqService } from "../../services/boqService";
import type { BoqItem } from "../../types/boq";
import type { Task } from "../../types/project";
import { formatCompactCurrency } from "../../utils/currencyUtils";

const MeasurementPage = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const PAGE_SIZE = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Measurement | null>(null);
  const [viewingItem, setViewingItem] = useState<Measurement | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectBoqItems, setProjectBoqItems] = useState<BoqItem[]>([]);
  // Use isDataLoading for potential UI loading states
  const [isDataLoading, setIsDataLoading] = useState(false);
  console.log("Reference Data Loading Status:", isDataLoading);

  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    boq_item_id: "",
    final_area: "",
    approved_rate: "",
    extra_area: "",
    extra_rate: "",
    measured_qty: "",
    certified_qty: "",
    rejected_qty: "",
    retention_amount: "",
    status: "DRAFT"
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isRestricted = Boolean(
    editingItem && (
      (editingItem as any).status?.toUpperCase() === "SUBMITTED" ||
      (editingItem as any).status?.toUpperCase() === "APPROVED"
    )
  );

  const handleFieldChange = (field: string, value: string) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);

    const standardSubtotal = (Number(updatedForm.final_area) || 0) * (Number(updatedForm.approved_rate) || 0);
    const extraSubtotal = (Number(updatedForm.extra_area) || 0) * (Number(updatedForm.extra_rate) || 0);
    const totalSubtotal = standardSubtotal + extraSubtotal;
    const retention = Number(updatedForm.retention_amount) || 0;

    setFormErrors(prev => {
      const next = { ...prev };
      
      // Clear empty required error for this field if populated
      if (value.trim() !== "") {
        delete next[field];
      }

      // Real-time check: Retention Amount cannot exceed total subtotal amount
      if (updatedForm.retention_amount && updatedForm.retention_amount.trim() !== "") {
        if (retention > totalSubtotal) {
          const formattedRetention = `₹${retention.toLocaleString('en-IN')}`;
          const formattedSubtotal = `₹${totalSubtotal.toLocaleString('en-IN')}`;
          const errorMsg = `Retention Amount (${formattedRetention}) cannot exceed total subtotal amount (${formattedSubtotal})`;
          next.retention_amount = errorMsg;
          if (field === "retention_amount") {
            toast.error(errorMsg, { id: "retention-error" });
          }
        } else {
          if (next.retention_amount && next.retention_amount.includes("cannot exceed")) {
            delete next.retention_amount;
            toast.dismiss("retention-error");
          }
        }
      }

      return next;
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const standardSubtotal = (Number(formData.final_area) || 0) * (Number(formData.approved_rate) || 0);
    const extraSubtotal = (Number(formData.extra_area) || 0) * (Number(formData.extra_rate) || 0);
    const totalSubtotal = standardSubtotal + extraSubtotal;
    const retention = Number(formData.retention_amount) || 0;

    if (!formData.project_id || formData.project_id === "0") {
      errors.project_id = "Project Node is required";
    }
    if (!formData.task_id || formData.task_id === "0") {
      errors.task_id = "Target Task is required";
    }
    if (!formData.boq_item_id || formData.boq_item_id === "0") {
      errors.boq_item_id = "BOQ Item is required";
    }
    if (!formData.retention_amount || formData.retention_amount.trim() === "") {
      errors.retention_amount = "Retention Amount is required";
    } else if (retention > totalSubtotal) {
      const formattedRetention = `₹${retention.toLocaleString('en-IN')}`;
      const formattedSubtotal = `₹${totalSubtotal.toLocaleString('en-IN')}`;
      errors.retention_amount = `Retention Amount (${formattedRetention}) cannot exceed total subtotal amount (${formattedSubtotal})`;
    }
    if (!formData.status || formData.status.trim() === "") {
      errors.status = "Current Status is required";
    }
    if (!formData.final_area || formData.final_area.trim() === "") {
      errors.final_area = "Final Area is required";
    }
    if (!formData.approved_rate || formData.approved_rate.trim() === "") {
      errors.approved_rate = "Apprv. Rate is required";
    }
    if (!formData.extra_area || formData.extra_area.trim() === "") {
      errors.extra_area = "Extra Area is required";
    }
    if (!formData.extra_rate || formData.extra_rate.trim() === "") {
      errors.extra_rate = "Extra Rate is required";
    }
    if (!formData.measured_qty || formData.measured_qty.trim() === "") {
      errors.measured_qty = "Measured Qty is required";
    }
    if (!formData.certified_qty || formData.certified_qty.trim() === "") {
      errors.certified_qty = "Certified Qty is required";
    }
    if (!formData.rejected_qty || formData.rejected_qty.trim() === "") {
      errors.rejected_qty = "Rejected Qty is required";
    }

    setFormErrors(errors);
    return errors;
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormErrors({});
    setIsBoqDropdownOpen(false);
    setFormData({
      project_id: selectedProject,
      task_id: "",
      boq_item_id: "",
      final_area: "",
      approved_rate: "",
      extra_area: "",
      extra_rate: "",
      measured_qty: "",
      certified_qty: "",
      rejected_qty: "",
      retention_amount: "",
      status: "DRAFT"
    });
  };

  const [isBoqDropdownOpen, setIsBoqDropdownOpen] = useState(false);
  const [boqSearch, setBoqSearch] = useState("");
  const boqDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boqDropdownRef.current && !boqDropdownRef.current.contains(event.target as Node)) {
        setIsBoqDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBoqs = useMemo(() => {
    if (!boqSearch.trim()) return projectBoqItems;
    return projectBoqItems.filter(b => (b.item_name || "").toLowerCase().includes(boqSearch.toLowerCase()));
  }, [projectBoqItems, boqSearch]);

  const selectedBoqName = useMemo(() => {
    if (!formData.boq_item_id || formData.boq_item_id === "0") return "Select BOQ Item";
    const found = projectBoqItems.find(b => String(b.id) === String(formData.boq_item_id));
    return found?.item_name || `BOQ Item #${formData.boq_item_id}`;
  }, [projectBoqItems, formData.boq_item_id]);

  // Initial load of projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await projectService.getProjects(100);
        const items = Array.isArray(res) ? res : res.items || [];
        setProjects(items);
        if (items.length > 0) {
          setSelectedProject(items[0].id.toString());
        }
      } catch (error) {
        toast.error("System offline: Project matrix inaccessible");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedProject) return;
    try {
      setIsLoading(true);
      const measData = await measurementService.getMeasurementsByProject(Number(selectedProject));
      setMeasurements(measData);
    } catch (error) {
      setMeasurements([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
    setCurrentPage(0);
  }, [fetchData, sortOrder]);

  // Fetch tasks and BOQ items when project changes
  useEffect(() => {
    const fetchReferenceData = async () => {
      const pid = formData.project_id || selectedProject;
      if (!pid) return;

      try {
        setIsDataLoading(true);
        const [tasks, boqs] = await Promise.all([
          projectService.getTasks(Number(pid)),
          boqService.getBoqItems(Number(pid))
        ]);
        const tasksArr = Array.isArray(tasks) ? tasks : ((tasks as any)?.items || (tasks as any)?.data || []);
        const boqsArr = Array.isArray(boqs) ? boqs : ((boqs as any)?.items || (boqs as any)?.data || []);
        setProjectTasks(tasksArr);
        setProjectBoqItems(boqsArr);
      } catch (error) {
        console.error("Failed to fetch reference data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (isModalOpen) {
      fetchReferenceData();
    }
  }, [formData.project_id, isModalOpen, selectedProject]);

  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => {
      const aVal = a.id;
      const bVal = b.id;
      return sortOrder === "latest" ? bVal - aVal : aVal - bVal;
    });
  }, [measurements, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedMeasurements.length / PAGE_SIZE));
  const pagedMeasurements = sortedMeasurements.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRestricted) {
      toast.error("Cannot modify a measurement once it has been submitted for approval", { id: "save" });
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      if (errors.retention_amount && errors.retention_amount.includes("cannot exceed")) {
        toast.error(errors.retention_amount, { id: "save" });
      } else {
        toast.error("Please fill in all required measurement fields", { id: "save" });
      }
      return;
    }

    try {
      toast.loading("Broadcasting field data...", { id: "save" });
      const data = {
        project_id: Number(formData.project_id),
        task_id: Number(formData.task_id || 0),
        boq_item_id: Number(formData.boq_item_id || 0),
        final_area: Number(formData.final_area),
        approved_rate: Number(formData.approved_rate),
        extra_area: Number(formData.extra_area || 0),
        extra_rate: Number(formData.extra_rate || 0),
        measured_qty: Number(formData.measured_qty || 0),
        certified_qty: Number(formData.certified_qty || 0),
        rejected_qty: Number(formData.rejected_qty || 0),
        retention_amount: Number(formData.retention_amount || 0),
        status: formData.status
      };

      if (editingItem) {
        await measurementService.updateMeasurement(editingItem.id, data);
        toast.success("Measurement updated successfully", { id: "save" });
      } else {
        await measurementService.createMeasurement(data);
        toast.success("New measurement synchronized", { id: "save" });
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.detail || error?.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : '');
      const msg = serverMsg || "Cannot modify a measurement once it has been submitted for approval";
      toast.error(msg, { id: "save" });
    }
  };

  const handleEdit = (m: Measurement) => {
    setEditingItem(m);
    setFormErrors({});
    setIsBoqDropdownOpen(false);
    setProjectTasks([]);
    setProjectBoqItems([]);
    setFormData({
      project_id: m.project_id.toString(),
      task_id: (m as any).task_id?.toString() || "",
      boq_item_id: (m as any).boq_item_id?.toString() || "",
      final_area: m.final_area != null ? m.final_area.toString() : "",
      approved_rate: m.approved_rate != null ? m.approved_rate.toString() : "",
      extra_area: m.extra_area != null ? m.extra_area.toString() : "",
      extra_rate: m.extra_rate != null ? m.extra_rate.toString() : "",
      measured_qty: (m as any).measured_qty != null ? (m as any).measured_qty.toString() : "",
      certified_qty: (m as any).certified_qty != null ? (m as any).certified_qty.toString() : "",
      rejected_qty: (m as any).rejected_qty != null ? (m as any).rejected_qty.toString() : "",
      retention_amount: (m as any).retention_amount != null ? (m as any).retention_amount.toString() : "",
      status: (m as any).status || "DRAFT"
    });
    setIsModalOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      toast.loading("Fetching measurement...", { id: "view" });
      const data = await measurementService.getMeasurementById(id);
      setViewingItem(data);
      setIsViewModalOpen(true);
      toast.dismiss("view");
    } catch (error) {
      toast.error("Failed to fetch measurement", { id: "view" });
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await measurementService.updateMeasurementStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.detail || error?.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : '');
      toast.error(serverMsg || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!targetId) return;
    try {
      await measurementService.deleteMeasurement(targetId);
      toast.success("Measurement record deleted successfully");
      setIsDeleteOpen(false);
      setTargetId(null);
      fetchData();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.detail || error?.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : '');
      toast.error(serverMsg || "Failed to delete measurement record");
    }
  };

  const totalFinal = measurements.reduce((acc, curr) => acc + (curr.final_area * curr.approved_rate), 0);
  const totalExtra = measurements.reduce((acc, curr) => acc + (curr.extra_area * curr.extra_rate), 0);


  return (
    <>
      <Navbar title="Field Measurements" breadcrumb={["Admin", "Finance", "Measurements"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
              Certified Measurements
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Synchronized with Project Matrix
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl text-sm font-black shadow-2xl shadow-primary/30 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            Record New Area
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Total Certified"
            value={formatCompactCurrency(totalFinal + totalExtra)}
            sub="Combined aggregate value"
            accent="text-primary"
          />
          <StatCard
            title="Standard Area"
            value={formatCompactCurrency(totalFinal)}
            sub="Based on approved rates"
            accent="text-emerald-500"
          />
          <StatCard
            title="Extra Deviation"
            value={formatCompactCurrency(totalExtra)}
            sub="Non-standard work value"
            accent="text-amber-500"
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-6 bg-[#fcfdfe]">
            <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
              <div className="relative flex-1 max-w-md w-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] absolute -top-3 left-6 bg-white px-3 py-0.5 rounded-full border border-slate-100 shadow-sm z-10">
                  Active Project Node
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full pl-11 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Project Node...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
            </div>
            {isLoading && (
              <div className="animate-pulse flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Node...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-6">Final Area (sq.ft)</th>
                  <th className="px-8 py-6">Approved Rate</th>
                  <th className="px-8 py-6">Extra (Area/Rate)</th>
                  <th className="px-8 py-6">Total Value</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {measurements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Ruler className="w-16 h-16 text-slate-300" />
                        <p className="text-slate-400 text-sm font-black tracking-tight">Node data empty. Record first measurement.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedMeasurements.map((m, index) => {
                    const lineTotal = (m.final_area * m.approved_rate) + (m.extra_area * m.extra_rate);
                    return (
                      <tr key={`meas-${m.id}-${index}`} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-700">{m.final_area.toLocaleString()} <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">Units</span></p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-emerald-600">₹{m.approved_rate.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600">{m.extra_area} sq.ft</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase">@ ₹{m.extra_rate}/unit</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-primary">₹{lineTotal.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={(m as any).status || "DRAFT"}
                            onChange={(e) => handleStatusChange(m.id, e.target.value)}
                            className={`text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-1.5 border cursor-pointer outline-none transition-all ${(m as any).status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : (m as any).status === "VERIFIED"
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : (m as any).status === "SUBMITTED"
                                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                  : (m as any).status === "REJECTED"
                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                    : (m as any).status === "BILLED"
                                      ? "bg-purple-50 text-purple-600 border-purple-200"
                                      : "bg-amber-50 text-amber-600 border-amber-200"
                              }`}
                          >
                            <option value="DRAFT">DRAFT</option>
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="BILLED">BILLED</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(m.id)}
                              className="p-3 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(m)}
                              className="p-3 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setTargetId(m.id); setIsDeleteOpen(true); }}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-slate-50 bg-[#fcfdfe] flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Showing {(currentPage * PAGE_SIZE) + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedMeasurements.length)} of {sortedMeasurements.length} Measurements
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-slate-100 text-xs font-black text-slate-800">
                  {currentPage + 1}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingItem ? "Edit Field Measurement" : "Record New Area"}
        maxWidth="max-w-4xl"
        footer={
          <>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              form="measurement-form"
              type="submit"
              disabled={isRestricted}
              className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all ${
                isRestricted
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-blue-600 active:scale-95"
              }`}
              title={isRestricted ? "Cannot modify a measurement once it has been submitted for approval" : ""}
            >
              {editingItem ? "Update Measurement" : "Authorize Entry"}
            </button>
          </>
        }
      >
        <form id="measurement-form" onSubmit={handleCreateOrUpdate} noValidate className="space-y-6">
          {/* Warning Banner when restricted */}
          {isRestricted && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold shadow-sm">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-900">Modification Restricted</p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  Cannot modify a measurement once it has been submitted for approval.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Project & Work Scope */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-primary rounded-full" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Project & Work Scope</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Project Node <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    disabled={isRestricted}
                    value={formData.project_id}
                    onChange={(e) => handleFieldChange("project_id", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold appearance-none pr-9 truncate ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.project_id
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    }`}
                  >
                    <option value="">Select Project Node</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {formErrors.project_id && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.project_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Target Task <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    disabled={isRestricted}
                    value={formData.task_id}
                    onChange={(e) => handleFieldChange("task_id", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold appearance-none pr-9 truncate ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.task_id
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    }`}
                  >
                    <option value="0">Select Task</option>
                    {projectTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {formErrors.task_id && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.task_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  BOQ Item <span className="text-rose-500">*</span>
                </label>
                <div className="relative" ref={boqDropdownRef}>
                  <button
                    type="button"
                    disabled={isRestricted}
                    onClick={() => !isRestricted && setIsBoqDropdownOpen(!isBoqDropdownOpen)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold flex items-center justify-between text-left ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.boq_item_id
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    }`}
                  >
                    <span className="truncate pr-2">{selectedBoqName}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isBoqDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {formErrors.boq_item_id && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <span>•</span> {formErrors.boq_item_id}
                    </p>
                  )}
                  {isBoqDropdownOpen && !isRestricted && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                        <input
                          type="text"
                          placeholder="Filter BOQ items..."
                          value={boqSearch}
                          onChange={(e) => setBoqSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto max-h-48 divide-y divide-slate-50 custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            handleFieldChange("boq_item_id", "0");
                            setIsBoqDropdownOpen(false);
                            setBoqSearch("");
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 font-medium"
                        >
                          Select BOQ Item
                        </button>
                        {filteredBoqs.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              handleFieldChange("boq_item_id", String(b.id));
                              setIsBoqDropdownOpen(false);
                              setBoqSearch("");
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between ${String(formData.boq_item_id) === String(b.id) ? "bg-primary/10 text-primary font-bold" : "text-slate-700"}`}
                          >
                            <span className="truncate pr-2">{b.item_name}</span>
                            {String(formData.boq_item_id) === String(b.id) && <span className="text-[10px] text-primary shrink-0">✓</span>}
                          </button>
                        ))}
                        {filteredBoqs.length === 0 && (
                          <p className="p-3 text-xs text-slate-400 text-center">No BOQ items match filter</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Status & Retention */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Status & Retention</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Retention Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isRestricted}
                  readOnly={isRestricted}
                  value={formData.retention_amount}
                  onChange={(e) => handleFieldChange("retention_amount", e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                    isRestricted
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : formErrors.retention_amount
                      ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                  placeholder="0.00"
                />
                {formErrors.retention_amount && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.retention_amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Current Status <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    disabled={isRestricted}
                    value={formData.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold appearance-none pr-9 ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.status
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="BILLED">BILLED</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {formErrors.status && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Measurements & Rates (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Standard Certified Work */}
            <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Standard Certs</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Subtotal: ₹{((Number(formData.final_area) || 0) * (Number(formData.approved_rate) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Final Area (sq.ft) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isRestricted}
                    readOnly={isRestricted}
                    value={formData.final_area}
                    onChange={(e) => handleFieldChange("final_area", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.final_area
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.final_area && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <span>•</span> {formErrors.final_area}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Apprv. Rate (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isRestricted}
                    readOnly={isRestricted}
                    value={formData.approved_rate}
                    onChange={(e) => handleFieldChange("approved_rate", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.approved_rate
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.approved_rate && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <span>•</span> {formErrors.approved_rate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Extra Deviations */}
            <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Extra Deviations</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Subtotal: ₹{((Number(formData.extra_area) || 0) * (Number(formData.extra_rate) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Extra Area (sq.ft) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isRestricted}
                    readOnly={isRestricted}
                    value={formData.extra_area}
                    onChange={(e) => handleFieldChange("extra_area", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.extra_area
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.extra_area && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <span>•</span> {formErrors.extra_area}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Extra Rate (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isRestricted}
                    readOnly={isRestricted}
                    value={formData.extra_rate}
                    onChange={(e) => handleFieldChange("extra_rate", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                      isRestricted
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : formErrors.extra_rate
                        ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                        : "bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.extra_rate && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <span>•</span> {formErrors.extra_rate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Quantity Analysis */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-purple-500 rounded-full" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Quantity Analysis</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Measured Qty <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isRestricted}
                  readOnly={isRestricted}
                  value={formData.measured_qty}
                  onChange={(e) => handleFieldChange("measured_qty", e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                    isRestricted
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : formErrors.measured_qty
                      ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                  }`}
                  placeholder="0.00"
                />
                {formErrors.measured_qty && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.measured_qty}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Certified Qty <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isRestricted}
                  readOnly={isRestricted}
                  value={formData.certified_qty}
                  onChange={(e) => handleFieldChange("certified_qty", e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                    isRestricted
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : formErrors.certified_qty
                      ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                  }`}
                  placeholder="0.00"
                />
                {formErrors.certified_qty && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.certified_qty}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Rejected Qty <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isRestricted}
                  readOnly={isRestricted}
                  value={formData.rejected_qty}
                  onChange={(e) => handleFieldChange("rejected_qty", e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl transition-all outline-none text-sm font-semibold ${
                    isRestricted
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : formErrors.rejected_qty
                      ? "!border-rose-500 !bg-rose-50/20 text-slate-800 focus:ring-2 focus:ring-rose-200"
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                  }`}
                  placeholder="0.00"
                />
                {formErrors.rejected_qty && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <span>•</span> {formErrors.rejected_qty}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Live Financial Summary Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard</p>
                <p className="text-sm font-extrabold text-emerald-400">
                  ₹{((Number(formData.final_area) || 0) * (Number(formData.approved_rate) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-slate-600 font-bold">+</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deviations</p>
                <p className="text-sm font-extrabold text-amber-400">
                  ₹{((Number(formData.extra_area) || 0) * (Number(formData.extra_rate) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-slate-600 font-bold">-</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retention</p>
                <p className="text-sm font-extrabold text-rose-400">
                  ₹{(Number(formData.retention_amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Certified Amount</p>
              <p className="text-lg font-black text-white">
                ₹{Math.max(0, (((Number(formData.final_area) || 0) * (Number(formData.approved_rate) || 0)) + ((Number(formData.extra_area) || 0) * (Number(formData.extra_rate) || 0))) - (Number(formData.retention_amount) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewingItem(null); }}
        title={`Measurement #${viewingItem?.id}`}
        maxWidth="max-w-xl"
        footer={
          <button
            onClick={() => { setIsViewModalOpen(false); setViewingItem(null); }}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Close
          </button>
        }
      >
        {viewingItem && (
          <div className="p-4 space-y-4 font-inter">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Project ID", value: viewingItem.project_id },
                { label: "Status", value: (viewingItem as any).status || "—" },
                { label: "Final Area", value: `${viewingItem.final_area} sq.ft` },
                { label: "Approved Rate", value: `₹${viewingItem.approved_rate}` },
                { label: "Extra Area", value: `${viewingItem.extra_area} sq.ft` },
                { label: "Extra Rate", value: `₹${viewingItem.extra_rate}` },
                { label: "Measured Qty", value: (viewingItem as any).measured_qty ?? "—" },
                { label: "Certified Qty", value: (viewingItem as any).certified_qty ?? "—" },
                { label: "Rejected Qty", value: (viewingItem as any).rejected_qty ?? "—" },
                { label: "Retention Amt", value: (viewingItem as any).retention_amount != null ? `₹${(viewingItem as any).retention_amount}` : "—" },
                { label: "Total Value", value: `₹${((viewingItem.final_area * viewingItem.approved_rate) + (viewingItem.extra_area * viewingItem.extra_rate)).toLocaleString()}` },
                { label: "Task ID", value: (viewingItem as any).task_id || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-slate-700">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Measurement Record"
        message="Are you certain you wish to delete this measurement sequence? This action is irreversible."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default MeasurementPage;
