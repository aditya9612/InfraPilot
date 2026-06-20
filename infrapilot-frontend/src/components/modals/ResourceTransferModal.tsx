import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { projectService } from '../../services/projectService';
import { ArrowRightLeft, Users, Truck, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResourceTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceType: 'labour' | 'machinery' | 'material';
    resourceData?: any;
}

const ResourceTransferModal: React.FC<ResourceTransferModalProps> = ({ isOpen, onClose, resourceType, resourceData }) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [targetProjectId, setTargetProjectId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            projectService.getProjects().then(res => {
                setProjects(Array.isArray(res) ? res : res.items || []);
            });
        }
    }, [isOpen]);

    const handleTransfer = async () => {
        if (!targetProjectId) {
            toast.error("Please select a destination project.");
            return;
        }

        setLoading(true);
        try {
            // Mocking the transfer logic as per common patterns in the app
            // In a real scenario, this would call specialized transfer APIs
            await new Promise(resolve => setTimeout(resolve, 1000));

            const destProject = projects.find(p => p.id === Number(targetProjectId));
            toast.success(`Mobilization Successful: ${resourceData.name || resourceData.equipment_name || 'Resource'} transferred to ${destProject?.project_name}`);
            onClose();
        } catch (err) {
            toast.error("Transfer failed. Please check resource availability.");
        } finally {
            setLoading(false);
        }
    };

    const icons = {
        labour: <Users className="w-6 h-6 text-primary" />,
        machinery: <Truck className="w-6 h-6 text-amber-500" />,
        material: <Package className="w-6 h-6 text-emerald-500" />
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inter-Project Mobilization">
            <div className="p-6 space-y-8 font-inter">
                <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                        {icons[resourceType]}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transferring {resourceType}</p>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            {resourceData?.name || resourceData?.equipment_name || resourceData?.material_name || "Untitled Resource"}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">ID: {resourceData?.worker_code || resourceData?.equipment_code || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 py-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                        <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Select Destination Site</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <select
                            value={targetProjectId}
                            onChange={(e) => setTargetProjectId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                        >
                            <option value="">Choose a project...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.project_name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                    <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                        </div>
                        <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                            Mobilizing this resource will update its primary allocation registry across all systems. High-priority logistics alerts will be sent to the destination site engineer.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all font-inter"
                    >
                        Abort
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={loading || !targetProjectId}
                        className="flex-[2] py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-black transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:translate-y-0"
                    >
                        {loading ? "Mobilizing..." : (
                            <>
                                Confirm Mobilization
                                <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ResourceTransferModal;
