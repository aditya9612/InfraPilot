import React from "react";
import Modal from "../../../components/common/Modal";
import { Link2 } from "lucide-react";

interface EquipmentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: any;
    projectsMap?: Record<number, string>;
    onEdit?: () => void;
}

const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-500 text-white',
    'REPAIR': 'bg-orange-500 text-white',
    'DAMAGED': 'bg-red-500 text-white',
    'MAINTENANCE': 'bg-blue-500 text-white',
};

const EquipmentViewModal: React.FC<EquipmentViewModalProps> = ({
    isOpen,
    onClose,
    equipment,
    projectsMap = {},
    onEdit
}) => {
    if (!equipment) return null;

    const conditionStr = (equipment.condition || "UNKNOWN").toUpperCase();
    const conditionColorClass = conditionColors[conditionStr] || "bg-slate-500 text-white";

    // For the banner color, use the same base color but maybe slightly customized
    const getBannerColor = (cond: string) => {
        if (cond === 'GOOD') return 'bg-emerald-500';
        if (cond === 'REPAIR') return 'bg-orange-500';
        if (cond === 'DAMAGED') return 'bg-rose-500';
        if (cond === 'MAINTENANCE') return 'bg-blue-500';
        return 'bg-slate-500';
    };

    const projectName = equipment.project_id
        ? (projectsMap[equipment.project_id] || `Project ${equipment.project_id}`)
        : "Unassigned (Global)";

    const modalFooter = (
        <div className="flex w-full justify-between gap-3 mt-2">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
                CLOSE
            </button>
            <button
                onClick={onEdit}
                className="flex-1 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
            >
                EDIT DETAILS
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Equipment Details"
            maxWidth="max-w-lg"
            footer={modalFooter}
        >
            <div className="flex flex-col gap-5 pb-2">

                {/* Header Banner */}
                <div className={`${getBannerColor(conditionStr)} rounded-2xl p-6 shadow-sm`}>
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-2xl font-black text-white">{equipment.equipment_name || "Unknown Asset"}</h2>
                        <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-bold rounded-lg tracking-wider">
                            {equipment.equipment_code || "N/A"}
                        </span>
                    </div>
                    <div className="inline-block px-3 py-1 bg-white/20 rounded-lg backdrop-blur-sm border border-white/20">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">
                            CONDITION: {conditionStr}
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OPERATOR</p>
                            <p className="font-bold text-slate-800">{equipment.operator_name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJECT</p>
                            <p className="font-bold text-slate-800">{projectName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">WORKING HOURS</p>
                            <p className="font-bold text-slate-800">{equipment.working_hours ?? "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">FUEL USED</p>
                            <p className="font-bold text-primary">{equipment.fuel_used ?? "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RENTAL COST</p>
                            <p className="font-bold text-purple-600 font-mono text-base">
                                {equipment.rental_cost ? `₹${equipment.rental_cost.toLocaleString()}` : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MAINTENANCE DATE</p>
                            <p className="font-bold text-slate-800">{equipment.maintenance_date || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CREATED AT</p>
                            <p className="font-bold text-slate-700 text-xs">
                                {equipment.created_at ? new Date(equipment.created_at).toLocaleString() : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">UPDATED AT</p>
                            <p className="font-bold text-slate-700 text-xs">
                                {equipment.updated_at ? new Date(equipment.updated_at).toLocaleString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Allocation Banner */}
                {equipment.project_id ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">ALLOCATION STATUS</p>
                            <p className="font-bold text-blue-900 text-sm">Allocated to {projectName}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
                            <Link2 className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ALLOCATION STATUS</p>
                            <p className="font-bold text-slate-600 text-sm">Not Allocated (Available)</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default EquipmentViewModal;
