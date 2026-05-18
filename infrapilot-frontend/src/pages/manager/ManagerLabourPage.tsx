import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { Users, UserCheck, Clock, TrendingUp, Search, Filter, Download, Eye, Edit2, Trash2 } from "lucide-react";

const mockLaborData = [
  { id: 1, name: "Rahul Sharma", role: "Skilled Labor", project: "Skyline Residency", status: "Present", hours: 8, wage: 800 },
  { id: 2, name: "Amit Kumar", role: "Unskilled Labor", project: "Skyline Residency", status: "Present", hours: 10, wage: 600 },
  { id: 3, name: "Suresh Singh", role: "Mason", project: "Skyline Residency", status: "Absent", hours: 0, wage: 900 },
  { id: 4, name: "Vijay Yadav", role: "Electrician", project: "Skyline Residency", status: "Present", hours: 8, wage: 1100 },
  { id: 5, name: "Karan Johar", role: "Plumber", project: "Metropolis Hub", status: "Present", hours: 8, wage: 950 },
  { id: 6, name: "Sunil Grover", role: "Carpenter", project: "Metropolis Hub", status: "Present", hours: 9, wage: 1050 },
];

const ManagerLabourPage = () => {
  const [activeTab, setActiveTab] = useState<"attendance" | "wages" | "database">("attendance");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLabor = mockLaborData.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar
        title="Labour Management"
        breadcrumb={["Manager", "Labour", "Overview"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen pb-24">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Workforce Overview
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track attendance, performance, and daily wage records across all project sites.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Wage Report
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              + Register Labour
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Workforce"
            value="142"
            sub="Across all sites"
            accent="text-primary"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Today's Attendance"
            value="128"
            sub="90% Attendance rate"
            accent="text-emerald-500"
            icon={<UserCheck className="w-5 h-5" />}
          />
          <StatCard
            title="Avg. Work Hours"
            value="8.4h"
            sub="Per person today"
            accent="text-amber-500"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Daily Wage Pool"
            value="₹1.2L"
            sub="Current daily outflow"
            accent="text-rose-500"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/30">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "attendance"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setActiveTab("wages")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "wages"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Wage Records
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "database"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Labour Database
            </button>
          </div>

          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
                <Filter className="w-4 h-4" />
              </button>
              <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                <option>All Projects</option>
                <option>Skyline Residency</option>
                <option>Metropolis Hub</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab !== "wages" ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Labour Name</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Project Site</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Hours</th>
                    <th className="px-6 py-4 text-right">Daily Wage</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLabor.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {item.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        {item.role}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.project}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          item.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {item.hours}h
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        ₹{item.wage}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium">Wage reports are being generated...</p>
                <button className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg">
                  Generate Today's Wage Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default ManagerLabourPage;
