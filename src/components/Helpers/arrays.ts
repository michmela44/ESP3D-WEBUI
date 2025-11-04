/*
 arrays.ts - ESP3D WebUI helpers file

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

interface HasId {
    id: string
}

const removeEntriesByIDs = <T extends HasId>(src: T[], uid: string[]): T[] =>
    src.filter(({ id }) => !uid.includes(id))

const limitArr = <T>(arr: T[], limit: number): T[] =>
    arr.slice(
        arr.length - (arr.length <= limit ? arr.length : limit),
        arr.length
    )

const splitArrayByLines = (arrayBuffer: ArrayBuffer): number[][] => {
    const bytes = new Uint8Array(arrayBuffer)
    return bytes.reduce<number[][]>(
        (acc, curr) => {
            if (curr == 10 || curr == 13) return [...acc, []]
            const i = Number(acc.length - 1)
            return [...acc.slice(0, i), [...acc[i], curr]]
        },
        [[]]
    )
}

//Merge 2 JSON in generic way
//based on https://gist.github.com/sinemetu1/1732896#gistcomment-2571586
function mergeJSON<T = any>(o1: T, o2: Partial<T>): T {
    let tempNewObj: any = o1
    if ((o1 as any).length === undefined && typeof o1 !== "number") {
        for (let key in o2) {
            let value = o2[key]
            if ((o1 as any)[key] === undefined) {
                tempNewObj[key] = value
            } else {
                tempNewObj[key] = mergeJSON((o1 as any)[key], (o2 as any)[key])
            }
        }
    } else if ((o1 as any).length > 0 && typeof o1 !== "string") {
        for (let index in o2) {
            if (JSON.stringify(o1).indexOf(JSON.stringify((o2 as any)[index])) === -1) {
                //look for existing id in same section
                let i = (tempNewObj as any[]).findIndex(
                    (element) => element.id == (o2 as any)[index].id
                )
                if (i == -1) tempNewObj.push((o2 as any)[index])
                else {
                    if (Array.isArray(tempNewObj[i].value)) {
                        //need to check if id is already in array
                        for (let v in (o2 as any)[index].value) {
                            let j = tempNewObj[i].value.findIndex(
                                (element: any) => element.id == (o2 as any)[index].value[v].id
                            )
                            if (j == -1) {
                                tempNewObj[i].value.push((o2 as any)[index].value[v])
                            } else {
                                tempNewObj[i].value[j] = (o2 as any)[index].value[v]
                            }
                        }
                    } else {
                        tempNewObj[i].value = (o2 as any)[index].value
                        if (typeof (o2 as any)[index].hide != "undefined")
                            tempNewObj[i].hide = (o2 as any)[index].hide
                    }
                }
            }
        }
    } else {
        tempNewObj = o2
    }
    return tempNewObj
}

const addObjectItem = <T extends Record<string, any>>(
    src: T[],
    entry: keyof T,
    variable: T
): T[] => {
    let i = src.findIndex((element) => element[entry] == variable[entry])
    if (i == -1) {
        src.push(JSON.parse(JSON.stringify(variable)))
    } else {
        if (variable[entry]) src[i] = variable
        else {
            console.log(
                "error addObjectItem",
                variable,
                " has no entry: ",
                entry
            )
        }
    }
    return src
}

const removeObjectItem = <T extends Record<string, any>>(
    src: T[],
    entry: keyof T,
    entryValue: any
): T[] => {
    let i = src.findIndex((element) => element[entry] == entryValue)
    if (i != -1) {
        src.splice(i, 1)
    }
    return src
}

interface BitsArrayType {
    bits: string[]
    size: number
    fromInt: (intVal: number, arraySize: number) => BitsArrayType
    fromArray: (arrayVal: any[]) => BitsArrayType
    getBit: (index: number) => number
    setBit: (index: number, value: number) => void
    toInt: () => number
}

const BitsArray: BitsArrayType = {
    bits: [],
    size: 0,
    fromInt: function (intVal: number, arraySize: number): BitsArrayType {
        this.bits = (intVal >>> 0).toString(2).split("").reverse()
        this.size = arraySize
        //Sanity check to have proper size
        while (this.size > this.bits.length) {
            this.bits.push("0")
        }
        let t = ""
        for (let i = 0; i < this.bits.length; i++) {
            if (i > 0) t += ","
            t += this.bits[i]
        }
        return this
    },
    fromArray: function (arrayVal: any[]): BitsArrayType {
        this.bits = []
        this.size = arrayVal.length
        //sanity check to have proper content
        // so can handle false/true, 0/1, "0"/"1", empty
        for (let index = 0; index < this.size; index++) {
            if (arrayVal[index]) {
                if (arrayVal[index] == "0") {
                    this.bits[index] = "0"
                } else {
                    this.bits[index] = "1"
                }
            } else {
                this.bits[index] = "0"
            }
        }

        return this
    },
    getBit: function (index: number): number {
        return parseInt(this.bits[index])
    },
    setBit: function (index: number, value: number): void {
        this.bits[index] = value == 0 ? "0" : "1"
    },
    toInt: function (): number {
        const bitstmp: string[] = []
        for (let index = 0; index < this.size; index++) {
            if (typeof this.bits[index] == "undefined") {
                bitstmp[index] = "0"
            } else {
                bitstmp[index] = this.bits[index]
            }
        }
        return parseInt(bitstmp.reverse().join(""), 2)
    },
}

export {
    limitArr,
    mergeJSON,
    removeEntriesByIDs,
    splitArrayByLines,
    addObjectItem,
    removeObjectItem,
    BitsArray,
}
export type { BitsArrayType, HasId }
