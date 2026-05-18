import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { Search, User, Phone, Briefcase, CheckCircle2 } from "lucide-react";
import { contractorService } from "../../services/contractorService";
import type { Contractor } from "../../services/contractorService";

interface SelectContractorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (contractorId: number) => void;
    projectId?: number;
}

const SelectContractorModal: React.FC<SelectContractorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    projectId
}) => {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchContractors = async () => {
                setLoading(true);
                try {
                    let data: Contractor[] = [];
                    if (projectId) {
                        data = await contractorService.getContractorsByProject(projectId);
                    } else {
                        data = await contractorService.getContractors();
                    }
                    setContractors(data);
                } catch (error) {
                    console.error("Error fetching contractors:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchContractors();
        }
    }, [isOpen, projectId]);

    const filteredContractors = contractors.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirm = () => {
        if (selectedId) {
            onSelect(selectedId);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select Deployed Contractor"
            maxWidth="max-w-xl"
            footer={
                <div className="flex w-full gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all font-inter"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedId}
                        className={`flex-1 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all font-inter active:scale-95 ${selectedId
                            ? "bg-primary text-white shadow-primary/20 hover:bg-blue-600"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        Confirm Assignment
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by name, code or specialization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-[1.25rem] text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                    />
                </div>

                {/* List Content */}
                <div className="space-y-3 max-h-[400px] pr-2 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parsing Contractor Database...</p>
                        </div>
                    ) : filteredContractors.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <User className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-500">No active contractors found</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Try refining your search terms</p>
                        </div>
                    ) : (
                        filteredContractors.map((contractor) => (
                            <div
                                key={contractor.id}
                                onClick={() => setSelectedId(contractor.id)}
                                className={`p-4 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden flex items-center gap-4 ${selectedId === contractor.id
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"
                                    }`}
                            >
                                {/* Visual Indicator for selection */}
                                {selectedId === contractor.id && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                                        <CheckCircle2 className="w-6 h-6 fill-primary text-white" />
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${selectedId === contractor.id
                                    ? "bg-primary text-white border-primary"
                                    : "bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                                    }`}>
                                    <span className="text-xl font-black font-inter">{contractor.name.charAt(0)}</span>
                                </div>

                                <div className="flex-1 min-w-0 pr-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-black text-slate-800 line-clamp-1">{contractor.name}</h4>
                                        {contractor.code && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-primary border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {contractor.code}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Briefcase className="w-3 h-3 shrink-0" />
                                            <span className="text-[10px] font-bold truncate tracking-tight">{contractor.specialization}</span>
                                        </div>
                                        {contractor.mobile && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Phone className="w-3 h-3 shrink-0" />
                                                <span className="text-[10px] font-bold tabular-nums tracking-tight">{contractor.mobile}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SelectContractorModal;
