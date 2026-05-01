import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import type { ChecklistRecord, ChecklistItem, CreateChecklistRequest } from '../../types/checklist';

interface CreateChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateChecklistRequest) => Promise<void>;
    initialData?: ChecklistRecord | null;
}

const CreateChecklistModal: React.FC<CreateChecklistModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData
}) => {
    const [formData, setFormData] = useState({
        checklist_name: "",
        remarks: "",
        project_id: 1,
    });
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newItemTask, setNewItemTask] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                checklist_name: initialData.checklist_name,
                remarks: initialData.remarks,
                project_id: initialData.project_id,
            });
            setItems([...initialData.item_list]);
        } else {
            setFormData({
                checklist_name: "",
                remarks: "",
                project_id: 1,
            });
            setItems([]);
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const addItem = () => {
        if (!newItemTask.trim()) return;
        setItems(prev => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), task: newItemTask.trim(), status: "Pending" }
        ]);
        setNewItemTask("");
        if (errors.items) setErrors(prev => { const u = { ...prev }; delete u.items; return u; });
    };

    const toggleItemStatus = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: item.status === "Done" ? "Pending" : "Done" } : item
        ));
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.checklist_name.trim()) errs.checklist_name = "Required";
        if (items.length === 0) errs.items = "Add at least one verification point";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                ...formData,
                item_list: items,
            });
            onClose();
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setErrors({}); }}
            title={initialData ? "Modify Audit Definition" : "Initiate Site Checklist"}
            maxWidth="max-w-4xl"
            footer={
                <>
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        form="checklist-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? "Processing..." : initialData ? "Update Log" : "Confirm Entry"}
                    </button>
                </>
            }
        >
            <form id="checklist-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Checklist Identity</h3>
                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className={labelClasses}>Checklist Name / Headline <span className="text-rose-500">*</span></label>
                            <input
                                name="checklist_name"
                                value={formData.checklist_name}
                                onChange={handleInputChange}
                                placeholder="e.g. Site Opening Inventory Check"
                                className={inputClasses(errors.checklist_name)}
                            />
                            {errors.checklist_name && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.checklist_name}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Verification Matrix</h3>
                    <div className="space-y-5">
                        <div className="flex gap-4">
                            <input
                                value={newItemTask}
                                onChange={(e) => setNewItemTask(e.target.value)}
                                placeholder="Add a verification point..."
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Add Point
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.length > 0 ? (
                                items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 group transition-all hover:bg-slate-50">
                                        <div className="flex items-center gap-4 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleItemStatus(item.id)}
                                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.status === "Done" ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"}`}
                                            >
                                                {item.status === "Done" && <span className="text-white text-[10px] font-black">✓</span>}
                                            </button>
                                            <span className={`text-sm font-semibold transition-all ${item.status === "Done" ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.task}</span>
                                        </div>
                                        <button type="button" onClick={() => deleteItem(item.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 font-bold italic">Verification points pending...</p>
                                </div>
                            )}
                            {errors.items && <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1">{errors.items}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Technical Remarks</h3>
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClasses}>Registry Observations</label>
                        <textarea
                            name="remarks"
                            rows={3}
                            value={formData.remarks}
                            onChange={handleInputChange}
                            placeholder="Additional site observations or technical notes..."
                            className={`${inputClasses()} resize-none`}
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateChecklistModal;
