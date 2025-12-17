/*
 Terminal.js - ESP3D WebUI component file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

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

import { TargetedKeyboardEvent, TargetedEvent, type FunctionalComponent, type VNode } from "preact"
import { useEffect, useRef, useState, useMemo } from "preact/hooks"
import { T } from "../Translations"
import {
    Terminal,
    Send,
    CheckCircle,
    Circle,
    PauseCircle,
    ChevronLeft,
    ChevronRight,
} from "preact-feather"
import { useUiContext, useDatasContext, useUiContextFn, type TerminalElement } from "../../contexts"
import { useTargetContext, variablesList } from "../../targets"
import { useTargetCommands } from "../../hooks"
import { replaceVariables } from "../Helpers"
import { ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { Menu as PanelMenu } from "./"

/*
 * Local const
 *
 */
type TerminalLine = TerminalElement & {
    content: string
    type?: string
    isAction?: boolean
    actionType?: string
    isverboseOnly?: boolean
}

const TerminalPanel: FunctionalComponent = () => {
    const { panels, uisettings } = useUiContext()
    const { terminal } = useDatasContext()
    const { processData } = useTargetContext()
    const { targetCommands } = useTargetCommands()
    if (terminal.isVerbose.current == undefined)
        terminal.isVerbose.current = uisettings.getValue("verbose")
    if (terminal.isAutoScroll.current == undefined)
        terminal.isAutoScroll.current = uisettings.getValue("autoscroll")
    if (terminal.maxTerminalMessages.current == undefined)
        terminal.maxTerminalMessages.current = uisettings.getValue("MaxTerminalMessages") || 400
    const [isVerbose, setIsVerbose] = useState<boolean | undefined>(terminal.isVerbose.current)
    const [isAutoScroll, setIsAutoScroll] = useState<boolean>(
        terminal.isAutoScroll.current
    )
    const [isAutoScrollPaused, setIsAutoScrollPaused] = useState<boolean>(false)
    let lastPos: number = 0
    const inputRef = useRef<HTMLInputElement | null>(null)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    const terminalOutput = useRef<HTMLDivElement | null>(null)
    const id = "terminalPanel"
    const inputHistoryIndex = useRef<number>(terminal.inputHistory.length)
    const renderedMessages = useRef<Array<VNode | null>>([])
    const lastRenderedCount = useRef<number>(0)
    const lastFirstMessage = useRef<TerminalLine | null>(null)
    const scrollToBottom = () => {
        if (
            terminal.isAutoScroll.current &&
            !terminal.isAutoScrollPaused.current
        ) {
            terminalOutput.current!.scrollTop =
                terminalOutput.current!.scrollHeight
        }
    }

    const renderLine = (line: TerminalLine, index: number): VNode | null => {
        if (line.isAction) {
            return (
                <pre key={index} class="action" title={line.actionType}>
                    {line.content}
                </pre>
            )
        } else if (
            isVerbose ||
            isVerbose === line.isverboseOnly
        ) {
            let className = ""
            switch (line.type) {
                case "echo":
                    className = "echo"
                    break
                case "error":
                    className = "error"
                    break
                case "stream":
                    if (line.content.startsWith("ALARM:") || line.content.startsWith("Hold:") || line.content.startsWith("Door:") ) {
                        className = "warning"
                    } else if (line.content.startsWith("error:")) {
                        className = "error"
                    } else if (line.content.startsWith("<Hold:")) {
                        return <pre key={index}>&lt;<span class="warning">Hold</span>{line.content.substring(5)}</pre>
                    } else if (line.content.startsWith("<Door:")) {
                        return <pre key={index}>&lt;<span class="warning">Door</span>{line.content.substring(5)}</pre>
                    } else if (line.content.startsWith("<Alarm")) {
                        return <pre key={index}>&lt;<span class="warning">Alarm</span>{line.content.substring(6)}</pre>
                    } else if (line.content.startsWith("[MSG:ERR")) {
                        return <pre key={index}>[<span class="error">MSG:ERR</span>{line.content.substring(8)}</pre>
                    } else if (line.content.startsWith("[MSG:WARN")) {
                        return <pre key={index}>[<span class="warning">MSG:WARN</span>{line.content.substring(9)}</pre>
                    } else if (line.content.startsWith("[MSG:INFO")) {
                        return <pre key={index}>[<span class="info">MSG:INFO</span>{line.content.substring(9)}</pre>
                    }
                    break
                default:
                    //do nothing
            }

            return <pre key={index} class={className}>{line.content}</pre>
        }
        return null
    }
    const historyPrev = (): void => {
        if (terminal.inputHistory.length > 0 && inputHistoryIndex.current > 0) { 
            inputHistoryIndex.current--
            if (inputRef.current) inputRef.current.value = terminal.inputHistory[inputHistoryIndex.current]
            terminal.input.current = inputRef.current ? inputRef.current.value : ""
        }
    }

    const historyNext = (): void => {
        if (
            terminal.inputHistory.length > 0 &&
            inputHistoryIndex.current < terminal.inputHistory.length-1 
        ) {
            inputHistoryIndex.current++
            if (inputRef.current) inputRef.current.value = terminal.inputHistory[inputHistoryIndex.current]
            terminal.input.current = inputRef.current ? inputRef.current.value : ""
        } else {
            if (inputRef.current) inputRef.current.value = ""
            terminal.input.current = inputRef.current ? inputRef.current.value : ""
            inputHistoryIndex.current = terminal.inputHistory.length
        } 
    }
    const onKeyUp = (e: TargetedKeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case "Enter":
                onSend(e)
                break
            case "ArrowUp": //prev
                historyPrev()
                break
            case "ArrowDown": //next
                historyNext()
                break
            default:
            //ignore
        }
    }
    const onSend = (_e?: Event) => {
        useUiContextFn.haptic()
        inputRef.current?.focus()
        if (!terminal.input.current && variablesList.allowEmptyLine)
            terminal.input.current = ""
        if (
            (terminal.input.current &&
                terminal.input.current.trim().length > 0) ||
            variablesList.allowEmptyLine
        ) {
            const cmd = terminal.input.current.trim()
            if (
                cmd.length > 0 &&
                terminal.inputHistory[terminal.inputHistory.length - 1] != cmd
            ) {
                terminal.addInputHistory(cmd)
            }
            inputHistoryIndex.current = terminal.inputHistory.length 

            // echo here to prevent verbose mode from filtering out
            // polling commands and whatnot.  If the user sends it
            // explicitly, we want to echo it.
            processData(
                "echo",
                replaceVariables(variablesList.commands, cmd, true)
            )
            // echo:false because it was echoed above
            targetCommands(cmd, null, { echo: false })
        } 
        inputHistoryIndex.current = terminal.inputHistory.length 
        terminal.input.current = ""
        if (inputRef.current) inputRef.current.value = ""
    }
    const onInput = (e: TargetedEvent<HTMLInputElement, Event>) => {
        terminal.input.current = e.currentTarget.value
    }
    useEffect(() => {
        scrollToBottom()
    }, [terminal.content])
    useEffect(() => {
        return () => {
            //console.log('Resetting terminal history');
            inputHistoryIndex.current = terminal.inputHistory.length - 1;
        };
    }, []);

    const toggleVerboseMode = (): void => {
        useUiContextFn.haptic()
        terminal.isVerbose.current = !isVerbose
        setIsVerbose(!isVerbose)
    }

    const toggleAutoScroll = (): void => {
        useUiContextFn.haptic()
        if (!isAutoScrollPaused) {
            terminal.isAutoScroll.current = !isAutoScroll
            setIsAutoScroll(!isAutoScroll)
        }
        terminal.isAutoScrollPaused.current = false
        setIsAutoScrollPaused(false)
        scrollToBottom()
    }

    const menu = [
        {
            label: T("S76"),
            displayToggle: () => (
                <span class="feather-icon-container">
                    {isVerbose ? (
                        <CheckCircle style={{ width: "0.8rem", height: "0.8rem" }} />
                    ) : (
                        <Circle style={{ width: "0.8rem", height: "0.8rem" }} />
                    )}
                </span>
            ),
            onClick: toggleVerboseMode,
        },
        {
            label: T("S77"),
            displayToggle: () => (
                <span class="feather-icon-container">
                    {isAutoScroll ? (
                        isAutoScrollPaused ? (
                            <PauseCircle style={{ width: "0.8rem", height: "0.8rem" }} />
                        ) : (
                            <CheckCircle style={{ width: "0.8rem", height: "0.8rem" }} />
                        )
                    ) : (
                        <Circle style={{ width: "0.8rem", height: "0.8rem" }} />
                    )}
                </span>
            ),
            onClick: toggleAutoScroll,
        },
        { divider: true },
        {
            label: T("S79"),
            onClick: (_e: MouseEvent) => {
                useUiContextFn.haptic()
                terminal.clear()
            },
            icon: <span class="btn btn-clear" aria-label="Close" />,
        },
    ]

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id}/>
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Terminal />
                    <strong class="text-ellipsis">{T("Terminal")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="full-height">
                        <PanelMenu items={menu} />
                        <FullScreenButton
                            elementId={id}
                        />
                        <CloseButton
                            elementId={id}
                            hideOnFullScreen={true}
                        />
                    </span>
                </span>
            </div>
            <div class="input-group m-2">
                <input
                    type="text"
                    class="form-input"
                    onInput={onInput}
                    onKeyUp={onKeyUp}
                    ref={inputRef}
                    value={terminal.input.current as unknown as string}
                    placeholder={T("S80")}
                />
                <ButtonImg
                    group
                    ltooltip
                    data-tooltip={T("S82")}
                    label={T("S81")}
                    icon={<Send />}
                    onClick={onSend}
                />
            </div>
            <div class="show-low">
                <ButtonImg
                    class=" m-2"
                    icon={<ChevronLeft />}
                    onClick={historyPrev}
                />
                <ButtonImg
                    class=" m-2"
                    icon={<ChevronRight />}
                    onClick={historyNext}
                />
            </div>
            <div
                ref={terminalOutput}
                class="panel-body panel-body-dashboard terminal m-1"
                onScroll={(e: TargetedEvent<HTMLDivElement, UIEvent>) => {
                    const el = e.currentTarget
                    if (
                        lastPos > el.scrollTop &&
                        terminal.isAutoScroll.current
                    ) {
                        terminal.isAutoScrollPaused.current = true
                        setIsAutoScrollPaused(true)
                    }
                    if (
                        terminal.isAutoScrollPaused.current &&
                        Math.abs(
                            el.scrollTop +
                                el.offsetHeight -
                                el.scrollHeight
                        ) < 5
                    ) {
                        terminal.isAutoScrollPaused.current = false
                        setIsAutoScrollPaused(false)
                    }
                    lastPos = el.scrollTop
                }}
            >
                {useMemo(() => {
                    if (!terminal.content) return null

                    const currentCount = terminal.content.length
                    const firstMessage = terminal.content[0]

                    // If verbose mode changed, content was cleared, or messages rolled off (first message changed), re-render everything
                    if (currentCount < lastRenderedCount.current ||
                        (currentCount > 0 && firstMessage !== lastFirstMessage.current)) {
                        // Re-render all current messages
                        renderedMessages.current = terminal.content.map((line, index) => renderLine(line as unknown as TerminalLine, index))
                        lastRenderedCount.current = currentCount
                        lastFirstMessage.current = firstMessage as unknown as TerminalLine
                    } else {
                        // Only process new messages since last render
                        for (let i = lastRenderedCount.current; i < currentCount; i++) {
                            renderedMessages.current.push(renderLine(terminal.content[i] as unknown as TerminalLine, i))
                        }
                        lastRenderedCount.current = currentCount
                        lastFirstMessage.current = firstMessage as unknown as TerminalLine
                    }

                    return renderedMessages.current
                }, [terminal.content, isVerbose])}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}

const TerminalPanelElement = {
    id: "terminalPanel",
    content: <TerminalPanel />,
    name: "S75",
    icon: "Terminal",
    show: "showterminalpanel",
    onstart: "openterminalonstart",
    settingid: "terminal",
}

export { TerminalPanel, TerminalPanelElement }
