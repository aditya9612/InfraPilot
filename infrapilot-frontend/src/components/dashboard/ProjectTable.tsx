interface Project {
  id: string;
  name: string;
  progress: number;
  status: "On Track" | "At Risk" | "Delayed";
  type: string;
  city: string;
  startDate: string;
  endDate: string;
  budgetUsed: number;
  totalBudget: number;
}

const projects: Project[] = [
  {
    id: "1",
    name: "Skyline Residency Phase 1",
    progress: 75,
    status: "On Track",
    type: "Construction",
    city: "Pune",
    startDate: "Jan 12, 2024",
    endDate: "Dec 15, 2025",
    budgetUsed: 12000000,
    totalBudget: 15000000,
  },
  {
    id: "2",
    name: "Metropolis Commercial Hub",
    progress: 40,
    status: "Delayed",
    type: "Infrastructure",
    city: "Mumbai",
    startDate: "Mar 05, 2024",
    endDate: "Oct 20, 2026",
    budgetUsed: 8000000,
    totalBudget: 25000000,
  },
  {
    id: "3",
    name: "Green Valley Smart City",
    progress: 60,
    status: "At Risk",
    type: "Construction",
    city: "Bangalore",
    startDate: "Feb 20, 2024",
    endDate: "Jun 30, 2026",
    budgetUsed: 15000000,
    totalBudget: 40000000,
  },
  {
    id: "4",
    name: "Coastal Bridge Project",
    progress: 25,
    status: "On Track",
    type: "Infrastructure",
    city: "Goa",
    startDate: "May 10, 2024",
    endDate: "Dec 20, 2027",
    budgetUsed: 4500000,
    totalBudget: 18000000,
  },
];

const ProjectTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">
          Project Performance Overview
        </h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            Filters
          </button>
          <button className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            Sort
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Project & Type
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                Budget Utilization
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {project.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">
                      {project.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: INF-{project.id}092
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-600">{project.city}</p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.status === "On Track"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : project.status === "At Risk"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>{project.startDate}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{project.endDate}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="text-sm font-bold text-slate-700">
                    ₹{(project.budgetUsed / 10000000).toFixed(1)}Cr
                  </p>
                  <p className="text-[10px] text-slate-400">
                    of ₹{(project.totalBudget / 10000000).toFixed(1)}Cr
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50/30 border-t border-slate-100 text-center">
        <button className="text-sm font-semibold text-primary hover:underline">
          View All Projects
        </button>
      </div>
    </div>
  );
};

export default ProjectTable;
