import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const clientsData = [
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
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clientsData.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              + Add Client
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Clients"
            value="24"
            sub="5 Premium Accounts"
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
                  <th className="px-6 py-4">Client & Company</th>
                  <th className="px-6 py-4">Linked Project</th>
                  <th className="px-6 py-4">Billing Status</th>
                  <th className="px-6 py-4">Financial History</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClients.map((c) => (
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
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          c.status === "Active"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View Profile">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit Client">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete Client">
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
    </>
  );
};

export default ClientsPage;
