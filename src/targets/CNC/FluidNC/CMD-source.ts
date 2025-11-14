/*
 CMD-source.js - ESP3D WebUI Target file

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

type Accumulator = any[]

const formatEepromLine = (acc: Accumulator, line: string): Accumulator => {
    //format G20 / G21
    //it is comment
    if (line.startsWith("$")) {
        //it is setting
        const data = line.split("=")
        acc.push({ type: "comment", value: data[0] })
        acc.push({
            type: "text",
            value: data[1],
            initial: data[1],
            cmd: data[0],
        })
    }

    return acc
}

const capabilities: Record<string, (...args: any[]) => any> = {}

const commands: Record<string, (...args: any[]) => any> = {
    eeprom: (): { type: string; cmd: string } => {
        return { type: "cmd", cmd: "$$" }
    },
    formatEeprom: (result: string[] | undefined): any[] => {
        if (!result || result.length == 0) return []
        const res = result.reduce((acc: Accumulator, line: string) => {
            return formatEepromLine(acc, line)
        }, [] as Accumulator)
        return res
    },
}

const responseSteps = {
    eeprom: {
        start: (data: string) => data.startsWith("$"),
        end: (data: string) => data.startsWith("ok"),
        error: (data: string) => {
            return data.indexOf("error") != -1
        },
    },
}

function capability(...args: any[]): any {
    const [cap, ...rest] = args
    if (capabilities[cap]) return (capabilities as any)[cap](...rest)
    //console.log("Unknow capability ", cap)
    return false
}

function command(...args: any[]): any {
    const [cmd, ...rest] = args
    if ((commands as any)[cmd]) return (commands as any)[cmd](...rest)
    //console.log("Unknow command ", cmd)
    return { type: "error" }
}

const CMD = { capability, command, responseSteps }

export { CMD }
