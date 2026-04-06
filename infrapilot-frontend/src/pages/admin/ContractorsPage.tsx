import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const contractorsData = [
  {
    id: 1,
    name: "Rajesh Varma",
    company: "Varma Constructions Pvt. Ltd.",
    email: "rajesh.v@varmaconst.com",
    mobile: "+91 91234 56789",
    gst: "27AAACV1234A1Z1",
    bank: "HDFC Bank - **** 8821",
    projects: "Skyline Tower A, Metro Ph-II",
    rating: 4.8,
    status: "Active"
  },
  {
    id: 2,
    name: "Suresh Gupta",
    company: "Gupta Engineering Works",
    email: "suresh@guptaworks.in",
    mobile: "+91 99887 76655",
    gst: "27BBBCG5678B1Z2",
    bank: "SBI - **** 4432",
    projects: "Grand Vista Residency",
    rating: 4.2,
    status: "Active"
  },
  {
    id: 3,
    name: "Meera Deshmukh",
    company: "Infratech Solutions",
    email: "meera.d@infratech.co.in",
    mobile: "+91 98221 12233",
    gst: "27CCCDS9012C1Z3",
    bank: "ICICI Bank - **** 1190",
    projects: "Bridge Overpass Site",
    rating: 3.9,
    status: "Delayed"
  }
];

const ContractorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContractors = contractorsData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Navbar title="Contractor Management" breadcrumb={["Admin", "Contractors"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Contractor Directory</h1>
            <p className="text-slate-500 text-sm">Manage construction partners, ratings, and site assignments.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Export CSV</button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              + New Contractor
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Contractors" value="12" sub="3 New this quarter" accent="text-primary" />
          <StatCard title="Avg. Rating" value="4.4" sub="Based on site performance" accent="text-emerald-500" />
          <StatCard title="Total Payouts" value="₹1.2Cr" sub="Payments processed YTD" accent="text-violet-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  <th className="px-6 py-4">GST & Bank Details</th>
                  <th className="px-6 py-4">Assigned Projects</th>
                  <th className="px-6 py-4 text-center">Performance Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredContractors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{c.name}</p>
                        <p className="text-slate-500 text-xs font-semibold">{c.company}</p>
                        <p className="text-slate-400 text-[10px]">{c.mobile} | {c.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">GST: <span className="text-slate-600 font-medium">{c.gst}</span></p>
                      <p className="text-[10px] font-bold text-slate-400">BANK: <span className="text-slate-600 font-medium">{c.bank}</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-[200px]">{c.projects}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-800">{c.rating} / 5.0</span>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-3 h-3 ${star <= Math.round(c.rating) ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        c.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-primary transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default ContractorsPage;
