import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { ArrowRight } from "lucide-react";
import { CustomSelect } from "../common/CustomDropdown";

const TransferEquipmentModal = ({ isOpen, onClose, equipmentList, projects, onSubmit }: any) => {
    const [formData, setFormData] = useState({
        equipment_id: "",
        source_project_id: "",
        target_project_id: ""
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                equipment_id: "",
                source_project_id: "",
                target_project_id: ""
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
                    <div className="md:col-span-2 relative z-30 focus-within:z-40">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Equipment <span className="text-rose-500">*</span></label>
                        <CustomSelect
                            value={formData.equipment_id}
                            onChange={(val: any) => {
                                const eq = equipmentList.find((x: any) => String(x.id) === String(val));
                                setFormData(prev => ({ ...prev, equipment_id: val ? String(val) : "", source_project_id: eq?.project_id ? String(eq.project_id) : "" }));
                            }}
                            options={equipmentList.map((eq: any) => ({
                                id: String(eq.id),
                                label: `${eq.equipment_name} (Code: ${eq.equipment_code})`
                            }))}
                            placeholder="-- Choose Equipment --"
                            maxHeight="max-h-48"
                            placement="bottom"
                            searchable={equipmentList.length > 5}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 relative z-20 focus-within:z-40">
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

                        <div className="flex-1 w-full relative z-20 focus-within:z-40">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Project <span className="text-rose-500">*</span></label>
                            <CustomSelect
                                value={formData.target_project_id}
                                onChange={(val: any) => setFormData({ ...formData, target_project_id: val ? String(val) : "" })}
                                options={[
                                    { id: "0", label: "Global / Unassigned" },
                                    ...projects.filter((p: any) => p.id !== Number(formData.source_project_id)).map((p: any) => ({
                                        id: String(p.id),
                                        label: p.project_name || p.name || `Project #${p.id}`
                                    }))
                                ]}
                                placeholder="-- Choose Target Project --"
                                maxHeight="max-h-48"
                                placement="bottom"
                                searchable={projects.length > 5}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 border border-transparent transition-all shadow-md active:scale-95">
                        Initiate Transfer
                    </button>
                </div>
            </form>
        </Modal >
    );
};

export default TransferEquipmentModal;
