import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const engineersData = [
  {
    id: 1,
    name: "Arjun Mehta",
    email: "arjun.m@infrapilot.com",
    mobile: "+91 95566 77889",
    projects: "Skyline Tower A",
    experience: "8 Years",
    reportStatus: "Submitted",
    performance: "Exceptional",
    status: "On Site",
  },
  {
    id: 2,
    name: "Sana Khan",
    email: "sana.k@infrapilot.com",
    mobile: "+91 96677 88990",
    projects: "Metro Ph-II, Bridge Overpass",
    experience: "5 Years",
    reportStatus: "Pending",
    performance: "Good",
    status: "On Site",
  },
  {
    id: 3,
    name: "Rahul Deshpande",
    email: "rahul.d@infrapilot.com",
    mobile: "+91 97788 99001",
    projects: "Grand Vista Residency",
    experience: "12 Years",
    reportStatus: "Submitted",
    performance: "Outstanding",
    status: "Leave",
  },
];

const EngineersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEngineers = engineersData.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.projects.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Navbar
        title="Site Engineer Management"
        breadcrumb={["Admin", "Engineers"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Engineering Staff
            </h1>
            <p className="text-slate-500 text-sm">
              Monitor site engineer performance, reports, and assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              Daily Logs
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              + Add Engineer
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Engineers"
            value="18"
            sub="15 On Site today"
            accent="text-primary"
          />
          <StatCard
            title="Reports Compliance"
            value="92%"
            sub="+4% from last week"
            accent="text-emerald-500"
          />
          <StatCard
            title="Pending Reviews"
            value="5"
            sub="Requires Admin action"
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
                placeholder="Search by name or project..."
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
                  <th className="px-6 py-4">Engineer Information</th>
                  <th className="px-6 py-4">Assigned Projects</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Daily Report</th>
                  <th className="px-6 py-4">Performance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEngineers.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">
                          {e.name}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          {e.mobile} | {e.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-bold">
                      {e.projects}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {e.experience}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          e.reportStatus === "Submitted"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {e.reportStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold ${
                          e.performance === "Exceptional" ||
                          e.performance === "Outstanding"
                            ? "text-primary"
                            : "text-slate-600"
                        }`}
                      >
                        {e.performance}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          e.status === "On Site"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-primary transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
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
    </>
  );
};

export default EngineersPage;
