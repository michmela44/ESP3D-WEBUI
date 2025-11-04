/*
 DatasContext.tsx - ESP3D WebUI context file

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
import { createContext, FunctionalComponent } from "preact"
import { useRef, useContext, useState, useCallback, useMemo } from "preact/hooks"
import { limitArr, useStoredState } from "../components/Helpers"

// Type definitions
interface TerminalElement {
    isverboseOnly?: boolean
    [key: string]: any
}

interface Terminal {
    input: { current: any }
    content: TerminalElement[]
    add: (element: TerminalElement) => void
    clear: () => void
    inputHistory: string[]
    addInputHistory: (element: string) => void
    isAutoScroll: { current: boolean }
    isVerbose: { current: boolean | undefined }
    isAutoScrollPaused: { current: boolean | undefined }
    maxTerminalMessages: { current: number | undefined }
}

interface DatasContextValue {
    terminal: Terminal
}

interface DatasContextProviderProps {
    children: any
}

/*
 * Local const
 *
 */
const DatasContext = createContext<DatasContextValue | undefined>(undefined)
const useDatasContext = () => {
    const context = useContext(DatasContext)
    if (!context) {
        throw new Error("useDatasContext must be used within a DatasContextProvider")
    }
    return context
}

const DatasContextProvider: FunctionalComponent<DatasContextProviderProps> = ({ children }) => {
    const isAutoScroll = useRef<boolean>(true)
    const isAutoScrollPaused = useRef<boolean | undefined>(undefined)
    const isVerbose = useRef<boolean | undefined>(undefined)
    const maxTerminalMessages = useRef<number | undefined>(undefined)
    const terminalBuffer = useRef<TerminalElement[]>([])
    const terminalBufferQuiet = useRef<TerminalElement[]>([])
    const [terminalContent, setTerminalContent] = useState<TerminalElement[]>([])
    const [terminalInputHistory, setTerminalInputHistory] = useStoredState<string[]>(
        "terminalInputHistory",
        []
    )
    const terminalInput = useRef<any>()

    const clearTerminal = useCallback(() => {
        terminalBuffer.current = []
        terminalBufferQuiet.current = []
        setTerminalContent([])
    }, [])

    const addTerminalContent = useCallback((element: TerminalElement) => {
        //console.log(element)
        //console.log(
        //    'isVerbose',
        //    terminalBuffer.current.length,
        //    'Quiet',
        //    terminalBufferQuiet.current.length
        //)
        const maxMessages = maxTerminalMessages.current || 1000
        const trimThreshold = Math.floor(maxMessages * 1.2) // Allow 20% overflow before trimming

        terminalBuffer.current.push(element)

        if (terminalBuffer.current.length > trimThreshold) {
            const removeCount = terminalBuffer.current.length - maxMessages
            terminalBuffer.current.splice(0, removeCount)
        }

        if (!element.isverboseOnly) {
            //console.log("quiet command", element)
            terminalBufferQuiet.current.push(element)

            if (terminalBufferQuiet.current.length > trimThreshold) {
                const removeCount = terminalBufferQuiet.current.length - maxMessages
                terminalBufferQuiet.current.splice(0, removeCount)
            }
        }

        if (isVerbose.current) setTerminalContent([...terminalBuffer.current])
        else setTerminalContent([...terminalBufferQuiet.current])
    }, [])

    const addTerminalInputHistory = useCallback((element: string) => {
        setTerminalInputHistory((prev: string[]) =>
            limitArr([...prev, element], 50)
        )
    }, [setTerminalInputHistory])

    const store: DatasContextValue = useMemo(() => ({
        terminal: {
            input: terminalInput,
            content: terminalContent,
            add: addTerminalContent,
            clear: clearTerminal,
            inputHistory: terminalInputHistory,
            addInputHistory: addTerminalInputHistory,
            isAutoScroll,
            isVerbose,
            isAutoScrollPaused,
            maxTerminalMessages,
        },
    }), [terminalContent, terminalInputHistory, addTerminalContent, clearTerminal, addTerminalInputHistory])

    return (
        <DatasContext.Provider value={store}>{children}</DatasContext.Provider>
    )
}

export { DatasContextProvider, useDatasContext }
export type { DatasContextValue, Terminal, TerminalElement }
