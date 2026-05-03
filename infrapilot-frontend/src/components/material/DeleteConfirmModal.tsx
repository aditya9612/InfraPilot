import React, { useState } from 'react';
import Modal from '../common/Modal';
import type { Material } from '../../types/material';
import { materialService } from '../../services/materialService';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    material: Material | null;
    onSuccess: () => void;
}

const DeleteConfirmModal: React.FC<Props> = ({ isOpen, onClose, material, onSuccess }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!material) return;
        setIsDeleting(true);
        try {
            await materialService.deleteMaterial(material.id);
            toast.success('Material record archived');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to delete material');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Confirm Permanent Deletion"
            maxWidth="max-w-md"
            footer={
                <div className="flex gap-4 w-full">
                    <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Abort</button>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 py-3 bg-rose-500 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Material'}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Irreversible Action</h3>
                <p className="text-sm text-slate-500 mb-6 px-4">
                    You are about to delete <span className="font-bold text-slate-800">{material?.material_name}</span> (<span className="font-mono text-xs">{material?.material_code}</span>). This will purge all associated logs and stock history.
                </p>
                <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Reminder</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-bold italic-none">
                        All consumption reports and purchase records for this material will be permanently lost.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmModal;
