import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateContractorModal from "../../components/forms/CreateContractorModal";
<<<<<<< HEAD
import ContractorDetailsModal from "../../components/dashboard/ContractorDetailsModal";
=======
import toast from "react-hot-toast";
import ContractorDetailsModal from "../../components/dashboard/ContractorDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { PROJECTS } from "../../config/projectSeed";
import { exportToCSV } from "../../utils/csvExport";
>>>>>>> testing

const INITIAL_CONTRACTORS = [
  {
    id: 1,
    name: "Rajesh Varma",
    company: "Varma Constructions Pvt. Ltd.",
    email: "rajesh.v@varmaconst.com",
    mobile: "+91 91234 56789",
    gst: "27AAACV1234A1Z1",
    bank: "HDFC Bank - **** 8821",
<<<<<<< HEAD
    projects: "Skyline Tower A, Metro Ph-II",
    rating: 4.8,
    status: "Active",
=======
    projects: "Electrical & HVAC",
    project_id: 1,
    rating: 4.8,
    status: "Active",
    total_work_assigned: 2500000,
    payment_given: 1200000,
    bills: [
      { id: 1, contractor_id: 1, memo: "Phase 1 Electrical Wiring", amount: 800000, date: "2026-04-05", status: "approved" },
      { id: 2, contractor_id: 1, memo: "HVAC Unit Installation", amount: 1200000, date: "2026-04-10", status: "approved" },
      { id: 3, contractor_id: 1, memo: "Maintenance Kit", amount: 50000, date: "2026-04-12", status: "pending" }
    ],
    payments: [
      { id: 1, contractor_id: 1, amount: 500000, date: "2026-04-06", method: "Bank Transfer", reference: "TXN100293" },
      { id: 2, contractor_id: 1, amount: 700000, date: "2026-04-11", method: "Cheque", reference: "CHQ99201" }
    ]
>>>>>>> testing
  },
  {
    id: 2,
    name: "Suresh Gupta",
    company: "Gupta Engineering Works",
    email: "suresh@guptaworks.in",
    mobile: "+91 99887 76655",
    gst: "27BBBCG5678B1Z2",
    bank: "SBI - **** 4432",
<<<<<<< HEAD
    projects: "Grand Vista Residency",
    rating: 4.2,
    status: "Active",
=======
    projects: "Structural Steel Work",
    project_id: 2,
    rating: 4.2,
    status: "Active",
    total_work_assigned: 4500000,
    payment_given: 3000000,
    bills: [
      { id: 4, contractor_id: 2, memo: "Foundation Steel Reinforcement", amount: 3000000, date: "2026-03-20", status: "approved" }
    ],
    payments: [
      { id: 3, contractor_id: 2, amount: 3000000, date: "2026-03-25", method: "NEFT", reference: "NEF98201" }
    ]
>>>>>>> testing
  },
  {
    id: 3,
    name: "Meera Deshmukh",
    company: "Infratech Solutions",
    email: "meera.d@infratech.co.in",
    mobile: "+91 98221 12233",
    gst: "27CCCDS9012C1Z3",
    bank: "ICICI Bank - **** 1190",
<<<<<<< HEAD
    projects: "Bridge Overpass Site",
    rating: 3.9,
    status: "Delayed",
=======
    projects: "Plumbing & Sanitary",
    project_id: 1,
    rating: 3.9,
    status: "Delayed",
    total_work_assigned: 1500000,
    payment_given: 500000,
    bills: [
      { id: 5, contractor_id: 3, memo: "Piping Network Ph-1", amount: 700000, date: "2026-04-01", status: "approved" }
    ],
    payments: [
      { id: 4, contractor_id: 3, amount: 500000, date: "2026-04-05", method: "UPI", reference: "UPI55291" }
    ]
>>>>>>> testing
  },
];

const ContractorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<< HEAD
  const [contractors, setContractors] = useState(INITIAL_CONTRACTORS);
=======
  const [contractors, setContractors] = useState<any[]>(INITIAL_CONTRACTORS);
>>>>>>> testing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingContractor, setViewingContractor] = useState<any | null>(null);
  const [editingContractor, setEditingContractor] = useState<any | null>(null);
<<<<<<< HEAD
=======
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState<number | null>(null);
>>>>>>> testing

  const filteredContractors = contractors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()),
  );

<<<<<<< HEAD
  const handleAddContractor = (data: any) => {
    if (editingContractor) {
      setContractors(prev => prev.map(c => c.id === editingContractor.id ? { ...c, ...data, mobile: data.contact_number, gst: data.gst_number, bank: data.bank_details, projects: data.work_type } : c));
=======
  const calculateOutstanding = (contractor: any) => {
    const totalBilled = contractor.bills?.reduce((acc: number, bill: any) => acc + (bill.status === 'approved' ? bill.amount : 0), 0) || 0;
    const totalPaid = contractor.payments?.reduce((acc: number, pay: any) => acc + pay.amount, 0) || 0;
    return totalBilled - totalPaid;
  };

  const handleAddContractor = (data: any) => {
    if (editingContractor) {
      setContractors(prev => prev.map(c => c.id === editingContractor.id ? { 
        ...c, 
        ...data, 
        mobile: data.contact_number, 
        gst: data.gst_number, 
        bank: data.bank_details, 
        projects: data.work_type,
        project_id: data.project_id ? parseInt(data.project_id) : undefined
      } : c));
>>>>>>> testing
    } else {
      const newContractor = {
        id: contractors.length + 1,
        name: data.name,
        company: data.company,
        email: data.email,
        mobile: data.contact_number,
        gst: data.gst_number,
        bank: data.bank_details,
        projects: data.work_type,
<<<<<<< HEAD
        rating: 5.0,
        status: "Active",
=======
        project_id: data.project_id ? parseInt(data.project_id) : undefined,
        rating: 5.0,
        status: "Active",
        total_work_assigned: data.total_work_assigned || 0,
        payment_given: data.payment_given || 0,
        bills: [],
        payments: []
>>>>>>> testing
      };
      setContractors([newContractor, ...contractors]);
    }
    setIsModalOpen(false);
    setEditingContractor(null);
  };

  const handleEditClick = (contractor: any) => {
    setEditingContractor(contractor);
    setIsModalOpen(true);
  };

  const handleViewDetails = (contractor: any) => {
    setViewingContractor(contractor);
    setIsViewModalOpen(true);
  };

<<<<<<< HEAD
  const handleDeleteContractor = (id: number) => {
    if (window.confirm("Are you sure you want to delete this contractor?")) {
      setContractors(prev => prev.filter(c => c.id !== id));
    }
  };

=======
  const handleDeleteClick = (id: number) => {
    setContractorToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contractorToDelete) {
      setContractors(contractors.filter(c => c.id !== contractorToDelete));
      toast.success("Contractor deleted successfully!");
      setIsDeleteModalOpen(false);
      setContractorToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredContractors.length === 0) {
      toast.error("No contractors found to export", {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
      return;
    }

    const data = filteredContractors.map((c) => ({
      ID: c.id,
      Name: c.name,
      Company: c.company,
      Email: c.email,
      Mobile: c.mobile,
      GST: c.gst,
      "Work Type": c.projects,
      "Assigned Project": PROJECTS.find((p) => p.id === c.project_id)?.project_name || "N/A",
      Status: c.status,
      Rating: c.rating,
      "Total Work Assigned (₹)": c.total_work_assigned,
      "Payment Given (₹)": c.payment_given,
      "Outstanding Dues (₹)": calculateOutstanding(c),
    }));
    
    exportToCSV(data, "contractors_directory_export.csv");
    toast.success("CSV Exported successfully!", {
      style: { borderRadius: '12px', background: '#333', color: '#fff' }
    });
  };

>>>>>>> testing
  return (
    <>
      <Navbar
        title="Contractor Management"
        breadcrumb={["Admin", "Contractors"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
<<<<<<< HEAD
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Contractor Directory</h1>
            <p className="text-slate-500 text-sm">Manage construction partners, ratings, and site assignments.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Export CSV</button>
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">+ New Contractor</button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Assign Contractor to Project", desc: "Map contractor to specific project", behavior: "Should link Contractor ID with Project ID.", icon: "🤝", color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Track Contractor Bills", desc: "Maintain contractor work bill details", behavior: "Should store bill amount, date, and work description.", icon: "🧾", color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Payment History", desc: "Record all payments made to contractor", behavior: "Should show date-wise payment records.", icon: "💰", color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Pending Payment Report", desc: "Generate contractor pending dues report", behavior: "Should display contractor-wise outstanding amount.", icon: "📊", color: "text-purple-600", bg: "bg-purple-50" }
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <div className={`w-10 h-10 ${f.bg} ${f.color} rounded-lg flex items-center justify-center mb-3 text-lg`}>{f.icon}</div>
              <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{f.desc}</p>
              <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Behavior: <span className="text-slate-600 lowercase font-medium italic">"{f.behavior}"</span></p>
              </div>
            </div>
          ))}
        </div>

=======
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Contractor Directory
            </h1>
            <p className="text-slate-500 text-sm">
              Manage construction partners, ratings, and site assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + New Contractor
            </button>
          </div>
        </div>

>>>>>>> testing
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Contractors"
            value={contractors.length.toString()}
            sub="Active in directory"
            accent="text-primary"
          />
          <StatCard
            title="Avg. Rating"
            value="4.4"
            sub="Based on site performance"
            accent="text-emerald-500"
          />
          <StatCard
            title="Total Payouts"
            value="₹1.2Cr"
            sub="Payments processed YTD"
            accent="text-violet-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Contractor & Company</th>
<<<<<<< HEAD
                  <th className="px-6 py-4">GST & Bank Details</th>
                  <th className="px-6 py-4">Assigned Projects</th>
                  <th className="px-6 py-4 text-center">Performance Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
=======
                  <th className="px-6 py-4">Financial Overview</th>
                  <th className="px-6 py-4">Assigned Site</th>
                  <th className="px-6 py-4 text-center">Pending Dues</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
>>>>>>> testing
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredContractors.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                          {c.name}
                        </p>
                        <p className="text-slate-500 text-xs font-semibold">
                          {c.company}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          {c.mobile} | {c.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
<<<<<<< HEAD
                      <p className="text-[10px] font-bold text-slate-400 mb-1">
                        GST:{" "}
                        <span className="text-slate-600 font-medium">
                          {c.gst}
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        BANK:{" "}
                        <span className="text-slate-600 font-medium">
                          {c.bank}
                        </span>
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-[200px]">
                        {c.projects}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-800">
                          {c.rating} / 5.0
=======
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-bold uppercase">Billed:</span>
                          <span className="text-slate-600 font-bold">₹{(c.bills?.reduce((acc: number, b: any) => acc + (b.status === 'approved' ? b.amount : 0), 0) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-bold uppercase">Paid:</span>
                          <span className="text-emerald-600 font-bold">₹{(c.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.project_id ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">{PROJECTS.find(p => p.id === c.project_id)?.project_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium italic">{c.projects}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No project assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-black ${calculateOutstanding(c) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          ₹{calculateOutstanding(c).toLocaleString()}
>>>>>>> testing
                        </span>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
<<<<<<< HEAD
                              className={`w-3 h-3 ${star <= Math.round(c.rating) ? "text-amber-400" : "text-slate-200"}`}
=======
                              className={`w-2 h-2 ${star <= Math.round(c.rating || 5) ? "text-amber-400" : "text-slate-200"}`}
>>>>>>> testing
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
<<<<<<< HEAD
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${c.status === "Active"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                          }`}
=======
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          c.status === "Active"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
>>>>>>> testing
                      >
                        {c.status}
                      </span>
                    </td>
<<<<<<< HEAD
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
=======
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
>>>>>>> testing
                          onClick={() => handleViewDetails(c)}
                          title="View Details"
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
<<<<<<< HEAD
                        <button
=======
                        <button 
>>>>>>> testing
                          onClick={() => handleEditClick(c)}
                          title="Update Contractor"
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
<<<<<<< HEAD
                        <button
                          onClick={() => handleDeleteContractor(c.id)}
=======
                        <button 
                          onClick={() => handleDeleteClick(c.id)}
>>>>>>> testing
                          title="Delete Contractor"
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      <CreateContractorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContractor(null);
        }}
        onSubmit={handleAddContractor}
        initialData={editingContractor}
      />

      <ContractorDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingContractor(null);
        }}
        contractor={viewingContractor}
      />
<<<<<<< HEAD
=======

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContractorToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Contractor"
        message="Are you sure you want to delete this contractor? This will remove all their data from the directory."
        confirmText="Delete"
        type="danger"
      />
>>>>>>> testing
    </>
  );
};

export default ContractorsPage;
