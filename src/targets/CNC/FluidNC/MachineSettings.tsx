/*
 MachineSettings.tsx - ESP3D WebUI Target file

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
import { Fragment,  JSX } from "preact"
import { useEffect, useState } from "preact/hooks"
import { T } from "../../../components/Translations"
import { processor } from "./processor"
import { useHttpFn } from "../../../hooks"
import { useToastsContext, useUiContext, useUiContextFn } from "../../../contexts"
import { Target } from "./index"
import {
    espHttpURL,
    formatFileSizeToString,
} from "../../../components/Helpers"
import {
    Field,
    Loading,
    ButtonImg,
    CenterLeft,
} from "../../../components/Controls"
import { RefreshCcw, XCircle, Send, Flag } from "preact-feather"
import { CMD } from "./CMD-source"

type MachineSettingElement = {
    type?: string
    value?: string
    initial?: string
    cmd?: string
    hasmodified?: boolean
    haserror?: boolean
}

const machineSettings: { cache: any[] } = { cache: [] }

const MachineSettings = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [settings, setSettings] = useState(machineSettings.cache)
    const [collected, setCollected] = useState("0 B")
    const { createNewRequest, abortRequest } = useHttpFn as any
    const { uisettings } = useUiContext()
    const { toasts } = useToastsContext()
    const id = "Machine Tab"
    const sendSerialCmd = (cmd: string, updateUI?: (res: any) => void) => {
        createNewRequest(
            espHttpURL("command", { cmd }),
            { method: "GET", echo: cmd },
            {
                onSuccess: (result: any) => {
                    //Result is handled on ws so just do nothing
                    if (updateUI) updateUI(result)
                },
                onFail: (error: string) => {
                    console.log("Error:", error)
                    setIsLoading(false)
                    toasts.addToast({ content: error, type: "error" })
                    processor.stopCatchResponse()
                },
            }
        )
    }

    const processCallBack = (_data: string, total: number) => {
        setCollected(formatFileSizeToString(total))
    }

    const processFeedback = (feedback: any) => {
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
                machineSettings.cache = CMD.command("formatEeprom", feedback.content)
            }
        }
        setIsLoading(false)
    }

    const onCancel = (_e?: any) => {
        useUiContextFn.haptic()
        toasts.addToast({
            content: T("S175"),
            type: "error",
        })
        processor.stopCatchResponse()
        machineSettings.cache = []
        setIsLoading(false)
    }

    const onRefresh = (e?: any) => {
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

    const sendCommand = (element: MachineSettingElement, setvalidation: (v: any) => void) => {
        sendSerialCmd(`${element.cmd}=${(element.value || '').trim()}`, () => {
            element.initial = element.value
            setvalidation(generateValidation(element))
        })
        //TODO: Should answer be checked ?
    }

    const generateValidation = (fieldData: MachineSettingElement) => {
        const validation: { message: any; valid: boolean; modified: boolean } = {
            message: <Flag style={{ width: "1rem", height: "1rem" }} />,
            valid: true,
            modified: true,
        }
        if (fieldData.type == "text") {
            if (fieldData.value == fieldData.initial) {
                fieldData.hasmodified = false
            } else {
                fieldData.hasmodified = true
            }
            if ((fieldData.value || '').trim().length == 0) validation.valid = false
        }
        if (!validation.valid) {
            validation.message = T("S42")
        }
        fieldData.haserror = !validation.valid
        //setShowSave(checkSaveStatus());
        if (!fieldData.hasmodified && !fieldData.haserror) {
            validation.message = null
            validation.valid = true
            validation.modified = false
        }
        return validation
    }
    useEffect(() => {
        if (uisettings.getValue("autoload") && (machineSettings.cache as any) == "") {
            setIsLoading(true)
            //avoid race condition with websocket
            setTimeout(() => {
                onRefresh()
            }, 1000)
        }
    }, [])

    return (
        <div class="container">
            <h4 class="show-low title">{Target}</h4>
            <div class="m-2" />
            <div style={{ textAlign: "center" }}>
                {isLoading && (
                    <Fragment>
                        <Loading class="m-2" />
                        <div>{collected}</div>
                        <ButtonImg
                            donotdisable
                            icon={<XCircle />}
                            label={T("S28")}
                            tooltip
                            data-tooltip={T("S28")}
                            onClick={onCancel}
                        />
                    </Fragment>
                )}
                {!isLoading && (
                    <div class="m-2" style={{ textAlign: "center" }}>
                        {machineSettings.cache.length > 0 && (
                            <div>
                                <CenterLeft bordered>
                                    {machineSettings.cache.map((element: MachineSettingElement) => {
                                        if ((element as any).type == "comment")
                                            return (
                                                <div class="comment m-1  ">
                                                    {T((element as any).value)}({(element as any).value})
                                                </div>
                                            )
                                        const [validation, setvalidation] =
                                            useState<any>()
                                        const button = (
                                            <ButtonImg
                                                className="submitBtn"
                                                group
                                                icon={<Send />}
                                                label={T("S81")}
                                                tooltip
                                                data-tooltip={T("S82")}
                                                onclick={() => {
                                                    useUiContextFn.haptic()
                                                    sendCommand(
                                                        element,
                                                        setvalidation
                                                    )
                                                }}
                                            />
                                        )
                                        return (
                                            <div class="m-1">
                                                <Field
                                                    type={(element as any).type}
                                                    value={(element as any).value}
                                                    setValue={(
                                                        val: any,
                                                        update: boolean = false
                                                    ) => {
                                                        if (!update) {
                                                            ;(element as any).value = val
                                                        }
                                                        setvalidation(
                                                            generateValidation(
                                                                element
                                                            )
                                                        )
                                                    }}
                                                    validation={validation}
                                                    button={button}
                                                />
                                            </div>
                                        )
                                    })}
                                </CenterLeft>
                            </div>
                        )}

                        <ButtonImg
                            icon={<RefreshCcw />}
                            label={T("S50")}
                            tooltip
                            data-tooltip={T("S23")}
                            onClick={onRefresh}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export { MachineSettings, machineSettings }

