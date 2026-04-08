interface Task {
  id: string;
  name: string;
  assignedTo: string;
  deadline: string;
  status: "Pending" | "In Progress" | "Completed";
  project: string;
}

const tasks: Task[] = [
  { id: "1", name: "Foundation Concrete Pouring", assignedTo: "Eng. Rahul S.", deadline: "Today", status: "In Progress", project: "Skyline Residency" },
  { id: "2", name: "Steel Structure Reinforcement", assignedTo: "Eng. Priya M.", deadline: "Tomorrow", status: "Pending", project: "Metropolis Hub" },
  { id: "3", name: "Electrical Layout Review", assignedTo: "Eng. Amit K.", deadline: "Mar 31", status: "Completed", project: "Green Valley" },
  { id: "4", name: "Plumbing Pressure Test", assignedTo: "Eng. Suresh V.", deadline: "Apr 02", status: "Pending", project: "Coastal Bridge" },
];

const TaskOverview = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-slate-800">Task Management Overview</h3>
        <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600">
          <option>All Projects</option>
          <option>In Progress</option>
        </select>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="group p-3 rounded-xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">{task.name}</h4>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                task.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                task.status === "In Progress" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"
              }`}>
                {task.status}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {task.assignedTo.split(" ")[1][0]}
                </div>
                <span className="text-[11px] text-slate-500">{task.assignedTo}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {task.deadline}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-5 py-2 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
        Assign New Task
      </button>
    </div>
  );
};

export default TaskOverview;
