/**
 * Notification Handlers for WebSocketService
 * Provides handlers for system notifications, errors, and status messages
 */

import type { Toast, ToastType } from "../../src/contexts/ToastsContext";


export interface NotificationHandler {
    addToast: (toast: Omit<Toast, "id">) => void;
    clearModals: () => void;
}

/**
 * Parses notification messages from the controller
 * Format: "NOTIFICATION:Type:Message"
 *
 * Note: The message display includes the Type field.
 * For example, "NOTIFICATION:Success:File uploaded" displays as "Success:File uploaded"
 * This matches the original WsContext behavior.
 */
export function parseNotification(message: string): Omit<Toast, "id"> | null {
    const parts = message.split(":");
    if (parts.length < 3) {
        return null;
    }

    const [, type, ...contentParts] = parts;
    // Include the type in the content display (e.g., "Success:File uploaded")
    const content = `${type}${contentParts.length > 0 ? `:${  contentParts.join(":")}` : ""}`;

    let toastType: ToastType = "notification";
    if (type.startsWith("Error")) {
        toastType = "error";
    } else if (type.startsWith("Success")) {
        toastType = "success";
    } else if (type.startsWith("Warning")) {
        toastType = "warning";
    }

    return {
        content,
        type: toastType,
    };
}

/**
 * Parses error messages from the controller
 * Format: "ERROR:ErrorCode:ErrorMessage"
 */
export function parseError(message: string): Omit<Toast, "id"> | null {
    const parts = message.split(":");
    if (parts.length < 3) {
        return null;
    }

    const [, errorCode, ...messageParts] = parts;
    const errorMessage = messageParts.join(":");

    return {
        content: `Error code ${errorCode}: ${errorMessage}`,
        type: "error",
    };
}

/**
 * Creates a connection error toast
 */
export function createConnectionErrorToast(reason: string): Omit<Toast, "id"> {
    const messages: Record<string, string> = {
        "sessiontimeout": "Session timeout - please reconnect",
        "connectionlost": "Connection lost - attempting to reconnect",
        "already connected": "Already connected from another session",
        "unknown": "Unknown connection error",
    };

    return {
        content: messages[reason] || messages["unknown"],
        type: "error",
    };
}

/**
 * Creates a connection status toast
 */
export function createConnectionStatusToast(status: string): Omit<Toast, "id"> | null {
    const messages: Record<string, Omit<Toast, "id">> = {
        "connected": {
            content: "Connected to controller",
            type: "success",
        },
        "connecting": {
            content: "Connecting to controller...",
            type: "notification",
        },
        "reconnecting": {
            content: "Reconnecting to controller...",
            type: "warning",
        },
        "disconnected": {
            content: "Disconnected from controller",
            type: "notification",
        },
    };

    return messages[status] || null;
}

/**
 * Creates a reconnection attempt toast
 */
export function createReconnectionToast(attempt: number, maxAttempts: number): Omit<Toast, "id"> {
    return {
        content: `Reconnection attempt ${attempt}/${maxAttempts}`,
        type: "warning",
    };
}

/**
 * Creates a max reconnection attempts reached toast
 */
export function createMaxReconnectionToast(): Omit<Toast, "id"> {
    return {
        content: "Maximum reconnection attempts reached. Please check your connection.",
        type: "error",
    };
}
