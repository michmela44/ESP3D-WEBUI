/*
 files.js - ESP3D WebUI Target file

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
import { h } from "preact"
import { FLASH } from "../../FLASH-source"
import { DIRECTSD } from "./DIRECTSD-source"
import { SD } from "./SD-source"
import { useSettingsContextFn, useUiContextFn } from "../../../contexts"

//List of supported files systems
const supportedFileSystems = [
    {
        value: "FLASH",
        name: "S137",
        depend: () => {
            return (
                useUiContextFn.getValue("flashfs") &&
                useSettingsContextFn.getValue("FlashFileSystem") != "none"
            )
        },
    },
    {
        value: "SD",
        name: "S190",
        depend: () => {
            return (
                useUiContextFn.getValue("sd") &&
                useSettingsContextFn.getValue("SDConnection") == "none"
            )
        },
    },
    {
        value: "DIRECTSD",
        name: "S190",
        depend: () => {
            return (
                useUiContextFn.getValue("sd") &&
                useSettingsContextFn.getValue("SDConnection") != "none"
            )
        },
    },
]

const capabilities = {
    FLASH: FLASH.capabilities,
    DIRECTSD: DIRECTSD.capabilities,
    SD: SD.capabilities,
}

const commands = {
    FLASH: FLASH.commands,
    DIRECTSD: DIRECTSD.commands,
    SD: SD.commands,
}

function capability() {
    const [filesystem, cap, ...rest] = arguments
    if (!filesystem) return false
    if (capabilities[filesystem] && capabilities[filesystem][cap])
        return capabilities[filesystem][cap](...rest)
    //console.log("Unknow capability ", cap, " for ", filesystem)
    return false
}

function command() {
    const [filesystem, cmd, ...rest] = arguments
    if (commands[filesystem] && commands[filesystem][cmd])
        return commands[filesystem][cmd](...rest)
    //console.log("Unknow command ", cmd, " for ", filesystem)
    return { type: "error" }
}

//everything in one object
const files = {
    command,
    capability,
    supported: supportedFileSystems,
}

export { files }
