/*
Jog.tsx - ESP3D WebUI component file

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

import { Fragment } from "preact"
import {
    Move,
    Home,
    ChevronDown,
    Edit3,
    StopCircle,
    MoreHorizontal,
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { T } from "../Translations"
import { Button, ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useEffect, useState } from "preact/hooks"
import { showModal } from "../Modal"
import { useTargetContext } from "../../targets"

let currentFeedRate: Record<string, any> = {}
let currentJogDistanceXY: any = "-1"
let currentJogDistanceZ: any = "-1"
let currentAxis: string = "-1"

const feedList = ["XY", "Z", "A", "B", "C", "U", "V", "W"]
const selectableAxisLettersList = ["A", "B", "C", "U", "V", "W"]

/*
 * Local const
 *
 */
//A separate control to avoid the full panel to be updated when the positions are updated
interface PositionsControlsProps {
    onWPosClick: (letter: string, position: string) => void
}

const PositionsControls = ({ onWPosClick }: PositionsControlsProps) => {
    const { positions } = useTargetContext()
    const posLines = [
        ["x", "y", "z"],
        ["a", "b", "c"],
        ["u", "v", "w"],
    ]
    return (
        <Fragment>
            {posLines.map((line) => {
                if (
                    typeof positions[line[0]] != "undefined" ||
                    typeof positions[`w${line[0]}`] != "undefined"
                )
                    return (
                        <div key={line.join('')} class="jog-positions-ctrls m-1">
                            {line.map((letter) => {
                                if (
                                    (typeof positions[letter] != "undefined" ||
                                        typeof positions[`w${letter}`] !=
                                            "undefined") &&
                                    useUiContextFn.getValue(`show${letter}`)
                                ) {
                                    return (
                                        <div key={letter} class="jog-position-ctrl">
                                            {typeof positions[letter] !=
                                                "undefined" && (
                                                <Fragment>
                                                    <div class="jog-position-sub-header">
                                                        MPos{" "}
                                                        {letter.toUpperCase()}
                                                    </div>
                                                    <div class="m-1 jog-position-value">
                                                        {positions[letter]}
                                                    </div>
                                                </Fragment>
                                            )}
                                            {typeof positions[`w${letter}`] !=
                                                "undefined" && (
                                                <Fragment>
                                                    <div class="jog-position-sub-header">
                                                        WPos{" "}
                                                        {letter.toUpperCase()}
                                                    </div>
                                                    <div
                                                        class="m-1 jog-position-value jog-position-clickable"
                                                        onClick={() => {
                                                            useUiContextFn.haptic()
                                                            onWPosClick(letter, positions[
                                                                `w${letter}`
                                                            ])
                                                        }}
                                                    >
                                                        {
                                                            positions[
                                                                `w${letter}`
                                                            ]
                                                        }
                                                    </div>
                                                </Fragment>
                                            )}
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    )
            })}
        </Fragment>
    )
}

const JogPanel = () => {
    const { modals } = useModalsContext()
    const [currentSelectedAxis, setCurrentSelectedAxis] = useState(currentAxis)
    const { positions } = useTargetContext()
    const id = "jogPanel"

    const onChangeAxis = (e: any) => {
        let value = e.target ? e.target.value : e
        setCurrentSelectedAxis(value)
        currentAxis = value
    }

    const { targetCommands } = useTargetCommands()

    //Send Home command
    const sendHomeCommand = (axis: string) => {
        let selected_axis
        if (axis == "Axis") selected_axis = currentAxis
        else selected_axis = axis
        const cmd = useUiContextFn
            .getValue("homecmd")
            .replace("#", selected_axis)
        targetCommands(cmd)
    }

    //Send Zero command
    const sendZeroCommand = (axis: string) => {
        let selected_axis: string
        if (axis == "Axis") selected_axis = `${currentAxis  }0`
        else selected_axis = `${axis  }0`
        if (axis.length == 0) {
            selected_axis = ""
            "xyzabcuvw".split("").reduce((acc, letter) => {
                if (positions[letter] || positions[`w${letter}`])
                    acc += selected_axis += ` ${letter.toUpperCase()  }0`
                return acc
            }, "")
        }
        const cmd = useUiContextFn
            .getValue("zerocmd")
            .replace("#", selected_axis.trim())
        targetCommands(cmd)
    }

    const sendMoveToCommand = (axis: string, targetPosition: string) => {
       let upperAxis = axis.toUpperCase()
       let selected_axis: string
        let feedrate =
            upperAxis.startsWith("X") || upperAxis.startsWith("Y")
                ? currentFeedRate["XY"]
                : upperAxis.startsWith("Z")
                  ? currentFeedRate["Z"]
                  : currentFeedRate[currentAxis]
        if (axis.startsWith("Axis"))
            selected_axis = axis.replace("Axis", currentAxis)
        else selected_axis = axis
        let cmd =
            `$J=G90 G21 ${selected_axis.toUpperCase()}${targetPosition} F${feedrate}`
        targetCommands(cmd)
    }

    const showMoveToDialog = (axis: string, currentPosition: string) => {
        let targetValue = currentPosition
        const axisUpper = axis.toUpperCase()
        showModal({
            modals,
            title: `Move to ${axisUpper} position`,
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (targetValue.length > 0 && !isNaN(parseFloat(targetValue))) {
                        sendMoveToCommand(axisUpper, targetValue)
                    }
                },
                text: T("S43"),
                id: "applyMoveToBtn",
            },
            icon: <Move />,
            id: "inputMoveTo",
            content: (
                <Fragment>
                    <div>
                        {T("CN15")?.replace("$", axisUpper) || `Enter target ${axisUpper} position:`}
                    </div>
                    <input
                        class="form-input"
                        type="number"
                        step="0.01"
                        value={targetValue}
                        onInput={(e) => {
                            targetValue = (e.target as HTMLInputElement).value.trim()
                            const btn = document.getElementById("applyMoveToBtn") as HTMLButtonElement
                            if (btn) {
                                btn.disabled = targetValue.length === 0 || isNaN(targetValue as any)
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

    const sendJogCommand = (axis: string) => {
        let selected_axis: string
        let distance: string | number
        let feedrate =
            axis.startsWith("X") || axis.startsWith("Y")
                ? currentFeedRate["XY"]
                : axis.startsWith("Z")
                  ? currentFeedRate["Z"]
                  : currentFeedRate[currentAxis]

        // Determine which distance to use based on axis
        if (axis.startsWith("X") || axis.startsWith("Y")) {
            distance = currentJogDistanceXY
        } else if (axis.startsWith("Z")) {
            distance = currentJogDistanceZ
        } else {
            distance = currentJogDistanceXY // Default for other axes
        }

        if (axis.startsWith("Axis"))
            selected_axis = axis.replace("Axis", currentAxis)
        else selected_axis = axis
        let cmd =
            `$J=G91 G21 ${selected_axis  }${distance  } F${feedrate}`
        targetCommands(cmd)
    }

    //click distance button
    const onCheckXY = (e: any, distance: number | string) => {
        e.target.blur()
        currentJogDistanceXY = distance
    }

    //click distance button for Z
    const onCheckZ = (e: any, distance: number | string) => {
        e.target.blur()
        currentJogDistanceZ = distance
    }

    //Set the current feedrate for axis
    const setFeedrate = (axis: string) => {
        let value = currentFeedRate[axis]
        let t
        if (axis == "XY") {
            t = T("CN2")
        } else {
            t = T("CN3").replace("$", axis)
        }
        showModal({
            modals,
            title: t,
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (value.length > 0.1 as any) currentFeedRate[axis] = value
                },
                text: T("S43"),
                id: "applyFrBtn",
            },
            icon: <Edit3 />,
            id: "inputFeedrate",
            content: (
                <Fragment>
                    <div>{t}</div>
                    <input
                        class="form-input"
                        type="number"
                        step="0.1"
                        value={value}
                        onInput={(e) => {
                            value = (e.target as HTMLInputElement).value.trim()
                            const btn = document.getElementById("applyFrBtn") as HTMLButtonElement
                            if (parseFloat(value) < 0.1) {
                                if (btn) {
                                    btn.disabled = true
                                }
                            } else {
                                if (btn) {
                                    btn.disabled = false
                                }
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

    // Axis selector for additional axes (A, B, C, U, V, W)
    const selectorBtn = (type: string) => {
        if (type == "prev" || type == "next") {
            const axisList = selectableAxisLettersList.reduce(
                (acc: string[], letter) => {
                    if (
                        (positions[letter.toLowerCase()] ||
                            positions[`w${letter.toLowerCase()}`]) &&
                        useUiContextFn.getValue(
                            `show${[letter.toLowerCase()]}`
                        )
                    ) {
                        acc.push(letter)
                    }

                    return acc
                },
                []
            )

            if (axisList.length > 1) {
                let index = axisList.indexOf(currentAxis)
                if (type == "next") {
                    index++
                    if (index >= axisList.length) index = 0
                } else {
                    index--
                    if (index < 0) index = axisList.length - 1
                }

                const selectElement = document.getElementById("selectAxisList") as HTMLSelectElement
                if (selectElement) {
                    selectElement.value =
                        axisList[index]
                    onChangeAxis(axisList[index])
                }
            }
        }
    }

    useEffect(() => {
        if(currentJogDistanceXY == "-1") {
            currentJogDistanceXY = useUiContextFn.getValue("jogdistancedefault")
        }
        if(currentJogDistanceZ == "-1") {
            currentJogDistanceZ = useUiContextFn.getValue("zjogdistancedefault") || "10"
        }

        if (currentAxis == "-1") {
            feedList.forEach((letter) => {
                if (!currentFeedRate[letter]) {
                    currentFeedRate[letter] = useUiContextFn.getValue(
                        `${letter.toLowerCase()  }feedrate`
                    )
                }
                feedList.forEach((letter) => {
                    if (!(letter == "XY" || letter == "Z")) {
                        if (
                            currentAxis == "-1" &&
                            useUiContextFn.getValue(
                                `show${letter.toLowerCase()}`
                            ) &&
                            (positions[letter.toLowerCase()] ||
                                positions[`w${letter.toLowerCase()}`])
                        ) {
                            currentAxis = letter
                        }
                    }
                })
            })
            setCurrentSelectedAxis(currentAxis)
        }
    })

    return (
        <div class="panel panel-dashboard" id={id} >
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
                                <ChevronDown size={"0.8rem" as any} />
                            </span>

                            <ul class="menu">
                                {feedList.map((letter) => {
                                    let help
                                    let condition = false
                                    if (letter.length == 2) {
                                        help = T("CN2")
                                        condition =
                                            (useUiContextFn.getValue("showx") &&
                                                (positions.x ||
                                                    positions.wx)) ||
                                            (useUiContextFn.getValue("showy") &&
                                                (positions.y || positions.wy))
                                    } else {
                                        help = T("CN3").replace("$", letter)
                                        condition =
                                            (positions[letter.toLowerCase()] ||
                                                positions[
                                                    `w${letter.toLowerCase()}`
                                                ]) &&
                                            useUiContextFn.getValue(
                                                `show${letter.toLowerCase()}`
                                            )
                                    }
                                    if (condition)
                                        return (
                                            <li key={letter} class="menu-item">
                                                <div
                                                    class="menu-entry"
                                                    onClick={(_e: any) => {
                                                        useUiContextFn.haptic()
                                                        setFeedrate(letter)
                                                    }}
                                                >
                                                    <div class="menu-panel-item">
                                                        <span class="text-menu-item">
                                                            {help}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                })}
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
                <PositionsControls onWPosClick={showMoveToDialog} />
                <div class="m-1">
                    <div class="jog-buttons-main-container">
                        {/* XY Group */}
                        <div class="jog-axis-group">
                        {/* X and Y axes with shared distance selector */}
                        {["X", "Y"].map((letter) => {
                            if (
                                (positions[letter.toLowerCase()] ||
                                    positions[`w${letter.toLowerCase()}`]) &&
                                useUiContextFn.getValue(
                                    `show${letter.toLowerCase()}`
                                )
                            ) {
                                return (
                                    <div key={letter} class="m-1 jog-buttons-container">
                                        <Button
                                            m2
                                            tooltip
                                            data-tooltip={T("CN12")}
                                            id={`btn+${letter}`}
                                            onClick={(e: any) => {
                                                useUiContextFn.haptic();
                                                (e.target as HTMLElement).blur();
                                                sendJogCommand(`${letter  }+`)
                                            }}
                                        >
                                            +{letter}
                                        </Button>
                                        {useUiContextFn.getValue(
                                            "homesingleaxis"
                                        ) && (
                                            <Button
                                                m2
                                                tooltip
                                                data-tooltip={T("CN10")}
                                                id={`btnH${letter}`}
                                                onClick={(e: any) => {
                                                    useUiContextFn.haptic();
                                                    (e.target as HTMLElement).blur();
                                                    sendHomeCommand(letter)
                                                }}
                                            >
                                                <Home size={"1rem" as any} />
                                                <span class="text-tiny">
                                                    {letter.toLowerCase()}
                                                </span>
                                            </Button>
                                        )}

                                        <Button
                                            m2
                                            tooltip
                                            data-tooltip={T("CN19")}
                                            id={`btnZ${letter}`}
                                            onClick={(e: any) => {
                                                useUiContextFn.haptic();
                                                (e.target as HTMLElement).blur();
                                                sendZeroCommand(letter)
                                            }}
                                        >
                                            &Oslash;
                                            <span class="text-tiny">
                                                {letter.toLowerCase()}
                                            </span>
                                        </Button>
                                        <Button
                                            m2
                                            tooltip
                                            data-tooltip={T("CN13")}
                                            id={`btn-${letter}`}
                                            onClick={(e: any) => {
                                                useUiContextFn.haptic();
                                                (e.target as HTMLElement).blur();
                                                sendJogCommand(`${letter  }-`)
                                            }}
                                        >
                                            -{letter}
                                        </Button>
                                    </div>
                                )
                            }
                        })}
                        {/* XY Distance Selector */}
                        <div class="m-1 p-2 jog-buttons-container">
                            <div class="btn-group jog-distance-selector-container">
                                <div class="jog-distance-selector-header">
                                    mm
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("CN18")}
                                >
                                    <input
                                        type="radio"
                                        id="move_xy_100"
                                        name="select_distance_xy"
                                        value="100"
                                        checked={currentJogDistanceXY == 100}
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic()
                                            onCheckXY(e, 100)
                                        }}
                                    />
                                    <label for="move_xy_100">100</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("CN18")}
                                >
                                    <input
                                        type="radio"
                                        id="move_xy_50"
                                        name="select_distance_xy"
                                        value="50"
                                        checked={currentJogDistanceXY == 50}
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic()
                                            onCheckXY(e, 50)
                                        }}
                                    />
                                    <label for="move_xy_50">50</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("CN18")}
                                >
                                    <input
                                        type="radio"
                                        id="move_xy_10"
                                        name="select_distance_xy"
                                        value="10"
                                        checked={currentJogDistanceXY == 10}
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic()
                                            onCheckXY(e, 10)
                                        }}
                                    />
                                    <label for="move_xy_10">10</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("CN18")}
                                >
                                    <input
                                        type="radio"
                                        id="move_xy_1"
                                        name="select_distance_xy"
                                        value="1"
                                        checked={currentJogDistanceXY == 1}
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic()
                                            onCheckXY(e, 1)
                                        }}
                                    />
                                    <label for="move_xy_1">1</label>
                                </div>
                                <div
                                    class="flatbtn tooltip tooltip-left"
                                    data-tooltip={T("CN18")}
                                >
                                    <input
                                        type="radio"
                                        id="move_xy_0_1"
                                        name="select_distance_xy"
                                        value="0.1"
                                        checked={currentJogDistanceXY == 0.1}
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic()
                                            onCheckXY(e, 0.1)
                                        }}
                                    />
                                    <label class="last-button" for="move_xy_0_1">
                                        0.1
                                    </label>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* Z axis with its own distance selector */}
                        {(positions.z || positions.wz) &&
                            useUiContextFn.getValue("showz") && (
                            <div class="jog-axis-group">
                                <div class="m-1 jog-buttons-container">
                                    <Button
                                        m2
                                        tooltip
                                        data-tooltip={T("CN12")}
                                        id="btn+Z"
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic();
                                            (e.target as HTMLElement).blur();
                                            sendJogCommand("Z+")
                                        }}
                                    >
                                        +Z
                                    </Button>
                                    {useUiContextFn.getValue("homesingleaxis") && (
                                        <Button
                                            m2
                                            tooltip
                                            data-tooltip={T("CN10")}
                                            id="btnHZ"
                                            onClick={(e: any) => {
                                                useUiContextFn.haptic();
                                                (e.target as HTMLElement).blur();
                                                sendHomeCommand("Z")
                                            }}
                                        >
                                            <Home size={"1rem" as any} />
                                            <span class="text-tiny">z</span>
                                        </Button>
                                    )}
                                    <Button
                                        m2
                                        tooltip
                                        data-tooltip={T("CN19")}
                                        id="btnZZ"
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic();
                                            (e.target as HTMLElement).blur();
                                            sendZeroCommand("Z")
                                        }}
                                    >
                                        &Oslash;
                                        <span class="text-tiny">z</span>
                                    </Button>
                                    <Button
                                        m2
                                        tooltip
                                        data-tooltip={T("CN13")}
                                        id="btn-Z"
                                        onClick={(e: any) => {
                                            useUiContextFn.haptic();
                                            (e.target as HTMLElement).blur();
                                            sendJogCommand("Z-")
                                        }}
                                    >
                                        -Z
                                    </Button>
                                </div>
                                {/* Z Distance Selector */}
                                <div class="m-1 p-2 jog-buttons-container">
                                    <div class="btn-group jog-distance-selector-container">
                                        <div class="jog-distance-selector-header">
                                            mm
                                        </div>
                                        <div
                                            class="flatbtn tooltip tooltip-left"
                                            data-tooltip={T("CN18")}
                                        >
                                            <input
                                                type="radio"
                                                id="move_z_50"
                                                name="select_distance_z"
                                                value="50"
                                                checked={currentJogDistanceZ == 50}
                                                onClick={(e: any) => {
                                                    useUiContextFn.haptic()
                                                    onCheckZ(e, 50)
                                                }}
                                            />
                                            <label for="move_z_50">50</label>
                                        </div>
                                        <div
                                            class="flatbtn tooltip tooltip-left"
                                            data-tooltip={T("CN18")}
                                        >
                                            <input
                                                type="radio"
                                                id="move_z_25"
                                                name="select_distance_z"
                                                value="25"
                                                checked={currentJogDistanceZ == 25}
                                                onClick={(e: any) => {
                                                    useUiContextFn.haptic()
                                                    onCheckZ(e, 25)
                                                }}
                                            />
                                            <label for="move_z_25">25</label>
                                        </div>
                                        <div
                                            class="flatbtn tooltip tooltip-left"
                                            data-tooltip={T("CN18")}
                                        >
                                            <input
                                                type="radio"
                                                id="move_z_10"
                                                name="select_distance_z"
                                                value="10"
                                                checked={currentJogDistanceZ == 10}
                                                onClick={(e: any) => {
                                                    useUiContextFn.haptic()
                                                    onCheckZ(e, 10)
                                                }}
                                            />
                                            <label for="move_z_10">10</label>
                                        </div>
                                        <div
                                            class="flatbtn tooltip tooltip-left"
                                            data-tooltip={T("CN18")}
                                        >
                                            <input
                                                type="radio"
                                                id="move_z_1"
                                                name="select_distance_z"
                                                value="1"
                                                checked={currentJogDistanceZ == 1}
                                                onClick={(e: any) => {
                                                    useUiContextFn.haptic()
                                                    onCheckZ(e, 1)
                                                }}
                                            />
                                            <label for="move_z_1">1</label>
                                        </div>
                                        <div
                                            class="flatbtn tooltip tooltip-left"
                                            data-tooltip={T("CN18")}
                                        >
                                            <input
                                                type="radio"
                                                id="move_z_0_1"
                                                name="select_distance_z"
                                                value="0.1"
                                                checked={currentJogDistanceZ == 0.1}
                                                onClick={(e: any) => {
                                                    useUiContextFn.haptic()
                                                    onCheckZ(e, 0.1)
                                                }}
                                            />
                                            <label class="last-button" for="move_z_0_1">
                                                0.1
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {selectableAxisLettersList.reduce((acc, letter) => {
                    if (
                        useUiContextFn.getValue(
                            `show${letter.toLowerCase()}`
                        ) &&
                        (positions[letter.toLowerCase()] ||
                            positions[`w${letter.toLowerCase()}`])
                    )
                        acc = true
                    return acc
                }, false as boolean) && (
                    <div class="m-1 jog-buttons-container-horizontal">
                        <div
                            class="d-none"
                            id="btnaxisSel+"
                            onClick={() => {
                                selectorBtn("next")
                            }}
                        />
                        <div
                            class="d-none"
                            id="btnaxisSel-"
                            onClick={() => {
                                selectorBtn("prev")
                            }}
                        />
                        <div class="form-group m-2 text-primary">
                            <select
                                id="selectAxisList"
                                class="form-select"
                                onChange={(e: any) => {
                                    onChangeAxis(e)
                                }}
                                value={currentSelectedAxis}
                            >
                                {selectableAxisLettersList.map((letter) => {
                                    if (
                                        (positions[letter.toLowerCase()] ||
                                            positions[
                                                `w${letter.toLowerCase()}`
                                            ]) &&
                                        useUiContextFn.getValue(
                                            `show${letter.toLowerCase()}`
                                        )
                                    )
                                        return (
                                            <option value={letter}>
                                                {letter}
                                            </option>
                                        )
                                })}
                            </select>
                        </div>
                        <Button
                            m2
                            tooltip
                            data-tooltip={T("CN12")}
                            id="btn+axis"
                            onClick={(e: any) => {
                                useUiContextFn.haptic();
                                (e.target as HTMLElement).blur();
                                sendJogCommand("Axis+")
                            }}
                        >
                            +{currentSelectedAxis}
                        </Button>
                        {useUiContextFn.getValue("homesingleaxis") && (
                            <Button
                                m2
                                tooltip
                                data-tooltip={T("CN10")}
                                id="btnHaxis"
                                onClick={(e: any) => {
                                    useUiContextFn.haptic();
                                    (e.target as HTMLElement).blur();
                                    sendHomeCommand("Axis")
                                }}
                            >
                                <Home size={"1rem" as any} />
                                <span class="text-tiny">
                                    {currentSelectedAxis}
                                </span>
                            </Button>
                        )}

                        <Button
                            m2
                            tooltip
                            data-tooltip={T("CN19")}
                            id="btnZaxis"
                            onClick={(e: any) => {
                                useUiContextFn.haptic();
                                (e.target as HTMLElement).blur();
                                sendZeroCommand("Axis")
                            }}
                        >
                            &Oslash;
                            <span class="text-tiny">{currentSelectedAxis}</span>
                        </Button>
                        <Button
                            m2
                            tooltip
                            data-tooltip={T("CN13")}
                            id="btn-axis"
                            onClick={(e: any) => {
                                useUiContextFn.haptic();
                                (e.target as HTMLElement).blur();
                                sendJogCommand("Axis-")
                            }}
                        >
                            -{currentSelectedAxis}
                        </Button>
                    </div>
                )}
                {(positions.x ||
                    positions.wx ||
                    positions.y ||
                    positions.wy ||
                    positions.z ||
                    positions.wz ||
                    positions.a ||
                    positions.wa ||
                    positions.b ||
                    positions.wb ||
                    positions.c ||
                    positions.wc) && (
                    <div class="jog-extra-buttons-container">
                        <Button
                            m1
                            tooltip
                            data-tooltip={T("CN21")}
                            id="btnHAll"
                            onClick={(e: any) => {
                                useUiContextFn.haptic();
                                (e.target as HTMLElement).blur();
                                sendHomeCommand("")
                            }}
                        >
                            <Home />
                            <MoreHorizontal />
                        </Button>
                        <Button
                            m1
                            tooltip
                            data-tooltip={T("CN20")}
                            id="btnZAll"
                            onClick={(e: any) => {
                                useUiContextFn.haptic();
                                (e.target as HTMLElement).blur();
                                sendZeroCommand("")
                            }}
                        >
                            <label class="text-like-icon">
                                &Oslash;
                            </label>
                            <MoreHorizontal />
                        </Button>
                        <ButtonImg
                            m1
                            tooltip
                            label={T("CN23")}
                            id="btnStop"
                            icon={
                                <span class="text-error">
                                    <StopCircle />
                                </span>
                            }
                            data-tooltip={T("CN23")}
                            onClick={(e: any) => {
                                useUiContextFn.haptic();
                                (e.target as HTMLElement).blur();
                                const cmds = useUiContextFn
                                    .getValue("jogstopcmd")
                                targetCommands(cmds, ";")
                            }}
                        />
                    </div>
                )}
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
