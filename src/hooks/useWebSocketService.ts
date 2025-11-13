import { useEffect, useRef } from "preact/hooks";
import { WebSocketService } from "../../Services/WebSocketService";
import { WebSocketAdapter } from "../../Services/WebSocketAdapter";
import { useUiContext } from "../contexts";
import { useToastsContext } from "../contexts";
import { useModalsContext } from "../contexts";
import { useTargetContext } from "../targets";
import { useHttpQueueContext } from "../contexts";
import { useSettingsContext } from "../contexts";
import { dispatchToExtensions } from "../components/Helpers";

let webSocketServiceInstance : WebSocketService | undefined;

/**
 * Hook to get or create the WebSocketService instance
 * Handles all integrations with app contexts
 */
export function useWebSocketService() : WebSocketService {
    const { connection, dialogs } = useUiContext();
    const { toasts } = useToastsContext();
    const { modals } = useModalsContext();
    const { processData } = useTargetContext();
    const { removeAllRequests } = useHttpQueueContext();
    const { connectionSettings, activity } = useSettingsContext();

    const serviceRef = useRef<WebSocketService | undefined>();
    useEffect(() => {
        // Create service instance once on mount
        // Only create if we have the WebSocketPort configured
        if (!webSocketServiceInstance) {
            const port = connectionSettings.current?.WebSocketPort;
            if (!port) {
                console.warn("WebSocketPort not configured in connection settings");
                return;
            }

            // Construct WebSocket URL from current location
            const address = document.location.hostname;
            const path =
                connectionSettings.current.WebCommunication === "Synchronous"
                    ? ""
                    : "/ws"
            const wsPort = document.location.port != ""
                    ? parseInt(document.location.port) + 2
                    : port
            const wsUrl = `ws://${address}:${wsPort}${path}`;

            const wsAdapter = new WebSocketAdapter(wsUrl);
            webSocketServiceInstance = new WebSocketService(wsAdapter);

            // Set up service context for dependency injection
            // This allows the service to access app-level contexts (connectionSettings, dialogs, activity, modals, extensions)
            webSocketServiceInstance.setServiceContext({
                dialogs,
                activity,
                modalsCleared: () => modals.clearModals(),
                extensionsNotify: (type, data, targetId) => dispatchToExtensions(type, data, targetId),
            });

            // Set up notification handler
            webSocketServiceInstance.setNotificationHandler({
                addToast: (toast) => toasts.addToast(toast),
                clearModals: () => modals.clearModals(),
            });

            // Set up connection state listener
            webSocketServiceInstance.setConnectionStateListener((state) => {
                connection.setConnectionState(state);
            });

            // Set up data routing
            webSocketServiceInstance.addDataListener((type, data) => {
                processData(type, data);
            });

            // Set up ping listener for session timeout warning
            webSocketServiceInstance.addPingListener((timeRemaining, maxTime) => {
                if (timeRemaining < 30000 && timeRemaining > 0) {
                    dialogs.setShowKeepConnected(true);
                }
            });

            // Set up session timeout listener
            webSocketServiceInstance.setSessionTimeoutListener(() => {
                dialogs.setShowKeepConnected(false);
            });

            // Set up error handler to abort HTTP requests on controller errors
            webSocketServiceInstance.setErrorHandler((errorCode, errorMessage) => {
                removeAllRequests();
            });
        }

        serviceRef.current = webSocketServiceInstance;
        return () => {
            // Don't disconnect on unmount - service should persist
        };
    }, [connection, dialogs, toasts, modals, processData, removeAllRequests, connectionSettings, activity]);

    // Return the service instance (will be undefined if not yet initialized)
    return serviceRef.current!;
}

/**
 * Gets the global WebSocketService instance
 * Use this when you need the service outside of hooks
 */
export function getWebSocketService(): WebSocketService | undefined {
    return webSocketServiceInstance;
}