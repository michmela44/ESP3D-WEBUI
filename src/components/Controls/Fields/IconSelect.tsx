/*
 IconSelect.tsx - ESP3D WebUI component file

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
import { useEffect } from "preact/hooks"
import { useUiContextFn, useModalsContext } from "../../../contexts"
import { ButtonImg } from "../../Controls"
import { iconsFeather } from "../../Images"
import { iconsTarget } from "../../../targets"
import { showModal } from "../../Modal"
import { Search } from "preact-feather"

import { T } from "./../../Translations"

interface IconSelectProps {
    id: string
    label?: string
    validation?: any
    value?: string
    type?: string
    setValue?: (value: string | null, update?: boolean) => void
    inline?: boolean
    [key: string]: any
}

/*
 * Local const
 *
 */
const IconSelect: FunctionalComponent<IconSelectProps> = ({
    value,
    setValue,
}) => {
    const { modals } = useModalsContext()
    const iconsList: Record<string, any> = { ...iconsTarget, ...iconsFeather }
    const showList = (_e: TargetedMouseEvent<HTMLButtonElement>) => {
        useUiContextFn.haptic()
        const content = (
            <div>
                {Object.keys(iconsList).map((element) => {
                    const displayIcon = iconsList[element]
                        ? iconsList[element]
                        : ""
                    const onSelect = (_e: TargetedMouseEvent<HTMLButtonElement>) => {
                        useUiContextFn.haptic()
                        setValue && setValue(element)
                        modals.removeModal(modals.getModalIndex(modalId))
                    }
                    if (value == element)
                        return (
                            <ButtonImg key={element}
                                m05
                                primary
                                min1rem
                                btn-xs
                                icon={displayIcon}
                                onClick={onSelect}
                            />
                        )
                    else
                        return (
                            <ButtonImg key={element}
                                m05
                                min2rem
                                icon={displayIcon}
                                onclick={onSelect}
                            />
                        )
                })}
            </div>
        )
        const modalId = "iconSelection"
        //TODO generate icon list and current selected
        //modals.removeModal(modals.getModalIndex(modalId));
        showModal({
            modals,
            title: T("S134"),
            button2: { text: T("S24") },
            icon: <Search />,
            id: modalId,
            content,
        })
    }
    const controlIcon = iconsList[value || ""] ? iconsList[value || ""] : ""
    useEffect(() => {
        //to update state
        if (setValue) setValue(null, true)
    }, [value])
    return (
        <div class={`input-group  `}>
            <ButtonImg
                m1
                min2rem
                icon={controlIcon}
                onClick={showList}
            />
        </div>
    )
}

export default IconSelect
