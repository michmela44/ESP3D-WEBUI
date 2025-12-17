/*
 Slider.tsx - ESP3D WebUI component file

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

import { Fragment, FunctionalComponent, TargetedEvent } from "preact"
import { useEffect } from "preact/hooks"
import {
    useUiContextFn,
    useSettingsContext,
} from "../../../contexts"
import {
    generateDependIds,
    checkDependencies
} from "../../Helpers"
import Input from "./Input"

interface SliderProps {
    id: string
    label?: string
    validation?: any
    value?: number
    min?: number
    max?: number
    adjustValue?: (id: string) => number
    type?: string
    depend?: any
    setValue?: (value: string | number | null, update?: boolean) => void
    append?: string
    inline?: boolean
    disabled?: boolean
    [key: string]: any
}

/*
 * Local const
 *
 */
const Slider: FunctionalComponent<SliderProps> = ({
    id,
    label,
    validation,
    value = 0,
    min = 0,
    max = 100,
    adjustValue,
    type,
    depend,
    setValue,
    append,
    inline,
    disabled,
    ...rest
}) => {
    const onInput = (e: TargetedEvent<HTMLInputElement, Event>) => {
        if (e) useUiContextFn.haptic()
        if (setValue) {
            setValue(parseFloat(e.currentTarget.value))
        }
    }
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const dependIds = generateDependIds(
        depend,
        interfaceSettings.current.settings
    )


    useEffect(() => {
        let visible = checkDependencies(depend, interfaceSettings.current.settings, connectionSettings.current)
        if (document.getElementById(id))
            document.getElementById(id)!.style.display = visible
                ? "block"
                : "none"
        if (document.getElementById(`group-${  id}`))
            document.getElementById(`group-${  id}`)!.style.display = visible
                ? "block"
                : "none"
    }, [...dependIds])

    useEffect(() => {
        //to update state
        if (setValue) setValue(null, true)
    }, [value])
    return (
        <Fragment>
            <div class="slider-ctrl text-center hide-low">
                <label>{value}%</label>
                <input
                    class="slider"
                    id={id}
                    value={value}
                    onInput={onInput}
                    type="range"
                    min="0"
                    max="100"
                    disabled={disabled}
                    onClick={(e: TargetedEvent<HTMLInputElement, MouseEvent>) => {
                        //to workaround the slider bug not updating the value if overboundary
                        if (adjustValue) {
                            const adjustedValue = adjustValue(id)
                            if (e.currentTarget.value != adjustedValue.toString()) {
                                setValue && setValue(adjustValue(id))
                            }
                        }
                    }}
                />
            </div>
            <Input
                id={id}
                label={label}
                validation={validation}
                depend={depend}
                setValue={setValue}
                append={append}
                value={value}
                type="number"
                inline={inline}
                disabled={disabled}
                {...rest}
                class="show-low form-input text-center"
            />
        </Fragment>
    )
}

export default Slider
