import { useState, useEffect, useCallback, useMemo } from "react";
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
  Edit3
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
        setProjectTasks(tasks || []);
        setProjectBoqItems(boqs || []);
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
    if (!formData.project_id || !formData.final_area || !formData.approved_rate) {
      toast.error("Incomplete coordinate set detected");
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
        toast.success("Measurement record recalibrated", { id: "save" });
      } else {
        await measurementService.createMeasurement(data);
        toast.success("New measurement synchronized", { id: "save" });
      }

      setIsModalOpen(false);
      setEditingItem(null);
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
      fetchData();
    } catch (error) {
      toast.error("Transmission failed: Check node connectivity", { id: "save" });
    }
  };

  const handleEdit = (m: Measurement) => {
    setEditingItem(m);
    setFormData({
      project_id: m.project_id.toString(),
      task_id: (m as any).task_id?.toString() || "",
      boq_item_id: (m as any).boq_item_id?.toString() || "",
      final_area: m.final_area.toString(),
      approved_rate: m.approved_rate.toString(),
      extra_area: m.extra_area.toString(),
      extra_rate: m.extra_rate.toString(),
      measured_qty: (m as any).measured_qty?.toString() || "",
      certified_qty: (m as any).certified_qty?.toString() || "",
      rejected_qty: (m as any).rejected_qty?.toString() || "",
      retention_amount: (m as any).retention_amount?.toString() || "",
      status: (m as any).status || "DRAFT"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetId) return;
    try {
      await measurementService.deleteMeasurement(targetId);
      toast.success("Record purged from mainframes");
      setIsDeleteOpen(false);
      setTargetId(null);
      fetchData();
    } catch (error) {
      toast.error("Purge aborted: Safety protocols active");
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
              setEditingItem(null);
              setFormData({ ...formData, project_id: selectedProject });
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
                  <th className="px-8 py-6">ID</th>
                  <th className="px-8 py-6">Final Area (sq.ft)</th>
                  <th className="px-8 py-6">Approved Rate</th>
                  <th className="px-8 py-6">Extra (Area/Rate)</th>
                  <th className="px-8 py-6">Total Value</th>
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
                        <td className="px-8 py-6 font-black text-slate-400 text-xs">#{m.id}</td>
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
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
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
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        title={editingItem ? "Recalibrate Record" : "New Field Measurement"}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              form="measurement-form"
              type="submit"
              className="px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              {editingItem ? "Recalibrate Matrix" : "Authorize Entry"}
            </button>
          </>
        }
      >
        <form id="measurement-form" onSubmit={handleCreateOrUpdate} noValidate>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="font-semibold text-gray-700">Target Project Node</h3>
            </div>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl transition-all outline-none appearance-none"
            >
              <option value="">Select Project Node</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                <h3 className="font-semibold text-gray-700">Reference Nodes</h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Target Task</label>
                  <select
                    value={formData.task_id}
                    onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl transition-all outline-none font-semibold appearance-none"
                  >
                    <option value="0">Select Task</option>
                    {projectTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">BOQ Item</label>
                  <select
                    value={formData.boq_item_id}
                    onChange={(e) => setFormData({ ...formData, boq_item_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl transition-all outline-none font-semibold appearance-none"
                  >
                    <option value="0">Select BOQ Item</option>
                    {projectBoqItems.map(b => (
                      <option key={b.id} value={b.id}>{b.item_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                <h3 className="font-semibold text-gray-700">Status & Retention</h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Retention Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retention_amount}
                    onChange={(e) => setFormData({ ...formData, retention_amount: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 rounded-xl transition-all outline-none font-semibold"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Current Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 rounded-xl transition-all outline-none font-semibold"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="CERTIFIED">CERTIFIED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                <h3 className="font-semibold text-gray-700">Standard Certs</h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Final Area</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.final_area}
                      onChange={(e) => setFormData({ ...formData, final_area: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 rounded-xl transition-all outline-none font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Apprv. Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.approved_rate}
                      onChange={(e) => setFormData({ ...formData, approved_rate: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 rounded-xl transition-all outline-none font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                <h3 className="font-semibold text-gray-700">Extra Deviations</h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Extra Area</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.extra_area}
                      onChange={(e) => setFormData({ ...formData, extra_area: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 rounded-xl transition-all outline-none font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Extra Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.extra_rate}
                      onChange={(e) => setFormData({ ...formData, extra_rate: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 rounded-xl transition-all outline-none font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-purple-500 rounded-full" />
              <h3 className="font-semibold text-gray-700">Quantity Analysis</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Measured Qty</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.measured_qty}
                  onChange={(e) => setFormData({ ...formData, measured_qty: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 rounded-xl transition-all outline-none font-semibold"
                  placeholder="0.00"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Certified Qty</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.certified_qty}
                  onChange={(e) => setFormData({ ...formData, certified_qty: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 rounded-xl transition-all outline-none font-semibold"
                  placeholder="0.00"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Rejected Qty</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rejected_qty}
                  onChange={(e) => setFormData({ ...formData, rejected_qty: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 rounded-xl transition-all outline-none font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Authorize Record Purge"
        message="Are you certain you wish to terminate this measurement sequence? This action is irreversible."
        confirmText="Purge Record"
        type="danger"
      />
    </>
  );
};

export default MeasurementPage;
