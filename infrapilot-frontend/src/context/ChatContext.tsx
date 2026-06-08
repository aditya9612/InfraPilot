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
    isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Notification sound URL (Modern Soft Pop/Ping)
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const unreadCountsRef = useRef<Record<number, number>>({});
    const activeChatIdRef = useRef<number | null>(null);
    const isFirstLoad = useRef(true);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep ref in sync
    useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

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
                        // New message!
                        const audio = new Audio(NOTIFICATION_SOUND_URL);
                        audio.volume = 1.0; // Max volume
                        audio.play().catch(err => console.debug("Audio play blocked", err));

                        // Show toast if not currently viewing this chat
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
                                            {conv.type === "group" && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-lg border-2 border-slate-900 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                </div>
                                            )}
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
                                        background: '#0f172a', // slate-900
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: '#ffffff',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                                    }
                                }
                            );
                        }
                    }
                });
            }

            // Update ref and isFirstLoad
            const nextCounts: Record<number, number> = {};
            data.forEach(c => { nextCounts[c.id] = c.unread_count; });
            unreadCountsRef.current = nextCounts;
            isFirstLoad.current = false;

            setConversations(data);
        } catch (error: any) {
            if (isBackground && (error.response?.status === 502 || error.code === 'ECONNABORTED')) return;
            console.error("Failed to refresh chat list", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Use current activeChatId from REF inside recursive poll
    const startPolling = useCallback(() => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

        const poll = async () => {
            if (!isAuthenticated) return;
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

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeChatId,
                setActiveChatId,
                unreadTotal,
                refreshChatList,
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
