import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle, X, ChevronLeft, Search, Plus, Send, Paperclip,
    Users, Check, CheckCheck, Smile, Pin, Phone, Shield, User
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { chatService } from "../../services/chatService";
import type { ChatMessage, Conversation, ChatUser } from "../../types/chat";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { getFullImageUrl } from "../../utils/imageUtils";
import { formatToIST } from "../../utils/dateUtils";

type WidgetView = "list" | "chat" | "new-chat" | "new-group";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥"];

const ChatWidget: React.FC = () => {
    const { user } = useAuth();
    const { conversations, activeChatId, setActiveChatId, unreadTotal, refreshChatList } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<WidgetView>("list");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [inputText, setInputText] = useState("");
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [typingUsers, setTypingUsers] = useState<{ user_id: number; name: string }[]>([]);
    const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
    const [groupName, setGroupName] = useState("");
    const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // User info panel
    type UserProfile = { name: string; mobile?: string; role?: string; profile_image?: string | null; };
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const openProfile = (profile: UserProfile) => {
        console.log("Opening profile:", profile);
        setSelectedProfile(profile);
    };
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isDragging = useRef(false);
    const myUserId = user?.id ? parseInt(user.id, 10) : null;

    // ── Load messages ────────────────────────────────────────────────────────────
    const loadMessages = useCallback(async (chatId: number) => {
        setIsLoadingMsgs(true);
        try {
            const [msgs, info] = await Promise.all([
                chatService.getMessages(chatId),
                chatService.getChatInfo(chatId),
            ]);
            setMessages(msgs);
            setActiveConv(info);
        } catch { /* silent */ }
        finally { setIsLoadingMsgs(false); }
    }, []);

    // ── Poll for new messages every 5 s ─────────────────────────────────────────
    useEffect(() => {
        if (activeChatId && isOpen) {
            pollingRef.current = setInterval(async () => {
                try {
                    const msgs = await chatService.getMessages(activeChatId);
                    setMessages(msgs);
                    const typing = await chatService.getTypingUsers(activeChatId);
                    setTypingUsers(typing.users.filter(u => u.user_id !== myUserId));
                } catch { /* silent */ }
            }, 5000);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeChatId, isOpen, myUserId]);

    useEffect(() => {
        if (activeChatId) { loadMessages(activeChatId); setView("chat"); }
    }, [activeChatId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            refreshChatList();
            chatService.getChatUsers().then(setChatUsers).catch(() => { });
        }
    }, [isOpen, refreshChatList]);

    // ── Typing indicator ─────────────────────────────────────────────────────────
    const handleInputChange = (val: string) => {
        setInputText(val);
        if (!activeChatId) return;
        if (!isTyping) {
            setIsTyping(true);
            chatService.setTyping(activeChatId, true).catch(() => { });
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            setIsTyping(false);
            chatService.setTyping(activeChatId, false).catch(() => { });
        }, 2000);
    };

    // ── Back to list ─────────────────────────────────────────────────────────────
    const handleBack = () => {
        setView("list");
        setActiveChatId(null);
        setMessages([]);
        setActiveConv(null);
        setTypingUsers([]);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    // ── Send message ─────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if ((!inputText.trim() && !selectedFile) || !activeChatId) return;

        const text = inputText;
        const fileToUpload = selectedFile;

        setInputText("");
        setSelectedFile(null);
        setIsTyping(false);
        chatService.setTyping(activeChatId, false).catch(() => { });

        try {
            let attachment_id = null;
            let attachment_url = null;

            if (fileToUpload) {
                toast.loading("Uploading file...", { id: "uploading-widget", position: "top-right" });
                const uploadRes = await chatService.uploadChatFile(fileToUpload);
                attachment_id = uploadRes.attachment_id;
                attachment_url = uploadRes.file_url;
                toast.dismiss("uploading-widget");
            }

            const msg = await chatService.sendMessage(activeChatId, {
                message: text,
                attachment_id,
                attachment_url
            });
            setMessages(prev => [...prev, msg]);
        } catch {
            toast.dismiss("uploading-widget");
            setInputText(text);
            setSelectedFile(fileToUpload);
            toast.error("Send failed", { position: "top-right" });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error("File size exceeds 10MB", { position: "top-right" });
                return;
            }
            setSelectedFile(file);
        }
    };

    const handlePin = async (msg: ChatMessage) => {
        try {
            if (msg.is_pinned) {
                await chatService.unpinMessage(msg.id);
                toast.success("Message unpinned", { position: "top-right" });
            } else {
                await chatService.pinMessage(msg.id);
                toast.success("Message pinned", { position: "top-right" });
            }
            if (activeChatId) loadMessages(activeChatId);
        } catch { toast.error("Pin failed", { position: "top-right" }); }
    };

    // ── React to message ─────────────────────────────────────────────────────────
    const handleReact = async (msgId: number, reaction: string) => {
        setActiveReactionMsgId(null);
        try {
            await chatService.reactToMessage(msgId, reaction);
            const msgs = await chatService.getMessages(activeChatId!);
            setMessages(msgs);
        } catch { /* silent */ }
    };

    // ── Open / Start private chat ────────────────────────────────────────────────
    const openPrivateChat = async (targetUser: ChatUser) => {
        try {
            const { chat_id } = await chatService.createPrivateChat(targetUser.id);
            setActiveChatId(chat_id);
            await refreshChatList();
        } catch { toast.error("Could not start conversation"); }
    };

    // ── Create group ─────────────────────────────────────────────────────────────
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            toast.error("Group needs a name and at least one member");
            return;
        }
        try {
            const ids = selectedUsers.map(u => u.id);
            const { chat_id } = await chatService.createGroup(groupName.trim(), ids);
            toast.success("Group created!", { position: "top-right" });
            setSelectedUsers([]);
            setGroupName("");
            setActiveChatId(chat_id);
            await refreshChatList();
        } catch { toast.error("Failed to create group", { position: "top-right" }); }
    };

    const filteredConvs = conversations.filter(c => {
        // WhatsApp style: Filter archived chats out of the main list in widget
        const archivedStatus = !!(c.is_archived || (c as any).archived || (c as any).isArchived);
        if (archivedStatus) return false;

        return !searchQuery || (c.name || c.other_user_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredUsers = chatUsers.filter(u =>
        !userSearch || (u.full_name || u.mobile_number || "").toLowerCase().includes(userSearch.toLowerCase())
    );

    // ── Message status icon ──────────────────────────────────────────────────────
    const MessageStatusIcon = ({ status }: { status: string }) => {
        if (status === "read") return <CheckCheck className="w-3 h-3 text-blue-300" />;
        if (status === "delivered") return <CheckCheck className="w-3 h-3 text-white/50" />;
        return <Check className="w-3 h-3 text-white/40" />;
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ left: -window.innerWidth + 80, right: 0, top: -window.innerHeight + 80, bottom: 0 }}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={() => {
                // Small timeout to ensure onClick doesn't fire after drag
                setTimeout(() => { isDragging.current = false; }, 100);
            }}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none"
        >
            <div className="pointer-events-auto flex flex-col items-end gap-3">

                {/* ── Chat Panel ── */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-[340px] h-[540px] bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-5 py-4 bg-slate-900 flex items-center gap-3 shrink-0">
                                {(view === "chat" || view === "new-chat" || view === "new-group") && (
                                    <button onClick={handleBack} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                )}
                                {view === "chat" && (
                                    <div
                                        onClick={() => {
                                            if (activeConv?.type !== "group") {
                                                openProfile({
                                                    name: activeConv?.other_user_name || conversations.find(c => c.id === activeChatId)?.other_user_name || "Chat",
                                                    profile_image: activeConv?.other_user_avatar || activeConv?.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar,
                                                });
                                            }
                                        }}
                                        className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-[10px] font-black text-white shrink-0 uppercase shadow-sm overflow-hidden border border-white/10 cursor-pointer hover:bg-white/30"
                                    >
                                        {activeConv?.type === "group" ? (
                                            <Users className="w-3.5 h-3.5" />
                                        ) : activeConv?.other_user_avatar || activeConv?.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar ? (
                                            <img
                                                src={getFullImageUrl(activeConv?.other_user_avatar || activeConv?.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar)}
                                                alt="A"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            (activeConv?.name || activeConv?.other_user_name || conversations.find(c => c.id === activeChatId)?.name || "?").charAt(0)
                                        )}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest truncate">
                                        {view === "chat" ? (activeConv?.name || activeConv?.other_user_name || conversations.find(c => c.id === activeChatId)?.name || conversations.find(c => c.id === activeChatId)?.other_user_name || "Chat")
                                            : view === "new-chat" ? "New Message"
                                                : view === "new-group" ? "Create Group"
                                                    : "Messages"}
                                    </h3>
                                    {view === "chat" && typingUsers.length > 0 && (
                                        <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                            <span className="flex gap-0.5">
                                                {[0, 1, 2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                                            </span>
                                            {typingUsers[0].name} typing...
                                        </p>
                                    )}
                                    {view === "chat" && typingUsers.length === 0 && (
                                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Active
                                        </p>
                                    )}
                                </div>
                                {view === "list" && (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setView("new-chat")} title="New Message" className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setView("new-group")} title="New Group" className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                            <Users className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* ── Conversation List ── */}
                            {view === "list" && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {filteredConvs.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2">
                                                <span className="text-3xl opacity-30">💬</span>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No conversations</p>
                                                <button onClick={() => setView("new-chat")} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Start one →</button>
                                            </div>
                                        ) : filteredConvs.map(c => (
                                            <button key={c.id} onClick={() => setActiveChatId(c.id)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all border-b border-slate-50/50">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 uppercase overflow-hidden ${c.type === "group" ? "bg-violet-500" : "bg-primary"}`}>
                                                    {c.type === "group" ? (
                                                        <Users className="w-4 h-4" />
                                                    ) : c.other_user_avatar || c.avatar_url ? (
                                                        <img src={getFullImageUrl(c.other_user_avatar || c.avatar_url)} alt="A" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (c.name || c.other_user_name || "U").charAt(0)
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-black text-slate-800 truncate">{c.name || c.other_user_name || "Anonymous"}</p>
                                                        {c.last_message_at && (
                                                            <span className="text-[8px] font-bold text-slate-400 shrink-0 ml-2">
                                                                {formatToIST(c.last_message_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <p className="text-[10px] text-slate-400 truncate font-medium flex-1">{c.last_message || "Tap to send first message"}</p>
                                                        {c.unread_count > 0 && (
                                                            <span className="ml-2 min-w-[16px] h-[16px] bg-rose-500 text-white text-[8px] font-black rounded-md flex items-center justify-center shrink-0">{c.unread_count}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── New Chat Picker ── */}
                            {view === "new-chat" && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                            <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {filteredUsers.map((u, idx) => (
                                            <button key={`widget-user-${u.id}-${idx}`} onClick={() => openPrivateChat(u)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all border-b border-slate-50/50">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0 uppercase overflow-hidden">
                                                    {u.profile_image ? (
                                                        <img src={getFullImageUrl(u.profile_image)} alt="U" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (u.full_name || u.mobile_number || "U").charAt(0)
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-slate-800">{u.full_name || u.mobile_number || "User"}</p>
                                                    <p className="text-[10px] text-slate-400">{u.role}</p>
                                                </div>
                                                {u.is_online && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── New Group ── */}
                            {view === "new-group" && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <input type="text" placeholder="Group name..." value={groupName} onChange={e => setGroupName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 mb-2 placeholder:text-slate-300" />
                                        {selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {selectedUsers.map(u => (
                                                    <span key={u.id} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg uppercase">
                                                        {u.full_name || u.mobile_number}
                                                        <button onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))} className="ml-0.5 hover:text-rose-500"><X className="w-2.5 h-2.5" /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {chatUsers.map(u => {
                                            const isSelected = selectedUsers.some(s => s.id === u.id);
                                            return (
                                                <button key={u.id}
                                                    onClick={() => setSelectedUsers(prev => isSelected ? prev.filter(x => x.id !== u.id) : [...prev, u])}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-b border-slate-50/50 ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}>
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 uppercase transition-colors overflow-hidden ${isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                                                        {isSelected ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : u.profile_image ? (
                                                            <img src={getFullImageUrl(u.profile_image)} alt="U" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (u.full_name || u.mobile_number || "U").charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-black text-slate-800">{u.full_name || u.mobile_number || "User"}</p>
                                                        <p className="text-[10px] text-slate-400">{u.role}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="p-3 border-t border-slate-50">
                                        <button onClick={handleCreateGroup}
                                            className="w-full py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40"
                                            disabled={!groupName.trim() || selectedUsers.length === 0}>
                                            <Users className="w-3.5 h-3.5" /> Create Group ({selectedUsers.length} members)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Chat Messages ── */}
                            {view === "chat" && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                                        {isLoadingMsgs ? (
                                            <div className="flex justify-center items-center h-full">
                                                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                                                <span className="text-2xl opacity-30">✉️</span>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No messages yet</p>
                                            </div>
                                        ) : [...messages].sort((a, b) => a.id - b.id).map(msg => {
                                            const isMine = myUserId !== null && msg.sender_id === myUserId;
                                            const reacting = activeReactionMsgId === msg.id;
                                            return (
                                                <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"} group relative`}>
                                                    {/* Reaction picker */}
                                                    <AnimatePresence>
                                                        {reacting && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.8, y: 5 }}
                                                                className={`absolute bottom-full mb-1 flex gap-1.5 bg-white rounded-2xl px-3 py-2 shadow-xl border border-slate-100 z-10 ${isMine ? "right-0" : "left-0"}`}
                                                            >
                                                                {EMOJI_REACTIONS.map(emoji => (
                                                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                                                                        className="text-base leading-none hover:scale-125 active:scale-95 transition-transform">{emoji}</button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <div className={`flex items-end gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 shrink-0 ${isMine ? "items-end" : "items-start"}`}>
                                                            <button
                                                                onClick={() => setActiveReactionMsgId(reacting ? null : msg.id)}
                                                                className="p-1 text-slate-300 hover:text-slate-500"
                                                            >
                                                                <Smile className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePin(msg)}
                                                                className={`p-1 transition-all ${msg.is_pinned ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`}
                                                            >
                                                                <Pin className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Avatar */}
                                                        <div
                                                            onClick={() => {
                                                                if (isMine) {
                                                                    openProfile({ name: user?.name || "Me", mobile: user?.mobile, role: user?.role, profile_image: user?.profile_image });
                                                                } else {
                                                                    openProfile({ name: msg.sender?.name || "User", profile_image: msg.sender?.profile_image });
                                                                }
                                                            }}
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 ${isMine ? "bg-primary/20 text-primary border border-primary/20" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                                                        >
                                                            {isMine ? (
                                                                user?.profile_image ? <img src={getFullImageUrl(user.profile_image)} alt="M" className="w-full h-full object-cover" /> : (user?.name || "M").charAt(0)
                                                            ) : (
                                                                msg.sender?.profile_image ? <img src={getFullImageUrl(msg.sender.profile_image)} alt="S" className="w-full h-full object-cover" /> : (msg.sender?.name || "U").charAt(0)
                                                            )}
                                                        </div>

                                                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${isMine ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"}`}>
                                                            {msg.is_pinned && (
                                                                <div className={`flex items-center gap-1 text-[8px] font-black uppercase mb-1 ${isMine ? "text-white/60" : "text-slate-400"}`}>
                                                                    <Pin className="w-2.5 h-2.5" /> Pinned
                                                                </div>
                                                            )}
                                                            {msg.message}
                                                            <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                                                <span className={`text-[8px] font-black ${isMine ? "text-white/50" : "text-slate-400"}`}>
                                                                    {formatToIST(msg.created_at)}
                                                                </span>
                                                                {isMine && <MessageStatusIcon status={msg.status} />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Reactions display */}
                                                    {msg.reactions?.length > 0 && (
                                                        <div className={`flex gap-0.5 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                                                            {msg.reactions?.slice(0, 4).map((r, i) => (
                                                                <span key={i} className="text-xs leading-none bg-white border border-slate-100 rounded-lg px-1.5 py-0.5 shadow-sm">{r.reaction}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <AnimatePresence>
                                        {selectedFile && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                                className="overflow-hidden border-t border-slate-100 bg-primary/5 px-4 py-2 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 truncate mr-1">
                                                    <Paperclip className="w-3 h-3 text-primary shrink-0" />
                                                    <span className="text-[10px] font-bold text-primary truncate">{selectedFile.name}</span>
                                                </div>
                                                <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-rose-500 shrink-0">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Input */}
                                    <div className="p-3 border-t border-slate-50 bg-white">
                                        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`transition-all p-1 shrink-0 ${selectedFile ? "text-primary" : "text-slate-300 hover:text-primary"}`}
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </button>
                                            <input
                                                type="text"
                                                value={inputText}
                                                onChange={e => handleInputChange(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && handleSend()}
                                                placeholder="Type a message..."
                                                className="flex-1 bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-300"
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={!inputText.trim() && !selectedFile}
                                                className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-30 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── User Info Panel (Widget style) ── */}
                            <AnimatePresence>
                                {selectedProfile && (
                                    <motion.div
                                        initial={{ x: "100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="absolute inset-0 bg-white z-[60] flex flex-col"
                                    >
                                        <div className="bg-slate-900 px-4 pt-8 pb-5 flex flex-col items-center relative">
                                            <button onClick={() => setSelectedProfile(null)} className="absolute top-3 left-3 text-slate-400 hover:text-white p-1 transition-colors">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Profile Info</span>

                                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center text-3xl font-black text-white shadow-lg border-2 border-white/10 mb-3">
                                                {selectedProfile.profile_image ? (
                                                    <img src={getFullImageUrl(selectedProfile.profile_image)} alt="P" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{(selectedProfile.name || "?").charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <h2 className="text-white font-black text-sm tracking-tight">{selectedProfile.name}</h2>
                                            {selectedProfile.role && (
                                                <span className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">{selectedProfile.role}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto py-2">
                                            {selectedProfile.mobile && (
                                                <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-50">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800">{selectedProfile.mobile}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Mobile</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-50">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Shield className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800">{selectedProfile.role || "User"}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Designation</p>
                                                </div>
                                            </div>
                                            <div className="px-5 py-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800">{selectedProfile.name}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedProfile(null)}
                                            className="m-4 py-2 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                                        >
                                            Close Profile
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Toggle Bubble ── */}
                <motion.button
                    onClick={() => {
                        if (isDragging.current) return;
                        setIsOpen(prev => !prev);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/30 flex items-center justify-center text-white relative"
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X className="w-6 h-6" />
                            </motion.span>
                        ) : (
                            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                                <MessageCircle className="w-6 h-6" />
                            </motion.span>
                        )}
                    </AnimatePresence>
                    {!isOpen && unreadTotal > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-rose-500 text-white text-[9px] font-black rounded-lg border-2 border-white flex items-center justify-center px-1 shadow-md animate-bounce">
                            {unreadTotal > 99 ? "99+" : unreadTotal}
                        </span>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ChatWidget;
