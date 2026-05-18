import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateClientModal from "../../components/forms/CreateClientModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2 } from "lucide-react";

const initialClients = [
  {
    id: 1,
    name: "Vikram Sethi",
    company: "Sethi Real Estate Group",
    email: "vikram@sethigroup.com",
    mobile: "+91 93344 55667",
    project: "Skyline Tower A",
    billing: "₹45.5L Pending",
    payments: "₹1.2Cr Received",
    status: "Active",
  },
  {
    id: 2,
    name: "Anjali Rao",
    company: "City Infra Development",
    email: "anjali.rao@cityinfra.com",
    mobile: "+91 94455 66778",
    project: "Metro Extension Ph-II",
    billing: "₹82.0L Processed",
    payments: "₹4.5Cr Received",
    status: "Active",
  },
  {
    id: 3,
    name: "Karan Malhotra",
    company: "Malhotra & Sons",
    email: "karan@malhotra.in",
    mobile: "+91 92233 44556",
    project: "Grand Vista Residency",
    billing: "₹12.4L Overdue",
    payments: "₹85L Received",
    status: "On Hold",
  },
];

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateOrUpdate = (data: any) => {
    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...data, id: c.id, billing: c.billing, payments: c.payments } : c));
      toast.success("Client profile updated.");
    } else {
      const newClient = {
        ...data,
        id: Date.now(),
        billing: "₹0 Pending",
        payments: "₹0 Received",
      };
      setClients(prev => [newClient, ...prev]);
      toast.success("New client added to portfolio!");
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = () => {
    if (clientToDelete) {
      setClients(prev => prev.filter(c => c.id !== clientToDelete));
      toast.success("Client removed from database.");
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
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
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              Client Portal
            </button>
            <button
              onClick={() => {
                const csvData = clients.map(c => ({
                  Name: c.name,
                  Company: c.company,
                  Project: c.project,
                  Status: c.status,
                  Billing: c.billing,
                  Payments: c.payments
                }));
                import("../../utils/csvExport").then(m => m.exportToCSV(csvData, "clients_list.csv"));
              }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
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
                {filteredClients.map((c) => (
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
                ))}
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
