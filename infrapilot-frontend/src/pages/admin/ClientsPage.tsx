import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateClientModal from "../../components/forms/CreateClientModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2, Users, IndianRupee, FileSpreadsheet, FileText } from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import { userService } from "../../services/userService";
import type { User, UserRole } from "../../types/user";
import { getFullImageUrl } from "../../utils/imageUtils";
import ClientPaymentsList from "../../components/dashboard/ClientPaymentsList";
import ClientPaymentAnalyticsUI from "../../components/dashboard/ClientPaymentAnalytics";
import { clientPaymentService } from "../../services/clientPaymentService";
import ProjectSelector from "../../components/common/ProjectSelector";
import { financeService } from "../../services/financeService";
import { quotationService } from "../../services/quotationService";


const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const PAGE_SIZE = 10;

  const [activeTab, setActiveTab] = useState<"clients" | "payments">("clients");
  const [isExporting, setIsExporting] = useState(false);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const [res, allInvoices, allQuotations] = await Promise.all([
        userService.getAllUsers(100, 0),
        financeService.getInvoices(100, 0).catch(() => []),
        quotationService.getQuotations(100, 0).catch(() => [])
      ]);
      const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);

      const invMap = new Map();
      const invProjNameMap = new Map();
      (Array.isArray(allInvoices) ? allInvoices : []).forEach((inv: any) => {
        const cid = inv.owner_id || inv.user_id || inv.client_id;
        if (cid) {
          if (inv.project_id) invMap.set(Number(cid), inv.project_id);
          if (inv.project_name) invProjNameMap.set(Number(cid), inv.project_name);
        }
      });
      (Array.isArray(allQuotations) ? allQuotations : []).forEach((quo: any) => {
        if (quo.client_name && quo.project_name) {
          invProjNameMap.set(quo.client_name.toLowerCase().trim(), quo.project_name);
        }
      });

      // Filter for Client role with robust check and map to UI format
      const clientList = userList
        .filter((u: any) => {
          const role = typeof u.role === "string" ? u.role : u.role?.name || "";
          return role.toLowerCase() === "client";
        })
        .map((u: User) => {
          const cName = (u.full_name || "").toLowerCase().trim();
          const projId = u.project_id || invMap.get(Number(u.user_id));
          const projName = u.project_name || invProjNameMap.get(Number(u.user_id)) || invProjNameMap.get(cName) || u.address;

          return {
            id: u.user_id,
            name: u.full_name,
            company: u.designation || "N/A",
            email: u.email,
            mobile: u.mobile_number,
            project: projName || (projId ? `Project #${projId}` : null) || "No Project Linked",
            status: u.is_active ? "Active" : "Inactive",
            profile_image: getFullImageUrl((u as any).profile_image || (u as any).avatar),
            pan_number: (u as any).pan_number || (u as any).pan || "—",
            aadhar_number: (u as any).aadhaar_number || (u as any).aadhar_number || (u as any).aadhar || "—",
            joining_date: (u as any).joining_date || (u as any).created_at || null,
          };
        });

      setClients(clientList);
    } catch (error) {
      toast.error("Failed to fetch clients");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [filteredClients, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / PAGE_SIZE));
  const pagedClients = sortedClients.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Reset to page 0 on search
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      // Strip "+91 " prefix so it doesn't corrupt the query param (+ becomes space in URL encoding)
      const rawMobile = (data.mobile_number || data.mobile || "").replace(/^\+91\s*/, "").replace(/\D/g, "");

      const userData: Partial<User> = {
        full_name: data.full_name || data.name,
        email: data.email,
        mobile_number: rawMobile,
        designation: data.designation || data.company,
        address: data.address || data.project,
        pan_number: data.pan_number,
        aadhaar_number: data.aadhaar_number,
        joining_date: data.joining_date,
        role: "Client" as UserRole,
        is_active: data.is_active,
      };

      if (!editingClient && data.password) (userData as any).password = data.password;
      if (data.profile_image instanceof File) (userData as any).profile_image = data.profile_image;

      if (editingClient) {
        await userService.updateUser(editingClient.id, userData);
        toast.success("Client profile updated.");
      } else {
        await userService.createUser(userData);
        toast.success("New client onboarded!");
      }
      setIsModalOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      toast.error(editingClient ? "Failed to update client" : "Failed to onboard client");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (clientToDelete) {
      try {
        await userService.deleteUser(clientToDelete);
        toast.success("Client removed from database.");
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
        fetchClients();
      } catch (error) {
        toast.error("Failed to delete client");
        console.error(error);
      }
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.loading("Exporting payments to Excel...", { id: "export" });
    try {
      await clientPaymentService.exportExcel();
      toast.success("Exported successfully", { id: "export" });
    } catch (error) {
      toast.error("Failed to export Excel", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.loading("Exporting payments to PDF...", { id: "export" });
    try {
      await clientPaymentService.exportPdf();
      toast.success("Exported successfully", { id: "export" });
    } catch (error) {
      toast.error("Failed to export PDF", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Navbar title={activeTab === 'clients' ? "Client Management" : "Client Payments"} breadcrumb={["Admin", activeTab === 'clients' ? "Clients" : "Client Payments"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'clients' ? "Client Portfolio" : "Payments Console"}
            </h1>
            <p className="text-slate-500 text-sm">
              {activeTab === 'clients'
                ? "Manage client relationships, project links, and statuses."
                : "Track financial history, verify payments, and manage invoices."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'payments' && (
              <>
                <ProjectSelector variant="page" />
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
                </button>
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  <FileText className="w-4 h-4 text-rose-600" /> Export PDF
                </button>
              </>
            )}
            {activeTab === 'clients' && (
              <button
                onClick={() => {
                  setEditingClient(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
              >
                + Add Client
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("clients")}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all ${activeTab === "clients" ? "text-primary bg-white rounded-xl shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <span className="relative z-10"><Users className="w-4 h-4" /></span>
            <span className="relative z-10 font-bold">Client Portfolio</span>
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all ${activeTab === "payments" ? "text-primary bg-white rounded-xl shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <span className="relative z-10"><IndianRupee className="w-4 h-4" /></span>
            <span className="relative z-10 font-bold">Client Payments</span>
          </button>
        </div>

        {activeTab === 'clients' ? (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Clients"
                value={clients.length.toString()}
                sub="All registered clients"
                accent="text-primary"
              />
              <StatCard
                title="Active Clients"
                value={clients.filter(c => c.status === 'Active').length.toString()}
                sub="Currently active relationships"
                accent="text-emerald-500"
              />
              <StatCard
                title="Inactive Clients"
                value={clients.filter(c => c.status === 'Inactive').length.toString()}
                sub="Deactivated or on hold"
                accent="text-rose-500"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
              <div className="p-4 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-1 max-w-md w-full">
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
                  <SortDropdown value={sortOrder} onChange={setSortOrder} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                      <th className="px-6 py-4">Client & Company</th>
                      <th className="px-6 py-4">PAN No.</th>
                      <th className="px-6 py-4">Aadhar No.</th>
                      <th className="px-6 py-4">Joining Date</th>
                      <th className="px-6 py-4">Linked Project</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            Loading clients...
                          </div>
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                          No clients found.
                        </td>
                      </tr>
                    ) : (
                      pagedClients.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div
                              onClick={() => navigate(`/admin/clients/${c.id}`)}
                              className="cursor-pointer group/link flex items-center gap-3"
                            >
                              {/* Avatar */}
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                                {c.profile_image ? (
                                  <img src={c.profile_image} alt={c.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm font-bold text-primary">{(c.name || "?")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-700 group-hover/link:text-primary transition-colors">
                                  {c.name}
                                </p>
                                <p className="text-slate-500 text-xs font-semibold">{c.company}</p>
                                <p className="text-slate-400 text-[10px]">{c.mobile} | {c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-700">
                            {c.pan_number}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-700">
                            {c.aadhar_number}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 font-semibold">
                            {c.joining_date ? new Date(c.joining_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                            {c.project}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${c.status === "Active"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-amber-100 text-amber-600"
                                }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => navigate(`/admin/clients/${c.id}`)}
                                className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                                title="View Profile"
                              >
                                <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClient(c);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                                title="Edit Client"
                              >
                                <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => {
                                  setClientToDelete(c.id);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                                title="Delete Client"
                              >
                                <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedClients.length)} of {sortedClients.length} Clients
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
          </>
        ) : (
          <>
            <ClientPaymentAnalyticsUI />
            <ClientPaymentsList />
          </>
        )}
      </PageTransition>

      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingClient}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Client Profile"
        message="Are you sure you want to remove this client? This will delete their access to the client portal and all linked financial history."
        confirmText="Delete Profile"
        type="danger"
      />
    </>
  );
};

export default ClientsPage;
