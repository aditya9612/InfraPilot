interface Activity {
  id: string;
  type: "Report" | "Update" | "Alert" | "Approval";
  description: string;
  time: string;
  user: string;
}

const activities: Activity[] = [
  { id: "1", type: "Report", description: "Daily construction report submitted for Skyline Residency", time: "10 mins ago", user: "Rahul S." },
  { id: "2", type: "Update", description: "BOQ updated for Metropolis Commercial Hub", time: "45 mins ago", user: "You" },
  { id: "3", type: "Alert", description: "Material shortage reported at Green Valley site", time: "2 hours ago", user: "Amit K." },
  { id: "4", type: "Approval", description: "New task approval pending for Coastal Bridge", time: "3 hours ago", user: "Priya M." },
];

const ActivityFeed = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800">Recent Activity Feed</h3>
        <button className="text-xs text-primary font-semibold hover:underline">Clear All</button>
      </div>
      <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-8">
            <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4 ring-white ${
              activity.type === "Alert" ? "bg-rose-500" :
              activity.type === "Report" ? "bg-emerald-500" :
              activity.type === "Approval" ? "bg-amber-500" : "bg-blue-500"
            }`} />
            <div className="space-y-1">
              <p className="text-xs text-slate-700 leading-relaxed italic">
                <span className="font-bold not-italic">{activity.description}</span>
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="font-medium text-slate-500">{activity.user}</span>
                <span>•</span>
                <span>{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
