import api from "./api";
import type {
    ChatMessage,
    Conversation,
    GroupMember,
    ChatUser,
    ChatFileUploadResponse
} from "../types/chat";

export const chatService = {
    // --- Chat Users ---
    async getChatUsers(): Promise<ChatUser[]> {
        const response = await api.get<any[]>("/chats/users");
        return response.data.map(u => ({
            ...u,
            id: u.id || u.user_id || u.ID // Support multiple backend variations
        }));
    },

    async getAllSystemUsers(): Promise<ChatUser[]> {
        const limit = 100;
        let offset = 0;
        let allUsers: any[] = [];
        let hasMore = true;

        while (hasMore) {
            const response = await api.get<any>("/users", { params: { limit, offset } });
            const data = Array.isArray(response.data) ? response.data : (response.data.items || response.data.data || response.data.users || []);
            allUsers = allUsers.concat(data);
            
            if (data.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
            
            // Safety break to prevent infinite loops (max 1000 users)
            if (offset >= 1000) break;
        }

        return allUsers.map((u: any) => ({
            ...u,
            id: u.user_id || u.id || u.ID,
            name: u.full_name || u.name
        }));
    },

    async searchUsers(query: string): Promise<ChatUser[]> {
        const response = await api.get<any[]>(`/chats/search-users?q=${query}`);
        return response.data.map(u => ({
            ...u,
            id: u.id || u.user_id || u.ID
        }));
    },

    // --- Chat List ---
    async getChatList(): Promise<Conversation[]> {
        try {
            const response = await api.get<Conversation[]>("/chats/");
            return response.data;
        } catch (error) {
            console.warn("getChatList API Error:", error);
            return [];
        }
    },

    async getEnhancedChatList(): Promise<Conversation[]> {
        try {
            const response = await api.get<Conversation[]>("/chats/enhanced");
            return response.data;
        } catch (error) {
            console.warn("getEnhancedChatList API Error:", error);
            return [];
        }
    },

    async getUnreadCount(chatId: number): Promise<{ unread: number }> {
        const response = await api.get<{ unread: number }>(`/chats/${chatId}/unread`);
        return response.data;
    },

    async getPinnedChats(): Promise<Conversation[]> {
        try {
            const response = await api.get<Conversation[]>("/chats/pinned");
            return response.data;
        } catch (error) {
            console.warn("getPinnedChats API Error:", error);
            return [];
        }
    },

    async softDeleteChat(chatId: number): Promise<{ status: string }> {
        const response = await api.delete<{ status: string }>(`/chats/${chatId}`);
        return response.data;
    },

    async restoreChat(chatId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/${chatId}/restore`);
        return response.data;
    },

    async muteChat(chatId: number, muted: boolean): Promise<{ status: string; is_muted: boolean }> {
        const response = await api.post<{ status: string; is_muted: boolean }>(`/chats/${chatId}/mute?muted=${muted}`);
        return response.data;
    },

    async archiveChat(chatId: number, archived: boolean): Promise<{ status: string; is_archived: boolean }> {
        const response = await api.post<{ status: string; is_archived: boolean }>(`/chats/${chatId}/archive?archived=${archived}`);
        return response.data;
    },

    async pinChat(chatId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/${chatId}/pin`);
        return response.data;
    },

    async unpinChat(chatId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/${chatId}/unpin`);
        return response.data;
    },

    // --- Private Chats ---
    async createPrivateChat(userId: number): Promise<{ chat_id: number }> {
        const response = await api.post<{ chat_id: number }>(`/chats/private/${userId}`, { user_id: userId });
        return response.data;
    },

    // --- Messages ---
    async getMessages(chatId: number): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chats/${chatId}/messages`);
        return response.data;
    },

    async sendMessage(chatId: number, payload: {
        message: string;
        parent_id?: number | null;
        attachment_id?: number | null;
        attachment_url?: string | null;
        mention_user_ids?: number[];
    }): Promise<ChatMessage> {
        const response = await api.post<ChatMessage>(`/chats/${chatId}/messages`, payload);
        return response.data;
    },

    async markDelivered(messageId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/messages/${messageId}/delivered`);
        return response.data;
    },

    async reactToMessage(messageId: number, reaction: string): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/messages/${messageId}/react?reaction=${encodeURIComponent(reaction)}`);
        return response.data;
    },

    async markRead(messageId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/messages/${messageId}/read`);
        return response.data;
    },

    async getReadReceipts(messageId: number): Promise<{ user_id: number; name: string; read_at: string }[]> {
        const response = await api.get<{ user_id: number; name: string; read_at: string }[]>(`/chats/messages/${messageId}/reads`);
        return response.data;
    },

    async getMentionedMessages(): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>("/chats/messages/mentions");
        return response.data;
    },

    async editMessage(messageId: number, newText: string): Promise<{ status: string }> {
        const response = await api.put<{ status: string }>(`/chats/messages/${messageId}/edit?new_text=${encodeURIComponent(newText)}`);
        return response.data;
    },

    async deleteMessage(messageId: number): Promise<void> {
        await api.delete(`/chats/messages/${messageId}`);
    },

    async getReplies(messageId: number): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chats/messages/${messageId}/replies`);
        return response.data;
    },

    async forwardMessage(messageId: number, targetChatId: number): Promise<{ status: string; message_id: number }> {
        const response = await api.post<{ status: string; message_id: number }>(`/chats/messages/${messageId}/forward?target_chat_id=${targetChatId}`);
        return response.data;
    },

    async pinMessage(messageId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/messages/${messageId}/pin`);
        return response.data;
    },

    async unpinMessage(messageId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/messages/${messageId}/unpin`);
        return response.data;
    },

    async getPinnedMessages(chatId: number): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chats/${chatId}/pinned`);
        return response.data;
    },

    async searchMessages(chatId: number, query: string): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chats/${chatId}/search?query=${query}`);
        return response.data;
    },

    async getChatInfo(chatId: number): Promise<Conversation> {
        const response = await api.get<Conversation>(`/chats/${chatId}`);
        return response.data;
    },

    // --- Groups ---
    async createGroup(name: string, memberIds: number[]): Promise<{ chat_id: number }> {
        const response = await api.post<{ chat_id: number }>("/chats/group", { name, member_ids: memberIds });
        return response.data;
    },

    async getGroupMembers(chatId: number): Promise<GroupMember[]> {
        let members: any[] = [];
        try {
            const response = await api.get<any>(`/chats/group/${chatId}/members`);
            const data = response.data;
            members = Array.isArray(data) ? data : data?.members || data?.data || data?.items || data?.group_members || [];
        } catch (e) {
            console.warn("[chatService] getGroupMembers primary failed", e);
        }

        if (members.length === 0) {
            try {
                const response = await api.get<any>(`/chats/${chatId}/members`);
                const data = response.data;
                members = Array.isArray(data) ? data : data?.members || data?.data || data?.items || data?.group_members || [];
            } catch (e) {
                console.warn("[chatService] getGroupMembers secondary failed", e);
            }
        }
        if (members.length === 0) {
            try {
                const response = await api.get<any>(`/chats/group/${chatId}`);
                const data = response.data;
                members = Array.isArray(data) ? data : data?.members || data?.data || data?.items || data?.group_members || data?.users || [];
            } catch (e) {
                console.warn("[chatService] getGroupMembers tertiary failed", e);
            }
        }
        
        return members;
    },

    async updateGroup(chatId: number, payload: { name?: string; avatar_url?: string }): Promise<{ status: string }> {
        const queryParams = new URLSearchParams();
        if (payload.name) queryParams.append('name', payload.name);
        if (payload.avatar_url) queryParams.append('avatar_url', payload.avatar_url);
        const response = await api.put<{ status: string }>(`/chats/group/${chatId}?${queryParams.toString()}`);
        return response.data;
    },

    async addMember(chatId: number, userId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/group/${chatId}/add?user_id=${userId}`);
        return response.data;
    },

    async addMultipleMembers(chatId: number, memberIds: number[]): Promise<{ status: string; added_members: number[]; already_exists: number[] }> {
        const response = await api.post<{ status: string; added_members: number[]; already_exists: number[] }>(`/chats/group/${chatId}/members`, { member_ids: memberIds });
        return response.data;
    },

    async removeMember(chatId: number, userId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/group/${chatId}/remove?user_id=${userId}`);
        return response.data;
    },


    async removeMultipleMembers(chatId: number, memberIds: number[]): Promise<{ status: string; removed_members: number[] }> {
        const response = await api.delete<{ status: string; removed_members: number[] }>(`/chats/group/${chatId}/members`, { data: { member_ids: memberIds } });
        return response.data;
    },

    async kickMember(chatId: number, userId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/group/${chatId}/kick?user_id=${userId}`);
        return response.data;
    },

    async leaveGroup(chatId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/group/${chatId}/leave`);
        return response.data;
    },

    async transferAdmin(chatId: number, newAdminId: number): Promise<{ status: string }> {
        const response = await api.post<{ status: string }>(`/chats/group/${chatId}/transfer-admin?new_admin_id=${newAdminId}`);
        return response.data;
    },

    // --- Real-time Features (HTTP Fallbacks) ---
    async setTyping(chatId: number, isTyping: boolean): Promise<{ ok: boolean }> {
        const response = await api.post<{ ok: boolean }>(`/chats/${chatId}/typing?is_typing=${isTyping}`);
        return response.data;
    },

    async getTypingUsers(chatId: number): Promise<{ users: { user_id: number; name: string }[] }> {
        const response = await api.get<{ users: { user_id: number; name: string }[] }>(`/chats/${chatId}/typing-users`);
        return response.data;
    },

    async getUserStatus(userId: number): Promise<{ online: boolean; last_seen: string | null }> {
        const response = await api.get<{ online: boolean; last_seen: string | null }>(`/chats/users/${userId}/status`);
        return response.data;
    },

    async getActiveUsers(chatId: number): Promise<{ active_users: number[] }> {
        const response = await api.get<{ active_users: number[] }>(`/chats/${chatId}/active-users`);
        return response.data;
    },

    async getUserStates(chatId: number): Promise<{ user_id: number; online: boolean; last_seen: string | null }[]> {
        const response = await api.get<{ user_id: number; online: boolean; last_seen: string | null }[]>(`/chats/${chatId}/user-states`);
        return response.data;
    },

    async uploadChatFile(file: File): Promise<ChatFileUploadResponse> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<ChatFileUploadResponse>("/chats/chat", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    async getMentionUsers(chatId: number): Promise<{ items: { user_id: number; full_name: string | null; profile_image: string | null }[] }> {
        const response = await api.get<any>(`/chats/${chatId}/mention-users`);
        const data = Array.isArray(response.data) ? response.data : (response.data.items || response.data.users || response.data.data || []);
        return { items: data };
    },

    // --- Utilities ---
    resolveUrl(path?: string | null): string | null {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        const baseUrl = import.meta.env.VITE_API_URL.replace("/api/v1", "");
        return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    }
};
