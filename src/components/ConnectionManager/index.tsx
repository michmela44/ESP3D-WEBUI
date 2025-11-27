import { useEffect } from "preact/hooks";
import { getWebSocketService } from "../../hooks/useWebSocketService";
import { useSettingsContext } from "../../contexts/SettingsContext";

export function ConnectionManager() {
    const { connectionSettings } = useSettingsContext();

    useEffect(() => {
        // Connect if WebCommunication is enabled
        if (connectionSettings.current?.WebCommunication) {
            const service = getWebSocketService();

            if (service) {
                service.connect().catch(error => {
                    console.error("Failed to connect:", error);
                });
            } else {
                console.warn("WebSocketService not yet initialized - cannot connect");
            }
        }
    }, [connectionSettings, connectionSettings.current.WebCommunication]);

    // This component doesn't render anything
    return null;
}