/*
 UiContext.tsx - ESP3D WebUI context file

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
import { useContext, useState, useRef, useEffect, useCallback, useMemo } from "preact/hooks"

// Extend Window interface for vendor-prefixed AudioContext
declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext
        audioContext?: typeof AudioContext
    }
}

// Type definitions
interface Panel {
    id: string
    settingid?: string
    [key: string]: unknown
}

interface ConnectionState {
    connected: boolean
    page: string
    extraMsg?: string
    updating?: boolean
}

interface SoundNote {
    f: number // frequency
    d?: number // duration
}

interface AudioContextManager {
    context?: AudioContext | null
    oscillator?: OscillatorNode | null
    list: SoundNote[]
}

interface UiSettingsObject {
    [key: string]: any
}

interface UiSettings {
    getValue: (id: string, base?: UiSettingsObject) => any
    getElement: (id: string, base?: UiSettingsObject) => any
    current: any
    set: (settings: any) => void
    refreshPaused: Record<string, boolean>
}

interface UiContextValue {
    timerIDs: { current: any }
    panels: {
        list: Panel[]
        set: (panels: Panel[]) => void
        visibles: Panel[]
        setVisibles: (panels: Panel[]) => void
        hide: (id: string) => void
        show: (id: string, fixed: boolean) => void
        isVisible: (id: string) => boolean
        initDone: boolean
        setInitDone: (done: boolean) => void
        setPanelsOrder: (order: any[]) => void
        updateTrigger: number
    }
    shortcuts: {
        enabled: boolean
        enable: (enabled: boolean) => void
    }
    uisettings: UiSettings
    connection: {
        connectionState: ConnectionState
        setConnectionState: (state: ConnectionState) => void
    }
    dialogs: {
        showKeepConnected: boolean
        setShowKeepConnected: (show: boolean) => void
    }
    ui: {
        ready: boolean
        setReady: (ready: boolean) => void
    }
}

interface UiContextFn {
    getValue: (id: string, base?: any) => any
    getElement: (id: string, base?: any) => any
    haptic: () => void
    playSound: (sequence: SoundNote[]) => void
    beep: () => void
    beepError: () => void
    beepSeq: (seq: SoundNote[] | undefined) => void
    panels: {
        hide: (id: string) => void
        isVisible: (id: string) => boolean
    }
}

const useUiContextFn: UiContextFn = {} as UiContextFn
const audio: AudioContextManager = { list: [] }

/*
 * Local const
 *
 */
const UiContext = createContext<UiContextValue | undefined>(undefined)
const useUiContext = () => {
    const context = useContext(UiContext)
    if (!context) {
        throw new Error("useUiContext must be used within a UiContextProvider")
    }
    return context
}

interface UiContextProviderProps {
    children: ComponentChildren
}

const UiContextProvider: FunctionalComponent<UiContextProviderProps> = ({ children }) => {
    const [panelsList, setPanelsList] = useState<Panel[]>([])
    const [panelsOrder, setPanelsOrder] = useState<any[]>([])
    const visiblePanelsListRef = useRef<Panel[]>([])
    const [updateTrigger, setUpdateTrigger] = useState<number>(0)
    const uiRefreshPaused = useRef<any>({})
    const timersList = useRef<any>({})
    const [initPanelsVisibles, setInitPanelsVisibles] = useState<boolean>(false)
    const [uiSettings, setUISettings] = useState<any>()
    const [isKeyboardEnabled, setIsKeyboardEnabled] = useState<boolean>(false)
    const [showKeepConnected, setShowKeepConnected] = useState<boolean>(false)
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        connected: false,
        page: "connecting",
    })
    const [uiSetup, setUiSetup] = useState<boolean>(false)

    const removeFromVisibles = useCallback((id: string) => {
        visiblePanelsListRef.current = visiblePanelsListRef.current.filter(
            (element) => element.id != id
        )
        setUpdateTrigger(prev => prev + 1)
    }, [])

    const addToVisibles = useCallback((id: string, fixed: boolean) => {
        if (fixed && panelsOrder.length > 0) {
            const unSortedVisiblePanelsList = [
                ...visiblePanelsListRef.current.filter((element) => element.id != id),
                ...panelsList.filter((element) => element.id == id),
            ]
            visiblePanelsListRef.current = panelsOrder.reduce((acc: Panel[], panel) => {
                const paneldesc = unSortedVisiblePanelsList.filter(
                    (p) => p.settingid == panel.id
                )
                if (paneldesc.length > 0) acc.push(...paneldesc)
                return acc
            }, [])
        } else {
            visiblePanelsListRef.current = [
                ...panelsList.filter((element) => element.id == id),
                ...visiblePanelsListRef.current.filter((element) => element.id != id),
            ]
        }
        setUpdateTrigger(prev => prev + 1)
    }, [panelsList, panelsOrder])

    const isPanelVisible = useCallback((id: string): boolean => {
        //console.log("Checking visibility for panel " + id)
        //console.log(visiblePanelsListRef.current)
        return visiblePanelsListRef.current.some((element) => element.id == id)
    }, [])

    const getElement = useCallback((Id: string, base: any = null): any => {
        const settingsobject = base ? base : uiSettings
        if (settingsobject) {
            for (let key in settingsobject) {
                if (Array.isArray(settingsobject[key])) {
                    for (
                        let index = 0;
                        index < settingsobject[key].length;
                        index++
                    ) {
                        if (settingsobject[key][index].id == Id) {
                            return settingsobject[key][index]
                        }
                        if (Array.isArray(settingsobject[key][index].value)) {
                            for (
                                let subindex = 0;
                                subindex <
                                settingsobject[key][index].value.length;
                                subindex++
                            ) {
                                if (
                                    settingsobject[key][index].value[subindex]
                                        .id == Id
                                ) {
                                    return settingsobject[key][index].value[
                                        subindex
                                    ]
                                }
                            }
                        }
                    }
                } else {
                    for (let subkey in settingsobject[key]) {
                        if (Array.isArray(settingsobject[key][subkey])) {
                            for (
                                let index = 0;
                                index < settingsobject[key][subkey].length;
                                index++
                            ) {
                                if (
                                    settingsobject[key][subkey][index].id == Id
                                ) {
                                    return settingsobject[key][subkey][index]
                                }
                            }
                        }
                    }
                }
            }
        }
        return undefined
    }, [uiSettings])

    const getValue = useCallback((Id: string, base: any = null): any => {
        if (!Id) return undefined
        const settingsobject = base ? base : uiSettings
        if (settingsobject) {
            for (let key in settingsobject) {
                if (Array.isArray(settingsobject[key])) {
                    for (
                        let index = 0;
                        index < settingsobject[key].length;
                        index++
                    ) {
                        if (settingsobject[key][index].id == Id) {
                            return settingsobject[key][index].value
                        }
                        if (Array.isArray(settingsobject[key][index].value)) {
                            for (
                                let subindex = 0;
                                subindex <
                                settingsobject[key][index].value.length;
                                subindex++
                            ) {
                                if (
                                    settingsobject[key][index].value[subindex]
                                        .id == Id
                                ) {
                                    return settingsobject[key][index].value[
                                        subindex
                                    ].value
                                }
                            }
                        }
                    }
                } else {
                    for (let subkey in settingsobject[key]) {
                        if (Array.isArray(settingsobject[key][subkey])) {
                            for (
                                let index = 0;
                                index < settingsobject[key][subkey].length;
                                index++
                            ) {
                                if (
                                    settingsobject[key][subkey][index].id == Id
                                ) {
                                    return settingsobject[key][subkey][index]
                                        .value
                                }
                            }
                        }
                    }
                }
            }
        }
        return undefined
    }, [uiSettings])

    useUiContextFn.getValue = getValue
    useUiContextFn.getElement = getElement

    const haptic = () => {
        if (getValue("audiofeedback")) {
            play([{ f: 1000, d: 100 }])
        }
        if (!window || !window.navigator || !window.navigator.vibrate) return
        if (getValue("hapticfeedback")) {
            window.navigator.vibrate(200)
            //console.log("haptic feedback")
        }
    }

    useUiContextFn.haptic = haptic

    const initAudio = () => {
        if (typeof window.AudioContext !== "undefined") {
            audio.context = new window.AudioContext()
        } else if (typeof window.webkitAudioContext !== "undefined") {
            audio.context = new window.webkitAudioContext()
        } else if (typeof window.audioContext !== "undefined") {
            audio.context = new window.audioContext()
        }
    }

    const play = (sequence?: SoundNote[]) => {
        if (sequence && audio.list.length > 0) {
            return
        }
        if (getValue("audio")) {
            if (!audio.context) {
                initAudio()
            }
            if (sequence) {
                audio.list = [...sequence]
            }
            if (audio.list.length > 0 && audio.context) {
                if (audio.context.state === "suspended") audio.context.resume()
                if (audio.oscillator) audio.oscillator.stop()
                audio.oscillator = audio.context.createOscillator()
                audio.oscillator.type = "square"
                audio.oscillator.connect(audio.context.destination)
                const current = audio.list.shift()
                if (current) {
                    audio.oscillator.frequency.value = current.f
                    audio.oscillator.start()
                    if (current.d) {
                        setTimeout(() => {
                            audio.oscillator?.stop()
                            play()
                        }, current.d)
                    } else {
                        audio.oscillator.stop()
                        play()
                    }
                }
            }
        }
    }

    //play sequence
    useUiContextFn.playSound = play
    //beep
    useUiContextFn.beep = () => {
        play([
            { f: 1046, d: 150 },
            { f: 1318, d: 150 },
            { f: 1567, d: 150 },
        ])
    }
    //beep error
    useUiContextFn.beepError = () => {
        play([
            { f: 400, d: 150 },
            { f: 200, d: 200 },
            { f: 100, d: 300 },
        ])
    }
    //sequence
    useUiContextFn.beepSeq = (seq: SoundNote[] | undefined) => {
        if (!seq) return
        play(seq)
    }


    useUiContextFn.panels = { hide: removeFromVisibles, isVisible: isPanelVisible }


    useEffect(() => {
        initAudio()
    }, [])

    const setVisibles = useCallback((newList: Panel[]) => {
        visiblePanelsListRef.current = newList
        setUpdateTrigger(prev => prev + 1)
    }, [])

    const store: UiContextValue = useMemo(() => ({
        timerIDs: timersList,
        panels: {
            list: panelsList,
            set: setPanelsList,
            visibles: visiblePanelsListRef.current,
            setVisibles,
            hide: removeFromVisibles,
            show: addToVisibles,
            isVisible: isPanelVisible,
            initDone: initPanelsVisibles,
            setInitDone: setInitPanelsVisibles,
            setPanelsOrder: setPanelsOrder,
            updateTrigger: updateTrigger,
        },
        shortcuts: {
            enabled: isKeyboardEnabled,
            enable: setIsKeyboardEnabled,
        },
        uisettings: {
            current: uiSettings,
            set: setUISettings,
            getValue,
            getElement,
            refreshPaused: uiRefreshPaused.current,
        },
        connection: {
            connectionState,
            setConnectionState,
        },

        dialogs: {
            showKeepConnected,
            setShowKeepConnected,
        },
        ui: {
            ready: uiSetup,
            setReady: setUiSetup,
        },
    }), [
        panelsList,
        setVisibles,
        removeFromVisibles,
        addToVisibles,
        isPanelVisible,
        initPanelsVisibles,
        updateTrigger,
        isKeyboardEnabled,
        uiSettings,
        getValue,
        getElement,
        connectionState,
        showKeepConnected,
        uiSetup,
    ])

    return <UiContext.Provider value={store}>{children}</UiContext.Provider>
}

export { UiContextProvider, useUiContext, useUiContextFn }
export type { UiContextValue, UiContextFn, UiSettings, Panel, ConnectionState, SoundNote }
