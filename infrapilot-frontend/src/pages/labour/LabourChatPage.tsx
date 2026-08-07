import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { useAuth } from "../../context/AuthContext";
import { chatService } from "../../services/chatService";
import type { Conversation, ChatMessage } from "../../types/chat";
import toast from "react-hot-toast";
import {
    Send, Search, MessageCircle, Users, CornerDownRight,
    Check, CheckCheck, Circle, Loader2, Hash, X, RefreshCw, Eye
} from "lucide-react";

const resolveAvatar = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const base = (import.meta.env.VITE_API_URL || "").replace("/api/v1", "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

const fmtTime = (iso?: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getInitials = (name?: string | null) =>
    (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

interface AvatarProps { name?: string | null; src?: string | null; size?: number; }
const Avatar: React.FC<AvatarProps> = ({ name, src, size = 40 }) => {
    const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500"];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            {src ? (
                <img src={src} alt={name || ""} className="w-full h-full rounded-full object-cover" />
            ) : (
                <div className={`w-full h-full rounded-full ${color} flex items-center justify-center`}>
                    <span className="text-white font-black" style={{ fontSize: size * 0.35 }}>{getInitials(name)}</span>
                </div>
            )}
        </div>
    );
};

// GET /api/v1/chats/{chat_id}/unread
const UnreadBadge: React.FC<{ chatId: number }> = ({ chatId }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        chatService.getUnreadCount(chatId).then((r) => setCount(r.unread)).catch(() => {});
    }, [chatId]);
    if (!count) return null;
    return (
        <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
            {count > 99 ? "99+" : count}
        </span>
    );
};

interface BubbleProps {
    msg: ChatMessage; isMine: boolean;
    onReply: (m: ChatMessage) => void;
    onViewReplies: (m: ChatMessage) => void;
    onViewReads: (m: ChatMessage) => void;
}
const MessageBubble: React.FC<BubbleProps> = ({ msg, isMine, onReply, onViewReplies, onViewReads }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {!isMine && <Avatar name={msg.sender?.name} size={32} />}
            <div className={`max-w-[72%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{msg.sender?.name || "Unknown"}</span>}
                {msg.parent && (
                    <div className="text-[10px] text-slate-400 border-l-2 border-indigo-300 pl-2 mb-0.5 max-w-[280px] truncate">
                        {msg.parent.sender?.name}: {msg.parent.message}
                    </div>
                )}
                <div className="relative">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed break-words ${isMine ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm"}`}>
                        {msg.is_deleted ? <span className="italic opacity-60">This message was deleted</span> : msg.message}
                    </div>
                    {hovered && !msg.is_deleted && (
                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-20 ${isMine ? "right-full pr-2" : "left-full pl-2"}`}>
                            <button onClick={() => onReply(msg)} className="p-1.5 bg-white rounded-lg shadow-md border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Reply">
                                <CornerDownRight className="w-3.5 h-3.5" />
                            </button>
                            {msg.reply_count > 0 && (
                                <button onClick={() => onViewReplies(msg)} className="p-1.5 bg-white rounded-lg shadow-md border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="View thread">
                                    <Hash className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {isMine && (
                                <button onClick={() => onViewReads(msg)} className="p-1.5 bg-white rounded-lg shadow-md border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Seen by">
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className={`flex items-center gap-2 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-[9px] text-slate-400 font-bold">{fmtTime(msg.created_at)}</span>
                    {isMine && (msg.is_read ? <CheckCheck className="w-3 h-3 text-indigo-400" /> : msg.is_delivered ? <CheckCheck className="w-3 h-3 text-slate-300" /> : <Check className="w-3 h-3 text-slate-300" />)}
                    {msg.reply_count > 0 && (
                        <button onClick={() => onViewReplies(msg)} className="text-[9px] font-black text-indigo-500 hover:underline">
                            {msg.reply_count} {msg.reply_count === 1 ? "reply" : "replies"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const LabourChatPage: React.FC = () => {
    const { user } = useAuth();
    const myId = user?.id ? Number(user.id) : 0;

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [convoSearch, setConvoSearch] = useState("");
    const [convoLoading, setConvoLoading] = useState(true);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [msgLoading, setMsgLoading] = useState(false);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [threadMsg, setThreadMsg] = useState<ChatMessage | null>(null);
    const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadDraft, setThreadDraft] = useState("");
    const [sendingThread, setSendingThread] = useState(false);
    const [readsMsg, setReadsMsg] = useState<ChatMessage | null>(null);
    const [reads, setReads] = useState<{ user_id: number; name: string; read_at: string }[]>([]);
    const [readsLoading, setReadsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const loadConversations = useCallback(async () => {
        setConvoLoading(true);
        try {
            const data = await chatService.getChatList();
            setConversations(Array.isArray(data) ? data : []);
        } catch { setConversations([]); }
        finally { setConvoLoading(false); }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // GET /api/v1/chats/{chat_id}/messages + POST /delivered
    const loadMessages = useCallback(async (chatId: number) => {
        setMsgLoading(true);
        try {
            const data = await chatService.getMessages(chatId);
            const items: ChatMessage[] = Array.isArray(data) ? data : ((data as any)?.items || []);
            setMessages(items);
            // POST /api/v1/chats/messages/{message_id}/delivered
            items.forEach((m) => { if (m.sender_id !== myId && !m.is_delivered) { chatService.markDelivered(m.id).catch(() => {}); } });
        } catch { toast.error("Failed to load messages"); setMessages([]); }
        finally { setMsgLoading(false); }
    }, [myId]);

    const selectConversation = useCallback((conv: Conversation) => {
        setActiveChatId(conv.id); setActiveConvo(conv);
        setReplyTo(null); setThreadMsg(null); setReadsMsg(null);
        loadMessages(conv.id);
        setTimeout(() => { setConversations((p) => p.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c)); }, 800);
    }, [loadMessages]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // POST /api/v1/chats/{chat_id}/messages
    const sendMessage = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!activeChatId || !draft.trim() || sending) return;
        setSending(true);
        const text = draft.trim();
        setDraft("");
        try {
            const sent = await chatService.sendMessage(activeChatId, { message: text, parent_id: replyTo?.id ?? null });
            setMessages((p) => [...p, sent]);
            setReplyTo(null);
            loadConversations();
        } catch { toast.error("Failed to send message"); setDraft(text); }
        finally { setSending(false); inputRef.current?.focus(); }
    }, [activeChatId, draft, replyTo, sending, loadConversations]);

    // GET /api/v1/chats/messages/{message_id}/replies
    const openThread = useCallback(async (msg: ChatMessage) => {
        setThreadMsg(msg); setReadsMsg(null); setThreadLoading(true);
        try { const data = await chatService.getReplies(msg.id); setThreadReplies(Array.isArray(data) ? data : []); }
        catch { toast.error("Failed to load replies"); setThreadReplies([]); }
        finally { setThreadLoading(false); }
    }, []);

    const sendThreadReply = useCallback(async () => {
        if (!activeChatId || !threadMsg || !threadDraft.trim() || sendingThread) return;
        setSendingThread(true);
        const text = threadDraft.trim(); setThreadDraft("");
        try {
            const sent = await chatService.sendMessage(activeChatId, { message: text, parent_id: threadMsg.id });
            setThreadReplies((p) => [...p, sent]);
            setMessages((p) => p.map((m) => m.id === threadMsg.id ? { ...m, reply_count: m.reply_count + 1 } : m));
        } catch { toast.error("Failed to send reply"); setThreadDraft(text); }
        finally { setSendingThread(false); }
    }, [activeChatId, threadMsg, threadDraft, sendingThread]);

    // GET /api/v1/chats/messages/{message_id}/reads
    const openReads = useCallback(async (msg: ChatMessage) => {
        setReadsMsg(msg); setThreadMsg(null); setReadsLoading(true);
        try { const data = await chatService.getReadReceipts(msg.id); setReads(Array.isArray(data) ? data : []); }
        catch { setReads([]); }
        finally { setReadsLoading(false); }
    }, []);

    const filteredConvos = useMemo(() => {
        if (!convoSearch.trim()) return conversations;
        const q = convoSearch.toLowerCase();
        return conversations.filter((c) => (c.name || c.other_user_name || "").toLowerCase().includes(q) || (c.last_message || "").toLowerCase().includes(q));
    }, [conversations, convoSearch]);

    const convoName = (c: Conversation) => c.name || c.other_user_name || `Chat #${c.id}`;
    const convoAvatar = (c: Conversation) => resolveAvatar(c.avatar_url || c.other_user_avatar);

    return (
        <>
            <Navbar title="Chat" breadcrumb={["Labour", "Chat"]} />
            <PageTransition className="bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter">
                <div className="flex h-full p-2 md:p-4 gap-3">

                    {/* Conversations sidebar */}
                    <div className="w-80 lg:w-96 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden flex-shrink-0">
                        <div className="p-5 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-black text-slate-800">Messages</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{conversations.length} conversations</p>
                                </div>
                                <button onClick={loadConversations} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><RefreshCw className="w-4 h-4" /></button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type="text" placeholder="Search conversations..." value={convoSearch} onChange={(e) => setConvoSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-300 transition-all placeholder:text-slate-300" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {convoLoading ? (
                                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
                            ) : filteredConvos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                    <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No conversations yet</p>
                                </div>
                            ) : filteredConvos.map((conv) => {
                                const isActive = conv.id === activeChatId;
                                return (
                                    <button key={conv.id} onClick={() => selectConversation(conv)}
                                        className={`w-full px-4 py-3.5 flex items-center gap-3 transition-all text-left border-b border-slate-50 last:border-0 ${isActive ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                                        <div className="relative">
                                            <Avatar name={convoName(conv)} src={convoAvatar(conv)} size={44} />
                                            {conv.type === "group" && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                                                    <Users className="w-2.5 h-2.5 text-white" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm font-black truncate ${isActive ? "text-indigo-700" : "text-slate-800"}`}>{convoName(conv)}</p>
                                                <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">{fmtDate(conv.last_message_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] text-slate-400 font-medium truncate flex-1">{conv.last_message || "No messages yet"}</p>
                                                <UnreadBadge chatId={conv.id} />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main chat area */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            {!activeChatId ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-24 px-8 text-center">
                                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                                        <MessageCircle className="w-10 h-10 text-indigo-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Select a Conversation</h3>
                                    <p className="text-sm text-slate-400 font-medium">Choose a conversation on the left to start chatting.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-4 bg-white">
                                        <Avatar name={activeConvo ? convoName(activeConvo) : ""} src={activeConvo ? convoAvatar(activeConvo) : null} size={40} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 truncate">{activeConvo ? convoName(activeConvo) : `Chat #${activeChatId}`}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                                                {activeConvo?.type === "group" ? `Group · ${activeConvo.member_count || ""} members` : "Direct message"}
                                            </p>
                                        </div>
                                        <button onClick={() => loadMessages(activeChatId)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><RefreshCw className="w-4 h-4" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/30">
                                        {msgLoading ? (
                                            <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 text-indigo-500 animate-spin" /></div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                                                <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No messages yet. Say hello!</p>
                                            </div>
                                        ) : messages.map((msg) => (
                                            <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === myId}
                                                onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
                                                onViewReplies={openThread} onViewReads={openReads} />
                                        ))}
                                        <div ref={bottomRef} />
                                    </div>

                                    {replyTo && (
                                        <div className="px-5 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3">
                                            <CornerDownRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Replying to {replyTo.sender?.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{replyTo.message}</p>
                                            </div>
                                            <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}

                                    <form onSubmit={sendMessage} className="px-5 py-4 border-t border-slate-50 bg-white flex items-end gap-3">
                                        <textarea ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                            placeholder="Type a message… (Enter to send)" rows={1}
                                            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300 max-h-32 overflow-y-auto"
                                            style={{ lineHeight: "1.5" }} />
                                        <button type="submit" disabled={!draft.trim() || sending}
                                            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-indigo-200">
                                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Thread drawer */}
                    {threadMsg && (
                        <div className="w-80 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden flex-shrink-0">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-800">Thread</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Replies</p>
                                </div>
                                <button onClick={() => setThreadMsg(null)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{threadMsg.sender?.name}</p>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{threadMsg.message}</p>
                                <p className="text-[9px] text-slate-400 mt-1">{fmtTime(threadMsg.created_at)}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {threadLoading ? (
                                    <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                                ) : threadReplies.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest py-8">No replies yet</p>
                                ) : threadReplies.map((r) => (
                                    <div key={r.id} className={`flex gap-2 ${r.sender_id === myId ? "flex-row-reverse" : ""}`}>
                                        <Avatar name={r.sender?.name} size={28} />
                                        <div className={`max-w-[80%] flex flex-col gap-0.5 ${r.sender_id === myId ? "items-end" : "items-start"}`}>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.sender?.name}</p>
                                            <div className={`px-3 py-2 rounded-xl text-xs font-medium ${r.sender_id === myId ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-700 border border-slate-100"}`}>{r.message}</div>
                                            <p className="text-[9px] text-slate-400">{fmtTime(r.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-3 border-t border-slate-50 flex items-center gap-2">
                                <input type="text" value={threadDraft} onChange={(e) => setThreadDraft(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") sendThreadReply(); }}
                                    placeholder="Reply in thread…"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-300" />
                                <button onClick={sendThreadReply} disabled={!threadDraft.trim() || sendingThread}
                                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95">
                                    {sendingThread ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Read receipts drawer */}
                    {readsMsg && !threadMsg && (
                        <div className="w-64 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden flex-shrink-0">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-800">Seen by</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Read receipts</p>
                                </div>
                                <button onClick={() => setReadsMsg(null)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {readsLoading ? (
                                    <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                                ) : reads.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest py-8">No reads yet</p>
                                ) : reads.map((r, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Avatar name={r.name} size={32} />
                                        <div>
                                            <p className="text-xs font-black text-slate-700">{r.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold">{fmtTime(r.read_at)}</p>
                                        </div>
                                        <CheckCheck className="w-3.5 h-3.5 text-indigo-400 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>
        </>
    );
};

export default LabourChatPage;
