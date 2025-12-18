/*
 index.tsx - ESP3D WebUI navigation tab file

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
import { Fragment,  TargetedMouseEvent, JSX } from "preact"
import { useEffect, useState, useRef } from "preact/hooks"
import { ButtonImg, Loading, Progress } from "../../components/Controls"
import { useHttpQueue, useTargetCommands } from "../../hooks"
import { espHttpURL } from "../../components/Helpers"
import { T } from "../../components/Translations"
import { useWebSocketService } from "../../hooks/useWebSocketService";
import {
    useUiContext,
    useModalsContext,
    useToastsContext,
    useSettingsContext,
    useUiContextFn,
} from "../../contexts"
import {
    RefreshCcw,
    RotateCcw,
    Save,
    ExternalLink,
    Flag,
    Download,
} from "preact-feather"
import {
    showConfirmationModal,
    showProgressModal,
} from "../../components/Modal"
import { Field } from "../../components/Controls"
import { formatStructure } from "./formatHelper"
import { exportFeatures } from "./exportHelper"
import { importFeatures } from "./importHelper"
import { restartdelay, useTargetContextFn } from "../../targets"
import { ImportResult } from "./importHelper"
import type {
    RawSettingItem,
    SettingFieldProps,
    FeaturesStructure,
    ValidationFieldData
} from "../../types/settings.types"

// API Response interfaces
interface ESP400Response {
    cmd: number;
    status: string;
    data?: RawSettingItem[];
}

interface ESP401Response {
    cmd: number;
    status: string;
    data?: string;
}

// Validation result interface
interface ValidationResult {
    message: JSX.Element | string | null;
    valid: boolean;
    modified: boolean;
}

// Progress bar interface
interface ProgressBarRef {
    update?: (value: number) => void;
}

const FeaturesTab = () => {
    const { uisettings } = useUiContext()
    const { toasts } = useToastsContext()
    const { modals } = useModalsContext()
    const { abortRequest } = useHttpQueue()
    const { targetCommands } = useTargetCommands()
    const { featuresSettings } = useSettingsContext()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [showSave, setShowSave] = useState<boolean>(true)
    const progressBar: ProgressBarRef = {}
    const [features, setFeatures] = useState<FeaturesStructure>(featuresSettings.current)
    const inputFile = useRef<HTMLInputElement>(null)
    const webSocketService = useWebSocketService();

    const getFeatures = () => {
        setIsLoading(true)
        const callbacks = {
            onSuccess: (result: string) => {
                try {
                    const jsonResult: ESP400Response = JSON.parse(result)
                    if (
                        !jsonResult ||
                        jsonResult.cmd != 400 ||
                        jsonResult.status == "error" ||
                        !jsonResult.data
                    ) {
                        toasts.addToast({
                            content: T("S194"),
                            type: "error",
                        })
                        return
                    }
                    const feat = formatStructure(jsonResult.data)
                    featuresSettings.current = { ...feat }
                    setFeatures(featuresSettings.current)
                } catch (e) {
                    console.log(e, T("S21"))
                    toasts.addToast({ content: T("S21"), type: "error" })
                } finally {
                    setIsLoading(false)
                }
            },
            onFail: (error: string) => {
                setIsLoading(false)
                console.log(error)
                toasts.addToast({ content: error, type: "error" })
            },
        }
        targetCommands("[ESP400]json=yes", undefined, { echo: false}, callbacks)
    }

    /**
     * *Aborts the save request and displays an error message.*
     */
    function abortSave() {
        abortRequest("ESP401")
        toasts.addToast({ content: T("S175"), type: "error" })
        endProgression(false)
    }

    /**
     * * Remove the progression modal from the DOM.
     * * Set the `isLoading` flag to `false`.
     * * If the `needrestart` flag is `true`, show a confirmation modal asking the user if they want to
     * restart the board
     * @param needrestart - If true, the board will ask for restart after the progression is finished.
     */
    function endProgression(needrestart: boolean) {
        modals.removeModal(modals.getModalIndex("progression"))
        setIsLoading(false)
        if (needrestart) {
            showConfirmationModal({
                modals,
                title: T("S58"),
                content: T("S174"),
                button1: { cb: reStartBoard, text: T("S27") },
                button2: { text: T("S28") },
            })
        }
    }

    /**
     * It sends a command to the ESP to save the current value of the entry to the ESP's memory
     * @param entry - the entry to save
     * @param index - the index of the current entry in the list of entries
     * @param total - the total number of entries to save
     * @param needrestart - If true, the ESP will be restarted after the save.
     */
    function saveEntry(entry: SettingFieldProps, index: number, total: number, needrestart: boolean) {
        const callbacks = {
            onSuccess: (result: string) => {
                try {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(index + 1)
                    const jsonResult: ESP401Response = JSON.parse(result)
                    if (
                        !jsonResult ||
                        jsonResult.cmd != 401 ||
                        jsonResult.status == "error" ||
                        !jsonResult.data
                    ) {
                        if (jsonResult.cmd != 401)
                            toasts.addToast({
                                content: T("S194"),
                                type: "error",
                            })
                        else if (jsonResult.status == "error") {
                            let content = T("S195")
                            if (typeof jsonResult.data === "string") {
                                content += `: ${  T(jsonResult.data)}`
                            }
                            toasts.addToast({
                                content: content,
                                type: "error",
                            })
                        }
                        return
                    }
                    entry.initial = entry.value
                } catch (e) {
                    console.log(e)
                    toasts.addToast({ content: String(e), type: "error" })
                } finally {
                    if (index == total - 1) {
                        endProgression(needrestart)
                    }
                }
            },
            onFail: (error: string) => {
                if (
                    progressBar.update &&
                    typeof progressBar.update === "function"
                )
                    progressBar.update(index + 1)
                console.log(error)
                toasts.addToast({ content: error, type: "error" })
                if (index == total - 1) {
                    endProgression(needrestart)
                }
            },
        }
        let cmd =
            `[ESP401]P=${ 
            entry.id 
            } T=${ 
            entry.cast 
            } V=${ 
            entry.value.toString().replaceAll(" ", "\\ ") 
            } json=yes`
       targetCommands(cmd, undefined, {id: "ESP401" }, callbacks)
    }

    /**
     * Save the settings to the board
     */
    function SaveSettings() {
        let needrestart = false
        let index = 0
        let total = 0
        setIsLoading(true)

        Object.keys(features).map((sectionId) => {
            const section = features[sectionId]
            Object.keys(section).map((subsectionId) => {
                const subsection = section[subsectionId]
                subsection.forEach((entry) => {
                    if (entry.initial != entry.value) {
                        total++
                        if (entry.needRestart == "1") {
                            needrestart = true
                        }
                    }
                })
            })
        })
        showProgressModal({
            modals,
            title: T("S91"),
            button1: { cb: abortSave, text: T("S28") },
            content: <Progress progressBar={progressBar} max={total} />,
        })
        Object.keys(features).map((sectionId) => {
            const section = features[sectionId]
            Object.keys(section).map((subsectionId) => {
                const subsection = section[subsectionId]
                subsection.forEach((entry) => {
                    if (entry.initial != entry.value) {
                        saveEntry(entry, index, total, needrestart)
                        index++
                    }
                })
            })
        })
    }

    /**
     * Check if the user has made changes
     * @returns a boolean value.
     */
    function checkSaveStatus(): boolean {
        let stringified = JSON.stringify(features)
        let hasmodified =
            stringified.indexOf('"hasmodified":true') == -1 ? false : true
        let haserrors =
            stringified.indexOf('"haserror":true') == -1 ? false : true
        if (haserrors || !hasmodified) return false
        return true
    }

    /**
     * * Create a new request to the ESP HTTP server.
     * * Set the method to GET.
     * * Set the onSuccess callback to reload page
     * * Set the onFail callback to the error toaster
     * * Send the request
     */
    function reStartBoard() {
        const callbacks = {
            onSuccess: (result: string) => {
                webSocketService.disconnect("restart")
                setTimeout(() => {
                    window.location.reload()
                }, restartdelay * 1000)
            },
            onFail: (error: string) => {
                console.log(error)
                toasts.addToast({ content: error, type: "error" })
            },
        }
        targetCommands("[ESP444]RESTART", undefined, undefined, callbacks)
        console.log("restart")
    }

    const fileSelected = () => {
        if (inputFile.current && inputFile.current.files && inputFile.current.files.length > 0) {
            setIsLoading(true)
            const reader = new FileReader()
            reader.onload = function (e) {
                try {
                    const result = e.target?.result
                    if (typeof result !== 'string') {
                        throw new Error("File result is not a string")
                    }
                    const importData = JSON.parse(result)
                    const importResult: ImportResult = importFeatures(
                        featuresSettings.current,
                        importData
                    )
                    featuresSettings.current = importResult.features
                    if (importResult.hasErrors) {
                        toasts.addToast({ content: "S56", type: "error" })
                    }
                    setFeatures(featuresSettings.current)
                } catch (e) {
                    console.log(e)
                    console.log("Error")
                    toasts.addToast({ content: "S56", type: "error" })
                } finally {
                    setIsLoading(false)
                }
            }
            reader.readAsText(inputFile.current.files[0])
        }
    }

    /**
     * Generate validation for a field
     * @param fieldData - The data for the field.
     * @returns The validation object
     */
    const generateValidation = (fieldData: ValidationFieldData): ValidationResult | null => {
        let validation: ValidationResult = {
            message: <Flag style={{ width: "1rem", height: "1rem" }} />,
            valid: true,
            modified: true,
        }

        if (fieldData.type === "text") {
            if (fieldData.cast === "A") {
                // IP address validation
                if (
                    !/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
                        fieldData.value
                    )
                ) {
                    validation.valid = false
                }
            } else {
                // Text length validation
                const minLength = fieldData.min ?? 0
                const textLength = fieldData.value.trim().length

                if (textLength < minLength) {
                    validation.valid = false
                } else if (
                    fieldData.minSecondary !== undefined &&
                    textLength < fieldData.minSecondary &&
                    textLength > minLength
                ) {
                    validation.valid = false
                }

                if (fieldData.max !== undefined && textLength > fieldData.max) {
                    validation.valid = false
                }
            }
        } else if (fieldData.type === "number") {
            // Precision validation
            if (fieldData.prec !== undefined) {
                const valueNum = parseFloat(fieldData.value)
                const precisionNum = parseInt(fieldData.prec)
                if (
                    valueNum !==
                    parseFloat(valueNum.toFixed(precisionNum))
                ) {
                    validation.valid = false
                }
            }

            // Empty check
            if (fieldData.value.trim().length === 0) {
                validation.valid = false
            }

            // Range validation
            const min = fieldData.min ?? -2000000000
            const max = fieldData.max ?? 2000000000

            if (max < min) {
                // Invalid range, disable validation by setting large range
                fieldData.min = -2000000000
                fieldData.max = 2000000000
            } else {
                const numValue = parseFloat(fieldData.value)
                if (numValue > max) {
                    validation.valid = false
                }
                if (numValue < min) {
                    validation.valid = false
                }
            }
        } else if (fieldData.type === "select") {
            if (fieldData.options) {
                const foundIndex = fieldData.options.findIndex(
                    (element) => element.value === fieldData.value
                )
                if (foundIndex === -1) {
                    validation.valid = false
                }
            } else {
                validation.valid = false
            }
        }

        if (!validation.valid) {
            validation.message = T("S42")
        }

        // Track validation state
        fieldData.haserror = !validation.valid

        // Check if value was modified
        if (fieldData.value === fieldData.initial) {
            fieldData.hasmodified = false
        } else {
            if (
                fieldData.type === "number" &&
                parseFloat(fieldData.value) === parseFloat(fieldData.initial)
            ) {
                fieldData.hasmodified = false
            } else {
                fieldData.hasmodified = true
            }
        }

        setShowSave(checkSaveStatus())
        if (!fieldData.hasmodified && !fieldData.haserror) return null
        return validation
    }

    useEffect(() => {
        if (
            featuresSettings.current &&
            Object.keys(featuresSettings.current).length != 0
        ) {
            setFeatures(featuresSettings.current)
            setIsLoading(false)
        } else {
            if (uisettings.getValue("autoload")) {
                getFeatures()
            } else setIsLoading(false)
        }
    }, [])
    console.log("feature")
    //console.log(featuresSettings.current)
    return (
        <div>
            <div id="features" style="max-height: calc(100dvh - 170px); overflow-y: scroll;">
                <input
                    ref={inputFile}
                    type="file"
                    class="d-none"
                    accept=".json"
                    onChange={fileSelected}
                />
                <h4 class="show-low title">{T("S36")}</h4>
                <div class="m-2" />
                {isLoading && <Loading large />}

                {!isLoading && (
                    <Fragment>
                        <div class="panels-container">
                            {Object.keys(features).length != 0 && (
                                <Fragment>
                                    {Object.keys(features).map((sectionId) => {
                                        const section = features[sectionId]
                                        return (
                                            <Fragment>
                                                {Object.keys(section).map(
                                                    (subsectionId) => {
                                                        const subSection =
                                                            section[subsectionId]
                                                        return (
                                                            <div class="panel panel-features">
                                                                <div class="navbar">
                                                                    <span class="navbar-section text-ellipsis">
                                                                        <strong class="text-ellipsis">
                                                                            {T(
                                                                                subsectionId
                                                                            )}
                                                                        </strong>
                                                                    </span>
                                                                    <span class="navbar-section">
                                                                        <span style="height: 100%;">
                                                                            <span class="label label-primary align-top">
                                                                                {T(
                                                                                    sectionId
                                                                                )}
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                </div>

                                                                <div class="panel-body panel-body-features">
                                                                    {subSection.map(
                                                                        (
                                                                            fieldData
                                                                        ) => {
                                                                            const [
                                                                                validation,
                                                                                setvalidation,
                                                                            ] =
                                                                                useState<ValidationResult | null>()
                                                                            const {
                                                                                label,
                                                                                options,
                                                                                initial,
                                                                                prec,
                                                                                ...rest
                                                                            } =
                                                                                fieldData
                                                                            const Options =
                                                                                options
                                                                                    ? options.reduce(
                                                                                        (
                                                                                            acc,
                                                                                            curval
                                                                                        ) => {
                                                                                            return [
                                                                                                ...acc,
                                                                                                {
                                                                                                    label: T(
                                                                                                        curval.label
                                                                                                    ),
                                                                                                    value: curval.value,
                                                                                                },
                                                                                            ]
                                                                                        },
                                                                                        [] as { label: string; value: string }[]
                                                                                    )
                                                                                    : null

                                                                            return (
                                                                                <Field
                                                                                    label={T(
                                                                                        label
                                                                                    )}
                                                                                    options={
                                                                                        Options
                                                                                    }
                                                                                    extra={
                                                                                        useTargetContextFn.isStaId(
                                                                                            subsectionId,
                                                                                            label,
                                                                                            fieldData
                                                                                        )
                                                                                            ? "scan"
                                                                                            : null
                                                                                    }
                                                                                    initial={
                                                                                        initial
                                                                                    }
                                                                                    prec={
                                                                                        prec
                                                                                    }
                                                                                    {...rest}
                                                                                    setValue={(
                                                                                        val: string,
                                                                                        update?: boolean
                                                                                    ) => {
                                                                                        if (
                                                                                            !update
                                                                                        )
                                                                                            fieldData.value =
                                                                                                val
                                                                                        setvalidation(
                                                                                            generateValidation(
                                                                                                fieldData
                                                                                            )
                                                                                        )
                                                                                    }}
                                                                                    validation={
                                                                                        validation
                                                                                    }
                                                                                />
                                                                            )
                                                                        }
                                                                    )}
                                                                    <div class="m-1" />
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                )}
                                            </Fragment>
                                        )
                                    })}
                                </Fragment>
                            )}
                        </div>
                    </Fragment>
                )}


            </div>
            <div>
                <div style="margin-top: 10px; text-align: center">

                    {!isLoading && (
                        <ButtonImg
                            m2
                            label={T("S50")}
                            tooltip
                            data-tooltip={T("S23")}
                            icon={<RefreshCcw />}
                            onClick={() => {
                                useUiContextFn.haptic()
                                getFeatures()
                            }}
                        />
                    )}
                    {Object.keys(features).length != 0 && (
                        <Fragment>
                            <ButtonImg
                                m2
                                label={T("S54")}
                                tooltip
                                data-tooltip={T("S55")}
                                icon={<Download />}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    if (inputFile.current) {
                                        inputFile.current.value = ""
                                        inputFile.current.click()
                                    }
                                }}
                            />
                            <ButtonImg
                                m2
                                label={T("S52")}
                                tooltip
                                data-tooltip={T("S53")}
                                icon={<ExternalLink />}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    exportFeatures(featuresSettings.current)
                                }}
                            />
                            {showSave && (
                                <ButtonImg
                                    m2
                                    tooltip
                                    data-tooltip={T("S62")}
                                    label={T("S61")}
                                    icon={<Save />}
                                    onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                        useUiContextFn.haptic()
                                        e.currentTarget.blur()
                                        SaveSettings()
                                    }}
                                />
                            )}

                            <ButtonImg
                                m2
                                tooltip
                                data-tooltip={T("S59")}
                                label={T("S58")}
                                icon={<RotateCcw />}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    showConfirmationModal({
                                        modals,
                                        title: T("S58"),
                                        content: T("S59"),
                                        button1: {
                                            cb: reStartBoard,
                                            text: T("S27"),
                                        },
                                        button2: { text: T("S28") },
                                    })
                                }}
                            />
                        </Fragment>
                    )}
                </div>
            </div>
        </div>
    )
}

export { FeaturesTab }
