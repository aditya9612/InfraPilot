import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { chatService } from "../../services/chatService";
import type { ChatMessage, Conversation, ChatUser } from "../../types/chat";
import Modal from "../common/Modal";
import {
    Search, Send, Paperclip, MoreVertical, Smile, Pin, Check, X,
    User, Shield, Info, Archive, BellOff, CheckCheck, Users, Phone,
    Plus, Trash2, RotateCcw, Edit2, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getFullImageUrl } from "../../utils/imageUtils";
import { formatToIST } from "../../utils/dateUtils";
import { userService } from "../../services/userService";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const saveAttachmentLocally = (msgId: number, attachments: any[]) => {
    try {
        const stored = JSON.parse(localStorage.getItem('chat_attachments') || '{}');
        stored[msgId] = attachments;
        localStorage.setItem('chat_attachments', JSON.stringify(stored));
    } catch {}
};

const getLocalAttachments = (msgId: number) => {
    try {
        const stored = JSON.parse(localStorage.getItem('chat_attachments') || '{}');
        return stored[msgId] || null;
    } catch {
        return null;
    }
};

const removeLocalAttachment = (msgId: number) => {
    try {
        const stored = JSON.parse(localStorage.getItem('chat_attachments') || '{}');
        delete stored[msgId];
        localStorage.setItem('chat_attachments', JSON.stringify(stored));
    } catch {}
};

const ChatView: React.FC = () => {
    const { activeChatId, conversations, setActiveChatId, updateConversation } = useChat();
    const { user } = useAuth();
    const myUserId = user?.id ? parseInt(user.id, 10) : null;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeChatFetched, setActiveChatFetched] = useState<Conversation | null>(null);

    const handleOpenGroupInfo = async (chatToOpen: Conversation) => {
        openProfile({
            name: chatToOpen.name || "Group",
            profile_image: chatToOpen.avatar_url,
            role: `${chatToOpen.member_count || 0} members`,
            isGroup: true,
            members: (chatToOpen as any).members || [],
            memberCount: chatToOpen.member_count || 0
        });
        setIsLoadingMembers(true);
        try {
            let membersRes: any = null;
            try {
                membersRes = await chatService.getGroupMembers(chatToOpen.id);
            } catch (primaryErr) {
                console.warn("[GroupFetch] Primary API failed", primaryErr);
            }

            let members: any[] = [];
            if (membersRes) {
                members = Array.isArray(membersRes) 
                    ? membersRes 
                    : (membersRes as any).members || (membersRes as any).data || (membersRes as any).items || (membersRes as any).group_members || [];
            }

            if (members.length === 0 && (chatToOpen as any).members && Array.isArray((chatToOpen as any).members)) members = (chatToOpen as any).members;
            if (members.length === 0 && (chatToOpen as any).users && Array.isArray((chatToOpen as any).users)) members = (chatToOpen as any).users;
            if (members.length === 0 && (chatToOpen as any).group_members && Array.isArray((chatToOpen as any).group_members)) members = (chatToOpen as any).group_members;
            if (members.length === 0 && (chatToOpen as any).participants && Array.isArray((chatToOpen as any).participants)) members = (chatToOpen as any).participants;

            if (members.length === 0) {
                try {
                    const mentionUsers = await chatService.getMentionUsers(chatToOpen.id);
                    if (mentionUsers?.items && mentionUsers.items.length > 0) {
                        members = mentionUsers.items.map(u => ({
                            user_id: u.user_id,
                            name: u.full_name || "Member",
                            role: "member",
                            profile_image: u.profile_image
                        }));
                    }
                } catch (e) {
                    console.warn("[GroupFetch] Mentions fallback failed:", e);
                }
            }

            let userStates: any[] = [];
            try {
                userStates = await chatService.getUserStates(chatToOpen.id);
            } catch (e) {
                console.warn("[GroupFetch] Failed to fetch user states", e);
            }

            const mappedMembers = members.map((m: any) => {
                const memberId = m.user_id || m.id || m.ID || 0;
                const state = userStates.find((s: any) => s.user_id === memberId);
                return {
                    user_id: memberId,
                    name: m.name || m.full_name || m.fullName || "User",
                    role: m.role || "member",
                    profile_image: m.profile_image || m.avatar_url,
                    online: state?.online || false,
                    last_seen: state?.last_seen || null
                };
            });

            setSelectedProfile(prev => prev ? { ...prev, members: mappedMembers, memberCount: mappedMembers.length } : null);
        } catch (error) {
            console.error("Failed to load group members", error);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const activeChatFromContext = conversations.find(c => Number(c.id) === Number(activeChatId));
    const activeChat = activeChatFetched
        ? { ...activeChatFetched, ...activeChatFromContext }
        : activeChatFromContext;

    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showPinned, setShowPinned] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<{ user_id: number; name: string }[]>([]);
    const [activeUsers, setActiveUsers] = useState<number[]>([]);
    const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    type GroupMemberInfo = { user_id: number; name: string; role: "admin" | "member"; profile_image?: string | null; online?: boolean; last_seen?: string | null };
    type UserProfile = { id?: number; name: string; mobile?: string | null; role?: string; profile_image?: string | null; isGroup?: boolean; members?: GroupMemberInfo[]; memberCount?: number; };
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const openProfile = (profile: UserProfile) => setSelectedProfile(profile);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [readReceipts, setReadReceipts] = useState<{ user_id: number; name: string; read_at: string }[] | null>(null);
    const [receiptMsgId, setReceiptMsgId] = useState<number | null>(null);
    const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);

    const [mentionUsers, setMentionUsers] = useState<{ user_id: number; full_name: string | null; profile_image: string | null }[]>([]);
    const [mentionSearch, setMentionSearch] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);

    const [userStatus, setUserStatus] = useState<{ online: boolean; last_seen: string | null } | null>(null);

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
    const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
    const [isForwarding, setIsForwarding] = useState(false);
    const [isAddingMembers, setIsAddingMembers] = useState(false);

    const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
    const [selectedToRemoveIds, setSelectedToRemoveIds] = useState<number[]>([]);
    const [isRemovingMembers, setIsRemovingMembers] = useState(false);

    const [isEditingGroupName, setIsEditingGroupName] = useState(false);
    const [editGroupName, setEditGroupName] = useState("");
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editMessageContent, setEditMessageContent] = useState("");
    const [isSavingMessage, setIsSavingMessage] = useState(false);

    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            setMessages(prev => {
                return messagesData.map(incoming => {
                    const existing = prev.find(p => p.id === incoming.id);
                    const localAtts = getLocalAttachments(incoming.id);
                    const finalAttachments = incoming.attachments?.length ? incoming.attachments : (existing?.attachments?.length ? existing.attachments : localAtts);
                    
                    if (finalAttachments && finalAttachments.length > 0) {
                        saveAttachmentLocally(incoming.id, finalAttachments);
                    }

                    return {
                        ...incoming,
                        attachments: finalAttachments,
                        attachment_url: incoming.attachment_url || existing?.attachment_url || localAtts?.[0]?.file_url,
                    };
                });
            });
            setActiveChatFetched(chatInfo);
            const otherUserId = chatInfo.other_user_id || activeChatFromContext?.other_user_id || conversations.find(c => c.id === activeChatId)?.other_user_id;
            
            if (chatInfo.type !== 'group' && otherUserId) {
                chatService.getUserStatus(otherUserId)
                    .then(setUserStatus)
                    .catch(() => setUserStatus({ online: false, last_seen: null }));
            } else if (chatInfo.type !== 'group') {
                setUserStatus({ online: false, last_seen: null });
            } else {
                setUserStatus(null);
            }

            messagesData
                .filter(m => m.sender_id !== myUserId && m.status === "sent")
                .forEach(m => chatService.markDelivered(m.id).catch(() => { }));
        } catch {
            toast.error("Failed to load messages", { position: "top-right" });
        } finally {
            setIsLoading(false);
        }
    }, [activeChatId, myUserId]);

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;
        setIsDeletingMessage(true);
        try {
            await chatService.deleteMessage(messageToDelete);
            removeLocalAttachment(messageToDelete);
            setMessages(prev => prev.filter(m => m.id !== messageToDelete));
            toast.success("Message deleted");
            setMessageToDelete(null);
        } catch {
            toast.error("Failed to delete message");
        } finally {
            setIsDeletingMessage(false);
        }
    };

    const handleSaveEditMessage = async (msgId: number) => {
        if (!editMessageContent.trim()) return;
        setIsSavingMessage(true);
        try {
            await chatService.editMessage(msgId, editMessageContent.trim());
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: editMessageContent.trim() } : m));
            setEditingMessageId(null);
            setEditMessageContent("");
            toast.success("Message updated");
        } catch {
            toast.error("Failed to edit message");
        } finally {
            setIsSavingMessage(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChatId) return;
        if (!searchQuery.trim()) {
            fetchChatData();
            return;
        }
        setIsLoading(true);
        try {
            const results = await chatService.searchMessages(activeChatId, searchQuery);
            setMessages(results);
        } catch {
            toast.error("Failed to search messages");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKickMember = async (userId: number) => {
        if (!activeChatId) return;
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await chatService.removeMember(activeChatId, userId);
            toast.success("Member removed");
            
            setSelectedProfile(prev => {
                if (!prev || !prev.members) return prev;
                const updatedMembers = prev.members.filter(m => m.user_id !== userId);
                return { ...prev, members: updatedMembers, memberCount: updatedMembers.length };
            });
            setActiveChatFetched(prev => prev ? { ...prev, member_count: Math.max(0, (prev.member_count || 0) - 1) } : null);
        } catch {
            toast.error("Failed to remove member");
        }
    };

    const handleTransferAdmin = async (userId: number) => {
        if (!activeChatId) return;
        if (!confirm("Are you sure you want to make this member an admin?")) return;
        try {
            await chatService.transferAdmin(activeChatId, userId);
            toast.success("Admin rights transferred");
            
            setSelectedProfile(prev => {
                if (!prev || !prev.members) return prev;
                const updatedMembers = prev.members.map(m => {
                    if (m.user_id === userId) return { ...m, role: "admin" };
                    if (m.user_id === myUserId) return { ...m, role: "member" };
                    return m;
                });
                return { ...prev, members: updatedMembers };
            });
        } catch {
            toast.error("Failed to transfer admin rights");
        }
    };

    const handleLeaveGroup = async () => {
        if (!activeChatId) return;
        if (!confirm("Are you sure you want to leave this group?")) return;
        try {
            await chatService.leaveGroup(activeChatId);
            toast.success("Left group successfully");
            setActiveChatId(null);
        } catch {
            toast.error("Failed to leave group");
        }
    };

    useEffect(() => {
        if (activeChatId) {
            pollingRef.current = setInterval(async () => {
                try {
                    const msgs = await chatService.getMessages(activeChatId);
                    setMessages(prev => {
                        return msgs.map(incoming => {
                            const existing = prev.find(p => p.id === incoming.id);
                            const localAtts = getLocalAttachments(incoming.id);
                            const finalAttachments = incoming.attachments?.length ? incoming.attachments : (existing?.attachments?.length ? existing.attachments : localAtts);
                            
                            if (finalAttachments && finalAttachments.length > 0) {
                                saveAttachmentLocally(incoming.id, finalAttachments);
                            }

                            return {
                                ...incoming,
                                attachments: finalAttachments,
                                attachment_url: incoming.attachment_url || existing?.attachment_url || localAtts?.[0]?.file_url,
                            };
                        });
                    });
                    const typing = await chatService.getTypingUsers(activeChatId);
                    setTypingUsers(typing.users.filter(u => u.user_id !== myUserId));
                    const activeRes = await chatService.getActiveUsers(activeChatId);
                    setActiveUsers(activeRes.active_users.filter(id => id !== myUserId));
                    
                    if (activeChat?.type !== 'group' && activeChat?.other_user_id) {
                        const status = await chatService.getUserStatus(activeChat.other_user_id);
                        setUserStatus(status);
                    }
                } catch { }
            }, 5000);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeChatId, myUserId, activeChat]);

    useEffect(() => { fetchChatData(); }, [fetchChatData]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleInputChange = (val: string) => {
        setInputText(val);

        const lastWord = val.split(" ").pop() || "";

        if (lastWord.startsWith("@")) {
            const query = lastWord.slice(1);
            setMentionSearch(query);
            setShowMentions(true);
            if (activeChatId) {
                chatService.getMentionUsers(activeChatId).then(res => {
                    setMentionUsers(res.items);
                });
            }
        } else {
            setShowMentions(false);
        }

        if (!activeChatId) return;
        if (!isTyping) {
            setIsTyping(true);
            chatService.setTyping(activeChatId, true).catch(() => { });
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            setIsTyping(false);
            chatService.setTyping(activeChatId, false).catch(() => { });
        }, 6000);
    };

    const handleMentionSelect = (user: { user_id: number; full_name: string | null }) => {
        const words = inputText.split(" ");
        words.pop();
        const newText = [...words, `@${user.full_name}`, ""].join(" ");
        setInputText(newText);
        setMentionedUserIds(prev => Array.from(new Set([...prev, user.user_id])));
        setShowMentions(false);
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
            let uploadRes: any = null;

            if (fileToUpload) {
                toast.loading("Uploading file...", { id: "uploading", position: "top-right" });
                uploadRes = await chatService.uploadChatFile(fileToUpload);
                attachment_id = uploadRes.attachment_id;
                attachment_url = uploadRes.file_url;
                toast.dismiss("uploading");
            }

            const response = await chatService.sendMessage(activeChatId, {
                message: originalText,
                parent_id: parentId,
                attachment_id,
                attachment_url,
                mention_user_ids: mentionedUserIds
            });
            
            if (uploadRes && (!response.attachments || response.attachments.length === 0)) {
                const newAttachments = [{
                    id: uploadRes.attachment_id,
                    file_url: uploadRes.file_url,
                    file_name: uploadRes.file_name || uploadRes.file_url.split('/').pop() || "Attached File",
                    file_type: uploadRes.file_type || "",
                    file_size: uploadRes.file_size || 0,
                    uploaded_by: response.sender_id
                }];
                response.attachments = newAttachments;
                saveAttachmentLocally(response.id, newAttachments);
            }

            setMentionedUserIds([]);
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
            if (file.size > 10 * 1024 * 1024) {
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
        } catch { }
    };

    const handlePin = async (msg: ChatMessage) => {
        try {
            if (msg.is_pinned) {
                await chatService.unpinMessage(msg.id);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: false } : m));
                toast.success("Message unpinned");
            } else {
                await chatService.pinMessage(msg.id);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: true } : m));
                const pins = await chatService.getPinnedMessages(activeChatId!);
                setPinnedMessages(pins);
                toast.success("Message pinned");
            }
        } catch { toast.error("Operation failed", { position: "top-right" }); }
    };

    const loadPinned = async () => {
        if (!activeChatId) return;
        const pins = await chatService.getPinnedMessages(activeChatId);
        setPinnedMessages(pins);
        setShowPinned(true);
    };

    const MessageStatusIcon = ({ msg }: { msg: ChatMessage }) => {
        const status = msg.status;
        const isMine = myUserId !== null && msg.sender_id === myUserId;
        if (!isMine) return null;

        const handleShowReceipts = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (receiptMsgId === msg.id) {
                setReceiptMsgId(null);
                setReadReceipts(null);
                return;
            }
            setReceiptMsgId(msg.id);
            setIsLoadingReceipts(true);
            try {
                const receipts = await chatService.getReadReceipts(msg.id);
                setReadReceipts(receipts);
            } catch {
                setReadReceipts([]);
            } finally {
                setIsLoadingReceipts(false);
            }
        };

        return (
            <button
                onClick={handleShowReceipts}
                className="hover:scale-110 transition-transform cursor-pointer flex items-center relative"
            >
                {(status === "read" || msg.is_read) ? <CheckCheck className="w-3 h-3 text-blue-400" /> :
                    (status === "delivered" || msg.is_delivered) ? <CheckCheck className="w-3 h-3 text-slate-400" /> :
                        <Check className="w-3 h-3 text-slate-300" />}

                <AnimatePresence>
                    {receiptMsgId === msg.id && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-6 right-0 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[120] p-1.5"
                        >
                            <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Read Receipts</p>
                            </div>
                            <div className="max-h-32 overflow-y-auto">
                                {isLoadingReceipts ? (
                                    <div className="p-2 text-center text-[9px] font-bold text-slate-400">Loading...</div>
                                ) : readReceipts && readReceipts.length > 0 ? (
                                    readReceipts.map(r => (
                                        <div key={r.user_id} className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50">
                                            <span className="text-[10px] font-bold text-slate-700 truncate">{r.name}</span>
                                            <span className="text-[9px] text-slate-400">{formatToIST(r.read_at)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-center text-[9px] font-bold text-slate-300 italic">Not read yet</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>
        );
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
                        if (activeChat) {
                            if (activeChat.type === "group") {
                                handleOpenGroupInfo(activeChat as Conversation);
                            } else {
                                openProfile({
                                    id: Number(activeChat.other_user_id),
                                    name: activeChat.other_user_name || conversations.find(c => c.id === activeChatId)?.other_user_name || "Unknown",
                                    profile_image: activeChat.other_user_avatar || activeChat.avatar_url || conversations.find(c => c.id === activeChatId)?.other_user_avatar,
                                });
                            }
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
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight truncate">
                                {activeChat?.name || activeChat?.other_user_name || conversations.find(c => c.id === activeChatId)?.name || conversations.find(c => c.id === activeChatId)?.other_user_name || "Unknown"}
                            </h3>
                            {(activeChat?.is_muted || (activeChat as any)?.muted || (activeChat as any)?.isMuted) && (
                                <BellOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                        </div>
                        {typingUsers.length > 0 ? (
                            <p className="text-[12px] font-semibold text-[#00a884] flex items-center gap-1">
                                {activeChat?.type === 'group' ? `${typingUsers[0].name} is typing...` : 'typing...'}
                            </p>
                        ) : activeChat?.type === 'group' ? (
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {activeChat?.member_count || 0} Members
                                </p>
                                {activeUsers.length > 0 && (
                                    <span className="text-[10px] font-black text-[#00a884] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                                        {activeUsers.length} Active
                                    </span>
                                )}
                            </div>
                        ) : userStatus ? (
                            <p className="text-[12px] font-medium flex items-center gap-1 mt-0.5">
                                {userStatus.online ? (
                                    <span className="text-slate-500 font-medium">online</span>
                                ) : (
                                    <span className="text-slate-500 font-medium lowercase">
                                        {userStatus.last_seen ? `last seen ${(() => {
                                            const d = new Date(userStatus.last_seen);
                                            const now = new Date();
                                            const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                            
                                            const yesterday = new Date();
                                            yesterday.setDate(yesterday.getDate() - 1);
                                            const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
                                            
                                            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            if (isToday) return `today at ${time}`;
                                            if (isYesterday) return `yesterday at ${time}`;
                                            return `${d.toLocaleDateString()} at ${time}`;
                                        })()}` : 'offline'}
                                    </span>
                                )}
                            </p>
                        ) : (
                            <p className="text-[10px] text-slate-500 font-medium lowercase mt-0.5">offline</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {showSearch && (
                        <form onSubmit={handleSearch} className="mr-2">
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                autoFocus
                            />
                        </form>
                    )}
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
                                        id="view-info-button"
                                        onClick={async () => {
                                            setShowMoreMenu(false);
                                            if (activeChat) {
                                                if (activeChat.type === "group") {
                                                    handleOpenGroupInfo(activeChat as Conversation);
                                                } else {
                                                    openProfile({
                                                        id: Number(activeChat.other_user_id),
                                                        name: activeChat.other_user_name || "Unknown",
                                                        profile_image: activeChat.other_user_avatar,
                                                        role: "Private Chat",
                                                        mobile: activeChat.other_user_mobile,
                                                    });
                                                }
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                                    >
                                        <Info className="w-4 h-4" />
                                        View Information
                                    </button>

                                    <button
                                        onClick={async () => {
                                            setShowMoreMenu(false);
                                            if (activeChat) {
                                                try {
                                                    const currentStatus = !!(activeChat.is_archived || (activeChat as any).archived || (activeChat as any).isArchived);
                                                    const targetStatus = !currentStatus;

                                                    updateConversation(activeChatId!, {
                                                        is_archived: targetStatus,
                                                        archived: targetStatus
                                                    } as any);

                                                    await chatService.archiveChat(activeChatId!, targetStatus);

                                                    if (targetStatus) {
                                                        setActiveChatId(null);
                                                    }

                                                    toast.success(targetStatus ? "Chat archived" : "Chat unarchived", { position: "top-right" });
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Action failed");
                                                }
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        <Archive className="w-4 h-4" />
                                        {activeChat?.is_archived ? "Unarchive Chat" : "Archive Chat"}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShowMoreMenu(false);
                                            if (activeChat) {
                                                try {
                                                    const currentMuted = !!(activeChat.is_muted || (activeChat as any).muted || (activeChat as any).isMuted);
                                                    const targetMuted = !currentMuted;

                                                    updateConversation(activeChatId!, {
                                                        is_muted: targetMuted,
                                                        muted: targetMuted
                                                    } as any);

                                                    await chatService.muteChat(activeChatId!, targetMuted);

                                                    toast.success(targetMuted ? "Notifications muted" : "Notifications enabled", { position: "top-right", icon: targetMuted ? "🔇" : "🔔" });
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Action failed");
                                                }
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 border-t border-slate-50 transition-colors"
                                    >
                                        <BellOff className="w-4 h-4" />
                                        {activeChat?.is_muted ? "Unmute Notifications" : "Mute Notifications"}
                                    </button>

                                    <div className="h-px bg-slate-50 my-1 mx-2" />

                                    <button
                                        onClick={async () => {
                                            setShowMoreMenu(false);
                                            if (activeChat) {
                                                try {
                                                    const targetPin = !activeChat.is_pinned;
                                                    updateConversation(activeChatId!, { is_pinned: targetPin });

                                                    if (targetPin) await chatService.pinChat(activeChatId!);
                                                    else await chatService.unpinChat(activeChatId!);

                                                    toast.success(targetPin ? "Chat pinned" : "Chat unpinned");
                                                } catch { toast.error("Failed to update pin status"); }
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                                    >
                                        <Pin className="w-4 h-4" />
                                        {activeChat?.is_pinned ? "Unpin Chat" : "Pin Chat"}
                                    </button>

                                        <button
                                            onClick={async () => {
                                                if (!window.confirm("Restore this chat?")) return;
                                                setShowMoreMenu(false);
                                                if (activeChatId) {
                                                    try {
                                                        await chatService.restoreChat(activeChatId);
                                                        updateConversation(activeChatId, { is_deleted: false });
                                                        toast.success("Chat restored");
                                                    } catch { toast.error("Failed to restore chat"); }
                                                }
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Restore Chat
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (!window.confirm("Are you sure you want to delete this chat history?")) return;
                                                setShowMoreMenu(false);
                                                if (activeChatId) {
                                                    try {
                                                        await chatService.softDeleteChat(activeChatId);
                                                        updateConversation(activeChatId, { is_deleted: true });
                                                        setActiveChatId(null);
                                                        toast.success("Chat deleted");
                                                    } catch { toast.error("Failed to delete chat"); }
                                                }
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                            Delete Chat
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


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

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

                                    <div className={`flex flex-col gap-1 max-w-[70%] relative ${isMine ? "items-end" : "items-start"}`}>
                                        {!isMine && showAvatar && (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{msg.sender?.name || "Unknown"}</span>
                                        )}

                                        {msg.parent && (
                                            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border-l-2 ${isMine ? "bg-white/20 border-white/60 text-white/80" : "bg-slate-200/70 border-primary text-slate-500"}`}>
                                                ↩ {msg.parent.message}
                                            </div>
                                        )}

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

                                        <div className={`px-5 py-3.5 rounded-3xl text-sm font-semibold leading-relaxed shadow-sm relative ${isMine ? "bg-primary text-white rounded-tr-none shadow-primary/20" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"}`}>
                                            {msg.is_pinned && (
                                                <span className={`flex items-center gap-1 text-[9px] font-black uppercase mb-1 ${isMine ? "text-white/60" : "text-amber-500"}`}>
                                                    <Pin className="w-2.5 h-2.5" /> Pinned
                                                </span>
                                            )}
                                            {editingMessageId === msg.id ? (
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <input
                                                        type="text"
                                                        value={editMessageContent}
                                                        onChange={(e) => setEditMessageContent(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEditMessage(msg.id);
                                                            else if (e.key === 'Escape') setEditingMessageId(null);
                                                        }}
                                                        disabled={isSavingMessage}
                                                        autoFocus
                                                        className="w-full bg-black/10 text-white placeholder-white/50 px-3 py-1.5 rounded-xl outline-none text-sm"
                                                    />
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button disabled={isSavingMessage} onClick={() => setEditingMessageId(null)} className="p-1 hover:bg-black/10 rounded-md transition-colors"><X className="w-3 h-3 text-white/80" /></button>
                                                        <button disabled={isSavingMessage || !editMessageContent.trim()} onClick={() => handleSaveEditMessage(msg.id)} className="p-1 hover:bg-black/10 rounded-md transition-colors"><Check className="w-3 h-3 text-white" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {(() => {
                                                        const attachment = msg.attachments?.[0];
                                                        const fileUrl = attachment?.file_url || msg.attachment_url;
                                                        const fileName = attachment?.file_name || fileUrl?.split('/').pop()?.split('?')[0] || "Attached File";
                                                        const fileType = attachment?.file_type || fileUrl?.split('.').pop() || "";
                                                        const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileUrl || "") || fileType.startsWith("image/");
                                                        const isPdf = fileType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
                                                        const extension = fileType.includes("pdf") || isPdf ? "PDF" : fileName.split('.').pop()?.toUpperCase() || "FILE";

                                                        if (!fileUrl) return null;

                                                        return (
                                                            <div className="mb-1">
                                                                {isImage ? (
                                                                    <a href={chatService.resolveUrl(fileUrl) || "#"} target="_blank" rel="noreferrer">
                                                                        <img src={chatService.resolveUrl(fileUrl) || ""} alt="Attachment" className="max-w-full sm:max-w-[260px] rounded-xl object-cover" />
                                                                    </a>
                                                                ) : (
                                                                    <div>
                                                                        <div className={`flex items-center gap-4 p-3 rounded-xl mb-1 ${isMine ? "bg-white/10" : "bg-slate-100/50"} transition-colors`}>
                                                                            <div className={`w-10 h-12 rounded flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm ${isPdf ? 'bg-rose-500' : 'bg-primary'}`}>
                                                                                {extension}
                                                                            </div>
                                                                            <div className="flex flex-col overflow-hidden">
                                                                                <span className="text-sm text-slate-800 font-medium truncate max-w-[180px]">{fileName}</span>
                                                                                <span className="text-xs opacity-60">{extension} • {attachment?.file_size ? Math.round(attachment.file_size / 1024) + ' kB' : 'File'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    {msg.message ? (
                                                        <div className="text-[15px] leading-relaxed px-1">
                                                            {msg.message.split(/(@[^\s]+)/g).map((part, i) =>
                                                                part.startsWith("@") ? (
                                                                    <span key={i} className={isMine ? "text-white font-bold" : "text-primary font-bold"}>{part}</span>
                                                                ) : part
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    {(() => {
                                                        const attachment = msg.attachments?.[0];
                                                        const fileUrl = attachment?.file_url || msg.attachment_url;
                                                        const fileType = attachment?.file_type || fileUrl?.split('.').pop() || "";
                                                        const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileUrl || "") || fileType.startsWith("image/");
                                                        
                                                        if (fileUrl && !isImage) {
                                                            return (
                                                                <div className="flex items-center gap-6 pt-3 mt-1 border-t border-slate-200/50 px-1 pb-1">
                                                                    <a href={chatService.resolveUrl(fileUrl) || "#"} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#00a884] hover:underline">
                                                                        View
                                                                    </a>
                                                                    <a href={chatService.resolveUrl(fileUrl) || "#"} download target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#00a884] hover:underline">
                                                                        Save as...
                                                                    </a>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        {msg.reactions?.length > 0 && (
                                            <div className={`flex gap-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                                                {msg.reactions?.slice(0, 6).map((r, i) => (
                                                    <span key={i} className="text-sm bg-white border border-slate-100 rounded-xl px-2 py-0.5 shadow-sm leading-none">{r.reaction}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-1.5 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                                {formatToIST(msg.created_at)}
                                            </span>
                                            {isMine && <MessageStatusIcon msg={msg} />}
                                        </div>
                                    </div>

                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                        <button onClick={() => setActiveReactionMsgId(reacting ? null : msg.id)} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg transition-all" title="React">
                                            <Smile className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => { setMessageToForward(msg); setIsForwardModalOpen(true); }} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg transition-all text-xs" title="Forward Message">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-forward"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
                                        </button>
                                        <button onClick={() => setReplyTo(msg)} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg transition-all text-xs" title="Reply">↩</button>
                                        {activeChat?.type !== "group" && (
                                            <button onClick={() => handlePin(msg)} className={`p-1.5 hover:bg-white rounded-lg transition-all ${msg.is_pinned ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`} title="Pin Message">
                                                <Pin className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {isMine && (
                                            <>
                                                <button onClick={() => { setEditMessageContent(msg.message); setEditingMessageId(msg.id); }} className="p-1.5 text-slate-300 hover:text-primary hover:bg-white rounded-lg transition-all" title="Edit Message">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setMessageToDelete(msg.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all" title="Delete Message">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                )}

                {/* WhatsApp Style Typing Bubble */}
                {typingUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-3 flex-row mb-4">
                        {activeChat?.type === 'group' && (
                            <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden bg-slate-300">
                                {typingUsers[0].name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center h-[38px]">
                            <div className="flex gap-1.5 items-center">
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-[#00a884] rounded-full" />
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00a884] rounded-full" />
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00a884] rounded-full" />
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

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

            <AnimatePresence>
                {showMentions && mentionUsers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-24 left-6 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden p-1.5"
                    >
                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mention User</p>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {mentionUsers
                                .filter(u => !mentionSearch || (u.full_name || "").toLowerCase().includes(mentionSearch.toLowerCase()))
                                .map(u => (
                                    <button
                                        key={u.user_id}
                                        onClick={() => handleMentionSelect({ user_id: u.user_id, full_name: u.full_name })}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary uppercase overflow-hidden">
                                            {u.profile_image ? (
                                                <img src={getFullImageUrl(u.profile_image)} alt="U" className="w-full h-full object-cover" />
                                            ) : (u.full_name || "?").charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 truncate">{u.full_name}</span>
                                    </button>
                                ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedFile && (
                <div className="absolute inset-0 bg-slate-50/95 z-50 flex flex-col backdrop-blur-sm">
                    <div className="flex items-center px-6 py-4 border-b border-slate-200 bg-white">
                        <button onClick={() => setSelectedFile(null)} className="text-slate-500 hover:text-slate-800 transition-colors p-2">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-slate-800 text-base font-bold mx-auto truncate max-w-[50%]">{selectedFile.name}</h2>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                         {selectedFile.type.startsWith("image/") ? (
                             <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-lg border border-slate-200" />
                         ) : (
                             <div className="bg-white p-10 rounded-2xl flex flex-col items-center justify-center min-w-[320px] shadow-xl border border-slate-100">
                                 <div className="w-20 h-24 bg-slate-50 rounded-md mb-6 shadow-sm border border-slate-200 flex items-center justify-center">
                                     <FileText className="w-10 h-10 text-slate-400" />
                                 </div>
                                 <p className="text-slate-800 text-lg font-bold mb-1">No preview available</p>
                                 <p className="text-slate-500 text-sm font-medium">
                                     {Math.round(selectedFile.size / 1024)} kB - {selectedFile.name.split('.').pop()?.toUpperCase()}
                                 </p>
                             </div>
                         )}
                    </div>

                    <div className="p-6 flex flex-col items-center gap-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <div className="w-full max-w-3xl bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 focus-within:ring-2 focus-within:border-primary ring-primary/10 transition-all">
                            <Smile className="w-6 h-6 text-slate-400 shrink-0" />
                            <input 
                                type="text"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                autoFocus
                                className="flex-1 bg-transparent text-slate-800 font-medium text-[15px] outline-none placeholder:text-slate-400"
                            />
                        </div>
                        
                        <div className="w-full max-w-3xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-slate-50 rounded-lg flex flex-col items-center justify-center border-2 border-primary overflow-hidden shadow-sm">
                                    <div className="w-6 h-8 bg-rose-500 rounded-sm flex items-center justify-center text-white text-[8px] font-black uppercase shadow-sm">
                                        PDF
                                    </div>
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            <button onClick={handleSend} disabled={!inputText.trim() && !selectedFile} className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/30">
                                <Send className="w-6 h-6 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            disabled={!inputText.trim() && !selectedFile}
                            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {selectedProfile && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProfile(null)}
                            className="absolute inset-0 bg-black/20 z-40"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
                        >
                            <div className="bg-primary px-4 pt-10 pb-6 flex flex-col items-center relative">
                                <button
                                    onClick={() => setSelectedProfile(null)}
                                    className="absolute top-3 left-3 text-white/70 hover:text-white p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <span className="absolute top-4 left-0 right-0 text-center text-xs font-black text-white/80 uppercase tracking-widest">
                                    {selectedProfile.isGroup ? "Group Info" : "Profile Info"}
                                </span>

                                <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-white/20 flex items-center justify-center text-4xl font-black text-white shadow-xl border-4 border-white/30 mb-3 group">
                                    {selectedProfile.profile_image ? (
                                        <img src={getFullImageUrl(selectedProfile.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : selectedProfile.isGroup ? (
                                        <Users className="w-12 h-12 text-white/80" />
                                    ) : (
                                        <span>{(selectedProfile.name || "?").charAt(0).toUpperCase()}</span>
                                    )}

                                    {!selectedProfile.isGroup && selectedProfile.id === Number(user?.id) && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <input 
                                                type="file" 
                                                id="profile-pic-upload"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file || !user?.id) return;
                                                    try {
                                                        const toastId = toast.loading("Uploading profile picture...");
                                                        const res = await userService.updateUser(Number(user.id), { profile_image: file } as any);
                                                        toast.success("Profile picture updated", { id: toastId });
                                                        setSelectedProfile(prev => prev ? { ...prev, profile_image: res?.user?.profile_image || res?.profile_image } : null);
                                                    } catch {
                                                        toast.error("Failed to upload image");
                                                    }
                                                }}
                                            />
                                            <label 
                                                htmlFor="profile-pic-upload"
                                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-primary text-white flex items-center justify-center cursor-pointer transition-colors"
                                                title="Upload Picture"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </label>
                                            
                                            {selectedProfile.profile_image && (
                                                <button
                                                    onClick={async () => {
                                                        if (!user?.id) return;
                                                        try {
                                                            const toastId = toast.loading("Removing profile picture...");
                                                            await userService.updateUser(Number(user.id), { profile_image: '' } as any);
                                                            toast.success("Profile picture removed", { id: toastId });
                                                            setSelectedProfile(prev => prev ? { ...prev, profile_image: null } : null);
                                                        } catch {
                                                            toast.error("Failed to remove image");
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-rose-500 text-white flex items-center justify-center transition-colors"
                                                    title="Remove Picture"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedProfile.isGroup && isEditingGroupName ? (
                                    <div className="flex items-center gap-2 mt-1 bg-white/10 rounded-xl p-1 pl-3 pr-1.5 border border-white/20">
                                        <input
                                            type="text"
                                            value={editGroupName}
                                            onChange={(e) => setEditGroupName(e.target.value)}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    if (!editGroupName.trim() || !activeChatId) return;
                                                    setIsUpdatingGroup(true);
                                                    try {
                                                        await chatService.updateGroup(activeChatId, { name: editGroupName.trim() });
                                                        toast.success("Group updated!");
                                                        setIsEditingGroupName(false);
                                                        setSelectedProfile(prev => prev ? { ...prev, name: editGroupName.trim() } : null);
                                                        updateConversation(activeChatId, { name: editGroupName.trim() });
                                                    } catch { toast.error("Failed to update group"); }
                                                    finally { setIsUpdatingGroup(false); }
                                                } else if (e.key === 'Escape') {
                                                    setIsEditingGroupName(false);
                                                }
                                            }}
                                            autoFocus
                                            disabled={isUpdatingGroup}
                                            className="bg-transparent text-white font-black text-lg tracking-tight outline-none w-full placeholder:text-white/50 min-w-0"
                                            placeholder="Group Name"
                                        />
                                        <button onClick={() => setIsEditingGroupName(false)} disabled={isUpdatingGroup} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0 text-white/80 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!editGroupName.trim() || !activeChatId) return;
                                                setIsUpdatingGroup(true);
                                                try {
                                                    await chatService.updateGroup(activeChatId, { name: editGroupName.trim() });
                                                    toast.success("Group updated!");
                                                    setIsEditingGroupName(false);
                                                    setSelectedProfile(prev => prev ? { ...prev, name: editGroupName.trim() } : null);
                                                    updateConversation(activeChatId, { name: editGroupName.trim() });
                                                } catch { toast.error("Failed to update group"); }
                                                finally { setIsUpdatingGroup(false); }
                                            }}
                                            disabled={isUpdatingGroup || !editGroupName.trim()}
                                            className="p-1.5 bg-white text-primary hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                                        >
                                            {isUpdatingGroup ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" /> : <Check className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ) : (
                                    <h2 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
                                        {selectedProfile.name}
                                        {selectedProfile.isGroup && (
                                            <button 
                                                onClick={() => {
                                                    setEditGroupName(selectedProfile.name);
                                                    setIsEditingGroupName(true);
                                                }}
                                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                                title="Edit Group Name"
                                            >
                                                <Edit2 className="w-4 h-4 text-white" />
                                            </button>
                                        )}
                                    </h2>
                                )}
                                {selectedProfile.isGroup ? (
                                    <span className="text-white/70 text-xs font-bold mt-0.5">
                                        {isLoadingMembers ? "Loading members..." : `${selectedProfile.memberCount ?? (selectedProfile.members?.length ?? 0)} members`}
                                    </span>
                                ) : selectedProfile.role && (
                                    <span className="text-white/70 text-xs font-bold mt-0.5">{selectedProfile.role}</span>
                                )}
                            </div>

                            {/* Info rows */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Private chat info */}
                                {!selectedProfile.isGroup && (
                                    <div className="py-4">
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
                                                    <p className="text-sm font-black text-slate-800">
                                                        {selectedProfile.isGroup && selectedProfile.memberCount
                                                            ? `${selectedProfile.memberCount} ${selectedProfile.memberCount === 1 ? 'member' : 'members'}`
                                                            : selectedProfile.role}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedProfile.isGroup ? "Total Members" : "Role"}</p>
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
                                )}

                                {/* Group members list */}
                                {selectedProfile.isGroup && (
                                    <div>
                                        <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" /> Members
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {selectedProfile?.members?.find(m => m.user_id === myUserId)?.role === "admin" && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedToRemoveIds([]);
                                                            setIsRemoveMemberModalOpen(true);
                                                        }}
                                                        className="text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors"
                                                        title="Remove Members"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        if (!activeChatId) return;
                                                        const me = selectedProfile.members?.find(m => m.user_id === myUserId);
                                                        if (me?.role !== "admin") {
                                                            toast.error("Only admin can add members");
                                                            return;
                                                        }
                                                        try {
                                                            const users = await chatService.getAllSystemUsers();
                                                            const existingIds = selectedProfile.members?.map(m => m.user_id) || [];
                                                            const available = users.filter(u => {
                                                                const uId = Number(u.id);
                                                                return !existingIds.includes(uId) && !isNaN(uId) && uId !== 0;
                                                            });
                                                            setAvailableUsers(available);
                                                            setSelectedUserIds([]);
                                                            setIsAddMemberModalOpen(true);
                                                        } catch {
                                                            toast.error("Failed to load users");
                                                        }
                                                    }}
                                                    className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors"
                                                    title="Add Member"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {isLoadingMembers ? (
                                            <div className="flex items-center justify-center py-10">
                                                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            </div>
                                        ) : selectedProfile.members && selectedProfile.members.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {selectedProfile.members.map(member => (
                                                    <div key={member.user_id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                                        {/* Member avatar */}
                                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0 uppercase">
                                                            {member.profile_image ? (
                                                                <img src={getFullImageUrl(member.profile_image)} alt={member.name} className="w-full h-full object-cover rounded-2xl" />
                                                            ) : (
                                                                (member.name || "?").charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        {/* Member info */}
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <h4 className="text-sm font-bold text-slate-800 truncate">{member.name} {member.user_id === Number(user?.id) && "(You)"}</h4>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                {member.online ? (
                                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                        Online
                                                                    </span>
                                                                ) : member.last_seen ? (
                                                                    <span className="text-[10px] text-slate-400 font-medium truncate">
                                                                        Last seen {new Date(member.last_seen).toLocaleDateString()}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 font-medium">Offline</span>
                                                                )}
                                                                <span className="text-[10px] text-slate-300">•</span>
                                                                <p className="text-[10px] text-slate-500 uppercase font-semibold">{member.role}</p>
                                                            </div>
                                                        </div>
                                                        {/* Admin badge */}
                                                        {member.role === "admin" && (
                                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-200 shrink-0">
                                                                Admin
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                                            {member.user_id !== myUserId && selectedProfile?.members?.find(m => m.user_id === myUserId)?.role === "admin" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleTransferAdmin(member.user_id)}
                                                                        className="text-slate-400 hover:text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                                                                        title="Make Admin"
                                                                    >
                                                                        <Shield className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleKickMember(member.user_id)}
                                                                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                                                        title="Remove Member"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 px-6 gap-2 text-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                                                    <Users className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No members found</p>
                                                <p className="text-[10px] font-bold text-slate-300 leading-relaxed">
                                                    The member list is currently empty. Try clicking below to refresh.
                                                </p>
                                                <button
                                                    onClick={() => document.getElementById('view-info-button')?.click()}
                                                    className="mt-4 px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all"
                                                >
                                                    Refresh List
                                                </button>
                                            </div>
                                        )}
                                        {/* Leave Group Button */}
                                        <div className="p-5 mt-4 border-t border-slate-50">
                                            <button
                                                onClick={handleLeaveGroup}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 text-rose-500 font-bold text-sm rounded-xl hover:bg-rose-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Exit Group
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Add Member Modal */}
            <Modal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} title="Add Members">
                <div className="p-4 space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableUsers.map(u => (
                            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedUserIds.includes(Number(u.id))}
                                    onChange={(e) => {
                                        const id = Number(u.id);
                                        if (e.target.checked) setSelectedUserIds(prev => [...prev, id]);
                                        else setSelectedUserIds(prev => prev.filter(x => x !== id));
                                    }}
                                    className="rounded border-slate-300 text-primary focus:ring-primary/20"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">{u.name || u.full_name}</p>
                                    <p className="text-[10px] text-slate-500">{u.role}</p>
                                </div>
                            </label>
                        ))}
                        {availableUsers.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No users available to add.</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <button onClick={() => setIsAddMemberModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button
                            onClick={async () => {
                                        if (selectedUserIds.length === 0 || !activeChatId) return;
                                        setIsAddingMembers(true);
                                        try {
                                            if (selectedUserIds.length === 1) {
                                                await chatService.addMember(activeChatId, selectedUserIds[0]);
                                                toast.success("Member added!");
                                            } else {
                                                await chatService.addMultipleMembers(activeChatId, selectedUserIds);
                                                toast.success("Members added!");
                                            }
                                            
                                            // Update local state manually to ensure they show up immediately
                                            const newlyAdded = availableUsers.filter(u => selectedUserIds.includes(Number(u.id))).map(u => ({
                                                user_id: Number(u.id),
                                                name: u.name || u.full_name || "User",
                                                role: "member",
                                                profile_image: u.profile_image
                                            }));
                                            
                                            if (newlyAdded.length > 0) {
                                                setSelectedProfile(prev => {
                                                    if (!prev) return prev;
                                                    const existingIds = new Set(prev.members?.map(m => m.user_id) || []);
                                                    const filteredNew = newlyAdded.filter(m => !existingIds.has(m.user_id));
                                                    const updatedMembers = [...(prev.members || []), ...filteredNew];
                                                    return {
                                                        ...prev,
                                                        members: updatedMembers,
                                                        memberCount: prev.memberCount ? prev.memberCount + filteredNew.length : updatedMembers.length
                                                    };
                                                });
                                                
                                                setActiveChatFetched(prev => {
                                                    if (!prev) return prev;
                                                    const existingIds = new Set((prev as any).members?.map((m: any) => m.user_id) || []);
                                                    const filteredNew = newlyAdded.filter(m => !existingIds.has(m.user_id));
                                                    const updatedMembers = [...((prev as any).members || []), ...filteredNew];
                                                    return {
                                                        ...prev,
                                                        members: updatedMembers,
                                                        member_count: (prev.member_count || 0) + filteredNew.length
                                                    };
                                                });
                                            }

                                            setIsAddMemberModalOpen(false);
                                        } catch {
                                            toast.error("Failed to add members");
                                        } finally {
                                            setIsAddingMembers(false);
                                        }
                                    }}
                            disabled={selectedUserIds.length === 0 || isAddingMembers}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl disabled:opacity-50"
                        >
                            {isAddingMembers ? "Adding..." : "Add Members"}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Remove Member Modal */}
            <Modal isOpen={isRemoveMemberModalOpen} onClose={() => setIsRemoveMemberModalOpen(false)} title="Remove Members">
                <div className="p-4 space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {selectedProfile?.members?.filter(m => m.user_id !== Number(user?.id)).map(m => (
                            <label key={m.user_id} className="flex items-center gap-3 p-2 hover:bg-rose-50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedToRemoveIds.includes(m.user_id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedToRemoveIds(prev => [...prev, m.user_id]);
                                        else setSelectedToRemoveIds(prev => prev.filter(x => x !== m.user_id));
                                    }}
                                    className="rounded border-slate-300 text-rose-500 focus:ring-rose-500/20"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{m.role}</p>
                                </div>
                            </label>
                        ))}
                        {(!selectedProfile?.members || selectedProfile.members.filter(m => m.user_id !== Number(user?.id)).length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-4">No members available to remove.</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <button onClick={() => setIsRemoveMemberModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button
                            onClick={async () => {
                                if (selectedToRemoveIds.length === 0 || !activeChatId) return;
                                setIsRemovingMembers(true);
                                try {
                                    await chatService.removeMultipleMembers(activeChatId, selectedToRemoveIds);
                                    toast.success("Members removed!");
                                    setIsRemoveMemberModalOpen(false);
                                    
                                    // Update local state directly instead of requiring refresh
                                    setSelectedProfile(prev => {
                                        if (!prev || !prev.members) return prev;
                                        const updatedMembers = prev.members.filter(m => !selectedToRemoveIds.includes(m.user_id));
                                        return { ...prev, members: updatedMembers, memberCount: updatedMembers.length };
                                    });
                                    setActiveChatFetched(prev => prev ? { ...prev, member_count: Math.max(0, (prev.member_count || 0) - selectedToRemoveIds.length) } : null);
                                    setSelectedToRemoveIds([]);
                                } catch {
                                    toast.error("Failed to remove members");
                                } finally {
                                    setIsRemovingMembers(false);
                                }
                            }}
                            disabled={selectedToRemoveIds.length === 0 || isRemovingMembers}
                            className="px-4 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl disabled:opacity-50"
                        >
                            {isRemovingMembers ? "Removing..." : "Remove Selected"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Message Modal (WhatsApp Style) */}
            <Modal isOpen={messageToDelete !== null} onClose={() => setMessageToDelete(null)} title="Delete message?">
                <div className="p-4 space-y-4">
                    <p className="text-sm font-semibold text-slate-600 mb-6 px-2">
                        Are you sure you want to delete this message?
                    </p>
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={handleDeleteMessage}
                            disabled={isDeletingMessage}
                            className="w-full px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isDeletingMessage ? "Deleting..." : "Delete for everyone"}
                        </button>
                        <button 
                            onClick={() => setMessageToDelete(null)} 
                            disabled={isDeletingMessage}
                            className="w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Forward Message Modal */}
            <Modal isOpen={isForwardModalOpen} onClose={() => { setIsForwardModalOpen(false); setMessageToForward(null); }} title="Forward Message to...">
                <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 italic truncate">
                        "{messageToForward?.message}"
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {conversations.map(chat => (
                            <button
                                key={chat.id}
                                onClick={async () => {
                                    if (!messageToForward) return;
                                    setIsForwarding(true);
                                    try {
                                        await chatService.forwardMessage(messageToForward.id, chat.id);
                                        toast.success("Message forwarded!");
                                        setIsForwardModalOpen(false);
                                        setMessageToForward(null);
                                    } catch {
                                        toast.error("Failed to forward message");
                                    } finally {
                                        setIsForwarding(false);
                                    }
                                }}
                                disabled={isForwarding}
                                className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all text-left"
                            >
                                {chat.avatar_url || chat.other_user_avatar ? (
                                    <img src={getFullImageUrl(chat.avatar_url || chat.other_user_avatar)} alt={chat.name || chat.other_user_name || "Chat"} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                        {(chat.name || chat.other_user_name || "?").charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-slate-800 truncate">{chat.name || chat.other_user_name || "Unknown"}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{chat.type}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ChatView;
