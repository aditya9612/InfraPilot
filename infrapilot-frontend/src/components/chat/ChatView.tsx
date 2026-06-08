import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { chatService } from "../../services/chatService";
import type { ChatMessage, Conversation } from "../../types/chat";
import {
    Send, Paperclip, MoreVertical, Search, Pin, Smile,
    Check, CheckCheck, X, Users, Phone, Shield, User,
    BellOff, Bell, Archive, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getFullImageUrl } from "../../utils/imageUtils";
import { formatToIST } from "../../utils/dateUtils";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥"];

const ChatView: React.FC = () => {
    const { activeChatId, conversations, setActiveChatId } = useChat();
    const { user } = useAuth();
    const myUserId = user?.id ? parseInt(user.id, 10) : null;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeChat, setActiveChat] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showPinned, setShowPinned] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<{ user_id: number; name: string }[]>([]);
    const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // User info panel
    type UserProfile = { name: string; mobile?: string | null; role?: string; profile_image?: string | null; };
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const openProfile = (profile: UserProfile) => setSelectedProfile(profile);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Click outside more menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        if (showMoreMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMoreMenu]);

    const fetchChatData = useCallback(async () => {
        if (!activeChatId) return;
        setIsLoading(true);
        try {
            const [messagesData, chatInfo] = await Promise.all([
                chatService.getMessages(activeChatId),
                chatService.getChatInfo(activeChatId)
            ]);
            setMessages(messagesData);
            setActiveChat(chatInfo);
            // Mark delivered
            messagesData
                .filter(m => m.sender_id !== myUserId && m.status === "sent")
                .forEach(m => chatService.markDelivered(m.id).catch(() => { }));
        } catch {
            toast.error("Failed to load messages", { position: "top-right" });
        } finally {
            setIsLoading(false);
        }
    }, [activeChatId, myUserId]);

    // Polling for new messages & typing
    useEffect(() => {
        if (activeChatId) {
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
    }, [activeChatId, myUserId]);

    useEffect(() => { fetchChatData(); }, [fetchChatData]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    const handleSend = async () => {
        if ((!inputText.trim() && !selectedFile) || !activeChatId) return;

        const originalText = inputText;
        const parentId = replyTo?.id ?? null;
        const fileToUpload = selectedFile;

        setInputText("");
        setReplyTo(null);
        setSelectedFile(null);
        setIsTyping(false);
        chatService.setTyping(activeChatId, false).catch(() => { });

        try {
            let attachment_id = null;
            let attachment_url = null;

            if (fileToUpload) {
                toast.loading("Uploading file...", { id: "uploading", position: "top-right" });
                const uploadRes = await chatService.uploadChatFile(fileToUpload);
                attachment_id = uploadRes.attachment_id;
                attachment_url = uploadRes.file_url;
                toast.dismiss("uploading");
            }

            const response = await chatService.sendMessage(activeChatId, {
                message: originalText,
                parent_id: parentId,
                attachment_id,
                attachment_url
            });
            setMessages(prev => [...prev, response]);
        } catch {
            toast.dismiss("uploading");
            toast.error("Transmission failed", { position: "top-right" });
            setInputText(originalText);
            setSelectedFile(fileToUpload);
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

    const handleReact = async (msgId: number, reaction: string) => {
        setActiveReactionMsgId(null);
        try {
            await chatService.reactToMessage(msgId, reaction);
            const msgs = await chatService.getMessages(activeChatId!);
            setMessages(msgs);
        } catch { /* silent */ }
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
            // Refresh messages to update is_pinned flag
            await fetchChatData();
            // If pinned panel is open, refresh it too
            if (activeChatId) {
                const pins = await chatService.getPinnedMessages(activeChatId);
                setPinnedMessages(pins);
            }
        } catch { toast.error("Operation failed", { position: "top-right" }); }
    };

    const loadPinned = async () => {
        if (!activeChatId) return;
        const pins = await chatService.getPinnedMessages(activeChatId);
        setPinnedMessages(pins);
        setShowPinned(true);
    };

    const MessageStatusIcon = ({ status }: { status: string }) => {
        if (status === "read") return <CheckCheck className="w-3 h-3 text-blue-400" />;
        if (status === "delivered") return <CheckCheck className="w-3 h-3 text-slate-400" />;
        return <Check className="w-3 h-3 text-slate-300" />;
    };

    if (!activeChatId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-10 bg-slate-50/40">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center text-4xl mb-6">
                    💬
                </div>
                <h2 className="text-xl font-black text-slate-700 tracking-tight mb-2">Select a Conversation</h2>
                <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-xs">
                    Choose from your existing conversations or start a new one from the sidebar.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* ── Header ── */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between z-30 shadow-sm">
                <div
                    className="flex items-center gap-3 cursor-pointer group/header"
                    onClick={() => {
                        if (activeChat?.type !== "group") {
                            openProfile({
                                name: activeChat?.other_user_name || conversations.find(c => c.id === activeChatId)?.other_user_name || "Unknown",
                                profile_image: activeChat?.other_user_avatar || activeChat?.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar,
                            });
                        }
                    }}
                >
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm shadow-sm overflow-hidden">
                        {activeChat?.type === "group" ? (
                            <Users className="w-4 h-4" />
                        ) : activeChat?.other_user_avatar || activeChat?.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar ? (
                            <img
                                src={getFullImageUrl(activeChat?.other_user_avatar || activeChat?.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar)}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            (activeChat?.name || activeChat?.other_user_name || conversations.find(c => c.id === activeChatId)?.name || "#").charAt(0)
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight">
                            {activeChat?.name || activeChat?.other_user_name || conversations.find(c => c.id === activeChatId)?.name || conversations.find(c => c.id === activeChatId)?.other_user_name || "Unknown"}
                        </h3>
                        {typingUsers.length > 0 ? (
                            <p className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                                <span className="flex gap-0.5">
                                    {[0, 1, 2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                                </span>
                                {typingUsers[0].name} is typing...
                            </p>
                        ) : (
                            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowSearch(s => !s)} className={`p-2.5 rounded-xl transition-all ${showSearch ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50 hover:text-primary"}`}>
                        <Search className="w-4 h-4" />
                    </button>
                    <button
                        onClick={loadPinned}
                        className={`p-2.5 rounded-xl transition-all ${showPinned ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50 hover:text-primary"}`}>
                        <Pin className="w-4 h-4" />
                    </button>

                    <div className="relative" ref={moreMenuRef}>
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`p-2.5 rounded-xl transition-all ${showMoreMenu ? "bg-slate-100 text-primary" : "text-slate-400 hover:bg-slate-50 hover:text-primary"}`}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {showMoreMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[110] p-1.5"
                                >
                                    <button
                                        onClick={() => {
                                            setShowMoreMenu(false);
                                            if (activeChat) {
                                                openProfile({
                                                    name: activeChat.type === "group" ? (activeChat.name || "Group") : (activeChat.other_user_name || "Unknown"),
                                                    profile_image: activeChat.type === "group" ? activeChat.avatar_url : activeChat.other_user_avatar,
                                                    role: activeChat.type === "group" ? "Group Conversation" : "Private Chat",
                                                    mobile: activeChat.type === "private" ? activeChat.other_user_mobile : undefined
                                                });
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                                    >
                                        <Info className="w-4 h-4" />
                                        View Information
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!activeChatId || !activeChat) return;
                                            try {
                                                const isMuted = activeChat.is_muted;
                                                await chatService.muteChat(activeChatId, !isMuted);
                                                setActiveChat(prev => prev ? { ...prev, is_muted: !isMuted } : null);
                                                toast.success(!isMuted ? "Notifications muted" : "Notifications enabled", { position: "top-right", icon: !isMuted ? "🔇" : "🔔" });
                                            } catch {
                                                toast.error("Action failed");
                                            }
                                            setShowMoreMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                                    >
                                        {activeChat?.is_muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                        {activeChat?.is_muted ? "Unmute Notifications" : "Mute Notifications"}
                                    </button>

                                    <div className="h-px bg-slate-50 my-1 mx-2" />

                                    <button
                                        onClick={() => {
                                            setShowSearch(true);
                                            setShowMoreMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                                    >
                                        <Search className="w-4 h-4" />
                                        Search History
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!activeChatId || !activeChat) return;
                                            try {
                                                const currentStatus = !!(activeChat.is_archived || (activeChat as any).archived || (activeChat as any).isArchived);
                                                const newStatus = !currentStatus;
                                                await chatService.archiveChat(activeChatId, newStatus);
                                                toast.success(newStatus ? "Chat archived" : "Chat unarchived", { position: "top-right" });
                                                // Refresh chat list to sync
                                                window.dispatchEvent(new CustomEvent('refresh_chat_list'));
                                                // If archiving, clear active chat. If unarchiving, stay here.
                                                if (newStatus) setActiveChatId(null);
                                                else setActiveChat(prev => prev ? { ...prev, is_archived: false, archived: false } as any : null);
                                            } catch {
                                                toast.error("Process failed");
                                            }
                                            setShowMoreMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-widest"
                                    >
                                        <Archive className="w-4 h-4" />
                                        {((activeChat as any)?.is_archived || (activeChat as any)?.archived || (activeChat as any)?.isArchived) ? "Unarchive Chat" : "Archive Chat"}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Search Bar ── */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b border-slate-50 bg-white px-6 py-3">
                        <input
                            type="text"
                            placeholder="Search in conversation..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Pinned Messages Panel ── */}
            <AnimatePresence>
                {showPinned && pinnedMessages.length > 0 && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b border-slate-100 bg-amber-50 px-6 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned Messages</span>
                            <button onClick={() => setShowPinned(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        {pinnedMessages.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-2 py-0.5">
                                <p className="flex-1 text-xs text-slate-600 font-medium truncate border-l-2 border-amber-400 pl-2">{m.message}</p>
                                <button
                                    onClick={() => handlePin({ ...m, is_pinned: true })}
                                    className="shrink-0 text-amber-400 hover:text-rose-500 transition-colors"
                                    title="Unpin message"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Messages ── */}
            <div
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30"
                style={{
                    backgroundImage: `linear-gradient(rgba(248,250,252,0.6), rgba(248,250,252,0.6)), url("/chat-bg-pattern.png")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "auto, 350px 350px",
                    backgroundBlendMode: "normal, multiply",
                }}
            >
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    [...messages]
                        .sort((a, b) => a.id - b.id)
                        .filter(m => !searchQuery || m.message.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((msg, idx, arr) => {
                            const isMine = myUserId !== null && msg.sender_id === myUserId;
                            const showAvatar = idx === 0 || arr[idx - 1].sender_id !== msg.sender_id;
                            const reacting = activeReactionMsgId === msg.id;

                            return (
                                <div key={msg.id} className={`flex items-end gap-3 group relative ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                    {/* Avatar */}
                                    {!isMine && (
                                        <div
                                            onClick={() => openProfile({ name: msg.sender?.name || "Unknown", profile_image: msg.sender?.profile_image })}
                                            className={`w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-300 shrink-0 transition-opacity overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 ${showAvatar ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                                        >
                                            {msg.sender?.profile_image ? (
                                                <img src={getFullImageUrl(msg.sender.profile_image)} alt="S" className="w-full h-full object-cover" />
                                            ) : (
                                                (msg.sender?.name || "U").charAt(0)
                                            )}
                                        </div>
                                    )}

                                    {/* My avatar on right side */}
                                    {isMine && showAvatar && (
                                        <div
                                            onClick={() => openProfile({ name: user?.name || "Me", mobile: user?.mobile, role: user?.role, profile_image: user?.profile_image })}
                                            className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-xs font-black text-primary border border-primary/20 shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 order-last"
                                        >
                                            {user?.profile_image ? (
                                                <img src={getFullImageUrl(user.profile_image)} alt="Me" className="w-full h-full object-cover" />
                                            ) : (
                                                (user?.name || "M").charAt(0)
                                            )}
                                        </div>
                                    )}

                                    {/* Bubble + reactions */}
                                    <div className={`flex flex-col gap-1 max-w-[70%] relative ${isMine ? "items-end" : "items-start"}`}>
                                        {/* Sender name */}
                                        {!isMine && showAvatar && (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{msg.sender?.name || "Unknown"}</span>
                                        )}

                                        {/* Reply preview */}
                                        {msg.parent && (
                                            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border-l-2 ${isMine ? "bg-white/20 border-white/60 text-white/80" : "bg-slate-200/70 border-primary text-slate-500"}`}>
                                                ↩ {msg.parent.message}
                                            </div>
                                        )}

                                        {/* Reaction picker */}
                                        <AnimatePresence>
                                            {reacting && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                                                    className={`absolute top-0 flex gap-2 bg-white rounded-2xl px-3 py-2 shadow-xl border border-slate-100 z-20 ${isMine ? "right-0 translate-y-[-110%]" : "left-0 translate-y-[-110%]"}`}
                                                >
                                                    {EMOJI_REACTIONS.map(emoji => (
                                                        <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-lg hover:scale-125 active:scale-95 transition-transform leading-none">{emoji}</button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Message Bubble */}
                                        <div className={`px-5 py-3.5 rounded-3xl text-sm font-semibold leading-relaxed shadow-sm relative ${isMine ? "bg-primary text-white rounded-tr-none shadow-primary/20" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"}`}>
                                            {msg.is_pinned && (
                                                <span className={`flex items-center gap-1 text-[9px] font-black uppercase mb-1 ${isMine ? "text-white/60" : "text-amber-500"}`}>
                                                    <Pin className="w-2.5 h-2.5" /> Pinned
                                                </span>
                                            )}
                                            {msg.message}
                                        </div>

                                        {/* Reaction bubbles */}
                                        {msg.reactions?.length > 0 && (
                                            <div className={`flex gap-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                                                {msg.reactions?.slice(0, 6).map((r, i) => (
                                                    <span key={i} className="text-sm bg-white border border-slate-100 rounded-xl px-2 py-0.5 shadow-sm leading-none">{r.reaction}</span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Timestamp + status */}
                                        <div className={`flex items-center gap-1.5 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                                {formatToIST(msg.created_at)}
                                            </span>
                                            {isMine && <MessageStatusIcon status={msg.status} />}
                                        </div>
                                    </div>

                                    {/* Hover actions */}
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                        <button onClick={() => setActiveReactionMsgId(reacting ? null : msg.id)} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg transition-all">
                                            <Smile className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setReplyTo(msg)} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg transition-all text-xs">↩</button>
                                        <button onClick={() => handlePin(msg)} className={`p-1.5 hover:bg-white rounded-lg transition-all ${msg.is_pinned ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`}>
                                            <Pin className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Reply Preview ── */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50 px-6 py-2.5 flex items-center gap-3">
                        <div className="flex-1 border-l-4 border-primary pl-3">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Replying to {replyTo.sender?.name || "message"}</p>
                            <p className="text-xs text-slate-500 font-medium truncate">{replyTo.message}</p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedFile && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-primary/5 px-6 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary truncate max-w-[200px]">{selectedFile.name}</span>
                            <span className="text-[10px] text-slate-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-rose-500 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Input ── */}
            <div className="p-5 bg-white border-t border-slate-50">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus-within:border-primary focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`shrink-0 transition-all p-1 ${selectedFile ? "text-primary" : "text-slate-400 hover:text-primary"}`}
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Write a message..."
                        className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-2">
                        <button className="hidden sm:flex shrink-0 text-slate-400 hover:text-primary transition-all p-1">
                            <Smile className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            {/* ── User Info Panel (WhatsApp style) ── */}
            <AnimatePresence>
                {selectedProfile && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProfile(null)}
                            className="absolute inset-0 bg-black/20 z-40"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="bg-primary px-4 pt-10 pb-6 flex flex-col items-center relative">
                                <button
                                    onClick={() => setSelectedProfile(null)}
                                    className="absolute top-3 left-3 text-white/70 hover:text-white p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <span className="absolute top-4 left-0 right-0 text-center text-xs font-black text-white/80 uppercase tracking-widest">Profile Info</span>

                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/20 flex items-center justify-center text-4xl font-black text-white shadow-xl border-4 border-white/30 mb-3">
                                    {selectedProfile.profile_image ? (
                                        <img src={getFullImageUrl(selectedProfile.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{(selectedProfile.name || "?").charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <h2 className="text-white font-black text-lg tracking-tight">{selectedProfile.name}</h2>
                                {selectedProfile.role && (
                                    <span className="text-white/70 text-xs font-bold mt-0.5">{selectedProfile.role}</span>
                                )}
                            </div>

                            {/* Info rows */}
                            <div className="flex-1 overflow-y-auto py-4">
                                {selectedProfile.mobile && (
                                    <div className="px-5 py-4 flex items-center gap-4 border-b border-slate-50">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                                            <Phone className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{selectedProfile.mobile}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile</p>
                                        </div>
                                    </div>
                                )}
                                {selectedProfile.role && (
                                    <div className="px-5 py-4 flex items-center gap-4 border-b border-slate-50">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Shield className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{selectedProfile.role}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                                        </div>
                                    </div>
                                )}
                                <div className="px-5 py-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{selectedProfile.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatView;
