import { useState, useMemo, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";
import { Search, RotateCcw, ChevronLeft, ChevronRight, ClipboardList, Eye } from "lucide-react";
import Modal from "../../../components/common/Modal";
import { workOrderService } from "../../../services/workOrderService";
import type { WorkOrder } from "../../../services/workOrderService";
import { useProject } from "../../../context/ProjectContext";

const statusBadge: Record<string, string> = {
  "PENDING": "bg-amber-100 text-amber-600",
  "IN_PROGRESS": "bg-blue-100 text-blue-600",
  "COMPLETED": "bg-emerald-100 text-emerald-600",
  "CANCELLED": "bg-rose-100 text-rose-600",
};

const WorkOrdersPage = () => {
  const { selectedProjectId, assignedProjects } = useProject();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    try {
      // Pass project_id to fetch relevant work orders
      const data = await workOrderService.getWorkOrders({ project_id: selectedProjectId || undefined });
      setWorkOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
      toast.error("Could not load work orders.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClick = async (id: number) => {
    setIsFetchingDetails(true);
    try {
      const data = await workOrderService.getWorkOrder(id);
      setSelectedWorkOrder(data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch work order details.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [selectedProjectId]);

  const filteredOrders = useMemo(() => {
    let list = workOrders;

    if (statusFilter !== "ALL") {
      list = list.filter((w) => w.status?.toUpperCase() === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.work_order_number?.toLowerCase().includes(q) ||
          w.work_description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [workOrders, searchQuery, statusFilter]);

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg text-[11px] font-medium px-2 py-1 outline-none bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white border border-blue-600 shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalItems === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar title="Work Orders" breadcrumb={["InfraPilot", "Engineer", "Work Progress", "Work Orders"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-primary" />
                Work Orders
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                View and track all work orders for the selected project.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchWorkOrders}
                className="p-2.5 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
                title="Refresh Work Orders"
              >
                <RotateCcw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by WO# or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary transition-all font-medium text-slate-600"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-white text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Work Order No.</th>
                    <th className="px-6 py-4 whitespace-nowrap">Project</th>
                    <th className="px-6 py-4 whitespace-nowrap">Work Description</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Total Quantity</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Completed Qty</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Rate</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Total Amount</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-3"></div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Loading Work Orders...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ClipboardList className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">No Work Orders Found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting your search or filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((wo) => {
                      const statusVal = wo.status?.toUpperCase() || "PENDING";
                      const badgeClass = statusBadge[statusVal] || "bg-slate-100 text-slate-600";

                      const projectName = assignedProjects.find(p => p.id === wo.project_id)?.project_name || "Rohan Harita";
                      return (
                        <tr key={wo.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-800">
                              {wo.work_order_number || `WO-${wo.id}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-600">
                              {projectName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-600 max-w-[200px] truncate" title={wo.work_description}>
                              {wo.work_description || "—"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-slate-600">
                              {wo.total_quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-slate-600">
                              {wo.completed_quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-slate-600">
                              {wo.rate || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-slate-600">
                              {wo.total_amount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${badgeClass}`}>
                              {wo.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleViewClick(wo.id)}
                              disabled={isFetchingDetails}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && paginatedOrders.length > 0 && renderPagination()}
          </div>
        </div>
      </PageTransition>

      {/* View Work Order Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Work Order Details"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end w-full">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedWorkOrder && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Work Order Number</p>
              <p className="text-sm font-medium text-slate-800">{selectedWorkOrder.work_order_number || `WO-${selectedWorkOrder.id}`}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project</p>
              <p className="text-sm font-medium text-slate-800">
                {assignedProjects.find(p => p.id === selectedWorkOrder.project_id)?.project_name || "Rohan Harita"}
              </p>
            </div>
            


            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Work Description</p>
              <p className="text-sm font-medium text-slate-800">{selectedWorkOrder.work_description || "—"}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Quantity</p>
              <p className="text-sm font-medium text-slate-800">{selectedWorkOrder.total_quantity || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed Quantity</p>
              <p className="text-sm font-medium text-slate-800">{selectedWorkOrder.completed_quantity || 0}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</p>
              <p className="text-sm font-medium text-slate-800">{selectedWorkOrder.rate || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-sm font-medium text-slate-800">{selectedWorkOrder.total_amount || 0}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md inline-block ${statusBadge[selectedWorkOrder.status?.toUpperCase() || "PENDING"] || "bg-slate-100 text-slate-600"}`}>
                {selectedWorkOrder.status?.replace(/_/g, " ") || "PENDING"}
              </span>
            </div>
            <div></div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default WorkOrdersPage;
