import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { workOrderService, type WorkOrder } from "../../../services/workOrderService";
import { projectService } from "../../../services/projectService";
import { useProject } from "../../../context/ProjectContext";

const WorkOrdersPage = () => {
  const { user } = useAuth();
  const { selectedProjectId: projectId } = useProject();
  
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contractors] = useState<any[]>([
    { id: 1, name: "Alpha Builders" },
    { id: 2, name: "Omega Constructors" }
  ]); // Mock contractors for now if contractorService is not readily available
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState<WorkOrder | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const paginatedWorkOrders = workOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({
    project_id: projectId || 0,
    contractor_id: 0,
    work_description: "",
    total_quantity: 0,
    completed_quantity: 0,
    rate: 0,
    status: "Pending"
  });


  const fetchProjects = async () => {
    try {
      const assigned = await projectService.getAssignedProjects(Number(user?.id) || 1);
      setProjects(assigned);
      if (assigned.length > 0 && !formData.project_id) {
        setFormData(prev => ({ ...prev, project_id: assigned[0].id }));
      }
    } catch (err) {
      console.error("Error fetching projects", err);
    }
  };

  const loadWorkOrders = async () => {
    try {
      const data = await workOrderService.getWorkOrders({ project_id: projectId || undefined });
      setWorkOrders(data);
    } catch (error) {
      toast.error("Failed to load work orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    loadWorkOrders();
  }, [projectId]);

  const handleView = async (id: number) => {
    const toastId = toast.loading("Loading details...");
    try {
      const freshOrder = await workOrderService.getWorkOrder(id);
      setSelectedViewOrder(freshOrder);
      setIsViewModalOpen(true);
      toast.dismiss(toastId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load work order details", { id: toastId });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["project_id", "contractor_id", "total_quantity", "completed_quantity", "rate"].includes(name) ? Number(value) : value
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workOrderService.createWorkOrder(formData);
      toast.success("Work order created successfully");
      setIsCreateModalOpen(false);
      loadWorkOrders();
    } catch (error) {
      toast.error("Failed to create work order");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await workOrderService.updateWorkOrder(selectedOrder.id, {
        contractor_id: formData.contractor_id,
        work_description: formData.work_description,
        total_quantity: formData.total_quantity,
        completed_quantity: formData.completed_quantity,
        rate: formData.rate,
        status: formData.status
      });
      toast.success("Work order updated successfully");
      setIsEditModalOpen(false);
      loadWorkOrders();
    } catch (error) {
      toast.error("Failed to update work order");
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await workOrderService.deleteWorkOrder(selectedOrder.id);
      toast.success("Work order deleted");
      setIsDeleteModalOpen(false);
      loadWorkOrders();
    } catch (error) {
      toast.error("Failed to delete work order");
    }
  };

  const openEdit = (order: WorkOrder) => {
    setSelectedOrder(order);
    setFormData({
      project_id: order.project_id,
      contractor_id: order.contractor_id,
      work_description: order.work_description,
      total_quantity: order.total_quantity,
      completed_quantity: order.completed_quantity || 0,
      rate: order.rate,
      status: order.status || "Pending"
    });
    setIsEditModalOpen(true);
  };

  const openDelete = (order: WorkOrder) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Navbar title="Work Orders" />
      <PageTransition>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-outfit">Work Orders</h1>
              <p className="text-sm text-slate-500 font-inter mt-1">
                Manage and track contractor work assignments.
              </p>
            </div>
            <button
              onClick={() => {
                setFormData({
                  project_id: projectId || (projects.length > 0 ? projects[0].id : 0),
                  contractor_id: contractors.length > 0 ? contractors[0].id : 0,
                  work_description: "",
                  total_quantity: 0,
                  completed_quantity: 0,
                  rate: 0,
                  status: "Pending"
                });
                setIsCreateModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium font-inter transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              Create Work Order
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Work Order No.</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Contractor</th>
                    <th className="px-6 py-4">Work Description</th>
                    <th className="px-6 py-4">Total Quantity</th>
                    <th className="px-6 py-4">Completed Qty</th>
                    <th className="px-6 py-4">Rate</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400 text-sm">Loading work orders...</td>
                    </tr>
                  ) : workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400 text-sm">No work orders found. Create one to get started.</td>
                    </tr>
                  ) : (
                    paginatedWorkOrders.map((order) => {
                      const projectName = projects.find(p => p.id === order.project_id)?.name || `Project #${order.project_id}`;
                      const contractorName = contractors.find(c => c.id === order.contractor_id)?.name || `Contractor #${order.contractor_id}`;
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.work_order_number || `WO-${order.id.toString().padStart(4, '0')}`}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">{projectName}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">{contractorName}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">{order.work_description}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.total_quantity}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.completed_quantity || 0}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.rate}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.total_amount || (order.total_quantity * order.rate)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleView(order.id)} className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEdit(order)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => openDelete(order)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
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

            {/* ── Pagination Controls ── */}
            {!isLoading && workOrders.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                {/* Left: Items per page */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-blue-500 bg-white shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Center: Showing info */}
                <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, workOrders.length)} of {workOrders.length} records
                </div>

                {/* Right: Pagination */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {(() => {
                    const totalItems = workOrders.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
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
                        return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                      }
                      const pageNum = page as number;
                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 border border-blue-600'
                            : 'bg-white text-slate-500 border border-slate-200 hover:text-blue-600 shadow-sm'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(workOrders.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.max(1, Math.ceil(workOrders.length / itemsPerPage)) || workOrders.length === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col font-inter">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-outfit">Create Work Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project</label>
                <select name="project_id" value={formData.project_id} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contractor</label>
                <select name="contractor_id" value={formData.contractor_id} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Description</label>
                <textarea name="work_description" required value={formData.work_description} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" rows={3} placeholder="Describe the scope of work..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Qty</label>
                  <input type="number" name="total_quantity" required value={formData.total_quantity} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rate (₹)</label>
                  <input type="number" name="rate" required value={formData.rate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200">Create Work Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col font-inter">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-outfit">Update Work Order</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">contractor</label>
                <select name="contractor_id" value={formData.contractor_id} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">work_description</label>
                <textarea name="work_description" required value={formData.work_description} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">total_quantity</label>
                  <input type="number" name="total_quantity" required value={formData.total_quantity} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">completed_quantity</label>
                  <input type="number" name="completed_quantity" required value={formData.completed_quantity} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">rate</label>
                  <input type="number" name="rate" required value={formData.rate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Work Order"
        message="Are you sure you want to delete this work order? This action cannot be undone."
        confirmText="Delete Work Order"
        cancelText="Cancel"
        type="danger"
      />

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedViewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col font-inter">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-outfit">Work Order Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">WORK ORDER NUMBER</p>
                  <p className="font-medium text-slate-900">{selectedViewOrder.work_order_number || `WO-${selectedViewOrder.id.toString().padStart(4, '0')}`}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">PROJECT</p>
                  <p className="font-medium text-slate-900">{projects.find(p => p.id === selectedViewOrder.project_id)?.name || `Project #${selectedViewOrder.project_id}`}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">CONTRACTOR</p>
                  <p className="font-medium text-slate-900">{contractors.find(c => c.id === selectedViewOrder.contractor_id)?.name || `Contractor #${selectedViewOrder.contractor_id}`}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">WORK DESCRIPTION</p>
                  <p className="font-medium text-slate-900 whitespace-pre-wrap">{selectedViewOrder.work_description}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">TOTAL QUANTITY</p>
                  <p className="font-medium text-slate-900">{selectedViewOrder.total_quantity}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">COMPLETED QUANTITY</p>
                  <p className="font-medium text-slate-900">{selectedViewOrder.completed_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">RATE</p>
                  <p className="font-medium text-slate-900">{selectedViewOrder.rate}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">TOTAL AMOUNT</p>
                  <p className="font-medium text-slate-900">{selectedViewOrder.total_amount || (selectedViewOrder.total_quantity * selectedViewOrder.rate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">STATUS</p>
                  <p className="font-medium text-slate-900">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedViewOrder.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      selectedViewOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedViewOrder.status || 'Pending'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">QUOTATION ID</p>
                  <p className="font-medium text-slate-900">{selectedViewOrder.quotation_id || 'null'}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersPage;
