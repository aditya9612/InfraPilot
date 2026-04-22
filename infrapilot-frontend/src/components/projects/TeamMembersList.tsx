import toast from "react-hot-toast";
import type { ProjectMember } from "../../types/project";

interface TeamMembersListProps {
  members: ProjectMember[];
  onAssignClick?: () => void;
  onRemoveMember?: (id: number) => void;
}

const TeamMembersList = ({ members, onAssignClick, onRemoveMember }: TeamMembersListProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">Team Members</h3>
        <button 
          onClick={onAssignClick}
          className="text-xs font-bold text-primary hover:underline"
        >
          + Assign Member
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-50 hover:border-slate-100 transition-all group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              {member.full_name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700 truncate">{member.full_name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{member.role}</p>
            </div>
            <div className="flex items-center gap-2 transition-opacity">
              <button 
                onClick={() => onRemoveMember && onRemoveMember(member.user_id)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove Member"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">👥</p>
            <p className="text-sm font-medium text-slate-400">No members assigned</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
          {members.length} Total Contributors
        </p>
      </div>
    </div>
  );
};

export default TeamMembersList;
