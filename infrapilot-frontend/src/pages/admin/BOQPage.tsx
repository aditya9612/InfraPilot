import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
<<<<<<< HEAD
import BOQDetailsModal from "../../components/dashboard/BOQDetailsModal";
=======
import toast from "react-hot-toast";
import BOQDetailsModal from "../../components/dashboard/BOQDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
>>>>>>> testing

// Mock Project Mapper
const projectMap: Record<number, string> = {
  1: "Skyline Tower A",
  2: "Metro Ph-II",
  3: "Grand Vista Residency",
  4: "Oceanic Bridge Project"
};

// Expanded Dummy Data following API spec
const INITIAL_BOQ_DATA = [
  {
    id: 1,
    project_id: 1,
    boq_group_id: 101,
    version_no: 1,
    is_latest: true,
    item_name: "Cement",
    category: "Construction",
    description: "Portland cement used for building foundation",
    quantity: "200.000",
    unit: "Bags",
    unit_cost: "350.00",
    total_cost: "70000.00",
    actual_quantity: "0.000",
    actual_cost: "0.00",
    variance_cost: "70000.00",
    is_completed: false,
    status: "Active"
  },
  {
    id: 2,
    project_id: 1,
    boq_group_id: 102,
    version_no: 1,
    is_latest: true,
    item_name: "Excavation",
    category: "Civil",
    description: "Soil excavation for site preparation",
    quantity: "450.000",
    unit: "Cum",
    unit_cost: "250.00",
    total_cost: "112500.00",
    actual_quantity: "120.000",
    actual_cost: "30000.00",
    variance_cost: "82500.00",
    is_completed: false,
    status: "Active"
  },
  {
    id: 3,
    project_id: 2,
    boq_group_id: 103,
    version_no: 1,
    is_latest: true,
    item_name: "Reinforcement Steel",
    category: "Structure",
    description: "TMT bars for column reinforcement",
    quantity: "12.500",
    unit: "MT",
    unit_cost: "65000.00",
    total_cost: "812500.00",
    actual_quantity: "12.500",
    actual_cost: "812500.00",
    variance_cost: "0.00",
    is_completed: true,
    status: "Completed"
  },
  {
    id: 4,
    project_id: 3,
    boq_group_id: 104,
    version_no: 1,
    is_latest: true,
    item_name: "Copper Wiring",
    category: "Electrical",
    description: "Internal electrical wiring for 3BHK units",
    quantity: "1500.000",
    unit: "Ft",
    unit_cost: "45.00",
    total_cost: "67500.00",
    actual_quantity: "0.000",
    actual_cost: "0.00",
    variance_cost: "67500.00",
    is_completed: false,
    status: "Draft"
  },
  {
    id: 5,
    project_id: 4,
    boq_group_id: 105,
    version_no: 1,
    is_latest: true,
    item_name: "Granite Flooring",
    category: "Finishing",
    description: "Slab granite for lobby flooring",
    quantity: "800.000",
    unit: "Sqm",
    unit_cost: "1250.00",
    total_cost: "1000000.00",
    actual_quantity: "0.000",
    actual_cost: "0.00",
    variance_cost: "1000000.00",
    is_completed: false,
    status: "Under Review"
  }
];

const INITIAL_ACTIVITIES_DATA = [
  { id: 1, name: "Site Clearing", type: "Pre-construction", project: "Skyline Tower A", status: "Completed" },
  { id: 2, name: "Foundation Pouring", type: "Civil", project: "Skyline Tower A", status: "In Progress" },
  { id: 3, name: "Column Casting", type: "Structure", project: "Metro Ph-II", status: "Pending" },
];

const BOQPage = () => {
  const location = useLocation();
  const isSetup = location.pathname.includes("/setup") || location.pathname === "/admin/boq";
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  
  const [boqData, setBoqData] = useState(INITIAL_BOQ_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
<<<<<<< HEAD
=======
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
>>>>>>> testing

  const handleCreateOrUpdateBOQ = (data: any) => {
    if (editingItem) {
      setBoqData(prev => prev.map(item => item.id === editingItem.id ? { 
        ...item, 
        ...data,
        total_cost: (parseFloat(data.quantity) * parseFloat(data.unit_cost)).toString(),
        variance_cost: (parseFloat(data.quantity) * parseFloat(data.unit_cost) - parseFloat(item.actual_cost)).toString()
      } : item));
    } else {
      const newItem = {
        id: boqData.length + 1,
        project_id: data.project_id,
        boq_group_id: 100 + boqData.length + 1,
        version_no: 1,
        is_latest: true,
        item_name: data.item_name,
        category: data.category,
        description: data.description,
        quantity: data.quantity.toString(),
        unit: data.unit,
        unit_cost: data.unit_cost.toString(),
        total_cost: (data.quantity * data.unit_cost).toString(),
        actual_quantity: "0.000",
        actual_cost: "0.00",
        variance_cost: (data.quantity * data.unit_cost).toString(),
        is_completed: false,
        status: data.status
      };
      setBoqData([newItem, ...boqData]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleViewDetails = (item: any) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

<<<<<<< HEAD
  const handleDeleteBOQ = (id: number) => {
    if (window.confirm("Are you sure you want to delete this BOQ item?")) {
      setBoqData(prev => prev.filter(item => item.id !== id));
=======
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      setBoqData(prev => prev.filter(item => item.id !== itemToDelete));
      toast.success("BOQ item deleted successfully!");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
>>>>>>> testing
    }
  };

  // Memoized Filtered Logic
  const filteredBoqData = useMemo(() => {
    return boqData.filter(item => {
      const matchSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchProject = projectFilter === "all" || item.project_id.toString() === projectFilter;

      return matchSearch && matchStatus && matchCategory && matchProject;
    });
  }, [boqData, searchTerm, statusFilter, categoryFilter, projectFilter]);

  return (
    <>
      <Navbar title="Work & BOQ Management" breadcrumb={["Admin", "Work & BOQ", isSetup ? "BOQ Setup" : "Activity List"]} />
      
<<<<<<< HEAD
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
=======
      <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen">
>>>>>>> testing
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{isSetup ? "BOQ Master Setup" : "Project Activity List"}</h1>
            <p className="text-slate-500 text-sm">
              {isSetup ? "Define Bill of Quantities and cost estimates for projects." : "Track site activities and progress against BOQ items."}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Import Excel</button>
            <button 
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              {isSetup ? "+ Add BOQ Item" : "+ New Activity"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total BOQ Value" value={`₹${(filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost), 0) / 10000000).toFixed(2)}Cr`} sub="Across current filtered items" accent="text-primary" />
          <StatCard title="Total Items" value={filteredBoqData.length.toString()} sub="Categorized by type" accent="text-violet-500" />
          <StatCard title="Pending Items" value={filteredBoqData.filter(i => i.status === "Draft").length.toString()} sub="Awaiting rate approval" accent="text-amber-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-slate-800">
          {/* Enhanced Filter Bar */}
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={isSetup ? "Search items or descriptions..." : "Search activities..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="under review">Under Review</option>
              </select>

              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="all">All Categories</option>
                <option value="construction">Construction</option>
                <option value="civil">Civil</option>
                <option value="structure">Structure</option>
                <option value="electrical">Electrical</option>
                <option value="finishing">Finishing</option>
              </select>

              <select 
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="all">All Projects</option>
                {Object.entries(projectMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSetup ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => window.history.pushState(null, "", "/admin/boq/setup")}
                >
                  BOQ Setup
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!isSetup ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => window.history.pushState(null, "", "/admin/boq/activities")}
                >
                  Activities
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isSetup ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Qty & Unit</th>
                    <th className="px-6 py-4">Unit Cost</th>
                    <th className="px-6 py-4">Est. Total</th>
                    <th className="px-6 py-4">Variance</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBoqData.length > 0 ? filteredBoqData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-slate-800">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-700 group-hover:text-primary transition-colors line-clamp-1">{item.item_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{projectMap[item.project_id] || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {parseFloat(item.quantity).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">₹{parseFloat(item.unit_cost).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">₹{parseFloat(item.total_cost).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-500">
                        ₹{parseFloat(item.variance_cost).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          item.status === "Active" ? "bg-emerald-100 text-emerald-600" : 
                          item.status === "Completed" ? "bg-blue-100 text-blue-600" : 
                          item.status === "Draft" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-600"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewDetails(item)}
                            title="View Details"
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleEditClick(item)}
                            title="Update BOQ"
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
<<<<<<< HEAD
                            onClick={() => handleDeleteBOQ(item.id)}
=======
                            onClick={() => handleDeleteClick(item.id)}
>>>>>>> testing
                            title="Delete BOQ"
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No items found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Activity Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Linked Project</th>
                    <th className="px-6 py-4">Progress Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {INITIAL_ACTIVITIES_DATA.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group text-slate-800">
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-primary transition-colors">{act.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{act.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{act.project}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          act.status === "Completed" ? "bg-emerald-100 text-emerald-600" : act.status === "In Progress" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageTransition>

      <CreateBOQModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdateBOQ}
        initialData={editingItem}
      />

      <BOQDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingItem(null);
        }}
        boqItem={viewingItem}
        projectName={viewingItem ? projectMap[viewingItem.project_id] : ""}
      />
<<<<<<< HEAD
=======

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete BOQ Item"
        message="Are you sure you want to delete this BOQ item? This will remove the cost estimation for this specific item."
        confirmText="Delete"
        type="danger"
      />
>>>>>>> testing
    </>
  );
};

export default BOQPage;
