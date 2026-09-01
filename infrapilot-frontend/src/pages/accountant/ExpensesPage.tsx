import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Pencil, Trash2, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Modal from "../../components/common/Modal";
import { expenseService } from "../../services/expenseService";
import { projectService } from "../../services/projectService";
import { boqService } from "../../services/boqService";
import api from "../../services/api";
import type { ExpenseCreateData } from "../../types/expense";


// Distinct color palette for dynamic categories
const CATEGORY_COLORS = [
  "#f43f5e", "#6366f1", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

// --- SECTIONS ---

// 1. Expense Dashboard Section (live API data)
const ExpenseEntrySection = () => {
  const [activeStat, setActiveStat] = useState("TOTAL EXPENSE");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  const fmt = (num: number) => `₹${Number(num).toLocaleString("en-IN")}`;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await expenseService.getDashboardStats();
        setStats(data);
      } catch {
        // keep stats null — cards show fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: "TOTAL EXPENSE", value: stats ? fmt(stats.total_expense) : "—" },
    { label: "MONTHLY EXPENSE", value: stats ? fmt(stats.monthly_expense) : "—" },
    { label: "PROJECT EXPENSE", value: stats ? fmt(stats.project_expense) : "—" },
    { label: "DIRECT EXPENSE", value: stats ? fmt(stats.direct_expense) : "—" },
    { label: "INDIRECT EXPENSE", value: stats ? fmt(stats.indirect_expense) : "—" },
    {
      label: "PENDING APPRVL",
      value: stats ? String(stats.pending_approval_count) : "—",
      valueColor: "text-amber-500",
    },
  ];

  // Build dynamic pie data from category_summary
  const categorySummary: { category: string; total_amount: number; percentage: number }[] =
    stats?.category_summary ?? [];

  const pieData = categorySummary.map((c, i) => ({
    name: c.category,
    value: c.total_amount > 0 ? c.total_amount : 1, // Avoid 0 for rendering
    percentage: c.percentage || 0,
    amount: c.total_amount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const topCategory = hoveredPieIndex !== null && pieData[hoveredPieIndex] 
    ? pieData[hoveredPieIndex] 
    : (pieData.length > 0 ? [...pieData].sort((a, b) => b.amount - a.amount)[0] : null);

  // Trend: use API data if available, else empty
  const trendData: { day: string; amount: number }[] =
    Array.isArray(stats?.trend) && stats.trend.length > 0
      ? stats.trend
      : [];

  return (
    <div className="space-y-6 mt-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {statCards.map(k => {
          const isActive = activeStat === k.label;
          return (
            <div
              key={k.label}
              onClick={() => setActiveStat(k.label)}
              className={`bg-white rounded-xl p-4 shadow-sm border ${isActive ? 'border-rose-500' : 'border-slate-100 hover:border-rose-300'
                } relative overflow-hidden cursor-pointer transition-colors`}
            >
              {isActive && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500" />}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{k.label}</p>
              {loading ? (
                <div className="h-6 w-20 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className={`text-xl font-bold ${k.valueColor || 'text-slate-800'}`}>{k.value}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Expense Trend</h3>
          <div className="h-[200px]">
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm font-semibold">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} tickFormatter={v => `${v}`} dx={-10} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} />
                  <Area type="monotone" dataKey="amount" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category-wise Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Category-wise</h3>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-sm font-semibold">No data</div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Donut chart */}
              <div className="flex items-center justify-center">
                <div className="h-36 w-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={46}
                        outerRadius={64}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                        onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                        onMouseLeave={() => setHoveredPieIndex(null)}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(_val: any, name: any, props: any) => [`${props.payload.percentage.toFixed(2)}%`, name]}
                        contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {topCategory && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-black text-slate-800">{topCategory.percentage.toFixed(1)}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight text-center px-1">{topCategory.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category legend rows */}
              <div className="flex flex-col gap-2 mt-1">
                {pieData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-bold text-slate-800">₹{Number(cat.amount).toLocaleString("en-IN")}</span>
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: cat.color + '20', color: cat.color }}
                      >
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ViewExpenseModal = ({ isOpen, onClose, expense, projects }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState<string>("");
  const [boqItemName, setBoqItemName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!expense) return;
      try {
        setLoading(true);
        const res = await expenseService.getExpenseById(expense.id);
        if (!isMounted) return;
        setData(res);

        // Resolve Project Name from API response body project_id
        const projId = res?.project_id ?? expense?.project_id;
        if (projId !== undefined && projId !== null && projId !== "") {
          if (res?.project_name) {
            setProjectName(res.project_name);
          } else if (res?.project?.project_name || res?.project?.name) {
            setProjectName(res.project?.project_name || res.project?.name);
          } else {
            const matchedProj = projects?.find(
              (p: any) => String(p.id) === String(projId) || String(p.project_id) === String(projId)
            );
            if (matchedProj) {
              setProjectName(matchedProj.project_name || matchedProj.name || `Project ${projId}`);
            } else {
              try {
                const projData = await projectService.getProjectById(Number(projId));
                if (isMounted) {
                  setProjectName(projData?.project_name || projData?.name || projData?.title || `Project ${projId}`);
                }
              } catch (e) {
                if (isMounted) setProjectName(`Project ${projId}`);
              }
            }
          }
        } else {
          setProjectName("—");
        }

        // Resolve BOQ Item Name from boq_item_id
        const boqId = res?.boq_item_id ?? expense?.boq_item_id;
        if (boqId !== undefined && boqId !== null && boqId !== "") {
          if (res?.boq_item_name || res?.boq_name || res?.boq_item?.item_name) {
            setBoqItemName(res.boq_item_name || res.boq_name || res.boq_item?.item_name);
          } else {
            try {
              const boqData = await boqService.getBoqById(Number(boqId));
              if (isMounted) {
                setBoqItemName(boqData?.item_name || boqData?.description || `BOQ Item #${boqId}`);
              }
            } catch (e) {
              if (isMounted) setBoqItemName(`BOQ #${boqId}`);
            }
          }
        } else {
          setBoqItemName("—");
        }
      } catch (err) {
        toast.error("Failed to load expense details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isOpen && expense) {
      load();
    } else {
      setData(null);
      setProjectName("");
      setBoqItemName("");
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, expense, projects]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Profile" maxWidth="max-w-4xl">
      {loading ? (
        <div className="p-20 text-center text-slate-400 font-inter">
          <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Loading Details...</p>
        </div>
      ) : data ? (
        <div className="p-6 font-inter h-full overflow-y-auto">
          <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative flex-shrink-0">
                <FileText className="w-10 h-10 text-white" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${data.status === 'Approved' ? 'bg-emerald-500' : data.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'} border-4 border-primary rounded-full`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold tracking-tight">{data.category || 'Expense'}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white`}>{data.status || 'Pending Approval'}</span>
                </div>
                <p className="text-white/70 text-xs font-bold mb-2">Expense #{data.id}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">{projectName || '—'}</span>
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">Amount: ₹{Number(data.amount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Expense No', value: `EXP-${data.id}` },
              { label: 'Project', value: projectName || '—' },
              { label: 'Category', value: data.category || '—' },
              { label: 'Payment Mode', value: data.payment_mode || '—' },
              { label: 'Expense Date', value: data.expense_date || '—' },
              { label: 'Amount (₹)', value: `₹${Number(data.amount).toLocaleString("en-IN")}`, highlight: true },
              { label: 'BOQ Item', value: boqItemName || '—' },
            ].map(({ label, value, highlight }: any) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-sm font-bold truncate ${highlight ? 'text-rose-500' : 'text-slate-800'}`}>{String(value)}</p>
              </div>
            ))}
            <div className="col-span-full bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm font-bold text-slate-800">{data.description || '—'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

const EditExpenseModal = ({ isOpen, onClose, expense, onSubmit, projects: propProjects }: any) => {
  const [formData, setFormData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>(propProjects || []);
  const [boqItems, setBoqItems] = useState<any[]>([]);

  useEffect(() => {
    if (expense) setFormData({ ...expense });
  }, [expense]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!propProjects || propProjects.length === 0) {
          const data = await projectService.getProjects(100, 0);
          setProjects(Array.isArray(data) ? data : (data as any).items || []);
        }
        const boqRes = await boqService.getBoqs({ limit: 100 });
        setBoqItems(boqRes?.items || []);
      } catch (err) {}
    };
    if (isOpen) fetchData();
  }, [isOpen, propProjects]);

  if (!formData) return null;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const { project_id, ...putData } = formData;
    onSubmit(putData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Expense" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 font-inter h-full overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project</label>
            <select value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required>
              {projects.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.project_name || p.name || p.id}</option>
              ))}
              {projects.length === 0 && <option value={formData.project_id}>{formData.project_id}</option>}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required>
              <option value="Construction">Construction</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Fuel">Fuel</option>
              <option value="Travel">Travel</option>
              <option value="Material">Material</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
            <input type="date" value={formData.expense_date} onChange={e => setFormData({ ...formData, expense_date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Mode</label>
            <select value={formData.payment_mode} onChange={e => setFormData({ ...formData, payment_mode: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
              <option value="auto">Auto Payment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BOQ Item</label>
            <select value={formData.boq_item_id || ""} onChange={e => setFormData({ ...formData, boq_item_id: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option value="">None</option>
              {boqItems.map((b: any) => (
                <option key={b.id || b.boq_id} value={b.id || b.boq_id}>{b.item_name || b.description || `BOQ Item #${b.id || b.boq_id}`}</option>
              ))}
              {boqItems.length === 0 && (
                <>
                  <option value="1">Civil Work</option>
                  <option value="4">Sand & Cement</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount</label>
            <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" rows={2} required />
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

const CreateExpenseModal = ({ isOpen, onClose }: any) => {
  const [formData, setFormData] = useState<ExpenseCreateData>({ project_id: 1, category: "Construction", expense_date: "", payment_mode: "Cash", boq_item_id: undefined, amount: 0, description: "" });
  const [projects, setProjects] = useState<any[]>([]);
  const [boqItems, setBoqItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await projectService.getProjects(100, 0);
        const list = Array.isArray(data) ? data : (data as any).items || [];
        setProjects(list);
        if (list.length > 0) {
          setFormData(f => ({ ...f, project_id: list[0].id || list[0].project_id }));
        }
        const boqRes = await boqService.getBoqs({ limit: 100 });
        setBoqItems(boqRes?.items || []);
      } catch (err) {}
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await expenseService.createExpense(formData);
      toast.success("Expense created successfully!");
      window.dispatchEvent(new Event('expense-created'));
      onClose();
    } catch (err) {
      toast.error("Failed to create expense");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Expense" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="p-6 font-inter h-full overflow-y-auto bg-slate-50/30">
        <div className="border border-slate-100 bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-500 text-white text-xs font-bold">1</span>
            <span className="text-[15px] font-bold text-slate-800">Basic Information</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Project *</label>
              <select value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required>
                {projects.map(p => (
                  <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.project_name || p.name || p.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category *</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required>
                <option value="Construction">Construction</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Fuel">Fuel</option>
                <option value="Travel">Travel</option>
                <option value="Material">Material</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date *</label>
              <input type="date" onChange={e => setFormData({ ...formData, expense_date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-600" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Mode *</label>
              <select onChange={e => setFormData({ ...formData, payment_mode: e.target.value })} value={formData.payment_mode} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
                <option value="auto">Auto Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">BOQ Item</label>
              <select value={formData.boq_item_id || ""} onChange={e => setFormData({ ...formData, boq_item_id: e.target.value ? Number(e.target.value) : undefined })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">None</option>
                {boqItems.map(b => (
                  <option key={b.id || b.boq_id} value={b.id || b.boq_id}>{b.item_name || b.description || `BOQ Item #${b.id || b.boq_id}`}</option>
                ))}
                {boqItems.length === 0 && (
                  <>
                    <option value="1">Civil Work</option>
                    <option value="4">Sand & Cement</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Amount *</label>
              <input type="number" step="0.01" onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description *</label>
              <textarea onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" rows={2} required />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 items-center px-2">
          <button type="button" onClick={onClose} className="text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors">Cancel</button>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Create Expense</button>
        </div>
      </form>
    </Modal>
  );
};

const ExpenseListSection = () => {
  const [boqMap, setBoqMap] = useState<Record<number, string>>({});
  const fmt = (num: number) => `₹${Number(num).toLocaleString("en-IN")}`;

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjectsAndBoqs = async () => {
      try {
        const data = await projectService.getProjects(100, 0);
        const list = Array.isArray(data) ? data : (data as any).items || [];
        setProjects(list);
      } catch (err) { }

      try {
        const boqRes = await boqService.getBoqs({ limit: 100 });
        const items = boqRes?.items || [];
        const map: Record<number, string> = {};
        items.forEach((item: any) => {
          const id = item.id || item.boq_id;
          if (id) {
            map[id] = item.item_name || item.description || `BOQ #${id}`;
          }
        });
        setBoqMap(map);
      } catch (err) { }
    };
    fetchProjectsAndBoqs();
  }, []);


  const [expenses, setExpenses] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.listExpenses();
      setExpenses(data);
    } catch (err) {
      toast.error("Failed to fetch expenses");
    }
  };

  useEffect(() => {
    fetchExpenses();
    const handler = () => fetchExpenses();
    window.addEventListener('expense-created', handler);
    return () => window.removeEventListener('expense-created', handler);
  }, []);

  const handleDateChange = async (field: 'start' | 'end', val: string) => {
    const newStart = field === 'start' ? val : startDate;
    const newEnd = field === 'end' ? val : endDate;
    if (field === 'start') setStartDate(val);
    else setEndDate(val);

    if (newStart && newEnd) {
      try {
        const data = await expenseService.getExpensesByDateRange(newStart, newEnd);
        setExpenses(data);
      } catch (err) {
        toast.error("Failed to filter by date");
      }
    }
  };

  const handleProjectChange = async (val: string) => {
    if (!val) {
      fetchExpenses();
      return;
    }
    try {
      const data = await expenseService.getExpensesByProject(Number(val));
      setExpenses(data);
    } catch (err) {
      toast.error("Failed to fetch project expenses");
    }
  };

  const handlePaymentModeChange = async (val: string) => {
    if (!val) {
      fetchExpenses();
      return;
    }
    try {
      const data = await expenseService.getExpensesByPaymentMode(val);
      if (Array.isArray(data) && data.length > 0) {
        setExpenses(data);
      } else {
        const all = await expenseService.listExpenses();
        const filtered = (Array.isArray(all) ? all : []).filter(
          (item: any) => {
            const m = String(item.payment_mode || "").toLowerCase();
            const target = val.toLowerCase();
            return m === target || (target === "auto" && m.includes("auto"));
          }
        );
        setExpenses(filtered);
      }
    } catch (err) {
      try {
        const all = await expenseService.listExpenses();
        const filtered = (Array.isArray(all) ? all : []).filter(
          (item: any) => {
            const m = String(item.payment_mode || "").toLowerCase();
            const target = val.toLowerCase();
            return m === target || (target === "auto" && m.includes("auto"));
          }
        );
        setExpenses(filtered);
      } catch {
        toast.error("Failed to fetch expenses by payment mode");
      }
    }
  };

  const handleCategoryDropdownChange = async (val: string) => {
    if (!val) {
      fetchExpenses();
      return;
    }
    try {
      const res = await api.get(`/expenses/category/${val}`);
      setExpenses(res.data);
    } catch (err) {
      toast.error(`Failed to fetch ${val} expenses`);
    }
  };

  const handleCategoryClick = async (category: string) => {
    try {
      const data = await expenseService.getExpensesByCategory(category);
      setExpenses(data);
      toast.success(`Filtered by ${category}`);
    } catch (err) {
      toast.error(`Failed to fetch ${category} expenses`);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      await expenseService.updateExpense(formData.id, formData);
      toast.success("Expense updated successfully!");
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to update expense");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await expenseService.deleteExpense(deleteTarget);
      toast.success("Expense deleted successfully!");
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to delete expense");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Client-side search filtering
  const filteredExpenses = expenses.filter((expense: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = `exp-${expense.id}`.includes(q);
    const descMatch = (expense.description || "").toLowerCase().includes(q);
    const catMatch = (expense.category || "").toLowerCase().includes(q);
    const modeMatch = (expense.payment_mode || "").toLowerCase().includes(q);
    const proj = projects.find(p => String(p.id) === String(expense.project_id) || String(p.project_id) === String(expense.project_id));
    const projMatch = (proj?.project_name || proj?.name || expense.project_name || expense.project_id?.toString() || "").toLowerCase().includes(q);
    return idMatch || descMatch || catMatch || modeMatch || projMatch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, expenses, startDate, endDate]);

  const totalPages = Math.ceil(filteredExpenses.length / recordsPerPage);
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">All Expense Entrys</h3>
          <div className="flex gap-3">
            <input type="text" placeholder="Search expense entry..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-xl px-4 py-2.5 w-64 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
            <select onChange={e => handleProjectChange(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer">
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.project_name || p.name || p.id}</option>
              ))}
            </select>
            <select onChange={e => handleCategoryDropdownChange(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer">
              <option value="">All Categories</option>
              <option value="Construction">Construction</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Fuel">Fuel</option>
              <option value="Travel">Travel</option>
              <option value="Material">Material</option>
            </select>
            <select onChange={e => handlePaymentModeChange(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer">
              <option value="">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
              <option value="auto">Auto Payment</option>
            </select>
            <input type="date" value={startDate} onChange={e => handleDateChange('start', e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-slate-600" />
            <input type="date" value={endDate} onChange={e => handleDateChange('end', e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-slate-600" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Expense No", "Date", "Category", "Project", "Description", "Amount", "Payment Mode", "BOQ Item", "Actions"].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedExpenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4 text-xs font-bold text-slate-800">EXP-{e.id}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-500">{e.expense_date}</td>
                  <td className="px-5 py-4 text-xs font-bold">
                    <span onClick={() => handleCategoryClick(e.category)} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors">{e.category}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-600">
                    {(() => {
                      const p = projects.find(x => String(x.id) === String(e.project_id) || String(x.project_id) === String(e.project_id));
                      return p ? (p.project_name || p.name || `Project ${e.project_id}`) : (e.project_name || (e.project_id ? `Project ${e.project_id}` : "—"));
                    })()}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-500 max-w-[200px] truncate">{e.description}</td>
                  <td className="px-5 py-4 text-sm font-black text-rose-500">{fmt(e.amount)}</td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-600">{e.payment_mode}</td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-600">{e.boq_item_id ? (boqMap[e.boq_item_id] || e.boq_item_name || `BOQ #${e.boq_item_id}`) : "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingExpense(e)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingExpense(e)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(e.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm font-semibold text-slate-400">
                    No expense entries found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
            <select
              value={recordsPerPage}
              onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredExpenses.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filteredExpenses.length)} of {filteredExpenses.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EditExpenseModal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} expense={editingExpense} onSubmit={handleEditSubmit} projects={projects} />
      <ViewExpenseModal isOpen={!!viewingExpense} onClose={() => setViewingExpense(null)} expense={viewingExpense} projects={projects} />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </>
  );
};

const ProjectCostAllocationSection = () => {
  const [data, setData] = useState<{ projects: any[]; recent: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const fmt = (num: number) => `₹${Number(num).toLocaleString("en-IN")}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await expenseService.getProjectAllocations();
        setData(res);
      } catch (err) {
        toast.error("Failed to fetch project allocations");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400 font-bold">Loading allocations...</div>;
  if (!data) return <div className="p-10 text-center text-slate-400 font-bold">No data found</div>;

  const selectedProject = data.projects && data.projects.length > 0 ? (data.projects[selectedProjectIndex] || data.projects[0]) : null;

  const totalPages = Math.ceil((data.recent?.length || 0) / recordsPerPage);
  const paginatedRecent = (data.recent || []).slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.projects?.map((p, i) => {
          const isSelected = selectedProjectIndex === i;
          return (
            <div
              key={p.project_name}
              onClick={() => setSelectedProjectIndex(i)}
              className={`bg-white rounded-2xl shadow-sm border p-5 cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-100 hover:border-primary/40'}`}
            >
              <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center text-xl mb-3">🏢</div>
              <h4 className="font-bold text-slate-800">{p.project_name}</h4>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Total Allocated: {fmt(p.total_allocated || 0)}</p>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Allocation Details - {selectedProject.project_name}</h3>
          </div>
          <div className="p-6">
            <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Material Cost</span>
                <span className="font-bold text-slate-800">{fmt(selectedProject.material_cost || 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Labor Cost</span>
                <span className="font-bold text-slate-800">{fmt(selectedProject.labour_cost || 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Equipment Cost</span>
                <span className="font-bold text-slate-800">{fmt(selectedProject.equipment_cost || 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Other Expense</span>
                <span className="font-bold text-slate-800">{fmt(selectedProject.other_expense || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-black text-slate-800">Total Allocated</span>
                <span className="font-black text-primary text-lg">{fmt(selectedProject.total_allocated || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Details Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Recent Allocations</h3>
          <p className="text-xs text-slate-400 mt-0.5">Detailed breakdown of project cost allocations</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Project Name", "Expense Category", "Amount", "Allocated Date", "Cost Center"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRecent.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-primary">{r.project_name}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">{r.expense_category}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(r.amount || 0)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.allocated_date}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.cost_center}</td>
                </tr>
              ))}
              {(!data.recent || data.recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm font-semibold">No recent allocations</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
            <select
              value={recordsPerPage}
              onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {(!data.recent || data.recent.length === 0) ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, data.recent?.length || 0)} of {data.recent?.length || 0} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Expense Ledger
const ExpenseLedgerSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fmt = (num: number) => `₹${Number(num).toLocaleString("en-IN")}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await expenseService.getExpenseLedger();
        setData(res);
      } catch (err) {
        toast.error("Failed to fetch expense ledger");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = data.filter(row =>
    (row.particular && row.particular.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (row.date && row.date.includes(searchQuery))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Expense Ledger</h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Expense Ledger Entries</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search ledger..."
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 w-64 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-bold">Loading ledger...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Particular", "Debit", "Credit", "Running Balance"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-slate-800">{row.date}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">{row.particular}</td>
                    <td className="px-4 py-4 text-xs font-bold text-rose-500">{row.debit ? fmt(row.debit) : "-"}</td>
                    <td className="px-4 py-4 text-xs font-bold text-emerald-500">{row.credit ? fmt(row.credit) : "-"}</td>
                    <td className="px-4 py-4 text-xs font-bold text-blue-600">{fmt(row.running_balance)}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm font-semibold">No ledger entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filteredData.length)} of {filteredData.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BOQComparisonSection = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [boqData, setBoqData] = useState<any>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBoq, setLoadingBoq] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fmt = (num: number) => `₹${Number(num).toLocaleString("en-IN")}`;

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await projectService.getProjects(100);
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        setProjects(items);
        if (items.length > 0) {
          setSelectedProjectId(items[0].id || items[0].project_id);
        }
      } catch (err) {
        toast.error("Failed to fetch projects");
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch BOQ & Summary when project changes
  const [expenseSummary, setExpenseSummary] = useState<any>(null);

  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchBoqAndSummary = async () => {
      try {
        setLoadingBoq(true);
        setBoqData(null);
        setExpenseSummary(null);
        
        // Fetch BOQ Comparison
        const resBoq = await expenseService.getBoqComparison(selectedProjectId);
        setBoqData(resBoq);

        // Fetch missing Expense Summary API
        const resSummary = await expenseService.getProjectExpenseSummary(selectedProjectId);
        setExpenseSummary(resSummary);
      } catch (err) {
        toast.error("Failed to fetch BOQ or Expense Summary");
      } finally {
        setLoadingBoq(false);
      }
    };
    fetchBoqAndSummary();
  }, [selectedProjectId]);

  // Normalize: API may return array or { items: [] } or { boq_items: [] }
  const boqItems: any[] = boqData
    ? (Array.isArray(boqData) ? boqData : (boqData.items || boqData.boq_items || boqData.comparisons || []))
    : [];

  const filteredItems = boqItems.filter(item =>
    (item.item_name || item.boq_item || item.description || "")
      .toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProjectId]);

  const totalPages = Math.ceil(filteredItems.length / recordsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">BOQ Comparison</h2>
        </div>
        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Select Project:</label>
          {loadingProjects ? (
            <div className="text-xs text-slate-400 font-semibold">Loading projects...</div>
          ) : (
            <select
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 font-semibold text-slate-700 min-w-[200px]"
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.name || p.project_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Project Expense Summary (Newly integrated API) */}
      {!loadingBoq && expenseSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Project Expense</p>
              <p className="text-xl font-black text-rose-500">{fmt(expenseSummary.total_expense || 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-lg">💰</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Allocated BOQ</p>
              <p className="text-xl font-black text-blue-600">
                {fmt(boqItems.reduce((sum, item) => sum + (item.estimated ?? item.boq_amount ?? ((item.boq_qty * item.boq_rate) || 0)), 0))}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📈</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">All BOQ Comparisons</h3>
          <input
            type="text"
            placeholder="Search BOQ items..."
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 w-64 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          {loadingBoq ? (
            <div className="p-10 text-center text-slate-400 font-bold">Loading BOQ comparison...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["BOQ Item", "Estimated Amount", "Actual Amount", "Variance"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedItems.map((item, i) => {
                  const boqAmt = item.estimated ?? item.boq_amount ?? ((item.boq_qty * item.boq_rate) || 0);
                  const actualAmt = item.actual ?? item.actual_amount ?? item.actual_expense ?? 0;
                  const variance = item.variance ?? (boqAmt - actualAmt);
                  const isOver = variance < 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-xs font-bold text-slate-800">{item.item_name || item.boq_item || item.description || "-"}</td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-800">{fmt(boqAmt)}</td>
                      <td className={`px-4 py-4 text-xs font-bold ${isOver ? "text-rose-500" : "text-emerald-500"}`}>{fmt(actualAmt)}</td>
                      <td className={`px-4 py-4 text-xs font-bold ${isOver ? "text-rose-500" : "text-emerald-500"}`}>{isOver ? `-${fmt(Math.abs(variance))}` : fmt(variance)}</td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && !loadingBoq && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-sm font-semibold">
                      {selectedProjectId ? "No BOQ comparison data found for this project." : "Select a project to view BOQ comparison."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loadingBoq && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filteredItems.length)} of {filteredItems.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "expense-entry" | "boq-comparison";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "expense-entry", label: "Expense Entry" },
  { key: "boq-comparison", label: "BOQ Comparison" },
];

const ExpenseEntryWrapper = () => {
  const [activeSubTab, setActiveSubTab] = useState("expense-list");

  const tabs = [
    { key: "expense-list", label: "Expense List" },
    { key: "project-expenses", label: "Project Expenses" },
    { key: "expense-ledger", label: "Expense Ledger" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 w-fit border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center justify-center px-5 py-2 rounded-lg text-[13.5px] font-bold whitespace-nowrap transition-all ${activeSubTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeSubTab === "expense-list" && <ExpenseListSection />}
        {activeSubTab === "project-expenses" && <ProjectCostAllocationSection />}
        {activeSubTab === "expense-ledger" && <ExpenseLedgerSection />}
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateRows, setTemplateRows] = useState<any[]>([]);

  const templateCols = ["Date", "Category", "Project", "Description", "Amount", "Payment Mode", "BOQ Item"];

  useEffect(() => {
    setTemplateRows([
      { "Date": "2026-07-21", "Category": "Construction", "Project": "Metro", "Description": "Steel Purchase", "Amount": "10000", "Payment Mode": "Online", "BOQ Item": "Sand & Cement" }
    ]);
  }, []);

  const handleExport = async () => {
    try {
      toast.loading("Exporting...", { id: "export" });
      const blob = await expenseService.exportExpenses();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expenses_export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful!", { id: "export" });
    } catch (error) {
      toast.error("Failed to export", { id: "export" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Importing...", { id: "import" });
      await expenseService.importExpenses(file);
      toast.success("Expenses imported successfully!", { id: "import" });
      window.dispatchEvent(new Event('expense-created'));
    } catch (error) {
      toast.error("Failed to import", { id: "import" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveTemplate = () => {
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(templateRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Expense_Template.csv");
      toast.success("Template saved and downloaded!");
      setIsTemplateModalOpen(false);
    }).catch(() => {
      toast.error("Failed to generate template");
    });
  };

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "dashboard": "dashboard",
      "expense-entry": "expense-entry",
      "boq-comparison": "boq-comparison",
    };
    return map[currentSub || ""] || "dashboard";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/expenses/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Expenses" breadcrumb={["Accountant", "Expenses"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expenses</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track your expense records, ledgers, and BOQ comparisons.</p>
          </div>
          {activeTab === "expense-entry" && (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <span className="text-lg">📄</span> Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <span className="text-lg">📥</span> Import
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls,.csv" />
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <span className="text-lg">📤</span> Export
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
                <span className="text-base leading-none"></span> Create Expense
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-[13.5px] font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard" && <ExpenseEntrySection />}
        {activeTab === "expense-entry" && <ExpenseEntryWrapper />}
        {activeTab === "boq-comparison" && <BOQComparisonSection />}
      </PageTransition>

      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Fill Excel Template"
      >
        <div className="p-4 flex flex-col h-full">
          <p className="text-sm text-slate-500 mb-4">Add your expense details below. This will be saved as an Excel file which you can then import.</p>
          <div className="overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full text-left border-collapse select-none">
              <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                <tr>
                  <th className="w-10 border border-slate-300 p-1 text-center text-xs font-normal text-slate-500 bg-[#f8f9fa]"></th>
                  {templateCols.map((col, i) => (
                    <th key={col} className="border border-slate-300 p-1.5 text-center text-xs font-normal text-slate-600 bg-[#f8f9fa] min-w-[120px]">
                      {String.fromCharCode(65 + i)} ({col})
                    </th>
                  ))}
                  <th className="border border-slate-300 p-1.5 text-center text-xs font-normal text-slate-600 bg-[#f8f9fa] w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1 text-center text-xs font-normal text-slate-500 bg-[#f8f9fa]">1</td>
                  {templateCols.map(col => (
                    <td key={col} className="border border-slate-300 p-1 text-sm font-semibold text-slate-800 bg-white">{col}</td>
                  ))}
                  <td className="border border-slate-300 bg-white"></td>
                </tr>
                {templateRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1 text-center text-xs font-normal text-slate-500 bg-[#f8f9fa]">{idx + 2}</td>
                    {templateCols.map(col => (
                      <td key={col} className="border border-slate-300 bg-white p-0 relative">
                        <input
                          className="w-full h-full absolute inset-0 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 bg-transparent"
                          value={row[col] || ""}
                          onChange={(e) => {
                            const newRows = [...templateRows];
                            newRows[idx][col] = e.target.value;
                            setTemplateRows(newRows);
                          }}
                        />
                        <div className="px-2 py-1.5 invisible text-sm">H</div>
                      </td>
                    ))}
                    <td className="border border-slate-300 bg-white p-0 text-center">
                      <button onClick={() => setTemplateRows(templateRows.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 transition-colors w-full h-full flex items-center justify-center p-1.5">
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              const newRow: any = {};
              templateCols.forEach(c => newRow[c] = "");
              setTemplateRows([...templateRows, newRow]);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2 self-start flex items-center gap-1"
          >
            + Add Row
          </button>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setIsTemplateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm transition-all">Cancel</button>
            <button onClick={handleSaveTemplate} className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-sm shadow-sm transition-all">Save Template</button>
          </div>
        </div>
      </Modal>

      <CreateExpenseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default ExpensesPage;
