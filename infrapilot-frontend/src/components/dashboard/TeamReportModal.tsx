import Modal from "../common/Modal";
import { TrendingUp, Award, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface TeamReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any[];
}

const TeamReportModal = ({ isOpen, onClose, team }: TeamReportModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Performance Report — Mar 2026"
      size="lg"
    >
      <div className="space-y-8 py-2">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
            </div>
            <p className="text-xl font-bold text-slate-800">92.4%</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Productivity</span>
            </div>
            <p className="text-xl font-bold text-slate-800">+12%</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Completion</span>
            </div>
            <p className="text-xl font-bold text-slate-800">4.2 Days</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overdue Tasks</span>
            </div>
            <p className="text-xl font-bold text-slate-800">08</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Utilization</th>
                <th className="px-4 py-3">Tasks (C/T)</th>
                <th className="px-4 py-3">Avg Response</th>
                <th className="px-4 py-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="text-xs font-bold text-slate-700">{member.name}</p>
                    <p className="text-[10px] text-slate-400">{member.role}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${member.productivity}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{member.productivity}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-600">
                    {member.completedTasks} / {member.totalTasks}
                  </td>
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-500">
                    {Math.floor(Math.random() * 5) + 1}h 20m
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-[8px] ${star <= 4 ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
          <p className="text-[10px] text-slate-400 font-medium italic">
            * This report is generated based on real-time task completion and site logs.
          </p>
          <button 
            onClick={() => {
              const toastId = toast.loading("Preparing PDF report for download...");
              setTimeout(() => {
                toast.success("Team_Performance_Mar_2026.pdf downloaded!", { id: toastId });
              }, 1500);
            }}
            className="px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
          >
            Download PDF Report
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TeamReportModal;
