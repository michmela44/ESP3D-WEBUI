/*
 SettingsContext.tsx - ESP3D WebUI context file

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
import { createContext, FunctionalComponent, ComponentChildren } from "preact"
import { useRef, useContext } from "preact/hooks"

// Type definitions
interface PollingItem {
    id: string
    interval: NodeJS.Timeout
}

// Settings object types
interface SettingsObject {
    [key: string]: any
}

interface InterfaceSettings extends SettingsObject {
    settings?: any
}

interface ConnectionSettings extends SettingsObject {
    HostName?: string
    CameraName?: string
    HostPath?: string
    Screen?: string
    FlashFileSystem?: string
    HostTarget?: string
    HostUploadPath?: string
    HostDownloadPath?: string
}

interface FeaturesSettings extends SettingsObject {
    [subsection: string]: any
}

type PollingCallback = () => void | Promise<void>

interface SettingsContextValue {
    interfaceSettings: { current: InterfaceSettings }
    connectionSettings: { current: ConnectionSettings }
    featuresSettings: { current: FeaturesSettings }
    activity: {
        startPolling: (id: string, interval: number, fn: PollingCallback) => void
        stopPolling: (id?: string) => void
    }
}

interface SettingsContextFn {
    getValue: (val: string) => any
}

interface SettingsContextProviderProps {
    children: ComponentChildren
}

/*
 * Local const
 *
 */
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)
const useSettingsContext = () => {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error("useSettingsContext must be used within a SettingsContextProvider")
    }
    return context
}

const useSettingsContextFn: SettingsContextFn = {} as SettingsContextFn

const SettingsContextProvider: FunctionalComponent<SettingsContextProviderProps> = ({ children }) => {
    const interfaceValues = useRef<InterfaceSettings>({})
    const connectionValues = useRef<ConnectionSettings>({})
    const featuresValues = useRef<FeaturesSettings>({})
    const pollingInterval = useRef<PollingItem[]>([])

    useSettingsContextFn.getValue = (val: string): any => connectionValues.current[val]

    function startPolling(id: string, interval: number, fn: PollingCallback): void {
        stopPolling(id)
        if (interval > 0 && fn) {
            const newInterval = setInterval(() => {
                fn()
            }, interval)
            pollingInterval.current.push({ id: id, interval: newInterval })
        }
    }

    /*
     * Stop polling query
     */
    function stopPolling(id?: string): void {
        if (typeof id == "undefined") {
            pollingInterval.current.forEach((item) => {
                clearInterval(item.interval)
            })
            pollingInterval.current = []
        } else {
            const index = pollingInterval.current.findIndex(
                (item) => item.id == id
            )
            if (index != -1) {
                clearInterval(pollingInterval.current[index].interval)
                pollingInterval.current.splice(index, 1)
            }
        }
    }

    const store: SettingsContextValue = {
        interfaceSettings: interfaceValues,
        connectionSettings: connectionValues,
        featuresSettings: featuresValues,
        activity: { startPolling, stopPolling },
    }

    return (
        <SettingsContext.Provider value={store}>
            {children}
        </SettingsContext.Provider>
    )
}

export { SettingsContextProvider, useSettingsContext, useSettingsContextFn }
export type { SettingsContextValue, SettingsContextFn }
