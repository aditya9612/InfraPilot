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
  const normalizedRole = (userRole || "Client").toLowerCase().trim();
  const isClient = normalizedRole === "client";
  const isLabour = normalizedRole === "labour";
  const isEngineer = normalizedRole === "siteengineer" || normalizedRole === "engineer";
  const isManager = normalizedRole === "projectmanager" || normalizedRole === "manager";
  const isAccountant = normalizedRole === "accountant";

  const rawEntity = String(notification.entity || notification.entity_type || notification.notification_type || "").toLowerCase();
  const title = String(notification.title || "").toLowerCase();
  const desc = String(notification.description || notification.message || notification.details || "").toLowerCase();
  const rawLink = String(notification.link || notification.url || notification.action_url || "").toLowerCase().trim();
  const fullText = `${title} ${desc} ${rawEntity} ${rawLink}`;

  // If explicit internal link is provided and valid for current role
  if (rawLink && rawLink.startsWith("/")) {
    if (isLabour && (rawLink.startsWith("/labour/") || rawLink.startsWith("/chat"))) {
      return { path: rawLink };
    }
    if (isClient && (rawLink.startsWith("/client/") || rawLink.startsWith("/chat"))) {
      return { path: rawLink };
    }
    if (isEngineer && (rawLink.startsWith("/engineer/") || rawLink.startsWith("/chat"))) {
      return { path: rawLink };
    }
    if (isAccountant && (rawLink.startsWith("/accountant/") || rawLink.startsWith("/chat"))) {
      return { path: rawLink };
    }
    if (isManager && (rawLink.startsWith("/manager/") || rawLink.startsWith("/chat"))) {
      return { path: rawLink };
    }
  }

  // ── 1. Labour Routes ──
  if (isLabour) {
    // Tasks -> /labour/tasks (My Tasks Page)
    if (fullText.includes("task") || fullText.includes("assigned") || fullText.includes("assign") || fullText.includes("work item")) {
      return { path: "/labour/tasks", targetEntity: "task" };
    }
    // Attendance -> /labour/attendance
    if (fullText.includes("attend") || fullText.includes("check in") || fullText.includes("check out") || fullText.includes("streak")) {
      return { path: "/labour/attendance", targetEntity: "attendance" };
    }
    // Work Updates -> /labour/work-updates
    if (fullText.includes("work update") || fullText.includes("photo") || fullText.includes("before") || fullText.includes("after") || fullText.includes("progress")) {
      return { path: "/labour/work-updates", targetEntity: "work_update" };
    }
    // Payments / Wages -> /labour/payments
    if (fullText.includes("payment") || fullText.includes("wage") || fullText.includes("salary") || fullText.includes("paid")) {
      return { path: "/labour/payments", targetEntity: "payment" };
    }
    // Task Requests -> /labour/task-requests
    if (fullText.includes("request")) {
      return { path: "/labour/task-requests", targetEntity: "task_request" };
    }
    // Chat -> /labour/chat
    if (fullText.includes("chat") || fullText.includes("message")) {
      return { path: "/labour/chat", targetEntity: "chat" };
    }

    // Default for Labour is My Tasks page
    return { path: "/labour/tasks", targetEntity: "task" };
  }

  // ── 2. Client Routes ──
  if (isClient) {
    // 1. Invoice notifications -> /client/invoices
    if (fullText.includes("invoice")) {
      return { path: "/client/invoices", targetEntity: "invoice" };
    }

    // 2. Quotation notifications -> /client/payment/quotation
    if (fullText.includes("quotation")) {
      return { path: "/client/payment/quotation", targetEntity: "quotation" };
    }

    // 3. Payment Approved / Rejected / Approval notifications -> /client/approvals
    if (
      fullText.includes("approval") ||
      (fullText.includes("payment") && (fullText.includes("approv") || fullText.includes("reject") || fullText.includes("status"))) ||
      title.includes("payment approved") ||
      title.includes("payment rejected") ||
      title.includes("approved") ||
      fullText.includes("approved") ||
      fullText.includes("rejected")
    ) {
      return { path: "/client/approvals", targetEntity: "approval" };
    }

    // 4. Payment History
    if (fullText.includes("payment") || fullText.includes("client_payment") || fullText.includes("transaction")) {
      return { path: "/client/payment/history", targetEntity: "client_payment" };
    }

    // 5. Work Progress / Tasks
    if (fullText.includes("task") || fullText.includes("delay") || fullText.includes("progress")) {
      return { path: "/client/progress", targetEntity: "task" };
    }

    // 6. Documents & Drawings
    if (fullText.includes("document") || fullText.includes("drawing") || fullText.includes("blueprint")) {
      return { path: "/client/documents", targetEntity: "document" };
    }

    // 7. Site Updates: Photos / DSR
    if (fullText.includes("photo")) {
      return { path: "/client/site-updates/photos", targetEntity: "photo" };
    }
    if (fullText.includes("dsr") || fullText.includes("daily report") || fullText.includes("site update")) {
      return { path: "/client/site-updates/dsr", targetEntity: "dsr" };
    }

    // 8. Issues & Risks
    if (fullText.includes("issue") || fullText.includes("risk") || fullText.includes("hazard")) {
      return { path: "/client/issues", targetEntity: "issue" };
    }

    // 9. Messages / Chat
    if (fullText.includes("message") || fullText.includes("chat")) {
      return { path: "/chat", targetEntity: "chat" };
    }

    // Safe client internal link fallback
    if (rawLink.startsWith("/client/")) {
      return { path: rawLink };
    }

    return { path: "/client/invoices", targetEntity: "invoice" };
  }

  // ── 3. Engineer Routes ──
  if (isEngineer) {
    if (fullText.includes("task")) return { path: "/engineer/tasks", targetEntity: "task" };
    if (fullText.includes("dsr")) return { path: "/engineer/dsr", targetEntity: "dsr" };
    if (fullText.includes("photo")) return { path: "/engineer/photos", targetEntity: "photo" };
    if (fullText.includes("material")) return { path: "/engineer/material/receipt", targetEntity: "material" };
    if (fullText.includes("qc") || fullText.includes("inspection")) return { path: "/engineer/qc/inspection", targetEntity: "qc" };
    if (fullText.includes("attendance") || fullText.includes("labour")) return { path: "/engineer/labor/attendance", targetEntity: "attendance" };
    if (fullText.includes("issue")) return { path: "/engineer/issues", targetEntity: "issue" };
    if (fullText.includes("approval")) return { path: "/engineer/approvals/work", targetEntity: "approval" };
    return { path: "/engineer/tasks", targetEntity: "task" };
  }

  // ── 4. Project Manager Routes ──
  if (isManager) {
    if (fullText.includes("task")) return { path: "/manager/tasks", targetEntity: "task" };
    if (fullText.includes("approval")) return { path: "/manager/approvals", targetEntity: "approval" };
    if (fullText.includes("qc") || fullText.includes("quality")) return { path: "/manager/quality", targetEntity: "quality" };
    if (fullText.includes("dsr")) return { path: "/manager/dsr-approvals", targetEntity: "dsr" };
    return { path: "/manager/tasks", targetEntity: "task" };
  }

  // ── 5. Accountant Routes ──
  if (isAccountant) {
    if (fullText.includes("invoice") || fullText.includes("bill")) return { path: "/accountant/receivables", targetEntity: "invoice" };
    if (fullText.includes("payment")) return { path: "/accountant/payments", targetEntity: "payment" };
    if (fullText.includes("expense")) return { path: "/accountant/expenses", targetEntity: "expense" };
    if (fullText.includes("payroll")) return { path: "/accountant/payroll", targetEntity: "payroll" };
    if (fullText.includes("banking")) return { path: "/accountant/banking", targetEntity: "banking" };
    if (fullText.includes("approval")) return { path: "/accountant/approvals", targetEntity: "approval" };
    return { path: "/accountant/receivables", targetEntity: "invoice" };
  }

  // ── 6. Admin Fallback ──
  if (fullText.includes("invoice")) return { path: "/admin/invoices/all", targetEntity: "invoice" };
  if (fullText.includes("quotation")) return { path: "/admin/quotations", targetEntity: "quotation" };
  if (fullText.includes("approval") || fullText.includes("approved")) return { path: "/admin/approvals", targetEntity: "approval" };
  if (fullText.includes("payment")) return { path: "/admin/owners/payments", targetEntity: "payment" };
  if (fullText.includes("task")) return { path: "/admin/projects", targetEntity: "task" };

  return {
    path: userRole === "Admin" ? "/admin/notifications" :
          userRole === "SiteEngineer" ? "/engineer/notifications" :
          userRole === "Labour" ? "/labour/notifications" : "/admin/notifications",
    targetEntity: "notification",
  };
}

/**
 * Centralized Notification Click Handler:
 * 1. Closes dropdown
 * 2. Resolves destination route and navigates IMMEDIATELY
 * 3. Marks notification as read asynchronously in the background
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
  // 1. Close dropdown immediately
  if (options?.onCloseDropdown) {
    options.onCloseDropdown();
  }

  // 2. Resolve route and navigate IMMEDIATELY without waiting for network request
  const resolved = resolveNotificationRoute(notification, userRole);
  if (resolved.path) {
    navigate(resolved.path);
  }

  // 3. Mark as read asynchronously in the background
  if (!notification.read && !notification.is_read && notification.id) {
    notificationService
      .markAsRead(notification.id, notification.source || "system")
      .then(() => {
        if (options?.onMarkedRead) {
          options.onMarkedRead(notification.id!);
        }
      })
      .catch((err) => {
        console.warn("Failed to mark notification as read on click:", err);
      });
  }
}
