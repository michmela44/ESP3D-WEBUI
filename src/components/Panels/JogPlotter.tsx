/*


    function clickBtn(id: string) {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) el.click()
    }


/*


    function clickBtn(id: string) {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) el.click()
    }


/*


    const clickBtn = (id: string) => {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) el.click()
    }


/*
JogPlotter.js - ESP3D WebUI component file

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
import {
    Edit2,
    Home,
    Move,
    ChevronDown,
    Edit3,
    StopCircle,
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn, useModalsContext, useToastsContext } from "../../contexts"
import { T } from "../Translations"
import { Button, ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useEffect } from "preact/hooks"
import { showModal } from "../Modal"
import { useTargetContext, variablesList } from "../../targets"
import { Field } from "../Controls"

let currentVelocity = 0
let currentJogDistance = 100
let currentSteps = 0

/*
 * Local const
 *
 */
//A separate control to avoid the full panel to be updated when the positions are updated
const PositionsControls: FunctionalComponent = () => {
    const { positions } = useTargetContext()
    const steps = useUiContextFn.getValue("steps")
    return (
        <Fragment>
            <div class="jog-positions-ctrls m-1">
                {useUiContextFn.getValue("showx") && (
                    <div class="jog-position-ctrl">
                        {typeof positions.x != "undefined" && (
                            <Fragment>
                                <div class="jog-position-sub-header">X</div>
                                <div class="m-1 jog-position-value">
                                    {positions.x == "?"
                                        ? "?"
                                        : positions.x / steps}
                                </div>
                            </Fragment>
                        )}
                    </div>
                )}
                {useUiContextFn.getValue("showy") && (
                    <div class="jog-position-ctrl">
                        {typeof positions.y != "undefined" && (
                            <Fragment>
                                <div class="jog-position-sub-header">Y</div>
                                <div class="m-1 jog-position-value">
                                    {positions.y == "?"
                                        ? "?"
                                        : positions.y / steps}
                                </div>
                            </Fragment>
                        )}
                    </div>
                )}
                {useUiContextFn.getValue("showpen") && (
                    <div class="jog-position-ctrl">
                        {typeof positions.pen != "undefined" && (
                            <Fragment>
                                <div class="jog-position-sub-header">
                                    {T("HP17")}
                                </div>
                                <div class="m-1 jog-position-value">
                                    {positions.pen == "?" ? (
                                        "?"
                                    ) : positions.pen == "1" ? (
                                        <Edit3 />
                                    ) : (
                                        <span>_</span>
                                    )}
                                </div>
                            </Fragment>
                        )}
                    </div>
                )}
            </div>
        </Fragment>
    )
}

const JogPanel: FunctionalComponent = () => {
    const { modals } = useModalsContext()

    const { targetCommands } = useTargetCommands()
    const { positions } = useTargetContext()
    const id = "jogPanel"
    console.log(id)

    function clickBtn(id: string) {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) el.click()
    }

    //we could use an array of object {distance, prev, next}
    //but for the 5 entries this works too
    const selectorBtn = (type: string) => {
        if (type == "+") {
            if (currentJogDistance == 100) clickBtn("move_0_1")
            else if (currentJogDistance == 0.1) clickBtn("move_1")
            else if (currentJogDistance == 1) clickBtn("move_10")
            else if (currentJogDistance == 10) clickBtn("move_50")
            else if (currentJogDistance == 50) clickBtn("move_100")
        } else if (type == "-") {
            if (currentJogDistance == 100) clickBtn("move_50")
            else if (currentJogDistance == 0.1) clickBtn("move_100")
            else if (currentJogDistance == 1) clickBtn("move_0_1")
            else if (currentJogDistance == 10) clickBtn("move_1")
            else if (currentJogDistance == 50) clickBtn("move_10")
        }
    }

    //Send Home command
    const sendParkCommand = () => {
        const command = useUiContextFn.getValue("jogparkcmd")
        const cmds = command.split(";")
        cmds.forEach((cmd: any) => {
            if (cmd.trim().length > 0) {
                targetCommands(variablesList.formatCommand(cmd))
            }
        })
    }
    const buttonsInfos: any = {}
    const initButtons = () => {
        const btnYplus = { label: "Y+", tooltip: "HP6", cmd: "Y+" }
        const btnXplus = { label: "X+", tooltip: "HP6", cmd: "X+" }
        const btnYminus = {
            label: "Y-",
            tooltip: "HP7",
            cmd: "Y-",
        }
        const btnXminus = {
            label: "X-",
            tooltip: "HP7",
            cmd: "X-",
        }
        const showxy =
            useUiContextFn.getValue("showx") && useUiContextFn.getValue("showy")
        const invertx = useUiContextFn.getValue("invertx")
        const inverty = useUiContextFn.getValue("inverty")
        const swapxy = showxy ? useUiContextFn.getValue("swapxy") : false

        if (swapxy) {
            if (inverty) {
                buttonsInfos.R = btnYplus
                buttonsInfos.L = btnYminus
            } else {
                buttonsInfos.L = btnYplus
                buttonsInfos.R = btnYminus
            }

            if (invertx) {
                buttonsInfos.B = btnXplus
                buttonsInfos.T = btnXminus
            } else {
                buttonsInfos.T = btnXplus
                buttonsInfos.B = btnXminus
            }
        } else {
            if (inverty) {
                buttonsInfos.B = btnYplus
                buttonsInfos.T = btnYminus
            } else {
                buttonsInfos.T = btnYplus
                buttonsInfos.B = btnYminus
            }

            if (invertx) {
                buttonsInfos.R = btnXplus
                buttonsInfos.L = btnXminus
            } else {
                buttonsInfos.L = btnXplus
                buttonsInfos.R = btnXminus
            }
        }
    }
    initButtons()

    //Send jog command
    const sendJogCommand = (axis: string) => {
        let velocitycmd = ""
        let jogcmd = "PR"
        if (currentVelocity != 0) velocitycmd = `VS${  currentVelocity  };`
        switch (axis) {
            case "X+":
                jogcmd += `${currentJogDistance * currentSteps  },0;`
                break
            case "X-":
                jogcmd += `-${  currentJogDistance * currentSteps  },0;`
                break
            case "Y-":
                jogcmd += `0,-${  currentJogDistance * currentSteps  };`
                break
            case "Y+":
                jogcmd += `0,${  currentJogDistance * currentSteps  };`
                break
            default:
                console.log(`Unknow axis: ${  axis}`)
                return
        }
        if (velocitycmd.length != 0) {
            targetCommands(velocitycmd)
        }
        targetCommands(jogcmd)
    }

    //click distance button
    const onCheck = (e: TargetedMouseEvent<HTMLInputElement>, distance: number) => {
        e.currentTarget.blur()
        currentJogDistance = distance
    }

    //Set the current velocity
    const setVelocity = () => {
        let value: any = currentVelocity
        showModal({
            modals,
            title: T("HP1"),
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (String(value).length >= 0) currentVelocity = Number(value)
                },
                text: T("S43"),
                id: "applyVelocityBtn",
            },
            icon: <Edit2 />,
            id: "inputVelocity",
            content: (
                <Fragment>
                    <div>{T("HP1")}</div>
                    <input
                        class="form-input"
                        type="number"
                        step="1"
                        min="0"
                        value={value}
                        onInput={(e) => {
                            value = e.currentTarget.value.trim()
                            console.log(value)
                            if (Number(value) < 0 || String(value).length == 0) {
                                const btn = document.getElementById("applyVelocityBtn") as HTMLButtonElement | null
                                if (btn) btn.disabled = true
                            } else {
                                const btn = document.getElementById("applyVelocityBtn") as HTMLButtonElement | null
                                if (btn) btn.disabled = false
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

    //Set the current velocity
    const setSteps = () => {
        let value: any = currentSteps
        showModal({
            modals,
            title: T("HP2"),
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (String(value).length >= 0) currentSteps = Number(value)
                },
                text: T("S43"),
                id: "applyStepsBtn",
            },
            icon: <Edit2 />,
            id: "inputSteps",
            content: (
                <Fragment>
                    <div>{T("HP2")}</div>
                    <input
                        class="form-input"
                        type="number"
                        step="1"
                        min="1"
                        value={value}
                        onInput={(e) => {
                            value = e.currentTarget.value.trim()
                            if (Number(value) < 1 || String(value).length == 0) {
                                const btn = document.getElementById("applyStepsBtn") as HTMLButtonElement | null
                                if (btn) btn.disabled = true
                            } else {
                                const btn = document.getElementById("applyStepsBtn") as HTMLButtonElement | null
                                if (btn) btn.disabled = false
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

    useEffect(() => {
        currentVelocity = useUiContextFn.getValue("velocity")
        currentSteps = useUiContextFn.getValue("steps")
    }, [])
    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} /> 
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Move />
                    <strong class="text-ellipsis">{T("S66")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="H-100">
                        <div class="dropdown dropdown-right">
                            <span
                                class="dropdown-toggle btn btn-xs btn-header m-1"
                                tabIndex={0}
                            >
                                <ChevronDown style={{ width: "0.8rem", height: "0.8rem" }} />
                            </span>

                            <ul class="menu">
                                <li class="menu-item">
                                    <div
                                        class="menu-entry"
                                        onClick={(_e: TargetedMouseEvent<HTMLDivElement>) => {
                                            useUiContextFn.haptic()
                                            setVelocity()
                                        }}
                                    >
                                        <div class="menu-panel-item">
                                            <span class="text-menu-item">
                                                {T("HP1")}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                                <li class="menu-item">
                                    <div
                                        class="menu-entry"
                                        onClick={(_e: TargetedMouseEvent<HTMLDivElement>) => {
                                            useUiContextFn.haptic()
                                            setSteps()
                                        }}
                                    >
                                        <div class="menu-panel-item">
                                            <span class="text-menu-item">
                                                {T("HP2")}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
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
            <div class="m-1 jog-container">
                <PositionsControls />
                <div class="m-1">
                    <div class="jog-buttons-main-container">
                        <div class="m-1 jog-buttons-container">
                            <div class="jog-buttons-line-top-container">
                                {((useUiContextFn.getValue("showx") &&
                                    buttonsInfos.T.cmd.startsWith("X")) ||
                                    (useUiContextFn.getValue("showy") &&
                                        buttonsInfos.T.cmd.startsWith(
                                            "Y"
                                        ))) && (
                                    <Button
                                        class="button-minimal"
                                        lg
                                        m2
                                        tooltip
                                        nomin
                                        data-tooltip={T(buttonsInfos.T.tooltip)}
                                        id="btnjogup"
                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                            useUiContextFn.haptic()
                                            e.currentTarget.blur()
                                            sendJogCommand(buttonsInfos.T.cmd)
                                        }}
                                    >
                                        {buttonsInfos.T.label}
                                    </Button>
                                )}
                            </div>
                            <div class="jog-buttons-line-container">
                                {((useUiContextFn.getValue("showx") &&
                                    buttonsInfos.L.cmd.startsWith("X")) ||
                                    (useUiContextFn.getValue("showy") &&
                                        buttonsInfos.L.cmd.startsWith(
                                            "Y"
                                        ))) && (
                                    <ButtonImg
                                        class="button-minimal"
                                        m2
                                        lg
                                        tooltip
                                        nomin
                                        data-tooltip={T(buttonsInfos.L.tooltip)}
                                        id="btnjogleft"
                                        label={buttonsInfos.L.label}
                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                            useUiContextFn.haptic()
                                            e.currentTarget.blur()
                                            sendJogCommand(buttonsInfos.L.cmd)
                                        }}
                                    />
                                )}
                                <ButtonImg
                                    lg
                                    m2
                                    tooltip
                                    icon={<Home />}
                                    data-tooltip={T("HP19")}
                                    id={"btnpark"}
                                    onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                        useUiContextFn.haptic()
                                        e.currentTarget.blur()
                                        sendParkCommand()
                                    }}
                                />

                                {((useUiContextFn.getValue("showx") &&
                                    buttonsInfos.L.cmd.startsWith("X")) ||
                                    (useUiContextFn.getValue("showy") &&
                                        buttonsInfos.L.cmd.startsWith(
                                            "Y"
                                        ))) && (
                                    <ButtonImg
                                        class="button-minimal"
                                        lg
                                        m2
                                        nomin
                                        label={buttonsInfos.R.label}
                                        tooltip
                                        data-tooltip={T(buttonsInfos.R.tooltip)}
                                        id="btnjogright"
                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                            useUiContextFn.haptic()
                                            e.currentTarget.blur()
                                            sendJogCommand(buttonsInfos.R.cmd)
                                        }}
                                    />
                                )}
                            </div>
                            <div class="jog-buttons-line-bottom-container">
                                {((useUiContextFn.getValue("showx") &&
                                    buttonsInfos.B.cmd.startsWith("X")) ||
                                    (useUiContextFn.getValue("showy") &&
                                        buttonsInfos.B.cmd.startsWith(
                                            "Y"
                                        ))) && (
                                    <ButtonImg
                                        class="button-minimal"
                                        lg
                                        m2
                                        nomin
                                        tooltip
                                        data-tooltip={T(buttonsInfos.B.tooltip)}
                                        id="btnjogdown"
                                        label={buttonsInfos.B.label}
                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                            useUiContextFn.haptic()
                                            e.currentTarget.blur()
                                            sendJogCommand(buttonsInfos.B.cmd)
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div class="m-1 p-2 jog-buttons-container">
                            <div class="btn-group jog-distance-selector-container">
                                <div class="jog-distance-selector-header">
                                    mm
                                </div>
                                <div
                                    class="d-none"
                                    id="btndistSel+"
                                    onClick={() => {
                                        selectorBtn("+")
                                    }}
                                />
                                <div
                                    class="d-none"
                                    id="btndistSel-"
                                    onClick={() => {
                                        selectorBtn("-")
                                    }}
                                />
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("HP10")}
                                >
                                    <input
                                        type="radio"
                                        id="move_100"
                                        name="select_distance"
                                        value="100"
                                        checked={currentJogDistance == 100}
                                        onClick={(e: TargetedMouseEvent<HTMLInputElement>) => {
                                            useUiContextFn.haptic()
                                            onCheck(e, 100)
                                        }}
                                    />
                                    <label htmlFor="move_100">100</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("HP10")}
                                >
                                    <input
                                        type="radio"
                                        id="move_50"
                                        name="select_distance"
                                        value="50"
                                        checked={currentJogDistance == 50}
                                        onClick={(e: TargetedMouseEvent<HTMLInputElement>) => {
                                            useUiContextFn.haptic()
                                            onCheck(e, 50)
                                        }}
                                    />
                                    <label htmlFor="move_50">50</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("HP10")}
                                >
                                    <input
                                        type="radio"
                                        id="move_10"
                                        name="select_distance"
                                        value="10"
                                        checked={currentJogDistance == 10}
                                        onClick={(e: TargetedMouseEvent<HTMLInputElement>) => {
                                            useUiContextFn.haptic()
                                            onCheck(e, 10)
                                        }}
                                    />
                                    <label htmlFor="move_10">10</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("HP10")}
                                >
                                    <input
                                        type="radio"
                                        id="move_1"
                                        name="select_distance"
                                        value="1"
                                        checked={currentJogDistance == 1}
                                        onClick={(e: TargetedMouseEvent<HTMLInputElement>) => {
                                            useUiContextFn.haptic()
                                            onCheck(e, 1)
                                        }}
                                    />
                                    <label htmlFor="move_1">1</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("HP10")}
                                >
                                    <input
                                        type="radio"
                                        id="move_0_1"
                                        name="select_distance"
                                        value="0.1"
                                        checked={currentJogDistance == 0.1}
                                        onClick={(e: TargetedMouseEvent<HTMLInputElement>) => {
                                            useUiContextFn.haptic()
                                            onCheck(e, 0.1)
                                        }}
                                    />
                                    <label class="last-button" htmlFor="move_0_1">
                                        0.1
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="jog-extra-buttons-container">
                    {useUiContextFn.getValue("showpen") && (
                        <Field
                            id="btnPen"
                            type="boolean"
                            inline
                            value={
                                positions.pen == "?" || positions.pen == 0
                                    ? false
                                    : true
                            }
                            setValue={(val: any, update?: boolean) => {
                                if (!update) {
                                    if (val) {
                                        targetCommands("PD;")
                                        positions.pen = true
                                    } else {
                                        targetCommands("PU;")
                                        positions.pen = false
                                    }
                                }
                            }}
                            label={T("HP20")}
                        />
                    )}

                    <ButtonImg
                        m1
                        tooltip
                        label={T("HP11")}
                        id="btnStop"
                        icon={
                            <span class="text-error">
                                <StopCircle />
                            </span>
                        }
                        data-tooltip={T("HP11")}
                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                            useUiContextFn.haptic()
                            e.currentTarget.blur()
                            const cmds = useUiContextFn
                                .getValue("jogstopcmd")
                                .split(";")
                            cmds.forEach((cmd: any) => {
                                if (cmd.trim().length > 0) {
                                    targetCommands(
                                        variablesList.formatCommand(cmd)
                                    )
                                }
                            })
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

const JogPanelElement = {
    id: "jogPanel",
    content: <JogPanel />,
    name: "S66",
    icon: "Move",
    show: "showjogpanel",
    onstart: "openjogonstart",
    settingid: "jog",
}

export { JogPanel, JogPanelElement, PositionsControls }




