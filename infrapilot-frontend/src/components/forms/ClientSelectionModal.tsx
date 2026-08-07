import React, { useState, useEffect } from "react";
import { X, Search, User } from "lucide-react";
import { userService } from "../../services/userService";

interface ClientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (clientId: number) => void;
    title?: string;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({ isOpen, onClose, onSelect, title = "Select Client" }) => {
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        try {
            setIsLoading(true);
            const res = await userService.getAllUsers(100, 0);
            const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);
            const clientList = userList.filter((u: any) => {
                const role = typeof u.role === "string" ? u.role : u.role?.name || "";
                return role.toLowerCase() === "client" && u.is_active;
            });
            setClients(clientList);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.company || c.designation || "").toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                        {isLoading ? (
                            <div className="py-8 text-center flex flex-col items-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                                <span className="text-xs text-slate-500 font-medium">Loading clients...</span>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-sm">
                                No active clients found.
                            </div>
                        ) : (
                            filteredClients.map(client => (
                                <button
                                    key={client.user_id}
                                    onClick={() => onSelect(client.user_id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {client.profile_image ? (
                                            <img src={client.profile_image} alt={client.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                                            {client.full_name}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-500 line-clamp-1">
                                            {client.company || client.designation || "Client"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientSelectionModal;
