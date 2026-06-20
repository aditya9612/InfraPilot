export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatUser {
    id: number;
    name: string;
    full_name?: string | null;
    role?: string;
    designation?: string | null;
    profile_image?: string | null;
    mobile_number?: string;
    is_online?: boolean;
    last_seen?: string | null;
}

export interface MessageReaction {
    id: number;
    reaction: string;
    user_id: number;
}

export interface MessageAttachment {
    id: number;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    uploaded_by: number;
}

export interface ChatMessage {
    id: number;
    chat_id: number;
    message: string;
    sender_id: number;
    created_at: string;
    status: MessageStatus;
    parent_id: number | null;
    is_deleted: boolean;
    is_edited: boolean;
    is_pinned: boolean;
    is_delivered: boolean;
    is_read: boolean;
    is_forwarded?: boolean;
    forwarded_from_message_id?: number | null;
    attachment_url?: string | null;
    sender: {
        id: number;
        name: string | null;
        profile_image?: string | null;
    };
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
    read_by: number[];
    reply_count: number;
    parent?: ChatMessage | null;
}

export interface Conversation {
    id: number;
    type: "private" | "group";
    name: string | null;
    avatar_url: string | null;
    other_user_id?: number | null;
    other_user_name?: string | null;
    other_user_avatar?: string | null;
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
    created_by?: number;
    created_at?: string;
    member_count?: number;
    is_muted?: boolean;
    is_archived?: boolean;
    is_pinned?: boolean;
    is_deleted?: boolean;
    pinned_at?: string | null;
    deleted_at?: string | null;
    archived?: boolean;
    other_user_mobile?: string | null;
}

export interface GroupMember {
    user_id: number;
    name: string;
    role: "admin" | "member";
    joined_at: string;
}

export interface ChatFileUploadResponse {
    attachment_id: number;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
}
