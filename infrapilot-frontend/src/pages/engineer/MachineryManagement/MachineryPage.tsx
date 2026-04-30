// import { useState, useEffect, useCallback, useMemo } from "react";
// import Navbar from "../../../components/common/Navbar";
// import PageTransition from "../../../components/common/PageTransition";
// import NewEquipmentModal from "../../../components/dashboard/NewEquipmentModal";
// import EditEquipmentModal from "../../../components/dashboard/EditEquipmentModal";
// import Modal from "../../../components/common/Modal";
// import ConfirmModal from "../../../components/common/ConfirmModal";
// import toast from "react-hot-toast";
// import { equipmentService } from "../../../services/equipmentService";
// import type { EquipmentItem, CreateEquipmentRequest, UpdateEquipmentRequest } from "../../../services/equipmentService";

// const conditionBadge: Record<string, string> = {
//   good: "bg-emerald-100 text-emerald-600",
//   fair: "bg-amber-100 text-amber-600",
//   poor: "bg-rose-100 text-rose-600",
// };

// const MachineryPage = () => {
//   // Data State
//   const [equipmentData, setEquipmentData] = useState<EquipmentItem[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [filterCondition, setFilterCondition] = useState("All Conditions");

//   // Modal State
//   const [isNewModalOpen, setIsNewModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
//   const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(null);

//   const projectId = 1; // Default project ID

//   // ─── Data Fetching ──────────────────────────────────────────────────────────
//   const fetchEquipmentList = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       const response = await equipmentService.listEquipment(projectId, 100);
//       setEquipmentData(response.items);
//     } catch (error) {
//       console.error("Fetch Equipment Error:", error);
//       toast.error("Failed to fetch equipment list");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [projectId]);

//   useEffect(() => {
//     fetchEquipmentList();
//   }, [fetchEquipmentList]);

//   // Debounced Search Effect
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedSearch(search);
//     }, 300);
//     return () => clearTimeout(handler);
//   }, [search]);

//   // ─── Handlers ───────────────────────────────────────────────────────────────
//   const handleCreateEquipment = async (data: CreateEquipmentRequest) => {
//     try {
//       console.log("Submitting equipment data:", data);
//       const response = await equipmentService.createEquipment(data);
//       console.log("Create equipment success:", response);
//       toast.success("Equipment added successfully!");
//       setIsNewModalOpen(false);
//       fetchEquipmentList();
//     } catch (error: any) {
//       console.error("Create Equipment Error Details:", error.response?.data || error.message);
//       const detail = error.response?.data?.detail;
//       let errorMessage = "Failed to add equipment";

//       if (typeof detail === 'string') {
//         errorMessage = detail;
//       } else if (Array.isArray(detail) && detail.length > 0) {
//         // Handle FastAPI/Pydantic validation error array
//         errorMessage = detail[0].msg || "Validation error";
//       } else if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }

//       toast.error(errorMessage);
//     }
//   };

//   const handleUpdateEquipment = async (id: number, data: UpdateEquipmentRequest) => {
//     try {
//       await equipmentService.updateEquipment(id, data);
//       toast.success("Equipment updated successfully!");
//       fetchEquipmentList();
//     } catch (error: any) {
//       console.error(`Update Equipment ${id} Error:`, error.response?.data || error.message);
//       const detail = error.response?.data?.detail;
//       let errorMessage = "Failed to update equipment";

//       if (typeof detail === 'string') {
//         errorMessage = detail;
//       } else if (Array.isArray(detail) && detail.length > 0) {
//         errorMessage = detail[0].msg || "Validation error";
//       } else if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       }

//       toast.error(errorMessage);
//     }
//   };

//   const handleDeleteClick = (id: number) => {
//     setEquipmentToDelete(id);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!equipmentToDelete) return;
//     try {
//       await equipmentService.deleteEquipment(equipmentToDelete);
//       toast.success("Equipment deleted successfully!");
//       fetchEquipmentList();
//       setIsDeleteModalOpen(false);
//       setEquipmentToDelete(null);
//     } catch (error) {
//       toast.error("Failed to delete equipment");
//     }
//   };

//   // ─── Filtered Data ─────────────────────────────────────────────────────────
//   const filteredData = useMemo(() => {
//     return equipmentData.filter((item) => {
//       const matchesSearch =
//         item.equipment_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
//         item.equipment_code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
//         item.operator_name.toLowerCase().includes(debouncedSearch.toLowerCase());

//       const matchesCondition =
//         filterCondition === "All Conditions" || item.condition === filterCondition;

//       return matchesSearch && matchesCondition;
//     });
//   }, [equipmentData, debouncedSearch, filterCondition]);

//   // ─── Stats ──────────────────────────────────────────────────────────────────
//   const stats = useMemo(() => {
//     const total = equipmentData.length;
//     const operational = equipmentData.filter((item) => item.condition === "good").length;
//     const maintenance = equipmentData.filter((item) => item.condition === "poor").length;
//     const totalFuel = equipmentData.reduce((acc, item) => acc + item.fuel_used, 0);

//     return { total, operational, maintenance, totalFuel };
//   }, [equipmentData]);

//   return (
//     <>
//       <Navbar title="Machinery & Equipment" breadcrumb={["Engineer", "Machinery"]} />

//       <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen">
//         {/* Header Section */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
//               Machinery & Equipment Registry
//             </h1>
//             <p className="text-slate-500 text-sm">
//               Monitor utilization, fuel consumption, and health status of site assets.
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <button
//               onClick={() => setIsNewModalOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
//             >
//               + Register Equipment
//             </button>
//           </div>
//         </div>

//         {/* Stats Grid - Matching DSR exact style */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {[
//             { title: "Total Assets", value: stats.total, sub: "Registered Units", accent: "text-slate-800" },
//             { title: "Operational", value: stats.operational, sub: "Optimal Condition", accent: "text-blue-600" },
//             { title: "Needs Repair", value: stats.maintenance, sub: "Technical Attention", accent: "text-rose-500" },
//             { title: "Fuel Consumption", value: `${stats.totalFuel} L`, sub: "Total usage recorded", accent: "text-slate-700" },
//           ].map((s) => (
//             <div key={s.title} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
//               <div className="flex justify-between items-start mb-2">
//                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.title}</p>
//               </div>
//               <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
//               <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
//             </div>
//           ))}
//         </div>

//         {/* Filter Bar - Matching DSR style */}
//         <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8">
//           <div className="flex flex-wrap gap-3 items-center">
//             <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
//               <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <circle cx="11" cy="11" r="8" strokeWidth="2" />
//                 <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
//               </svg>
//               <input
//                 type="text"
//                 placeholder="Search equipment, code, or operator..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="bg-transparent text-xs text-slate-500 outline-none w-full placeholder:text-slate-400"
//               />
//             </div>
//             <div className="flex gap-2">
//               <select
//                 value={filterCondition}
//                 onChange={(e) => setFilterCondition(e.target.value)}
//                 className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 outline-none hover:bg-slate-100 transition-all"
//               >
//                 <option value="All Conditions">All Conditions</option>
//                 <option value="good">Good</option>
//                 <option value="fair">Fair</option>
//                 <option value="poor">Needs Repair</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Machinery Grid - Matching DSR card style */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
//           {isLoading ? (
//             <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 italic text-sm">
//               <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
//               Loading equipment...
//             </div>
//           ) : filteredData.length === 0 ? (
//             <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
//               <p className="text-3xl mb-2">🚜</p>
//               <p className="font-bold text-slate-500 text-sm">No equipment logs found</p>
//             </div>
//           ) : (
//             filteredData.map((item) => (
//               <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col">
//                 <div className="flex items-center justify-between mb-4">
//                   <span className="text-[10px] font-mono font-bold text-slate-400">
//                     {item.equipment_code}
//                   </span>
//                   <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-lg ${conditionBadge[item.condition]}`}>
//                     {item.condition === "good" ? "Optimal" : item.condition === "fair" ? "Fair" : "Maintenance"}
//                   </span>
//                 </div>

//                 <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors truncate">
//                   {item.equipment_name}
//                 </h3>
//                 <p className="text-[10px] text-slate-400 font-medium mb-4">
//                   Operator: {item.operator_name}
//                 </p>

//                 <p className="text-xs text-slate-500 line-clamp-2 mb-6 h-8">
//                   Registered maintenance on {item.maintenance_date}
//                 </p>

//                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 mt-auto">
//                   <div>
//                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Usage</p>
//                     <p className="text-sm font-bold text-blue-600">{item.working_hours} h</p>
//                   </div>
//                   <div>
//                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fuel</p>
//                     <p className="text-sm font-bold text-slate-700">{item.fuel_used} L</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
//                   <div className="flex items-center gap-1">
//                     <button
//                       onClick={() => { setSelectedEquipment(item); setIsViewModalOpen(true); }}
//                       className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
//                       title="View Details"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                       </svg>
//                     </button>
//                     <button
//                       onClick={() => { setSelectedEquipment(item); setIsEditModalOpen(true); }}
//                       className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
//                       title="Edit"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                       </svg>
//                     </button>
//                   </div>
//                   <button
//                     onClick={() => handleDeleteClick(item.id)}
//                     className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
//                     title="Delete"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Modals */}
//         <NewEquipmentModal
//           isOpen={isNewModalOpen}
//           onClose={() => setIsNewModalOpen(false)}
//           onSubmit={handleCreateEquipment}
//           projectId={projectId}
//         />

//         <EditEquipmentModal
//           isOpen={isEditModalOpen}
//           onClose={() => { setIsEditModalOpen(false); setSelectedEquipment(null); }}
//           equipment={selectedEquipment}
//           onSubmit={handleUpdateEquipment}
//         />

//         {/* View Details Modal */}
//         <Modal
//           isOpen={isViewModalOpen}
//           onClose={() => { setIsViewModalOpen(false); setSelectedEquipment(null); }}
//           title="Equipment Details"
//           maxWidth="max-w-lg"
//         >
//           {selectedEquipment && (
//             <div className="p-6">
//               <div className="bg-slate-50 rounded-xl p-4 mb-6">
//                 <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedEquipment.equipment_name}</h4>
//                 <p className="text-xs text-slate-500 font-medium">{selectedEquipment.equipment_code}</p>
//               </div>
//               <div className="grid grid-cols-2 gap-6 mb-8">
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operator</p>
//                   <p className="text-sm font-bold text-slate-700">{selectedEquipment.operator_name}</p>
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
//                   <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg ${conditionBadge[selectedEquipment.condition]}`}>
//                     {selectedEquipment.condition}
//                   </span>
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Working Hours</p>
//                   <p className="text-sm font-bold text-slate-700">{selectedEquipment.working_hours} h</p>
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fuel Used</p>
//                   <p className="text-sm font-bold text-blue-600">{selectedEquipment.fuel_used} L</p>
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rental Cost</p>
//                   <p className="text-sm font-bold text-slate-700">₹{selectedEquipment.rental_cost}</p>
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maint. Date</p>
//                   <p className="text-sm font-bold text-slate-700">{selectedEquipment.maintenance_date}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setIsViewModalOpen(false)}
//                 className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
//               >
//                 Close
//               </button>
//             </div>
//           )}
//         </Modal>

//         <ConfirmModal
//           isOpen={isDeleteModalOpen}
//           onClose={() => setIsDeleteModalOpen(false)}
//           onConfirm={handleDeleteConfirm}
//           title="Delete Record"
//           message="Are you sure you want to delete this equipment entry? This action cannot be undone."
//           confirmText="Delete"
//           type="danger"
//         />
//       </PageTransition>
//     </>
//   );
// };

// export default MachineryPage;


import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import equipmentService from "../../../services/equipmentService";
import type { Equipment } from "../../../services/equipmentService";

const initialFormData = {
  equipment_name: "",
  equipment_code: "",
  operator_name: "",
  working_hours: "",
  fuel_used: "",
  condition: "GOOD" as "GOOD" | "REPAIR",
  rental_cost: "",
  maintenance_date: "",
};


// ─── Main Component ─────────────────────────────────────────────────────────────

const MachineryPage = () => {
  const [machineryList, setMachineryList] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(null);

  const projectId = 1;

  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const data = await equipmentService.getEquipment(projectId);
      const serverItems = Array.isArray(data) ? data : data.items || [];

      const localCache = localStorage.getItem('demo_equipment_list');
      const localItems = localCache ? JSON.parse(localCache) : [];

      const deletedCache = localStorage.getItem('demo_equipment_deleted_ids');
      const deletedIds = deletedCache ? JSON.parse(deletedCache) : [];

      const merged = [...localItems, ...serverItems].filter((item: any) => !deletedIds.includes(item.id));
      setMachineryList(merged);
    } catch (err) {
      toast.error("Failed to load machinery registry");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEquipment();
  }, []);


  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");

  const totalAssets = machineryList.length;
  const operationalCount = machineryList.filter(m => m.condition === "GOOD").length;
  const repairCount = machineryList.filter(m => m.condition === "REPAIR").length;
  const totalFuelUsed = machineryList.reduce((acc, m) => acc + Number(m.fuel_used || 0), 0);

  // ── CRUD Handlers ────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.equipment_name.trim()) errs.equipment_name = "Required";
    if (!formData.equipment_code.trim()) errs.equipment_code = "Required";
    if (!formData.operator_name.trim()) errs.operator_name = "Required";
    if (!String(formData.working_hours).trim()) errs.working_hours = "Required";
    if (!String(formData.fuel_used).trim()) errs.fuel_used = "Required";
    if (!String(formData.rental_cost).trim()) errs.rental_cost = "Required";
    if (!formData.maintenance_date.trim()) errs.maintenance_date = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormData(initialFormData);
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (record: Equipment) => {
    setFormMode("edit");
    setEditId(record.id);
    setFormData({
      equipment_name: record.equipment_name,
      equipment_code: record.equipment_code,
      operator_name: record.operator_name,
      working_hours: String(record.working_hours),
      fuel_used: String(record.fuel_used),
      condition: record.condition as "GOOD" | "REPAIR",
      rental_cost: String(record.rental_cost),
      maintenance_date: record.maintenance_date,
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setEquipmentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!equipmentToDelete) return;
    try {
      await equipmentService.deleteEquipment(equipmentToDelete);
      setMachineryList(prev => prev.filter(m => m.id !== equipmentToDelete));

      const deletedCache = localStorage.getItem('demo_equipment_deleted_ids');
      const deletedIds = deletedCache ? JSON.parse(deletedCache) : [];
      localStorage.setItem('demo_equipment_deleted_ids', JSON.stringify([...deletedIds, equipmentToDelete]));

      toast.success("Machinery record deleted");
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    const payload = {
      project_id: projectId,
      equipment_name: formData.equipment_name,
      equipment_code: formData.equipment_code,
      operator_name: formData.operator_name,
      working_hours: Number(formData.working_hours),
      fuel_used: Number(formData.fuel_used),
      condition: formData.condition,
      rental_cost: Number(formData.rental_cost),
      maintenance_date: formData.maintenance_date,
    };

    if (formMode === "create") {
      let apiResponse: any = {};
      try {
        apiResponse = await equipmentService.createEquipment(payload);
      } catch (error) {
        console.warn("Create equipment API unavailable, saving locally:", error);
      }
      const newRecord = { ...payload, id: apiResponse.id || Date.now() };

      setMachineryList(prev => [newRecord as Equipment, ...prev]);

      const existing = JSON.parse(localStorage.getItem('demo_equipment_list') || '[]');
      localStorage.setItem('demo_equipment_list', JSON.stringify([newRecord, ...existing]));

      toast.success("New machinery log registered!");
    } else {
      try {
        await equipmentService.updateEquipment(editId!, payload);
      } catch (error) {
        console.warn("Update equipment API unavailable, saving locally:", error);
      }
      const updatedRecord = { ...payload, id: editId! };

      setMachineryList(prev => prev.map(m => m.id === editId ? updatedRecord as Equipment : m));

      const existing = JSON.parse(localStorage.getItem('demo_equipment_list') || '[]');
      localStorage.setItem('demo_equipment_list', JSON.stringify(existing.map((m: any) => m.id === editId ? updatedRecord : m)));

      toast.success("Machinery log updated!");
    }
    setIsFormModalOpen(false);
  };

  const filteredList = useMemo(() => {
    return machineryList.filter(item => {
      const matchesSearch = item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.operator_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCondition = conditionFilter === "All" || item.condition === conditionFilter;
      return matchesSearch && matchesCondition;
    });
  }, [machineryList, searchTerm, conditionFilter]);

  return (
    <>
      <Navbar
        title="Machinery & Equipment"
        breadcrumb={["InfraPilot", "Engineer", "Machinery"]}
      />

      <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
              Asset Management
            </p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
              Heavy Machinery Registry
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Monitor fuel consumption, utilization hours, and maintenance schedules.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
          >
            <span className="text-lg leading-none font-inter">+</span>
            Register Equipment Log
          </button>
        </div>

        {/* ── Summary Stats (Activity Style) ───────────────────────── */}
        <div className="mb-8 font-inter">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
            Asset Telemetry Snapshots
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-inter">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Active Assets</p>
              <p className="text-2xl font-bold text-blue-600 font-inter">{totalAssets}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Registered Equipment</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Operational</p>
              <p className="text-2xl font-bold text-emerald-500 font-inter">{operationalCount}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Optimum Condition</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Under Repair</p>
              <p className="text-2xl font-bold text-rose-500 font-inter">{repairCount}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Technical Attention Needed</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Fuel Used</p>
              <p className="text-2xl font-bold text-slate-800 font-inter">{totalFuelUsed} <span className="text-[10px] opacity-40">LTR</span></p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Project Consumption</p>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-3 sm:px-5 py-3 sm:py-4 mb-8 flex flex-wrap items-center gap-3 sm:gap-4 font-inter">

          {/* Icon + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-800 whitespace-nowrap">Ledger Filters</span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

          {/* Search */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0 sm:min-w-[200px] sm:flex-none">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search Equipment</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Condition Dropdown */}
          <div className="flex flex-col gap-0.5 w-[calc(50%-6px)] sm:w-auto sm:min-w-[150px]">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Condition</label>
            <div className="relative">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
              >
                <option value="All">All Conditions</option>
                <option value="Good">Good</option>
                <option value="Repair">Under Repair</option>
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* ── Machinery Grid ────────────────────────────────────────── */}
        <div className="mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 font-inter">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
              >
                {/* Header: ID & Status */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.equipment_code}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.condition === "GOOD"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                    }`}>
                    {item.condition === "GOOD" ? "Optimal" : "Maintenance"}
                  </span>
                </div>

                {/* Equipment Name */}
                <p className="text-lg sm:text-xl font-bold text-slate-900 font-inter leading-tight mb-0.5 mt-2">{item.equipment_name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed mb-4">Operator: {item.operator_name}</p>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-3 mt-auto mb-4">
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Utilization</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-slate-800 font-inter">{item.working_hours} h</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium italic-none">Operational hours</p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-50">
                    <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Fuel Log</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-blue-600 font-inter">{item.fuel_used} L</span>
                    </div>
                    <p className="text-[9px] text-blue-600/50 mt-1 font-medium">Consumption recorded</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedEquipment(item)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Detail"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Log"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Record"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredList.length === 0 && (
            <div className="bg-white rounded-xl p-10 sm:p-20 text-center border border-slate-100 shadow-sm font-inter">
              <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No machinery logs match filters</p>
            </div>
          )}
        </div>
      </PageTransition>

      {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
      <Modal
        isOpen={!!selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
        title="Machinery Insight"
        maxWidth="max-w-xl"
      >
        {selectedEquipment && (
          <div className="bg-white p-4 sm:p-6 italic-none font-inter">
            {/* ── Blue Hero Card ────────────────────────────────── */}
            <div className="bg-blue-600 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 text-white shadow-xl shadow-blue-100 mb-6 sm:mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

              <div className="relative z-10 font-inter">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Asset Telemetry Record</p>
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-3xl font-black tracking-tight">{selectedEquipment.equipment_name}</h3>
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Equipment ID</p>
                    <p className="text-xl font-black">{selectedEquipment.equipment_code}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Record Created</p>
                    <p className="text-xl font-black">{selectedEquipment.created_at ? new Date(selectedEquipment.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Operational Diagnostics ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-6 sm:gap-x-12 px-1 mb-10 font-inter">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Operator in Charge</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">{selectedEquipment.operator_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Engine Hours</p>
                <p className="text-sm font-black text-slate-800 tabular-nums">{selectedEquipment.working_hours} H</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fuel Consumption</p>
                <p className="text-sm font-black text-blue-600 tabular-nums">{selectedEquipment.fuel_used} Liters</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Daily Rental Value</p>
                <p className="text-sm font-black text-slate-800 tabular-nums">₹{selectedEquipment.rental_cost?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Next Maintenance</p>
                <p className="text-sm font-black text-slate-800 tabular-nums">{selectedEquipment.maintenance_date}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Health Condition</p>
                <span className={`inline-block px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase ${selectedEquipment.condition === "GOOD" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  {selectedEquipment.condition === "GOOD" ? "OPTIMAL" : "NEEDS REPAIR"}
                </span>
              </div>
            </div>

            {/* ── Action Footer ─────────────────────────────────── */}
            <div className="flex items-center gap-4 pt-6 border-t border-slate-50 font-inter">
              <button
                onClick={() => setSelectedEquipment(null)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-400 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
              >
                Close Insight
              </button>
              <button
                onClick={() => {
                  handleOpenEdit(selectedEquipment);
                  setSelectedEquipment(null);
                }}
                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95 font-inter"
              >
                Update Log
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── FORM MODAL (Asset Entry Style) ─────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
        title={formMode === "create" ? "Register Equipment Log" : "Update Equipment Log"}
        maxWidth="max-w-4xl"
      >
        <div className="bg-white p-6 md:p-8 italic-none font-inter">
          <form id="machinery-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Section 1: Identity & Operator */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-6 bg-blue-600 rounded-full" />
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase font-inter">Identity & Operator</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-inter">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Equipment Name <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="equipment_name"
                    value={formData.equipment_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Excavator (JCB 3DX)"
                    className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-inter ${errors.equipment_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                  />
                </div>
                <div className="flex flex-col gap-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Equipment ID <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="equipment_code"
                    value={formData.equipment_code}
                    onChange={handleInputChange}
                    placeholder="JCB-XXXX"
                    className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-inter ${errors.equipment_code ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Operator Name <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="operator_name"
                    value={formData.operator_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-inter ${errors.operator_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Technicals & Commercials */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase font-inter">Technicals & Commercials</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-inter">
                <div className="flex flex-col gap-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Engine Hours <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="working_hours"
                    type="number"
                    value={formData.working_hours}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none font-inter"
                  />
                </div>
                <div className="flex flex-col gap-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Fuel Used (Ltr) <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="fuel_used"
                    type="number"
                    value={formData.fuel_used}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-600 focus:outline-none font-inter"
                  />
                </div>
                <div className="flex flex-col gap-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest uppercase focus:outline-none appearance-none cursor-pointer font-inter"
                  >
                    <option value="GOOD" className="font-inter">OPTIMAL CONDITION</option>
                    <option value="REPAIR" className="font-inter">NEEDS REPAIR</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Rental Cost <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="rental_cost"
                    type="number"
                    value={formData.rental_cost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none font-inter"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2 font-inter">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Maintenance Date <span className="text-rose-500 font-inter">*</span></label>
                  <input
                    name="maintenance_date"
                    type="date"
                    value={formData.maintenance_date}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none font-inter"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between font-inter">
          <button type="button" onClick={() => setIsFormModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest outline-none font-inter">Discard</button>
          <button type="submit" form="machinery-form" className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 font-inter">
            {formMode === "create" ? "Save Asset Entry" : "Commit Updates"}
          </button>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEquipmentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Machinery Record"
        message="Are you sure you want to delete this equipment log? This will permanently remove the usage and fuel data for this entry."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default MachineryPage;

