import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { ArrowRight } from "lucide-react";

const TransferEquipmentModal = ({ isOpen, onClose, equipmentList, projects, onSubmit }: any) => {
    const [formData, setFormData] = useState({
        equipment_id: "",
        source_project_id: "",
        target_project_id: "",
        transfer_date: new Date().toISOString().split("T")[0],
        reason: ""
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                equipment_id: "",
                source_project_id: "",
                target_project_id: "",
                transfer_date: new Date().toISOString().split("T")[0],
                reason: ""
            });
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            equipment_id: Number(formData.equipment_id),
            source_project_id: formData.source_project_id ? Number(formData.source_project_id) : null,
            to_project_id: Number(formData.target_project_id),
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transfer Equipment" maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Equipment *</label>
                        <select
                            value={formData.equipment_id}
                            onChange={e => {
                                const eqId = e.target.value;
                                const eq = equipmentList.find((x: any) => x.id === Number(eqId));
                                setFormData(prev => ({ ...prev, equipment_id: eqId, source_project_id: eq?.project_id || "" }));
                            }}
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        >
                            <option value="">-- Choose Equipment --</option>
                            {equipmentList.map((eq: any) => (
                                <option key={eq.id} value={eq.id}>{eq.equipment_name} (Code: {eq.equipment_code})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Source Project</label>
                            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 cursor-not-allowed">
                                {formData.source_project_id
                                    ? projects.find((p: any) => p.id === Number(formData.source_project_id))?.project_name || "Unknown Project"
                                    : "Global / Unassigned"}
                            </div>
                        </div>

                        <div className="hidden md:flex mt-6 bg-slate-100 rounded-full p-2 text-slate-400">
                            <ArrowRight className="w-4 h-4" />
                        </div>

                        <div className="flex-1 w-full">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Project *</label>
                            <select
                                value={formData.target_project_id}
                                onChange={e => setFormData({ ...formData, target_project_id: e.target.value })}
                                required
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            >
                                <option value="">-- Choose Target Project --</option>
                                <option value="0">Global / Unassigned</option>
                                {projects.filter((p: any) => p.id !== Number(formData.source_project_id)).map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transfer Date *</label>
                        <input
                            type="date"
                            value={formData.transfer_date}
                            onChange={e => setFormData({ ...formData, transfer_date: e.target.value })}
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Transfer *</label>
                        <input
                            type="text"
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            placeholder="e.g. Moved for excavation work..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 border border-transparent transition-all shadow-md active:scale-95">
                        Initiate Transfer
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TransferEquipmentModal;
