/*
 PickUp.tsx - ESP3D WebUI component file

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

import { FunctionalComponent, TargetedMouseEvent } from "preact"
import { useEffect, useState } from "preact/hooks"
import { Search } from "preact-feather"
import { showModal } from "../../Modal"
import { ScanPacksList } from "../ScanPacksList"
import {  useUiContextFn, useModalsContext } from "../../../contexts"
import { T, getLanguageName } from "../../Translations"
import { getBuiltinTheme } from "../../../themes"

interface PickUpProps {
    label?: string
    id?: string
    inline?: boolean
    setValue?: (value: string | null, update?: boolean) => void
    value?: string
    [key: string]: any
}

/**
 * Resolve the label shown in the field for a stored pickup value.
 *
 * @param id - Field id, `language` or `theme`
 * @param value - Stored preferences value
 * @param defaultDisplayValue - Label used when the value is `default`
 * @returns Text to display in the field
 */
const displayNameOf = (
    id: string,
    value: string,
    defaultDisplayValue: string
): string => {
    if (value == "default") return defaultDisplayValue
    if (id == "language") return getLanguageName(value)
    const builtinTheme = getBuiltinTheme(value)
    if (builtinTheme) return T(builtinTheme.label)
    return value.replace("theme-", "").replace(".gz", "")
}

const PickUp: FunctionalComponent<PickUpProps> = ({
    label = "",
    id = "",
    inline,
    setValue,
    value,
}) => {
    const [displayValue, setDisplayValue] = useState(
        id == "language" ? T("lang") : T("none")
    )
    const { modals } = useModalsContext()
    const defaultDisplayValue = id == "language" ? T("lang", true) : T("none")
    const onChange = (value: string) => {
        if (setValue) setValue(value)

        setDisplayValue(displayNameOf(id, value, defaultDisplayValue))
    }

    let ScanPacks: (() => void) | null = null
    const refreshList = () => {
        if (ScanPacks) ScanPacks()
    }
    useEffect(() => {
        //to update state
        if (setValue) setValue(null, true)
        setDisplayValue(displayNameOf(id, value || "", defaultDisplayValue))
    }, [value])

    return (
        <div class={`input-group ${inline ? "column" : ""} `}>
            <span
                class="form-input"
                style="cursor: pointer;"
                onClick={(e: TargetedMouseEvent<HTMLSpanElement>) => {
                    useUiContextFn.haptic()
                    e.currentTarget.blur()
                    const modalId = `${id}Pickup`
                    showModal({
                        modals,
                        title: id == "language" ? T("S177") : T("S182"),
                        button2: { text: T("S24") },
                        button1: {
                            cb: refreshList,
                            text: T("S50"),
                            noclose: true,
                        },
                        icon: <Search />,
                        id: modalId,
                        content: (
                            <ScanPacksList
                                id={modalId}
                                setValue={onChange}
                                refreshfn={(scanpacks: () => void) =>
                                    (ScanPacks = scanpacks)
                                }
                            />
                        ),
                    })
                }}
            >
                {displayValue}
            </span>
        </div>
    )
}
export default PickUp
