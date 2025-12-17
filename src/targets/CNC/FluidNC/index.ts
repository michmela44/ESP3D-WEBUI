/*
 index.js - ESP3D WebUI Target file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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
import { iconsTarget } from "./icons"
import { files } from "./files"
import { processor } from "./processor"
import { gcode_parser_modes } from "./gcode_parser_modes"
import { defaultPanelsList } from "./panels"
import { MachineSettings, machineSettings } from "./MachineSettings"
import {
    QuickButtonsBar,
    BackgroundContainer,
} from "./Controls"
import {
    TargetContextProvider,
    useTargetContext,
    useTargetContextFn,
} from "./TargetContext"
import realCommandsTable from "./realCommandsTable"
import variablesTable from "./variablesTable"
import { AppLogo as WebUILogo } from "../../../components/Images/logo"
import { AppLogo } from "./logo"
import { addObjectItem, removeObjectItem } from "../../../components/Helpers"

const Target: string = 'FluidNC'
const webUIbuild: string = 'FluidNC'
const Name: string = 'FluidNC'
const fwUrl = [
    'https://github.com/bdring/FluidNC',
] as const

const restartdelay = 10
type VariablesList = {
    commands: any[]
    addCommand: (variable: any) => void
    removeCommand: (name: string) => void
    modes: any[]
    hideFeatures: boolean
    allowEmptyLine: boolean
    formatCommand: (command: any) => string
}
const variablesList: VariablesList = {
    commands: [...(realCommandsTable as any[]), ...(variablesTable as any[])],
    addCommand: (variable: any) =>
        addObjectItem((variablesList as VariablesList).commands, "name", variable),
    removeCommand: (name: string) =>
        removeObjectItem((variablesList as VariablesList).commands, "name", name),
    modes: [...(gcode_parser_modes as any[])],
    hideFeatures: false,
    allowEmptyLine: true,
    formatCommand: (command: any) => command && typeof command === "string" ? command : String(command || ""),
}
type EventHandler = { fn: (...args: any[]) => void }
type EventsMap = Record<string, EventHandler[]>
type EventsList = {
    evts: EventsMap
    on: (event: string, fn: (...args: any[]) => void) => void
    off: (event: string, fn: (...args: any[]) => void) => void
    emit: (event: string, data: any) => void
}
const eventsList: EventsList = {
    evts: {},
    on: (event: string, fn: (...args: any[]) => void) => {
        if (typeof eventsList.evts[event] === "undefined") {
            eventsList.evts[event] = []
        }
        addObjectItem(eventsList.evts[event], "fn", { fn })
    },
    off: (event: string, fn: (...args: any[]) => void) => {
        removeObjectItem(eventsList.evts[event], "fn", fn)
    },
    emit: (event: string, data: any) => {
        if (eventsList.evts[event])
            eventsList.evts[event].forEach((element: EventHandler) => {
                if (typeof element.fn === "function") element.fn(data)
            })
    },
}

export {
    MachineSettings,
    machineSettings,
    Target,
    fwUrl,
    Name,
    files,
    iconsTarget,
    processor,
    restartdelay,
    defaultPanelsList,
    TargetContextProvider,
    useTargetContext,
    useTargetContextFn,
    webUIbuild,
    variablesList,
    eventsList,
    AppLogo,
    WebUILogo,
    QuickButtonsBar,
    BackgroundContainer,
}
