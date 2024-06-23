/*
 MachineSettings.js - ESP3D WebUI Target file

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
import { Fragment, h } from "preact"
import { useEffect, useState } from "preact/hooks"
import { T } from "../../../components/Translations"
import { processor } from "./processor"
import { useHttpFn } from "../../../hooks"
import { useUiContext, useUiContextFn } from "../../../contexts"
import { Target } from "./index"
import {
    espHttpURL,
    disableUI,
    formatFileSizeToString,
} from "../../../components/Helpers"
import {
    Field,
    Loading,
    ButtonImg,
    CenterLeft,
    Progress,
} from "../../../components/Controls"
import { RefreshCcw, XCircle, Flag, Save } from "preact-feather"
import { CMD } from "./CMD-source"
import {
    showConfirmationModal,
    showProgressModal,
} from "../../../components/Modal"

const machineSettings = {}
machineSettings.cache = []
machineSettings.toSave = []
machineSettings.totalToSave = 0

const MachineSettings = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [collected, setCollected] = useState("0 B")
    const { createNewRequest, abortRequest } = useHttpFn
    const { modals, toasts, uisettings } = useUiContext()
    const [showSave, setShowSave] = useState(false)
    const progressBar = {}
    const id = "Machine Tab"
    const sendSerialCmd = (cmd, updateUI) => {
        createNewRequest(
            espHttpURL("command", { cmd }),
            { method: "GET", echo: cmd },
            {
                onSuccess: (result) => {
                    //Result is handled on ws so just do nothing
                    if (updateUI) updateUI(result)
                },
                onFail: (error) => {
                    console.log("Error:", error)
                    setIsLoading(false)
                    toasts.addToast({ content: error, type: "error" })
                    processor.stopCatchResponse()
                },
            }
        )
    }

    const saveEntry = (entry, index, total) => {
        const { type, cmd } = CMD.command("eepromset", entry)
        createNewRequest(
            espHttpURL("command", { cmd }),
            { method: "GET", id: "saveMachineSetting" },
            {
                onSuccess: (result) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(index + 1)
                    try {
                        entry.initial = entry.value.trim()
                    } catch (e) {
                        console.log(e)
                        toasts.addToast({ content: e, type: "error" })
                    } finally {
                        entry.generateValidation()
                        processSaving()
                    }
                },
                onFail: (error) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(index + 1)
                    console.log(error)
                    toasts.addToast({ content: error, type: "error" })
                    processSaving()
                },
            }
        )
    }

    function abortSave() {
        abortRequest("saveMachineSetting")
        toasts.addToast({ content: T("S175"), type: "error" })
        endProgression()
    }

    function endProgression() {
        modals.removeModal(modals.getModalIndex("progression"))
    }

    const processSaving = () => {
        if (machineSettings.toSave.length > 0) {
            const index = machineSettings.toSave.pop()
            saveEntry(
                machineSettings.cache[index],
                machineSettings.totalToSave - machineSettings.toSave.length - 1,
                machineSettings.totalToSave
            )
        } else {
            endProgression()
        }
    }

    const saveSettings = () => {
        machineSettings.totalToSave = 0
        machineSettings.toSave = []
        machineSettings.cache.map((entry, index) => {
            if (entry.type != "comment") {
                if (entry.initial.trim() != entry.value.trim()) {
                    machineSettings.totalToSave++
                    machineSettings.toSave.push(index)
                }
            }
        })

        showProgressModal({
            modals,
            title: T("S91"),
            button1: { cb: abortSave, text: T("S28") },
            content: (
                <Progress
                    progressBar={progressBar}
                    max={machineSettings.totalToSave}
                />
            ),
        })
        processSaving()
    }

    function checkSaveStatus() {
        let stringified = JSON.stringify(machineSettings.cache)
        let hasmodified =
            stringified.indexOf('"hasmodified":true') == -1 ? false : true
        let haserrors =
            stringified.indexOf('"haserror":true') == -1 ? false : true
        if (haserrors || !hasmodified) return false
        return true
    }

    const processCallBack = (data, total) => {
        setCollected(formatFileSizeToString(total))
    }

    const processFeedback = (feedback) => {
        if (feedback.status) {
            if (feedback.status == "error") {
                console.log("got error")
                toasts.addToast({
                    content: feedback.content
                        ? `${T("S22")}:${T(feedback.content)}`
                        : T("S4"),
                    type: "error",
                })
            } else if (feedback.command == "eeprom") {
                machineSettings.cache = CMD.command(
                    "formatEeprom",
                    feedback.content
                )
            }
        }
        setIsLoading(false)
    }

    const onCancel = (e) => {
        useUiContextFn.haptic()
        toasts.addToast({
            content: T("S175"),
            type: "error",
        })
        processor.stopCatchResponse()
        machineSettings.cache = []
        setIsLoading(false)
    }

    const onRefresh = (e) => {
        if (e) useUiContextFn.haptic()
        //get command
        const response = CMD.command("eeprom")
        //send query
        if (
            processor.startCatchResponse(
                "CMD",
                "eeprom",
                processFeedback,
                null,
                processCallBack
            )
        ) {
            setCollected("0 B")
            setIsLoading(true)
            sendSerialCmd(response.cmd)
        }
    }

    const generateValidation = (fieldData) => {
        const validation = {
            message: <Flag size="1rem" />,
            valid: true,
            modified: true,
        }
        if (fieldData.value.trim().length == 0) validation.valid = false
        if (fieldData.type == "text") {
            if (fieldData.value.trim() == fieldData.initial.trim()) {
                fieldData.hasmodified = false
            } else {
                fieldData.hasmodified = true
            }
        }
        if (fieldData.type == "number") {
            if (fieldData.value == fieldData.initial) {
                fieldData.hasmodified = false
            } else {
                fieldData.hasmodified = true
            }
        }
        if (!validation.valid) {
            validation.message = T("S42")
        }
        fieldData.haserror = !validation.valid
        setShowSave(checkSaveStatus())
        if (!fieldData.hasmodified && !fieldData.haserror) {
            validation.message = null
            validation.valid = true
            validation.modified = false
        }
        return validation
    }
    useEffect(() => {
        if (uisettings.getValue("autoload") && machineSettings.cache == "") {
            setIsLoading(true)
            //do not call onRefresh directly as  WebSocket may still be connecting or just connected
            // and we may have a race issue, the command go but does not have answer catched
            setTimeout(() => {
                onRefresh()
            }, 1000)
        }
    }, [])

    return (
        <div class="container">
            <h4 class="show-low title">{Target}</h4>
            <div class="m-2" />
            <center>
                {isLoading && (
                    <Fragment>
                        <Loading class="m-2" />
                        <div>{collected}</div>
                        <ButtonImg
                            donotdisable
                            showlow
                            icon={<XCircle />}
                            label={T("S28")}
                            tooltip
                            data-tooltip={T("S28")}
                            onClick={onCancel}
                        />
                    </Fragment>
                )}
                {!isLoading && (
                    <center class="m-2">
                        {machineSettings.cache.length > 0 && (
                            <div>
                                <CenterLeft bordered>
                                    {machineSettings.cache.map((element) => {
                                        if (element.type == "comment")
                                            return (
                                                <div class="comment m-1  ">
                                                    {element.value}
                                                </div>
                                            )
                                        const [validation, setvalidation] =
                                            useState()
                                        element.generateValidation = () => {
                                            setvalidation(
                                                generateValidation(element)
                                            )
                                        }
                                        return (
                                            <div class="m-1">
                                                <Field
                                                    type={element.type}
                                                    value={element.value}
                                                    setValue={(
                                                        val,
                                                        update = false
                                                    ) => {
                                                        if (!update) {
                                                            element.value = val
                                                        }
                                                        setvalidation(
                                                            generateValidation(
                                                                element
                                                            )
                                                        )
                                                    }}
                                                    validation={validation}
                                                />
                                            </div>
                                        )
                                    })}
                                </CenterLeft>
                            </div>
                        )}

                        <ButtonImg
                            m2
                            icon={<RefreshCcw />}
                            label={T("S50")}
                            tooltip
                            data-tooltip={T("S23")}
                            onClick={onRefresh}
                        />
                        {showSave && (
                            <ButtonImg
                                m2
                                tooltip
                                data-tooltip={T("S62")}
                                label={T("S61")}
                                icon={<Save />}
                                onClick={(e) => {
                                    useUiContextFn.haptic()
                                    e.target.blur()
                                    saveSettings()
                                }}
                            />
                        )}
                    </center>
                )}
            </center>
        </div>
    )
}

export { MachineSettings, machineSettings }
