/*
Macros.js - ESP3D WebUI component file

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

import { TargetedMouseEvent } from "preact"
import type { FunctionalComponent, ComponentChildren } from "preact"
import { T } from "../Translations"
import { Cast } from "preact-feather"
import { useUiContext, useUiContextFn } from "../../contexts"
import { ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useTargetCommands } from "../../hooks"
import { iconsFeather } from "../Images"
import {
    iconsTarget,
    useTargetContextFn,
    files,
} from "../../targets"
import type { TargetContextFn } from "../../targets/types"

/*
 * Local const
 *
 */
// Types matching MacrosTab.tsx
type MacroType = "FS" | "SD" | "URI" | "CMD"

interface MacroValue {
    name: string
    initial: string
}

interface MacroItem {
    id: string
    value: MacroValue[]
}

interface MacroButton {
    id: string
    name: string
    action: string
    type: MacroType
    icon?: string
    color?: string
    [key: string]: any
}

const MacrosPanel: FunctionalComponent = () => {
    const { uisettings } = useUiContext()
    const { processData } = useTargetContextFn as TargetContextFn
    const { targetCommands, failToast } = useTargetCommands()
    const iconsList: Record<string, ComponentChildren> = { ...iconsTarget, ...iconsFeather }
    const id = "macrosPanel"
    const getSDSource = (): string => {
        for (const source of files.supported) {
            if (source.value == "DIRECTSD") {
                return source.value
            }
        }
        return "NONE"
    }
    const sendCommand = (command: string): void => {
        const callbacks = {
            onSuccess: (result: string) => {
                processData("response", result)
            },
            onFail: failToast,
        }
        targetCommands(command, undefined, undefined, callbacks)
    }

    const macroList: MacroItem[] = uisettings.getValue("macros")
    const macroButtons: MacroButton[] = macroList.reduce((acc: MacroButton[], curr: MacroItem) => {
        const item: MacroButton = curr.value.reduce((accumulator: any, current: MacroValue) => {
            accumulator[current.name] = current.initial
            return accumulator
        }, {} as MacroButton)
        item.id = curr.id
        acc.push(item)
        return acc
    }, [])
    const processMacro = (action: string, type: MacroType): void => {
        switch (type) {
            case "FS":
                //[ESP700] //ESP700 should send status to telnet / websocket
                //Todo: handle response from ESP700
                sendCommand(`[ESP700]${  action}`)
                break
            case "SD": {
                //get command accoring target FW
                const response = files.command(
                    getSDSource(),
                    "play",
                    "",
                    action
                )
            
                const cmds = response.cmd.split("\n")
                cmds.forEach((cmd: string) => {
                    sendCommand(cmd)
                })

                break
            }
            //TODO:
            //TFT SD ? same as above
            //TFT USB ? same as above
            case "URI": {
                //open new page or silent command
                if (action.trim().startsWith("[SILENT]")) {
                    const uri = action.trim().replace("[SILENT]", "")
                    var myInit: RequestInit = {
                        method: "GET",
                        mode: "cors",
                        cache: "default",
                    }
                    fetch(uri, myInit)
                        .then((response) => {
                            if (response.ok) {
                                console.log("Request succeeded")
                            } else {
                                console.log("Request failed")
                            }
                        })
                        .catch((error) => {
                            console.log(`Request failed: ${  error.message}`)
                        })
                } else {
                    window.open(action)
                }
                break
            }
            case "CMD": {
                //split by ; and show in terminal
                const commandsList = action.trim().split(";")
                commandsList.forEach((command) => {
                    sendCommand(command)
                })
                break
            }
            default:
                console.log("type:", type, " action:", action)
                break
        }
    }

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} /> 
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Cast />
                    <strong class="text-ellipsis">{T("macros")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="full-height">
                        <FullScreenButton elementId={id}/>
                        <CloseButton
                            elementId={id}
                            hideOnFullScreen={true}
                        />
                    </span>
                </span>
            </div>
            <div class="panel-body panel-body-dashboard">
                <div class="macro-buttons-panel">
                    {macroButtons.map((element: MacroButton) => {
                        const displayIcon = element.icon && iconsList[element.icon]
                            ? iconsList[element.icon]
                            : ""
                        return (
                            <ButtonImg key={element.id}
                                id={element.id}
                                m1
                                showlow
                                label={element.name}
                                icon={displayIcon}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    processMacro(element.action, element.type)
                                }}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

const MacrosPanelElement = {
    id: "macrosPanel",
    content: <MacrosPanel />,
    name: "macros",
    icon: "Cast",
    show: "showmacrospanel",
    onstart: "openmacrosonstart",
    settingid: "macros",
}

export { MacrosPanel, MacrosPanelElement }
