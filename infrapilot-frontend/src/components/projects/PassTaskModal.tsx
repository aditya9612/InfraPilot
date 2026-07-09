import { useState } from "react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";

interface PassTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: any | null;
    members: any[];
    onSubmit: (data: { new_user_id: number; remark: string }) => Promise<void>;
}

const PassTaskModal = ({
    isOpen,
    onClose,
    task,
    members,
    onSubmit,
}: PassTaskModalProps) => {
    const [userId, setUserId] = useState<string>("");
    const [remark, setRemark] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Exclude current assigned user
    const availableMembers = members.filter(
        (m) =>
            String(m.user_id) !== String(task?.assigned_user_id) &&
            m.user_id !== task?.assigned_user_id
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            toast.error("Please select a user to pass the task to.");
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                new_user_id: Number(userId),
                remark,
            });
            setUserId("");
            setRemark("");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    if (!task) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Pass / Delegate Task"
            maxWidth="max-w-md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="pass-task-form"
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : "Pass Task"}
                    </button>
                </>
            }
        >
            <form id="pass-task-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        New Assigned User <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all cursor-pointer"
                        required
                    >
                        <option value="">Select User</option>
                        {availableMembers.map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                                {m.full_name || m.user?.name || m.email || `User ${m.user_id}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Remark / Reason
                    </label>
                    <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Why is this task being passed?"
                        className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all min-h-[100px] resize-none"
                    />
                </div>
            </form>
        </Modal>
    );
};

export default PassTaskModal;
