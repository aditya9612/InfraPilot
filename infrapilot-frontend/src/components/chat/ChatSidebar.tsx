import React, { useState, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { chatService } from "../../services/chatService";
import type { ChatUser } from "../../types/chat";
import {
    Search, Plus, MessageCircle, Users, Archive, Star,
    Filter, Check, X, UserPlus, ChevronLeft, BellOff, ArchiveRestore, Pin
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { getFullImageUrl } from "../../utils/imageUtils";
import { formatToIST } from "../../utils/dateUtils";

type ChatFilter = "all" | "private" | "group" | "unread";
type SidebarMode = "list" | "new-chat" | "new-group";

const ChatSidebar: React.FC = () => {
    const { conversations, activeChatId, setActiveChatId, isLoading, refreshChatList, typingStatus, onlineStatus } = useChat();
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
        fetchUsers();
        const intervalId = setInterval(() => {
            fetchUsers(true);
        }, 15000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchUsers = async (isBackground = false) => {
        if (!isBackground) setIsLoadingUsers(true);
        try {
            const data = await chatService.getAllSystemUsers();
            setUsers(data);
        } catch { 
            if (!isBackground) toast.error("Could not load users", { position: "top-right" }); 
        } finally {
            if (!isBackground) setIsLoadingUsers(false);
        }
    };

    const filteredConversations = conversations.filter(c => {
        // WhatsApp style: filter archived chats from the main list. 
        // Handles multiple backend naming variations (is_archived, archived, isArchived).
        const archivedStatus = !!(c.is_archived || (c as any).archived || (c as any).isArchived || (c as any).is_archive || (c as any).archive);
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

    const sortedConversations = [...filteredConversations].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0; // maintain original order otherwise
    });



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
        <div className="flex flex-col h-full bg-white relative">
            <style>
                {`
                .chat-sidebar-scroll::-webkit-scrollbar {
                    width: 5px;
                }
                .chat-sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-sidebar-scroll::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .chat-sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                `}
            </style>
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
            <div className="flex-1 overflow-y-auto chat-sidebar-scroll">

                {/* Archived Section Header - Responsive and intuitive */}
                {!showArchived && (
                    <button
                        onClick={() => setShowArchived(true)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-100 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                            <Archive className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-black text-slate-700">Archived Chats</h3>
                            <p className="text-[10px] font-bold text-slate-400">
                                View your hidden conversations
                            </p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-primary rotate-180 transition-transform" />
                    </button>
                )}

                {showArchived && (
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                        <button
                            onClick={() => setShowArchived(false)}
                            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                            title="Back to Chats"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <h3 className="text-sm font-black text-slate-700">Archived Conversations</h3>
                            <p className="text-[10px] font-bold text-slate-400">Viewing hidden chats</p>
                        </div>
                    </div>
                )}

                {/* Pinned Section */}
                {mode === "list" && !showArchived && searchQuery === "" && filter === "all" && conversations.some(c => c.is_pinned) && (
                    <div className="mb-2">
                        <div className="px-5 py-2 flex items-center gap-2 opacity-50">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pinned Chats</span>
                        </div>
                        {conversations.filter(c => c.is_pinned).map(c => (
                            <div
                                key={`pinned-${c.id}`}
                                role="button"
                                onClick={() => setActiveChatId(c.id)}
                                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all relative border-b border-slate-50/60 cursor-pointer ${activeChatId === c.id ? "bg-primary/5" : "hover:bg-slate-50"}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 uppercase shadow-sm overflow-hidden ${c.type === "group" ? "bg-violet-500 text-white/90" : "bg-primary"}`}>
                                    {c.type === "group" ? <Users className="w-4 h-4" /> : c.other_user_avatar ? <img src={getFullImageUrl(c.other_user_avatar)} className="w-full h-full object-cover" /> : (c.name || c.other_user_name || "?").charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-slate-700 truncate">{c.name || c.other_user_name}</h3>
                                    <p className="text-[11px] text-slate-400 truncate font-medium">
                                        {typingStatus[c.id] ? (
                                            <span className="text-[#00a884] font-medium">{typingStatus[c.id]}</span>
                                        ) : (
                                            c.last_message || "No messages"
                                        )}
                                    </p>
                                </div>
                                {c.unread_count > 0 && (
                                    <span className="min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-md px-1 flex items-center justify-center">
                                        {c.unread_count}
                                    </span>
                                )}
                            </div>
                        ))}
                        <div className="h-px bg-slate-50 my-2 mx-5" />
                    </div>
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
                        sortedConversations.map(c => (
                            <div
                                key={c.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setActiveChatId(c.id)}
                                onKeyDown={e => e.key === 'Enter' && setActiveChatId(c.id)}
                                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all relative border-b border-slate-50/60 cursor-pointer ${activeChatId === c.id ? "bg-primary/5" : "hover:bg-slate-50"}`}
                            >
                                {/* Active indicator */}
                                {activeChatId === c.id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                                )}
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white uppercase shadow-sm overflow-hidden ${c.type === "group" ? "bg-violet-500" : "bg-primary"}`}>
                                        {c.type === "group" ? (
                                            <Users className="w-4 h-4" />
                                        ) : c.other_user_avatar || c.avatar_url ? (
                                            <img src={getFullImageUrl(c.other_user_avatar || c.avatar_url)} alt="A" className="w-full h-full object-cover" />
                                        ) : (
                                            (c.name || c.other_user_name || "U").charAt(0)
                                        )}
                                    </div>
                                    {c.type !== 'group' && onlineStatus[c.id] && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00a884] border-[2px] border-white rounded-full"></div>
                                    )}
                                </div>
                                {/* Details */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <h3 className={`text-sm font-black truncate flex items-center gap-1 ${c.id === activeChatId ? 'text-primary' : 'text-slate-700'}`}>
                                                {c.name || c.other_user_name || "Anonymous"}
                                            </h3>
                                            {c.is_pinned && (
                                                <Pin className="w-3 h-3 text-slate-400 shrink-0 rotate-45" />
                                            )}
                                            {(c.is_muted || (c as any).muted || (c as any).isMuted || (c as any).is_mute) && (
                                                <BellOff className="w-3 h-3 text-rose-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate font-medium">
                                            {typingStatus[c.id] ? (
                                                <span className="text-[#00a884] font-medium">{typingStatus[c.id]}</span>
                                            ) : (
                                                c.last_message || "Tap to begin..."
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                                        {showArchived ? (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await chatService.archiveChat(c.id, false);
                                                        await refreshChatList(true);
                                                        toast.success("Unarchived");
                                                    } catch { toast.error("Failed"); }
                                                }}
                                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
                                                title="Unarchive"
                                            >
                                                <ArchiveRestore className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            c.last_message_at && (
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {formatToIST(c.last_message_at)}
                                                </span>
                                            )
                                        )}
                                        <div className="flex items-center gap-1.5 justify-end">
                                            {c.unread_count > 0 && (
                                                <span className="min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-md px-1 flex items-center justify-center">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}

                {/* Team Members Section (List Mode) */}
                {mode === "list" && !showArchived && (
                    <div className="mt-8">
                        <div className="px-5 py-2 flex items-center justify-between opacity-50">
                            <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team Members</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-400">{users.length}</span>
                        </div>
                        
                        {isLoadingUsers && users.length === 0 ? (
                            <div className="px-5 py-4 space-y-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 bg-slate-100 rounded w-1/2" />
                                            <div className="h-1.5 bg-slate-50 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : users.length === 0 ? (
                            <div className="px-10 py-8 text-center">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                                    Invite members to start collaboration
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50/50">
                                {users.filter(u => {
                                    // filter out users who already have an active conversation
                                    const hasConvo = conversations.some(c => c.type === 'private' && (c.other_user_id === u.id || (c as any).user_id === u.id));
                                    const matchesSearch = !searchQuery || (u.full_name || u.mobile_number || u.role || "").toLowerCase().includes(searchQuery.toLowerCase());
                                    return !hasConvo && matchesSearch;
                                }).map((u, idx) => (
                                    <div
                                        key={`member-${u.id}-${idx}`}
                                        role="button"
                                        onClick={() => startPrivateChat(u)}
                                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-all group cursor-pointer"
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 uppercase shadow-sm group-hover:border-primary group-hover:text-primary transition-all overflow-hidden">
                                                {u.profile_image ? (
                                                    <img src={chatService.resolveUrl(u.profile_image) || ''} alt="U" className="w-full h-full object-cover" />
                                                ) : (
                                                    (u.full_name || u.mobile_number || "U").charAt(0)
                                                )}
                                            </div>
                                            {u.is_online && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00a884] border-[2px] border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-slate-700 truncate group-hover:text-primary transition-colors">
                                                {u.full_name || u.mobile_number || "Team Member"}
                                            </h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role || "Member"}</p>
                                        </div>
                                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MessageCircle className="w-3 h-3 text-primary" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
