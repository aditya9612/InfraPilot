import { useState } from "react";
import Modal from "../common/Modal";

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
    const [formNotification, setFormNotification] = useState<{ type: 'error' | 'success', message: string, fields?: string[] } | null>(null);

    const inputClasses = (error?: boolean) => `w-full px-4 py-2.5 bg-white border ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} rounded-xl text-sm outline-none transition-all cursor-pointer`;

    // Exclude current assigned user
    const availableMembers = members.filter(
        (m) =>
            String(m.user_id) !== String(task?.assigned_user_id) &&
            m.user_id !== task?.assigned_user_id
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setFormNotification({ type: 'error', message: 'Please fill in all mandatory details correctly.', fields: ['New Assigned User'] });
            setTimeout(() => setFormNotification(null), 5000);
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
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideDownIn {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}} />
            
            {/* Top-right floating toast */}
            {formNotification && (
                <div
                    style={{
                        position: 'fixed',
                        top: '18px',
                        right: '18px',
                        zIndex: 99999,
                        minWidth: '260px',
                        maxWidth: '380px',
                        animation: 'slideDownIn 0.32s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <style>{`
            @keyframes slideDownIn {
              from { opacity: 0; transform: translateY(-16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
                    <div
                        className="bg-white rounded-2xl flex items-start gap-3 px-4 py-3.5"
                        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)', border: '1px solid #f1f5f9' }}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${formNotification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}>
                            <span className="text-white text-xs font-bold">{formNotification.type === 'error' ? '×' : '✓'}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">
                            {formNotification.type === 'error'
                                ? `Please fill in all mandatory details correctly. \nMissing: ${(formNotification.fields || []).join(', ')}`
                                : formNotification.message}
                        </p>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-slate-300 hover:text-slate-500 text-base leading-none ml-1 mt-0.5">×</button>
                    </div>
                </div>
            )}

            <form id="pass-task-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Inline Validation Error Banner */}
                {formNotification && formNotification.type === 'error' && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-600">Validation Error</p>
                            <p className="text-xs text-red-500 mt-0.5">Please provide all required information to continue.</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(formNotification.fields || []).map(field => (
                                    <span key={field} className="px-2 py-1 bg-white border border-red-100 rounded text-[10px] font-bold text-red-600 uppercase tracking-wider">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button type="button" onClick={() => setFormNotification(null)} className="text-red-300 hover:text-red-500 text-base leading-none">×</button>
                    </div>
                )}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        New Assigned User <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className={inputClasses(formNotification !== null)}
                    >
                        <option value="">Select User</option>
                        {availableMembers.map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                                {m.full_name || m.user?.name || m.email || `User ${m.user_id}`}
                            </option>
                        ))}
                    </select>
                    {formNotification !== null && !userId && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 uppercase tracking-wider">REQUIRED</p>}
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
