import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { projectService } from "../../services/projectService";

interface ScheduleProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  initialStartDate?: string;
  initialEndDate?: string;
  onSuccess: () => void;
}

const ScheduleProjectModal = ({
  isOpen,
  onClose,
  projectId,
  initialStartDate = "",
  initialEndDate = "",
  onSuccess,
}: ScheduleProjectModalProps) => {
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        start_date: initialStartDate,
        end_date: initialEndDate,
      });
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.error("Both dates are required");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setIsLoading(true);
    try {
      await projectService.scheduleProject(projectId, {
        project_id: projectId,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      toast.success("Project schedule updated successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update schedule");
      console.error("Schedule update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
      >
        {isLoading ? "Updating..." : "Update Schedule"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Project"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            Updating the schedule will adjust the project's timeline tracking. 
            Ensure these dates align with your site delivery goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleProjectModal;
