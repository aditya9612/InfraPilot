import React, { useState, useEffect } from "react";
import { boqService } from "../../services/boqService";
import type { BoqOptimizationSuggestion } from "../../types/boq";
import { Sparkles, X, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

const OptimizationModal: React.FC<OptimizationModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [suggestions, setSuggestions] = useState<BoqOptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projectId) {
      const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
          // Based on the user sample, we use a reference ID. 
          // Let's get the project's BOQs first or use project ID if the service handles it.
          // In the user's sample, it was /api/v1/boq/{boq_id}/optimize (boq_id=1).
          const res = await boqService.getBoqSuggestions(projectId);
          setSuggestions(res.suggestions || []);
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Smart Cost Analysis</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">AI-Powered Optimization Suggestions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Analyzing budget performance...</p>
            </div>
          ) : !projectId ? (
             <div className="text-center py-10">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-slate-500 font-bold">Please select a project to analyze</p>
             </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50 rounded-[24px] border border-emerald-100 p-8">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-emerald-800">Perfectly Optimized!</h4>
              <p className="text-sm text-emerald-600 font-medium max-w-sm mx-auto mt-2">
                All items in this project are currently within budget limits. No overruns detected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="group p-5 bg-white border border-slate-100 rounded-[24px] hover:border-amber-200 hover:bg-amber-50/10 transition-all flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-base">{suggestion.item}</h4>
                      <span className="text-sm font-bold text-rose-500">
                        +₹{suggestion.over_budget_by.toLocaleString()} Over
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">
                      "{suggestion.suggestion}"
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-lg hover:bg-amber-200 transition-colors">
                        Apply Fix
                      </button>
                      <button className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-200 transition-colors">
                        Ignore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Live Insights Enabled
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptimizationModal;
