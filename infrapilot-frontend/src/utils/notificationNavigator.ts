import { notificationService, type Notification } from "../services/notificationService";

export interface ResolvedRoute {
  path: string;
  targetEntity?: string;
  targetId?: string | number;
}

/**
 * Resolves the exact application route for any notification based on:
 * 1. Structured backend `link` / `url` / `action_url`
 * 2. Structured `entity` / `entity_type` + `entity_id` / `reference_id` / `related_id`
 * 3. Semantic title/description matching as safe fallback
 */
export function resolveNotificationRoute(
  notification: Partial<Notification> & Record<string, any>,
  userRole: string = "Client"
): ResolvedRoute {
  const isClient = userRole === "Client";

  // 1. If backend provided a direct internal link
  const rawLink = notification.link || notification.url || notification.action_url;
  if (rawLink && typeof rawLink === "string") {
    const trimmed = rawLink.trim();
    // Validate that it is an internal application route
    if (trimmed.startsWith("/")) {
      // Normalize any backend legacy links to client routes if role is Client
      if (isClient) {
        if (trimmed.startsWith("/invoices/")) {
          const invId = trimmed.replace("/invoices/", "");
          return { path: `/client/invoices/${invId}`, targetEntity: "invoice", targetId: invId };
        }
        if (trimmed === "/invoices") {
          return { path: "/client/invoices", targetEntity: "invoice" };
        }
        if (trimmed.startsWith("/client-payments/") || trimmed.startsWith("/client/payment/")) {
          const payId = trimmed.split("/").pop();
          return { path: `/client/payment/history/${payId}`, targetEntity: "client_payment", targetId: payId };
        }
        if (trimmed === "/client-payments" || trimmed === "/client/payments") {
          return { path: "/client/payment/history", targetEntity: "client_payment" };
        }
        if (trimmed.startsWith("/quotations/")) {
          return { path: "/client/payment/quotation", targetEntity: "quotation" };
        }
      }
      return { path: trimmed };
    }
  }

  // 2. Structured entity metadata
  const rawEntity = (notification.entity || notification.entity_type || notification.notification_type || "").toLowerCase();
  const entityId = notification.entity_id || notification.reference_id || notification.related_id || notification.task_id;

  if (rawEntity.includes("invoice")) {
    const path = isClient
      ? (entityId ? `/client/invoices/${entityId}` : "/client/invoices")
      : `/admin/invoices/all${entityId ? `?id=${entityId}` : ""}`;
    return { path, targetEntity: "invoice", targetId: entityId };
  }

  if (rawEntity.includes("payment") || rawEntity.includes("client_payment")) {
    const path = isClient
      ? (entityId ? `/client/payment/history/${entityId}` : "/client/payment/history")
      : `/admin/owners/payments`;
    return { path, targetEntity: "payment", targetId: entityId };
  }

  if (rawEntity.includes("quotation")) {
    const path = isClient ? "/client/payment/quotation" : "/admin/quotations";
    return { path, targetEntity: "quotation", targetId: entityId };
  }

  if (rawEntity.includes("approval")) {
    const path = isClient ? "/client/approvals" : "/admin/approvals";
    return { path, targetEntity: "approval", targetId: entityId };
  }

  if (rawEntity.includes("task") || rawEntity.includes("delay")) {
    const path = isClient ? "/client/progress" : "/engineer/tasks";
    return { path, targetEntity: "task", targetId: entityId };
  }

  if (rawEntity.includes("document") || rawEntity.includes("drawing")) {
    const path = isClient ? "/client/documents" : "/admin/documents";
    return { path, targetEntity: "document", targetId: entityId };
  }

  if (rawEntity.includes("dsr") || rawEntity.includes("daily_report") || rawEntity.includes("site_update")) {
    const path = isClient ? "/client/site-updates/dsr" : "/engineer/progress/entry";
    return { path, targetEntity: "dsr", targetId: entityId };
  }

  if (rawEntity.includes("photo")) {
    const path = isClient ? "/client/site-updates/photos" : "/engineer/photos";
    return { path, targetEntity: "photo", targetId: entityId };
  }

  if (rawEntity.includes("issue") || rawEntity.includes("risk")) {
    const path = isClient ? "/client/issues" : "/engineer/issues";
    return { path, targetEntity: "issue", targetId: entityId };
  }

  // 3. Semantic fallback from Title, Message, Description
  const title = (notification.title || "").toLowerCase();
  const desc = (notification.description || notification.message || notification.details || "").toLowerCase();
  const fullText = `${title} ${desc}`;

  // Invoice detection
  if (fullText.includes("invoice")) {
    const invMatch = fullText.match(/#(\d+)|inv[ -]?0*(\d+)/i);
    const extractedId = invMatch ? (invMatch[1] || invMatch[2]) : entityId;
    const path = isClient
      ? (extractedId ? `/client/invoices/${extractedId}` : "/client/invoices")
      : `/admin/invoices/all${extractedId ? `?id=${extractedId}` : ""}`;
    return { path, targetEntity: "invoice", targetId: extractedId };
  }

  // Payment detection
  if (fullText.includes("payment")) {
    const payMatch = fullText.match(/cp\d+|#(\d+)/i);
    const extractedId = payMatch ? payMatch[0].toUpperCase() : entityId;
    const path = isClient
      ? (extractedId ? `/client/payment/history/${extractedId}` : "/client/payment/history")
      : `/admin/owners/payments`;
    return { path, targetEntity: "payment", targetId: extractedId };
  }

  // Quotation detection
  if (fullText.includes("quotation")) {
    return { path: isClient ? "/client/payment/quotation" : "/admin/quotations", targetEntity: "quotation" };
  }

  // Approval detection
  if (fullText.includes("approval") || fullText.includes("approved") || fullText.includes("rejected")) {
    return { path: isClient ? "/client/approvals" : "/admin/approvals", targetEntity: "approval" };
  }

  // Task / Progress detection
  if (fullText.includes("task") || fullText.includes("delayed") || fullText.includes("progress")) {
    return { path: isClient ? "/client/progress" : "/engineer/tasks", targetEntity: "task" };
  }

  // Documents detection
  if (fullText.includes("document") || fullText.includes("drawing") || fullText.includes("blueprint")) {
    return { path: isClient ? "/client/documents" : "/admin/documents", targetEntity: "document" };
  }

  // Site Updates / Photos / DSR
  if (fullText.includes("photo") || fullText.includes("site photo")) {
    return { path: isClient ? "/client/site-updates/photos" : "/engineer/photos", targetEntity: "photo" };
  }
  if (fullText.includes("dsr") || fullText.includes("daily report")) {
    return { path: isClient ? "/client/site-updates/dsr" : "/engineer/progress/entry", targetEntity: "dsr" };
  }

  // Issues detection
  if (fullText.includes("issue") || fullText.includes("risk") || fullText.includes("hazard")) {
    return { path: isClient ? "/client/issues" : "/engineer/issues", targetEntity: "issue" };
  }

  // Communication / Message
  if (fullText.includes("message") || fullText.includes("announcement")) {
    return { path: isClient ? "/client/communication/messages" : "/chat", targetEntity: "message" };
  }

  // Default fallback to role's Notifications page
  return {
    path: isClient ? "/client/notifications" : "/admin/notifications",
    targetEntity: "notification",
  };
}

/**
 * Centralized Notification Click Handler:
 * 1. Marks notification as read if unread
 * 2. Resolves destination route
 * 3. Navigates to target page
 * 4. Calls optional callbacks (e.g. close dropdown)
 */
export async function handleNotificationClick(
  notification: Partial<Notification> & Record<string, any>,
  navigate: (path: string) => void,
  userRole: string = "Client",
  options?: {
    onMarkedRead?: (notifId: string | number) => void;
    onCloseDropdown?: () => void;
  }
): Promise<void> {
  // Mark as read
  if (!notification.read && !notification.is_read && notification.id) {
    try {
      await notificationService.markAsRead(notification.id, notification.source || "system");
      if (options?.onMarkedRead) {
        options.onMarkedRead(notification.id);
      }
    } catch (err) {
      console.warn("Failed to mark notification as read on click:", err);
    }
  }

  // Close dropdown if open
  if (options?.onCloseDropdown) {
    options.onCloseDropdown();
  }

  // Resolve and navigate
  const resolved = resolveNotificationRoute(notification, userRole);
  if (resolved.path) {
    navigate(resolved.path);
  }
}
