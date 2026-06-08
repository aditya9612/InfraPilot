import React, { useState, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { chatService } from "../../services/chatService";
import type { ChatUser } from "../../types/chat";
import {
    Search, Plus, MessageCircle, Users, Archive, Star,
    Filter, Check, X, UserPlus, ChevronLeft
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { getFullImageUrl } from "../../utils/imageUtils";
import { formatToIST } from "../../utils/dateUtils";

type ChatFilter = "all" | "private" | "group" | "unread";
type SidebarMode = "list" | "new-chat" | "new-group";

const ChatSidebar: React.FC = () => {
    const { conversations, activeChatId, setActiveChatId, isLoading, refreshChatList } = useChat();
    const [filter, setFilter] = useState<ChatFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [mode, setMode] = useState<SidebarMode>("list");
    const [showArchived, setShowArchived] = useState(false);

    // New Chat state
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // New Group state
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);

    useEffect(() => {
        if (mode === "new-chat" || mode === "new-group") {
            setIsLoadingUsers(true);
            chatService.getChatUsers()
                .then(setUsers)
                .catch(() => toast.error("Could not load users", { position: "top-right" }))
                .finally(() => setIsLoadingUsers(false));
        }
    }, [mode]);

    const filteredConversations = conversations.filter(c => {
        // WhatsApp style: filter archived chats from the main list. 
        // Handles multiple backend naming variations (is_archived, archived, isArchived).
        const archivedStatus = !!(c.is_archived || (c as any).archived || (c as any).isArchived);
        if (showArchived && !archivedStatus) return false;
        if (!showArchived && archivedStatus) return false;

        const matchesFilter =
            filter === "all" ||
            (filter === "private" && c.type === "private") ||
            (filter === "group" && c.type === "group") ||
            (filter === "unread" && c.unread_count > 0);
        const matchesSearch =
            !searchQuery ||
            (c.name || c.other_user_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const archivedCount = conversations.filter(c => c.is_archived || (c as any).archived || (c as any).isArchived).length;

    const filteredUsers = users.filter(u =>
        !userSearch ||
        (u.full_name || u.mobile_number || "").toLowerCase().includes(userSearch.toLowerCase())
    );

    const startPrivateChat = async (targetUser: ChatUser) => {
        try {
            const { chat_id } = await chatService.createPrivateChat(targetUser.id);
            await refreshChatList();
            setActiveChatId(chat_id);
            setMode("list");
        } catch { toast.error("Could not start conversation", { position: "bottom-right" }); }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) { toast.error("Enter a group name", { position: "bottom-right" }); return; }
        if (selectedUsers.length === 0) { toast.error("Add at least one member", { position: "bottom-right" }); return; }
        try {
            const { chat_id } = await chatService.createGroup(groupName.trim(), selectedUsers.map(u => u.id));
            await refreshChatList();
            setActiveChatId(chat_id);
            toast.success("Group created!", { position: "bottom-right" });
            setGroupName("");
            setSelectedUsers([]);
            setMode("list");
        } catch { toast.error("Failed to create group", { position: "bottom-right" }); }
    };

    const resetMode = () => {
        setMode("list");
        setGroupName("");
        setSelectedUsers([]);
        setUserSearch("");
    };

    const tabs: { id: ChatFilter; label: string; icon: React.ReactNode }[] = [
        { id: "all", label: "All", icon: <MessageCircle className="w-3.5 h-3.5" /> },
        { id: "private", label: "DMs", icon: <Star className="w-3.5 h-3.5" /> },
        { id: "group", label: "Groups", icon: <Users className="w-3.5 h-3.5" /> },
        { id: "unread", label: "Unread", icon: <Filter className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* ── Header ── */}
            <div className="p-5 border-b border-slate-50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">
                        {showArchived ? (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setShowArchived(false)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                                    title="Back to Messages"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-lg font-black text-slate-900 tracking-tight">Archived</span>
                            </div>
                        ) : mode === "new-chat" ? "New Message" : mode === "new-group" ? "New Group" : "Messages"}
                    </h2>
                    <div className="flex items-center gap-1">
                        {!showArchived && mode === "list" ? (
                            <>
                                <button
                                    onClick={() => setMode("new-chat")}
                                    title="New Message"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setMode("new-group")}
                                    title="New Group"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </>
                        ) : !showArchived && (
                            <button
                                onClick={resetMode}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={mode === "list" ? "Search conversations..." : "Search users..."}
                        value={mode === "list" ? searchQuery : userSearch}
                        onChange={e => mode === "list" ? setSearchQuery(e.target.value) : setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                    />
                </div>

                {/* Group name input */}
                <AnimatePresence>
                    {mode === "new-group" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <input
                                type="text"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                placeholder="Group name..."
                                className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                            />
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {selectedUsers.map(u => (
                                        <span key={u.id} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase">
                                            {u.full_name || u.mobile_number}
                                            <button onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))} className="ml-0.5 hover:text-rose-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Filter Tabs (list only) ── */}
            {mode === "list" && (
                <div className="px-5 py-3 flex items-center gap-1 border-b border-slate-50">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === t.id ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                        >
                            {t.icon}
                            <span className="hidden lg:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Main Scrollable Area ── */}
            <div className="flex-1 overflow-y-auto">

                {/* Archived Entry (WhatsApp Style) */}
                {mode === "list" && !showArchived && archivedCount > 0 && (
                    <button
                        onClick={() => setShowArchived(true)}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 border-b border-slate-50 transition-all group"
                    >
                        <div className="text-slate-400 group-hover:text-primary transition-colors">
                            <Archive className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-slate-800">Archived</p>
                        </div>
                        <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {archivedCount}
                        </div>
                    </button>
                )}

                {/* Chat List */}
                {mode === "list" && (
                    isLoading && conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-center px-8 gap-3">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl opacity-40">💬</div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No conversations</p>
                            <button onClick={() => setMode("new-chat")} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">
                                Start one →
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setActiveChatId(c.id)}
                                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all relative border-b border-slate-50/60 ${activeChatId === c.id ? "bg-primary/5" : "hover:bg-slate-50"}`}
                            >
                                {/* Active indicator */}
                                {activeChatId === c.id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                                )}
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 uppercase shadow-sm overflow-hidden ${c.type === "group" ? "bg-violet-500" : "bg-primary"}`}>
                                    {c.type === "group" ? (
                                        <Users className="w-4 h-4" />
                                    ) : c.other_user_avatar || c.avatar_url ? (
                                        <img src={getFullImageUrl(c.other_user_avatar || c.avatar_url)} alt="A" className="w-full h-full object-cover" />
                                    ) : (
                                        (c.name || c.other_user_name || "U").charAt(0)
                                    )}
                                </div>
                                {/* Details */}
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className={`text-sm font-black truncate ${activeChatId === c.id ? "text-primary" : "text-slate-800"}`}>
                                            {c.name || c.other_user_name || "Anonymous"}
                                        </h3>
                                        {c.last_message_at && (
                                            <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-2">
                                                {formatToIST(c.last_message_at)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-slate-400 truncate font-medium">
                                            {c.last_message || "Tap to begin..."}
                                        </p>
                                        {c.unread_count > 0 && (
                                            <span className="ml-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-md px-1 flex items-center justify-center shrink-0">
                                                {c.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )
                )}

                {/* User Picker for New Chat / New Group */}
                {(mode === "new-chat" || mode === "new-group") && (
                    isLoadingUsers ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center px-8 gap-2">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No users found</p>
                        </div>
                    ) : filteredUsers.map((u, idx) => {
                        const isSelected = selectedUsers.some(s => s.id === u.id);
                        return (
                            <button
                                key={`user-${u.id}-${idx}`}
                                onClick={() => mode === "new-chat" ? startPrivateChat(u) : setSelectedUsers(prev =>
                                    isSelected ? prev.filter(x => x.id !== u.id) : [...prev, u]
                                )}
                                className={`w-full flex items-center gap-3 px-5 py-3 transition-all border-b border-slate-50/60 ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 uppercase shadow-sm transition-colors overflow-hidden ${isSelected ? "bg-primary" : "bg-slate-200 text-slate-500"}`}>
                                    {isSelected ? (
                                        <Check className="w-4 h-4" />
                                    ) : u.profile_image ? (
                                        <img src={getFullImageUrl(u.profile_image)} alt="U" className="w-full h-full object-cover" />
                                    ) : (
                                        (u.full_name || u.mobile_number || "U").charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-sm font-black text-slate-800">{u.full_name || u.mobile_number || "User"}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{u.role}</p>
                                </div>
                                {u.is_online && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                            </button>
                        );
                    })
                )}
            </div>

            {/* ── Footer ── */}
            {mode === "new-group" && (
                <div className="p-4 border-t border-slate-50">
                    <button
                        onClick={handleCreateGroup}
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                        className="w-full py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-30"
                    >
                        <Users className="w-4 h-4" />
                        Create ({selectedUsers.length} members)
                    </button>
                </div>
            )}

            {mode === "list" && (
                <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Synced</span>
                        </div>
                        <button className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors">
                            <Archive className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSidebar;
