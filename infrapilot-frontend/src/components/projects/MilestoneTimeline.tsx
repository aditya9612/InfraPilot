import type { Milestone } from "../../types/project";

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

const MilestoneTimeline = ({ milestones }: MilestoneTimelineProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-bold text-slate-800">Project Milestones</h3>
        <button className="text-xs font-bold text-primary hover:underline">+ New Milestone</button>
      </div>

      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {milestones.map((milestone) => {
          const isCompleted = milestone.status === "Completed";
          const isInProgress = milestone.status === "In Progress";
          
          return (
            <div key={milestone.id} className="relative group">
              {/* Dot */}
              <div className={`absolute -left-[28px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-white z-10 transition-all ${
                isCompleted ? 'bg-success' : isInProgress ? 'bg-primary animate-pulse' : 'bg-slate-200'
              }`} />
              
              <div className={`p-4 rounded-xl border transition-all ${
                isCompleted ? 'bg-green-50/20 border-green-100/50' : 
                isInProgress ? 'bg-blue-50/20 border-blue-100/50 shadow-sm' : 
                'bg-slate-50/30 border-slate-100/50'
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold ${isCompleted ? 'text-green-800' : 'text-slate-800'}`}>
                    {milestone.title}
                  </h4>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isCompleted ? 'bg-green-100 text-success' :
                    isInProgress ? 'bg-blue-100 text-primary' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {milestone.status || 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{milestone.description}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(milestone.start_date || "").toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                    <span className="text-slate-300 mx-1">→</span>
                    {new Date(milestone.end_date || "").toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📍</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Milestones Defined</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneTimeline;
