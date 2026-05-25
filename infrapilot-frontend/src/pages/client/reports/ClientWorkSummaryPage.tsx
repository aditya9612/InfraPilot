import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface WorkSummaryItem {
  task_id: number;
  category: string;
  plan_percentage: number | string;
  actual_percentage: number | string;
  efficiency: string;
  status: string;
}

interface WorkSummaryData {
  project_id: number;
  total_tasks: number;
  work_summary: WorkSummaryItem[];
}

const DEFAULT_MOCK_DATA: WorkSummaryItem[] = [
  { task_id: 1, category: "Foundation & Piling", plan_percentage: 100, actual_percentage: 100, efficiency: "HIGH", status: "Completed" },
  { task_id: 2, category: "Basement R.C.C", plan_percentage: 100, actual_percentage: 100, efficiency: "MEDIUM", status: "Completed" },
  { task_id: 3, category: "Ground Floor Structure", plan_percentage: 100, actual_percentage: 100, efficiency: "HIGH", status: "Completed" },
  { task_id: 4, category: "Floor 1-3 Structural Slab", plan_percentage: 100, actual_percentage: 100, efficiency: "HIGH", status: "Completed" },
  { task_id: 5, category: "Floor 4 Structural Slab", plan_percentage: 100, actual_percentage: 92, efficiency: "MEDIUM", status: "In Progress" },
  { task_id: 6, category: "Internal Masonry (L1-L2)", plan_percentage: 85, actual_percentage: 72, efficiency: "LOW", status: "In Progress" },
  { task_id: 7, category: "Plumbing & Electrification", plan_percentage: 40, actual_percentage: 35, efficiency: "MEDIUM", status: "In Progress" },
];

const ClientWorkSummaryPage = () => {
  const [data, setData] = useState<WorkSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchWorkSummary = async () => {
      try {
        setLoading(true);
        const result = await reportService.getWorkSummary(projectId);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch work summary, using fallback:", err);
        // Fallback to mock data if API fails (e.g. 404 or connection issues)
        setData({
          project_id: 0,
          total_tasks: DEFAULT_MOCK_DATA.length,
          work_summary: DEFAULT_MOCK_DATA
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkSummary();
  }, [projectId]);

  const items = data?.work_summary || DEFAULT_MOCK_DATA;

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Reports", "Work Summary"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Work Summary & Efficiency</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time plan vs actual activity completion tracking</p>
            </div>
            {!loading && (
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tasks</p>
                <p className="text-2xl font-black text-primary">{data?.total_tasks || items.length}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 px-10 py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Work Category</th>
                  <th className="py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan %</th>
                  <th className="py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actual %</th>
                  <th className="py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Efficiency</th>
                  <th className="py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <span className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Authenticating Site Data...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active work categories found.</td>
                  </tr>
                ) : (
                  items.map((work, i) => {
                    const actualVal = typeof work.actual_percentage === 'string'
                      ? parseInt(work.actual_percentage)
                      : work.actual_percentage;

                    return (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-all duration-300">
                        <td className="py-8">
                          <p className="text-sm font-black text-slate-800 tracking-tight">{work.category || (work as any).activity}</p>
                        </td>
                        <td className="py-8 text-center">
                          <p className="text-sm font-bold text-slate-400">{work.plan_percentage || (work as any).plan}{typeof work.plan_percentage === 'number' ? '%' : ''}</p>
                        </td>
                        <td className="py-8 text-center">
                          <div className="flex flex-col items-center">
                            <p className="text-sm font-black text-slate-800 tracking-tighter">{work.actual_percentage || (work as any).actual}{typeof work.actual_percentage === 'number' ? '%' : ''}</p>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${actualVal}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-8 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${work.efficiency.toUpperCase() === 'HIGH' ? 'bg-emerald-50 text-emerald-600' :
                              work.efficiency.toUpperCase() === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {work.efficiency}
                          </span>
                        </td>
                        <td className="py-8 text-right pr-4">
                          <span className={`text-xs font-black ${work.status === 'Completed' ? 'text-emerald-500' : 'text-primary'}`}>{work.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientWorkSummaryPage;
