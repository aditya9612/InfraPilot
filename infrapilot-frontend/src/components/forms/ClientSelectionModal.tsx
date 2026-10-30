import React, { useState, useEffect } from "react";
import { X, Search, User } from "lucide-react";
import { userService } from "../../services/userService";
import { projectService } from "../../services/projectService";

interface ClientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (clientId: number) => void;
    title?: string;
    projectId?: number;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Select Client",
    projectId
}) => {
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen, projectId]);

    const fetchClients = async () => {
        try {
            setIsLoading(true);
            const deletedList = JSON.parse(localStorage.getItem("infrapilot_deleted_clients") || "[]");
            const deletedIds = new Set(deletedList.map((d: any) => Number(d.id)));
            const deletedMobiles = new Set(deletedList.map((d: any) => (d.mobile || "").replace(/\D/g, "").slice(-10)).filter(Boolean));

            if (projectId && Number(projectId) > 0) {
                // Fetch team members officially mapped and assigned to the selected project
                const [membersData, projectData, usersData] = await Promise.all([
                    projectService.getProjectMembers(Number(projectId)).catch(() => []),
                    projectService.getProjectById(Number(projectId)).catch(() => null),
                    userService.getAllUsers(100, 0).catch(() => [])
                ]);

                const rawMembers = Array.isArray(membersData) ? membersData : (membersData.items || membersData.data || []);
                const allUsers = Array.isArray(usersData) ? usersData : (usersData.items || usersData.data || usersData.users || []);

                const clientMembers: any[] = [];
                const seenUserIds = new Set<number>();

                for (const m of rawMembers) {
                    const role = (typeof m.role === "string" ? m.role : m.role?.name || m.user?.role?.name || m.user?.role || m.designation || "").toLowerCase().trim();
                    const uid = Number(m.user_id || m.user?.id || m.user?.user_id || m.id);
                    const mob = (m.mobile_number || m.mobile || m.user?.mobile_number || m.user?.mobile || "").replace(/\D/g, "").slice(-10);
                    const isMarkedDeleted = (uid > 0 && deletedIds.has(uid)) || (mob && deletedMobiles.has(mob)) || (m as any).is_deleted;

                    if (role === "client" && !isMarkedDeleted) {
                        const matchingUser = allUsers.find((u: any) => Number(u.id || u.user_id) === uid);
                        const fullName = m.full_name || m.user?.full_name || m.user?.name || matchingUser?.full_name || `Client #${uid}`;
                        if (uid > 0 && !seenUserIds.has(uid)) {
                            seenUserIds.add(uid);
                            clientMembers.push({
                                user_id: uid,
                                full_name: fullName,
                                company: m.company || m.user?.company || matchingUser?.company || "Client",
                                profile_image: m.profile_image || m.user?.profile_image || matchingUser?.profile_image,
                                is_active: m.is_active !== undefined ? m.is_active : (matchingUser?.is_active ?? true)
                            });
                        }
                    }
                }

                // Also check if the project itself has a designated client
                if (projectData && (projectData.client_id || projectData.client)) {
                    const pClientId = Number(projectData.client_id || projectData.client?.id || projectData.client?.user_id);
                    const pMob = (projectData.client_phone || projectData.client_mobile || "").replace(/\D/g, "").slice(-10);
                    const isMarkedDeleted = (pClientId > 0 && deletedIds.has(pClientId)) || (pMob && deletedMobiles.has(pMob));

                    if (pClientId > 0 && !seenUserIds.has(pClientId) && !isMarkedDeleted) {
                        const matchingUser = allUsers.find((u: any) => Number(u.id || u.user_id) === pClientId);
                        seenUserIds.add(pClientId);
                        clientMembers.push({
                            user_id: pClientId,
                            full_name: projectData.client_name || projectData.client?.name || projectData.client?.full_name || matchingUser?.full_name || `Client #${pClientId}`,
                            company: projectData.client?.company || matchingUser?.company || "Client",
                            profile_image: matchingUser?.profile_image,
                            is_active: matchingUser?.is_active ?? true
                        });
                    }
                }

                setClients(clientMembers);
            } else {
                const res = await userService.getAllUsers(100, 0);
                const userList = Array.isArray(res) ? res : (res.items || res.data || res.users || []);
                const clientList = userList.filter((u: any) => {
                    const role = typeof u.role === "string" ? u.role : u.role?.name || "";
                    const uid = Number(u.user_id || u.id);
                    const mob = (u.mobile_number || u.mobile || "").replace(/\D/g, "").slice(-10);
                    const isMarkedDeleted = deletedIds.has(uid) || (mob && deletedMobiles.has(mob)) || (u as any).is_deleted;
                    return role.toLowerCase() === "client" && u.is_active && !isMarkedDeleted;
                });
                setClients(clientList);
            }
        } catch (error) {
            console.error("Failed to fetch clients", error);
            setClients([]);
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
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        {projectId ? (
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                Showing clients assigned to this project
                            </p>
                        ) : null}
                    </div>
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
                            placeholder="Search assigned clients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                        {isLoading ? (
                            <div className="py-8 text-center flex flex-col items-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                                <span className="text-xs text-slate-500 font-medium">Loading project clients...</span>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-sm">
                                {projectId
                                    ? "No clients assigned as team members to this project."
                                    : "No active clients found."}
                            </div>
                        ) : (
                            filteredClients.map(client => (
                                <button
                                    key={client.user_id}
                                    onClick={() => onSelect(client.user_id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group cursor-pointer"
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
