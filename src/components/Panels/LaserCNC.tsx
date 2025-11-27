/*
LaserCNC.js - ESP3D WebUI component file

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

import { Fragment,  TargetedMouseEvent } from "preact"
import type { FunctionalComponent } from "preact"
import { useState } from "preact/hooks"
import { T } from "../Translations"
import { Loader, Sun, Power } from "preact-feather"
import { useUiContext, useUiContextFn } from "../../contexts"
import { useTargetContext, variablesList, eventsList } from "../../targets"
import { ButtonImg, Field, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useTargetCommands } from "../../hooks"

/*
 * Local const
 *
 */
type NumberValue = { current: number; valid?: boolean }
const laserPercentage = {} as Partial<NumberValue>
const lasertestduration = {} as Partial<NumberValue>
const laserMaxPower = {} as Partial<NumberValue>

/*
 * Callback function when reset is detected
 *
 */ const onReset = (data: any) => {
    console.log("reset Happend:", data)
    //Todo: TBD
}

type StateValue = { value: string } | Array<{ value: string }>
type StatesMap = Record<string, StateValue>

const LaserControls: FunctionalComponent = () => {
    const { states } = useTargetContext() as { states: StatesMap }
    //Add callback to reset event
    eventsList.on("reset", onReset)
    if (!useUiContextFn.getValue("showlaserpanel")) return null

    const states_array = [{ id: "spindle_mode", label: "CN91" }]
    return (
        <Fragment>
            {states && (states as any).spindle_mode && (
                <div class="status-ctrls">
                    {states_array.map((element) => {
                        if (states[element.id]) {
                            const sv = states[element.id] as StateValue
                            const displayVal = Array.isArray(sv)
                                ? sv.map((i) => i.value).join(" ")
                                : sv.value
                            return (
                                <div key={element.id}
                                    class="extra-control mt-1 tooltip tooltip-bottom"
                                    data-tooltip={T(element.label)}
                                >
                                    <div class="extra-control-header">
                                        {T(element.label)}
                                    </div>

                                    <div class="extra-control-value">
                                        {displayVal}
                                    </div>
                                </div>
                            )
                        }
                    })}
                </div>
            )}
        </Fragment>
    )
}

const LaserPanel: FunctionalComponent = () => {
    const { states } = useTargetContext() as { states: StatesMap }
    const { targetCommands } = useTargetCommands()
    const id = "laserPanel"

    if (typeof laserPercentage.current === "undefined") {
        laserPercentage.current = useUiContextFn.getValue("lasertestprecent")
    }
    if (typeof lasertestduration.current === "undefined") {
        lasertestduration.current = useUiContextFn.getValue("lasertest")
    }
    if (typeof laserMaxPower.current === "undefined") {
        laserMaxPower.current = useUiContextFn.getValue("lasermax")
    }

    const hasError = (): boolean => {
        return !(
            !!laserPercentage.valid &&
            !!lasertestduration.valid &&
            !!laserMaxPower.valid
        )
    }

    const laser_controls = [
        {
            label: "CN90",
            id: "laser_group",
            controls: [
                {
                    id: "maximum_power",
                    elements: [
                        {
                            id: "maximum_power",
                            type: "number",
                            label: "CN84",
                            tooltip: "CN84",
                            min: 0,
                            value: laserMaxPower,
                            variableName: "#laser_max#",
                        },
                    ],
                },

                {
                    id: "test_laser",
                    elements: [
                        {
                            id: "test_laser_duration",
                            type: "number",
                            label: "CN85",
                            tooltip: "CN85",
                            append: "S114",
                            min: 0,
                            value: lasertestduration,
                        },
                    ],
                },
                {
                    id: "laser_power",
                    elements: [
                        {
                            id: "laser_power_slider",
                            type: "slider",
                            label: "CN89",
                            tooltip: "CN89",
                            min: 0,
                            max: 100,
                            value: laserPercentage,
                            append: "%",
                        },
                    ],
                },

                {
                    id: "laser_buttons",
                    elements: [
                        {
                            id: "laser_test",
                            icon: <Sun />,
                            type: "button",
                            label: "CN86",
                            tooltip: "CN88",
                            useinput: "true",
                            command: "M3 S#",
                            desc: "M3",
                            mode: "spindle_mode",
                            onclick: (e: TargetedMouseEvent<HTMLButtonElement>) => {
                                const commands = [
                                    "G1 F1",
                                    () => {
                                        const power = (Number(laserMaxPower.current) * Number(laserPercentage.current)) / 100
                                        return `M3 S${  power.toString()}`
                                    },
                                    () => {
                                        const sec = Number(lasertestduration.current) / 1000
                                        return `G4 P${  sec.toString()}`
                                    },
                                    "M5 S0",
                                ]
                                e.currentTarget.blur()
                                useUiContextFn.haptic()
                                targetCommands(commands)
                            },
                        },
                        {
                            id: "laser_off",
                            icon: <Power />,
                            type: "button",
                            label: "CN23",
                            tooltip: "CN87",
                            desc: "M5",
                            command: "M5 S0",
                            mode: "spindle_mode",
                            onclick: () => {
                                targetCommands("M5 S0")
                            },
                        },
                    ],
                },
            ],
        },
    ]
    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} /> 
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Loader />
                    <strong class="text-ellipsis">{T("CN35")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="full-height">
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
            <div class="panel-body panel-body-dashboard">
                <LaserControls />
                {laser_controls.map((block) => {
                    return (
                        <fieldset key={block.id} class="fieldset-top-separator fieldset-bottom-separator field-group">
                            <legend>
                                <label class="m-1 buttons-bar-label">
                                    {T(block.label)}
                                </label>
                            </legend>
                            <div class="field-group-content maxwidth">
                                {block.controls.map((control: any) => {
                                    return (
                                        <div key={control.id} class="states-buttons-container">
                                            {control.elements.map((element: any) => {
                                                if (element.type === "button") {
                                                    let classname = "tooltip"
                                                    if (
                                                        states &&
                                                        element.mode &&
                                                        states[element.mode]
                                                    ) {
                                                        const modeVal = states[element.mode] as StateValue
                                                        if (!Array.isArray(modeVal) && (modeVal as { value: string }).value == element.desc) {
                                                            classname +=
                                                                " btn-primary"
                                                        }
                                                    }
                                                    return (
                                                        <ButtonImg key={element.id}
                                                            label={T(
                                                                element.label
                                                            )}
                                                            disabled={
                                                                element.useinput
                                                                    ? hasError()
                                                                    : false
                                                            }
                                                            icon={element.icon}
                                                            tooltip
                                                            iconRight={
                                                                element.iconRight
                                                            }
                                                            data-tooltip={T(
                                                                element.tooltip
                                                            )}
                                                            mode={element.mode}
                                                            useinput={
                                                                element.useinput
                                                            }
                                                            onclick={
                                                                element.onclick
                                                            }
                                                        />
                                                    )
                                                } else {
                                                    //we won't handle modified state just handle error
                                                    //too many user cases where changing value to show button is not suitable
                                                    const [
                                                        validation,
                                                        setvalidation,
                                                    ] = useState({
                                                        message: null,
                                                        valid: true,
                                                        modified: false,
                                                    })

                                                    const generateValidation = (
                                                        element: any
                                                    ) => {
                                                        let validation = {
                                                            message: null,
                                                            valid: true,
                                                            modified: false,
                                                        }
                                                        if (
                                                            element.value
                                                                .current <
                                                                element.min ||
                                                            element.value
                                                                .current
                                                                .length === 0
                                                        ) {
                                                            //No error message to keep all control aligned
                                                            //may be have a better way ?
                                                            // validation.message = T("S42");
                                                            validation.valid = false
                                                        }
                                                        element.value.valid =
                                                            validation.valid
                                                        return validation
                                                    }

                                                    return (
                                                        <Field key={element.id}
                                                            inline
                                                            id={element.id}
                                                            type={element.type}
                                                            label={T(
                                                                element.label
                                                            )}
                                                            append={
                                                                element.append
                                                            }
                                                            min={element.min}
                                                            max={element.max}
                                                            value={
                                                                element.value
                                                                    .current
                                                            }
                                                            setValue={(
                                                                val: any,
                                                                update = false
                                                            ) => {
                                                                if (!update) {
                                                                    element.value.current =
                                                                        val
                                                                }
                                                                const validationObj =
                                                                    generateValidation(
                                                                        element
                                                                    )
                                                                setvalidation(
                                                                    validationObj
                                                                )
                                                                if (
                                                                    validationObj.valid &&
                                                                    element.variableName
                                                                ) {
                                                                    variablesList.addCommand(
                                                                        {
                                                                            name: element.variableName,
                                                                            value: element
                                                                                .value
                                                                                .current,
                                                                        }
                                                                    )
                                                                }
                                                            }}
                                                            validation={
                                                                validation
                                                            }
                                                        />
                                                    )
                                                }
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </fieldset>
                    )
                })}
            </div>
        </div>
    )
}

const LaserPanelElement = {
    id: "laserPanel",
    content: <LaserPanel />,
    name: "CN35",
    icon: "Loader",
    show: "showlaserpanel",
    onstart: "openlaseronstart",
    settingid: "laser",
}

export { LaserPanel, LaserPanelElement, LaserControls }
