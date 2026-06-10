import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { chatService } from "../services/chatService";
import type { Conversation } from "../types/chat";
import { useAuth } from "./AuthContext";

import { toast } from "react-hot-toast";
import { getFullImageUrl } from "../utils/imageUtils";

interface ChatContextType {
    conversations: Conversation[];
    activeChatId: number | null;
    setActiveChatId: (id: number | null) => void;
    unreadTotal: number;
    refreshChatList: (isBackground?: boolean) => Promise<void>;
    updateConversation: (chatId: number, updates: Partial<Conversation>) => void;
    isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Notification sound URL (Modern Soft Pop/Ping)
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";
const LOCAL_STATUS_KEY = "infrapilot_chat_statuses";

// --- localStorage helpers ---
type LocalChatStatus = { is_archived?: boolean; is_muted?: boolean };
type LocalStatusMap = Record<number, LocalChatStatus>;

function loadLocalStatuses(): LocalStatusMap {
    try {
        const raw = localStorage.getItem(LOCAL_STATUS_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as LocalStatusMap;
    } catch {
        return {};
    }
}

function saveLocalStatuses(map: LocalStatusMap) {
    try {
        localStorage.setItem(LOCAL_STATUS_KEY, JSON.stringify(map));
    } catch { /* ignore quota errors */ }
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const unreadCountsRef = useRef<Record<number, number>>({});
    const activeChatIdRef = useRef<number | null>(null);
    const isFirstLoad = useRef(true);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // In-memory guard (for within-session rapid polling protection)
    const recentUpdatesRef = useRef<Record<number, { is_archived?: boolean; is_muted?: boolean; timestamp: number }>>({});
    // Persistent status map (survives page refresh via localStorage)
    const localStatusMapRef = useRef<LocalStatusMap>(loadLocalStatuses());

    // Keep ref in sync
    useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

    // Helper: merge server conversations with local overrides
    const mergeWithLocalStatuses = useCallback((data: Conversation[]): Conversation[] => {
        const now = Date.now();
        return data.map(newConv => {
            // 1. Check short-term in-memory guard (~30 seconds, handles rapid polling)
            const recent = recentUpdatesRef.current[newConv.id];
            if (recent && (now - recent.timestamp) < 30000) {
                return {
                    ...newConv,
                    is_archived: recent.is_archived !== undefined ? recent.is_archived : newConv.is_archived,
                    archived: recent.is_archived !== undefined ? recent.is_archived : (newConv as any).archived,
                    is_muted: recent.is_muted !== undefined ? recent.is_muted : newConv.is_muted,
                    muted: recent.is_muted !== undefined ? recent.is_muted : (newConv as any).muted,
                };
            }
            if (recent && (now - recent.timestamp) >= 30000) {
                delete recentUpdatesRef.current[newConv.id];
            }

            // 2. Check persistent localStorage override (survives page refresh)
            const local = localStatusMapRef.current[newConv.id];
            if (local) {
                const serverArchived = !!(newConv.is_archived || (newConv as any).archived || (newConv as any).isArchived);
                const serverMuted = !!(newConv.is_muted || (newConv as any).muted || (newConv as any).isMuted);
                const localArchived = local.is_archived;
                const localMuted = local.is_muted;

                // If server now matches local, remove the override (self-healing)
                const archiveSynced = localArchived === undefined || serverArchived === localArchived;
                const muteSynced = localMuted === undefined || serverMuted === localMuted;

                if (archiveSynced && muteSynced) {
                    const updated = { ...localStatusMapRef.current };
                    delete updated[newConv.id];
                    localStatusMapRef.current = updated;
                    saveLocalStatuses(updated);
                    return newConv;
                }

                // Local override still needed — apply it
                return {
                    ...newConv,
                    is_archived: localArchived !== undefined ? localArchived : newConv.is_archived,
                    archived: localArchived !== undefined ? localArchived : (newConv as any).archived,
                    is_muted: localMuted !== undefined ? localMuted : newConv.is_muted,
                    muted: localMuted !== undefined ? localMuted : (newConv as any).muted,
                };
            }

            return newConv;
        });
    }, []);

    const refreshChatList = useCallback(async (isBackground: boolean = false) => {
        if (!isAuthenticated) return;
        try {
            if (!isBackground) setIsLoading(true);
            const data = await chatService.getEnhancedChatList();

            // Check for new messages
            if (!isFirstLoad.current) {
                const prevCounts = unreadCountsRef.current;
                data.forEach(conv => {
                    const prevCount = prevCounts[conv.id] || 0;
                    if (conv.unread_count > prevCount) {
                        const audio = new Audio(NOTIFICATION_SOUND_URL);
                        audio.volume = 1.0;
                        audio.play().catch(err => console.debug("Audio play blocked", err));

                        if (activeChatIdRef.current !== conv.id) {
                            const chatTitle = conv.type === "group" ? conv.name : (conv.other_user_name || "New Message");
                            toast.success(
                                (t) => (
                                    <div
                                        className="flex items-center gap-3.5 cursor-pointer group/toast"
                                        onClick={() => {
                                            setActiveChatId(conv.id);
                                            toast.dismiss(t.id);
                                        }}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/10 p-0.5 shadow-inner">
                                                {conv.other_user_avatar || conv.avatar_url ? (
                                                    <img
                                                        src={getFullImageUrl(conv.other_user_avatar || conv.avatar_url)}
                                                        alt="A"
                                                        className="w-full h-full object-cover rounded-[14px]"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-white uppercase bg-gradient-to-br from-primary to-blue-600 rounded-[14px]">
                                                        {(chatTitle || "?").charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                    {conv.type === "group" ? "Group" : "Direct"}
                                                </span>
                                                <p className="text-[11px] font-black text-white leading-tight truncate tracking-tight">
                                                    {chatTitle}
                                                </p>
                                            </div>
                                            <p className="text-[10px] font-semibold text-slate-400 truncate leading-relaxed">
                                                {conv.last_message || "New message received"}
                                            </p>
                                        </div>
                                    </div>
                                ),
                                {
                                    duration: 6000,
                                    position: "bottom-right",
                                    icon: null,
                                    style: {
                                        padding: '10px 14px',
                                        borderRadius: '20px',
                                        background: '#0f172a',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: '#ffffff',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    }
                                }
                            );
                        }
                    }
                });
            }

            // Update unread count tracking
            const nextCounts: Record<number, number> = {};
            data.forEach(c => { nextCounts[c.id] = c.unread_count; });
            unreadCountsRef.current = nextCounts;
            isFirstLoad.current = false;

            // Merge with local overrides (in-memory + localStorage)
            const mergedData = mergeWithLocalStatuses(data);
            setConversations(mergedData);
        } catch (error: any) {
            if (isBackground && (error.response?.status === 502 || error.code === 'ECONNABORTED')) return;
            console.error("Failed to refresh chat list", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [isAuthenticated, mergeWithLocalStatuses]);

    // Recursive poll
    const startPolling = useCallback(() => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

        const poll = async () => {
            if (!isAuthenticated || (user?.role === "Labour")) return;
            await refreshChatList(true);
            pollTimerRef.current = setTimeout(poll, 5000);
        };

        pollTimerRef.current = setTimeout(poll, 5000);
    }, [isAuthenticated, refreshChatList]);

    useEffect(() => {
        const handleRefresh = () => refreshChatList();
        window.addEventListener('refresh_chat_list', handleRefresh);
        return () => window.removeEventListener('refresh_chat_list', handleRefresh);
    }, [refreshChatList]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshChatList();
            startPolling();

            // Audio heart-beat / Unlock for browsers
            const unlockAudio = () => {
                const audio = new Audio(NOTIFICATION_SOUND_URL);
                audio.volume = 0;
                audio.play().catch(() => { });
                window.removeEventListener('click', unlockAudio);
            };
            window.addEventListener('click', unlockAudio);

            return () => {
                if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
                window.removeEventListener('click', unlockAudio);
            };
        } else {
            setConversations([]);
            setActiveChatId(null);
            activeChatIdRef.current = null;
            unreadCountsRef.current = {};
            isFirstLoad.current = true;
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        }
    }, [isAuthenticated, refreshChatList, startPolling]);

    const unreadTotal = conversations.reduce((acc, curr) => acc + curr.unread_count, 0);

    const updateConversation = useCallback((chatId: number, updates: Partial<Conversation>) => {
        // 1. Record in-memory guard (30s protection against rapid polling)
        recentUpdatesRef.current[chatId] = {
            ...recentUpdatesRef.current[chatId],
            ...updates,
            timestamp: Date.now()
        };

        // 2. Persist archive/mute status to localStorage (survives page refresh)
        const hasArchiveUpdate = 'is_archived' in updates || 'archived' in (updates as any);
        const hasMuteUpdate = 'is_muted' in updates || 'muted' in (updates as any);
        if (hasArchiveUpdate || hasMuteUpdate) {
            const current = localStatusMapRef.current[chatId] || {};
            const newStatus: LocalChatStatus = { ...current };
            if (hasArchiveUpdate) {
                newStatus.is_archived = !!(updates.is_archived ?? (updates as any).archived);
            }
            if (hasMuteUpdate) {
                newStatus.is_muted = !!(updates.is_muted ?? (updates as any).muted);
            }
            localStatusMapRef.current = { ...localStatusMapRef.current, [chatId]: newStatus };
            saveLocalStatuses(localStatusMapRef.current);
        }

        setConversations(prev => prev.map(c => Number(c.id) === Number(chatId) ? { ...c, ...updates } : c));
    }, []);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeChatId,
                setActiveChatId,
                unreadTotal,
                refreshChatList,
                updateConversation,
                isLoading,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
