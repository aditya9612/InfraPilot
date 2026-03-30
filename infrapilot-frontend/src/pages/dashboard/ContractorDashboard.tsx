import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import { useAuth } from "../../context/AuthContext";

// Mock Data
const projects = [
  { id: 1, name: "Skyline Tower A", progress: 75, status: "On Track", budgetId: "₹1.2Cr", spent: "₹85L" },
  { id: 2, name: "Metro Extension Ph-II", progress: 45, status: "Delayed", budgetId: "₹4.5Cr", spent: "₹2.1Cr" },
  { id: 3, name: "Grand Vista Residency", progress: 92, status: "On Track", budgetId: "₹8.2Cr", spent: "₹7.5Cr" },
];

const boqItems = [
  { id: 1, item: "Cement (Grade 53)", unit: "Bags", qty: 450, rate: 420, total: 189000 },
  { id: 2, item: "Steel Reinforcement", unit: "MT", qty: 12, rate: 68000, total: 816000 },
  { id: 3, item: "Coarse Aggregate", unit: "Cum", qty: 85, rate: 1250, total: 106250 },
  { id: 4, item: "Bricks (Fly Ash)", unit: "Nos", qty: 5000, rate: 9, total: 45000 },
];

const initialTasks = [
  { id: 1, name: "Slab Casting - 4th Floor", deadline: "Tomorrow", completed: false },
  { id: 2, name: "Plumbing Rough-in", deadline: "3 Apr", completed: true },
  { id: 3, name: "Electrical Conduiting", deadline: "5 Apr", completed: false },
];

const activity = [
  { id: 1, type: "invoice", text: "Invoice #INV-204 submitted", time: "2h ago", icon: "💰" },
  { id: 2, type: "boq", text: "BOQ updated for Steel items", time: "5h ago", icon: "📦" },
  { id: 3, type: "task", text: "Excavation completed for Block B", time: "1d ago", icon: "✔" },
];

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);
  const totalBOQ = boqItems.reduce((acc, item) => acc + item.total, 0);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <DashboardLayout>
      <Navbar
        title="Contractor Portal"
        breadcrumb={["InfraPilot", "Contractor", "Dashboard"]}
      />

      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back, {user?.name || "Contractor"}</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Monday, 30 March 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Progress
            </button>
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Submit Invoice
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Assigned Projects", value: "3", sub: "2 Active", icon: "🏗️", color: "text-blue-600 bg-blue-50" },
            { label: "Avg. Work Progress", value: "72%", sub: "+5% this week", icon: "📊", color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending Payments", value: "₹24.5L", sub: "3 Invoices", icon: "💰", color: "text-amber-600 bg-amber-50" },
            { label: "BOQ Completed", value: "142", sub: "Out of 180 items", icon: "📦", color: "text-purple-600 bg-purple-50" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{card.label}</p>
                <p className="text-2xl font-black text-slate-800">{card.value}</p>
                <p className={`text-[10px] font-bold mt-1 ${card.sub.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>{card.sub}</p>
              </div>
              <span className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-xl shadow-inner`}>{card.icon}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Project List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">Active Projects</h2>
                <button className="text-xs font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(p => (
                  <div key={p.id} className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">{p.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">ID: #PROJ-00{p.id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        p.status === 'On Track' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>{p.status}</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] font-bold mb-1.5">
                        <span className="text-slate-500">PROGRESS</span>
                        <span className="text-slate-800">{p.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${p.status === 'On Track' ? 'bg-primary' : 'bg-red-500'}`} style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-slate-100 mt-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">BUDGET USED</p>
                        <p className="text-sm font-bold text-slate-800">{p.spent} <span className="text-slate-300 font-normal ml-1">/ {p.budgetId}</span></p>
                      </div>
                      <button className="p-2 bg-white rounded-lg border border-slate-200 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOQ Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">BOQ (Bill of Quantity)</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-100">DOWNLOAD CSV</button>
                  <button className="px-3 py-1.5 bg-blue-50 text-primary text-[10px] font-bold rounded-lg hover:bg-blue-100">EDIT BOQ</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Item Name</th>
                      <th className="px-6 py-4 text-center">Unit</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Rate (₹)</th>
                      <th className="px-6 py-4 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boqItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.item}</td>
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">{item.unit}</td>
                        <td className="px-6 py-4 text-center text-slate-800 font-bold">{item.qty}</td>
                        <td className="px-6 py-4 text-right text-slate-500">{item.rate.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50/50 border-t-2 border-primary/10">
                    <tr>
                      <td colSpan={4} className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</td>
                      <td className="px-6 py-5 text-right text-lg font-black text-primary">₹{totalBOQ.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            
            {/* Payment Status */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px] mb-6">Payment Overview</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Total Earned</p>
                    <p className="text-xl font-black text-slate-800">₹82,45,000</p>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div className="h-full bg-emerald-500" style={{ width: '70.2%' }} />
                    <div className="h-full bg-amber-400" style={{ width: '29.8%' }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">PAID (70%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">PENDING (30%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-50">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Paid Amount</p>
                    <p className="text-sm font-black text-slate-800 italic">₹58.1L</p>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-50">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Overdue</p>
                    <p className="text-sm font-black text-slate-800 italic">₹4.2L</p>
                  </div>
                </div>

                <button className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  VIEW INVOICES & STATEMENTS
                </button>
              </div>
            </div>

            {/* Task Update Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">Today's Work Updates</h2>
              </div>
              <div className="p-2 space-y-1">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id)}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        task.completed ? 'bg-primary border-primary text-white scale-110' : 'border-slate-200 group-hover:border-primary'
                      }`}>
                        {task.completed && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-bold transition-all ${task.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                          {task.name}
                        </p>
                        <p className="text-[10px] text-slate-300 font-bold mt-1">DUE: {task.deadline.toUpperCase()}</p>
                      </div>
                    </div>
                    {!task.completed && (
                      <span className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Update</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest text-[11px] mb-6">Recent Site Updates</h2>
              <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {activity.map(act => (
                  <div key={act.id} className="relative pl-8 flex flex-col items-start gap-1">
                    <span className="absolute left-0 top-0 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px]">{act.icon}</span>
                    <p className="text-xs font-bold text-slate-200">{act.text}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{act.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              <div className="p-4 bg-red-100/50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-xs font-black text-red-600 uppercase tracking-tighter">Budget Overrun Risk</p>
                  <p className="text-[10px] text-red-400 font-bold mt-0.5">Skyline Tower A material costs +12%</p>
                </div>
              </div>
              <div className="p-4 bg-amber-100/50 border-l-4 border-amber-500 rounded-lg flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs font-black text-amber-600 uppercase tracking-tighter">Safety Audit Due</p>
                  <p className="text-[10px] text-amber-400 font-bold mt-0.5">Schedule for Metro Ext Ph-II on 2nd April</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContractorDashboard;
