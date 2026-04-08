interface TeamMember {
  id: string;
  name: string;
  role: string;
  completedTasks: number;
  totalTasks: number;
  productivity: number;
}

const team: TeamMember[] = [
  { id: "1", name: "Rahul Sharma", role: "Site Engineer", completedTasks: 12, totalTasks: 15, productivity: 85 },
  { id: "2", name: "Priya Mehta", role: "Assistant Engineer", completedTasks: 18, totalTasks: 20, productivity: 92 },
  { id: "3", name: "Amit Kumar", role: "Safety Officer", completedTasks: 8, totalTasks: 10, productivity: 78 },
  { id: "4", name: "Suresh Varma", role: "QC Engineer", completedTasks: 15, totalTasks: 18, productivity: 88 },
];

const TeamPerformance = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800">Team Performance</h3>
        <button className="text-xs text-primary font-semibold hover:underline">Full Report</button>
      </div>
      <div className="space-y-6">
        {team.map((member) => (
          <div key={member.id} className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-700">{member.name}</span>
                <span className="text-slate-400 ml-2">{member.role}</span>
              </div>
              <span className="font-bold text-primary">{member.productivity}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${member.productivity}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{member.completedTasks} Tasks Completed</span>
              <span>{member.totalTasks} Tasks Assigned</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPerformance;
