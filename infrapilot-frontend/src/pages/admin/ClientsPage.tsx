import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateClientModal from "../../components/forms/CreateClientModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { userService } from "../../services/userService";
import type { User, UserRole } from "../../types/user";


const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const res = await userService.getAllUsers(100, 0);
      const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);

      // Filter for Client role with robust check and map to UI format
      const clientList = userList
        .filter((u: any) => {
          const role = typeof u.role === "string" ? u.role : u.role?.name || "";
          return role.toLowerCase() === "client";
        })
        .map((u: User) => ({
          id: u.user_id,
          name: u.full_name,
          company: u.designation || "N/A",
          email: u.email,
          mobile: u.mobile_number,
          project: u.address || "No Project Linked",
          billing: "₹0 Pending", // Placeholders for now
          payments: "₹0 Received",
          status: u.is_active ? "Active" : "Inactive",
        }));

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

  const handleCreateOrUpdate = async (data: any) => {
    try {
      const userData: Partial<User> = {
        full_name: data.name,
        email: data.email,
        mobile_number: data.mobile,
        designation: data.company,
        address: data.project,
        role: "Client" as UserRole,
        is_active: data.status === "Active",
      };

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

  return (
    <>
      <Navbar title="Client Management" breadcrumb={["Admin", "Clients"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Client Portfolio
            </h1>
            <p className="text-slate-500 text-sm">
              Manage client relationships, project links, and financial history.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingClient(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + Add Client
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Clients"
            value={clients.length.toString()}
            sub="Active relationships"
            accent="text-primary"
          />
          <StatCard
            title="Outstanding Billing"
            value="₹2.4Cr"
            sub="Across 8 Projects"
            accent="text-rose-500"
          />
          <StatCard
            title="Satisfaction Score"
            value="94%"
            sub="Based on project delivery"
            accent="text-emerald-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
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
                  <th className="px-6 py-4">Client & Company</th>
                  <th className="px-6 py-4">Linked Project</th>
                  <th className="px-6 py-4">Billing Status</th>
                  <th className="px-6 py-4">Financial History</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        Loading clients...
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div
                          onClick={() => navigate(`/admin/clients/${c.id}`)}
                          className="cursor-pointer group/link"
                        >
                          <p className="font-bold text-slate-700 group-hover/link:text-primary transition-colors">
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
                      <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                        {c.project}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold ${c.billing.includes("Pending") || c.billing.includes("Overdue") ? "text-rose-500" : "text-emerald-500"}`}
                        >
                          {c.billing}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {c.payments}
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
          {filteredClients.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">No clients found matching your search.</p>
            </div>
          )}
        </div>
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
