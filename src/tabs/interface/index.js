/*
 index.js - ESP3D WebUI navigation tab file

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
import { useState, useRef } from "preact/hooks"
import {
    useUiContext,
    useSettingsContext,
    useSettingsContextFn,
    useUiContextFn,
} from "../../contexts"
import { ButtonImg, Loading } from "../../components/Controls"
import { useHttpQueue, useSettings } from "../../hooks"
import {
    espHttpURL,
    checkDependencies,
} from "../../components/Helpers"
import { T } from "../../components/Translations"
import { RefreshCcw, Save, ExternalLink, Flag, Download } from "preact-feather"
import { Field, FieldGroup } from "../../components/Controls"
import { exportPreferences, exportPreferencesSection } from "./exportHelper"
import { importPreferencesSection, formatPreferences } from "./importHelper"

const isDependenciesMet = (depend) => {
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    return checkDependencies(depend, interfaceSettings.current.settings, connectionSettings.current)
}

const generateValidationGlobal = (
    fieldData,
    isFlashFS,
    isSDFS,
    connectionSettings,
    interfaceSettings,
    setShowSave,
    checkSaveStatus
) => {
    const validation = {
        message: <Flag size="1rem" />,
        valid: true,
        modified: true,
    }

    if (fieldData.shortkey && interfaceSettings) {
        if (fieldData.value.length > 0) {
            if (fieldData.value.endsWith("+")) {
                validation.message = T("S214")
                validation.valid = false
                console.log("Error")
            }
            //look if used
            const keysRefs = [
                {
                    ref: interfaceSettings.current.settings.jog,
                    entry: "keymap",
                },
                {
                    ref: interfaceSettings.current.settings.macros,
                    entry: "macros",
                },
            ]
            keysRefs.forEach((list) => {
                let keysmap = list.ref.find((element) => {
                    if (element.id == list.entry) return true
                })
                if (keysmap) {
                    let counter = 0
                    keysmap.value.forEach((element) => {
                        element.value.forEach((sub) => {
                            if (
                                sub.name == "key" &&
                                sub.value == fieldData.value &&
                                sub.id != fieldData.id
                            ) {
                                counter++
                            }
                        })
                    })
                    if (counter != 0) {
                        validation.message = T("S213")
                        validation.valid = false
                        console.log("Error")
                    }
                }
            })
        }
    } else {
        if (typeof fieldData.step !== "undefined") {
            //hack to avoid float precision issue
            const mult =
                (1 / fieldData.step).toFixed(0) > 0
                    ? (1 / fieldData.step).toFixed(0)
                    : 1
            const valueMult = Math.round(fieldData.value * mult)
            const stepMult = Math.round(fieldData.step * mult)

            if (valueMult % stepMult != 0) {
                validation.message = <Flag size="1rem" color="red" />
                validation.valid = false
                console.log("Error")
            }
        }
        if (fieldData.type == "list") {
            const stringified = JSON.stringify(fieldData.value)
            //check new item or modified item
            if (
                stringified.includes('"newItem":true') ||
                fieldData.nb != fieldData.value.length
            )
                fieldData.hasmodified = true
            else
                fieldData.hasmodified =
                    stringified.includes('"hasmodified":true')
            //check order change
            fieldData.value.forEach((element, index) => {
                if (element.index != index) fieldData.hasmodified = true
            })
            validation.valid = !stringified.includes('"haserror":true')
        }
        if (fieldData.type == "text") {
            if (fieldData.regexpattern) {
                const regex = new RegExp(fieldData.regexpattern)
                if (!regex.test(fieldData.value)) {
                    validation.valid = false
                    console.log("Error")
                }
            }
            if (typeof fieldData.min != undefined) {
                if (fieldData.value.trim().length < fieldData.min) {
                    validation.valid = false
                    console.log("Error")
                } else if (typeof fieldData.minSecondary != undefined) {
                    if (
                        fieldData.value.trim().length <
                            fieldData.minSecondary &&
                        fieldData.value.trim().length > fieldData.min
                    ) {
                        validation.valid = false
                        console.log("Error")
                    }
                }
            }

            if (fieldData.max) {
                if (fieldData.value.trim().length > fieldData.max) {
                    validation.valid = false
                    console.log("Error")
                }
            }
        } else if (fieldData.type == "number") {
            if (fieldData.max != undefined) {
                if (fieldData.value > parseInt(fieldData.max)) {
                    validation.valid = false
                    console.log("Error")
                }
            }
            if (fieldData.min != undefined) {
                if (fieldData.minSecondary != undefined) {
                    if (
                        fieldData.value != parseInt(fieldData.min) &&
                        fieldData.value < parseInt(fieldData.minsecondary)
                    ) {
                        validation.valid = false
                        console.log("Error")
                    }
                } else if (fieldData.value < parseInt(fieldData.min)) {
                    validation.valid = false
                    console.log("Error")
                }
            }
        } else if (fieldData.type == "select") {
            const opt = fieldData.options.find(
                (element) => element.value == fieldData.value
            )
            if (opt && opt.depend) {
                if (interfaceSettings && connectionSettings) {
                    const canshow = checkDependencies(
                        opt.depend,
                        interfaceSettings.current.settings,
                        connectionSettings.current
                    )
                    if (!canshow) {
                        validation.valid = false
                        console.log("Error")
                    }
                }
            }
            if (
                fieldData.name == "type" &&
                fieldData.value == "camera" &&
                interfaceSettings
            ) {
                //Update camera source automaticaly
                //Note: is there a less complexe way to do ?
                const sourceId = fieldData.id.split("-")[0]
                const extraList =
                    interfaceSettings.current.settings.extracontents
                //look for extra panels entry
                const subextraList =
                    extraList[
                        extraList.findIndex((element) => {
                            return element.id == "extracontents"
                        })
                    ].value
                //look for extra panel specific id
                const datavalue =
                    subextraList[
                        subextraList.findIndex((element) => {
                            return element.id == sourceId
                        })
                    ].value
                //get source item
                const sourceItemValue =
                    datavalue[
                        datavalue.findIndex((element) => {
                            return element.id == sourceId + "-source"
                        })
                    ]
                //force /snap as source
                sourceItemValue.value = "/snap"
            }
            const index = fieldData.options.findIndex((element) => {
               /* if (fieldData.id == "default_filesystem") {
                    console.log(
                        "checking :*" +
                            element.value +
                            "* vs*" +
                            fieldData.value +
                            "*"
                    )
                    console.log(
                        "checking :*" +
                            parseInt(element.value) +
                            "* vs*" +
                            parseInt(fieldData.value) +
                            "*"
                    )
                }*/
                return (
                    (parseInt(element.value) == parseInt(fieldData.value) &&
                        !isNaN(parseInt(element.value))) ||
                    element.value == fieldData.value
                )
            })
            if (index == -1) {
                validation.valid = false
                console.log("Error")
            }
        }
    }
    if (!validation.valid) {
        if (!fieldData.shortkey) validation.message = T("S42")
    }
    fieldData.haserror = !validation.valid
    if (fieldData.type != "list") {
        if (fieldData.value == fieldData.initial) {
            fieldData.hasmodified = false
        } else {
            fieldData.hasmodified = true
        }
        if (fieldData.newItem) fieldData.hasmodified = true
    }
    if (
        (typeof isFlashFS != "undefined" || typeof isSDFS != "undefined") &&
        typeof setShowSave != "undefined" &&
        typeof checkSaveStatus != "undefined"
    ) {
        if (isFlashFS || isSDFS) {
            setShowSave(checkSaveStatus())
        } else {
            setShowSave(false)
        }
    }
    if (!fieldData.hasmodified && !fieldData.haserror) {
        validation.message = null
        validation.valid = true
        validation.modified = false
    }
    if (!validation.valid) {
        console.log(fieldData)
    }
    return validation
}

const InterfaceTab = () => {
    const { toasts, modals, connection } = useUiContext()
    const { createNewRequest, abortRequest } = useHttpQueue()
    const { getInterfaceSettings } = useSettings()
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const [isLoading, setIsLoading] = useState(false)
    const [showSave, setShowSave] = useState(true)
    const inputFile = useRef(null)
    console.log("Interface")
    const isFlashFS =
        useSettingsContextFn.getValue("FlashFileSystem") == "none"
            ? false
            : true
    const isSDFS =
        useSettingsContextFn.getValue("SDConnection") == "none" ? false : true

    const generateValidation = (fieldData) => {
        return generateValidationGlobal(
            fieldData,
            isFlashFS,
            isSDFS,
            connectionSettings,
            interfaceSettings,
            setShowSave,
            checkSaveStatus
        )
    }

    function checkSaveStatus() {
        const stringified = JSON.stringify(interfaceSettings.current.settings)
        const hasmodified = stringified.includes('"hasmodified":true')
        const haserrors = stringified.includes('"haserror":true')
        return !haserrors && hasmodified
    }

    const getInterface = () => {
        useUiContextFn.haptic()
        setIsLoading(true)
        getInterfaceSettings(setIsLoading)
    }

    const fileSelected = () => {
        if (inputFile.current.files.length > 0) {
            setIsLoading(true)
            const reader = new FileReader()
            reader.onload = function (e) {
                const importFile = e.target.result
                try {
                    const importData = JSON.parse(importFile)

                    const [preferences_settings, haserrors] =
                        importPreferencesSection(
                            interfaceSettings.current.settings,
                            importData.settings
                        )
                    interfaceSettings.current.settings = preferences_settings
                    if (importData.custom) {
                        interfaceSettings.current.custom = importData.custom
                    }
                    if (importData.extensions) {
                        interfaceSettings.current.extensions =
                            importData.extensions
                    }
                    formatPreferences(interfaceSettings.current.settings)
                    //console.log("Imported")
                    //console.log(interfaceSettings.current)
                    if (haserrors) {
                        toasts.addToast({ content: "S56", type: "error" })
                        console.log("Error")
                    }
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

    const SaveSettings = () => {
        const settings_to_save = exportPreferences(
            interfaceSettings.current,
            false
        )
        const preferencestosave = JSON.stringify(settings_to_save, null, " ")
        const blob = new Blob([preferencestosave], {
            type: "application/json",
        })

        const preferencesFileName =
            useSettingsContextFn.getValue("HostUploadPath") + "preferences.json"
        const formData = new FormData()
        const file = new File([blob], preferencesFileName)
        formData.append("path", useSettingsContextFn.getValue("HostUploadPath"))
        formData.append("creatPath", "true")
        formData.append(preferencesFileName + "S", preferencestosave.length)
        formData.append("myfiles", file, preferencesFileName)
        setIsLoading(true)
        createNewRequest(
            espHttpURL(useSettingsContextFn.getValue("HostTarget")),
            { method: "POST", id: "preferences", body: formData },
            {
                onSuccess: (result) => {
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000)
                },
                onFail: (error) => {
                    setIsLoading(false)
                },
            }
        )
    }
    //console.log(JSON.stringify(interfaceSettings.current, null, 2))
    return (
        <div id="interface">
            <input
                ref={inputFile}
                type="file"
                class="d-none"
                accept=".json"
                onChange={fileSelected}
            />
            <h4 class="show-low title">{T("S17")}</h4>
            <div class="m-2" />
            {isLoading && <Loading large />}

            {!isLoading && (
                <Fragment>
                    {interfaceSettings.current.settings && (
                        <div class="panels-container">
                            {Object.keys(
                                interfaceSettings.current.settings
                            ).map((sectionId) => {
                                const section =
                                    interfaceSettings.current.settings[
                                        sectionId
                                    ]
                                return (
                                    <Fragment>
                                        <div class="panel panel-interface">
                                            <div class="navbar">
                                                <span class="navbar-section text-ellipsis">
                                                    <strong class="text-ellipsis">
                                                        {T(sectionId)}
                                                    </strong>
                                                </span>
                                            </div>
                                            <div class="panel-body panel-body-interface">
                                                {Object.keys(section).map(
                                                    (subsectionId) => {
                                                        const fieldData =
                                                            section[
                                                                subsectionId
                                                            ]
                                                        if (
                                                            fieldData.type ==
                                                            "group"
                                                        ) {
                                                            //show group
                                                            if (
                                                                fieldData.depend
                                                            ) {
                                                                if (
                                                                    !isDependenciesMet(
                                                                        fieldData.depend
                                                                    )
                                                                ) {
                                                                    return
                                                                }
                                                            }
                                                            return (
                                                                <FieldGroup
                                                                    id={
                                                                        fieldData.id
                                                                    }
                                                                    label={T(
                                                                        fieldData.label
                                                                    )}
                                                                    depend={
                                                                        fieldData.depend
                                                                    }
                                                                >
                                                                    {Object.keys(
                                                                        fieldData.value
                                                                    ).map(
                                                                        (
                                                                            subData
                                                                        ) => {
                                                                            const subFieldData =
                                                                                fieldData
                                                                                    .value[
                                                                                    subData
                                                                                ]
                                                                            const [
                                                                                validation,
                                                                                setvalidation,
                                                                            ] =
                                                                                useState()
                                                                            const {
                                                                                label,
                                                                                initial,
                                                                                type,
                                                                                ...rest
                                                                            } =
                                                                                subFieldData
                                                                            return (
                                                                                <Field
                                                                                    label={T(
                                                                                        label
                                                                                    )}
                                                                                    type={
                                                                                        type
                                                                                    }
                                                                                    validationfn={
                                                                                        generateValidation
                                                                                    }
                                                                                    inline={
                                                                                        type ==
                                                                                            "boolean" ||
                                                                                        type ==
                                                                                            "icon"
                                                                                            ? true
                                                                                            : false
                                                                                    }
                                                                                    {...rest}
                                                                                    setValue={(
                                                                                        val,
                                                                                        update = false
                                                                                    ) => {
                                                                                        if (
                                                                                            !update
                                                                                        ) {
                                                                                            subFieldData.value =
                                                                                                val
                                                                                        }
                                                                                        setvalidation(
                                                                                            generateValidation(
                                                                                                subFieldData
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
                                                                </FieldGroup>
                                                            )
                                                        } else if (
                                                            !fieldData.hide
                                                        ) {
                                                            const [
                                                                validation,
                                                                setvalidation,
                                                            ] = useState()
                                                            const {
                                                                label,
                                                                initial,
                                                                type,
                                                                ...rest
                                                            } = fieldData
                                                            return (
                                                                <Field
                                                                    label={T(
                                                                        label
                                                                    )}
                                                                    type={type}
                                                                    validationfn={
                                                                        type ==
                                                                        "list"
                                                                            ? generateValidation
                                                                            : null
                                                                    }
                                                                    inline={
                                                                        type ==
                                                                            "boolean" ||
                                                                        type ==
                                                                            "icon"
                                                                            ? true
                                                                            : false
                                                                    }
                                                                    {...rest}
                                                                    setValue={(
                                                                        val,
                                                                        update = false
                                                                    ) => {
                                                                        if (
                                                                            !update
                                                                        ) {
                                                                            fieldData.value =
                                                                                val
                                                                        }
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
                                                    }
                                                )}
                                                <div class="m-1" />
                                            </div>
                                        </div>
                                    </Fragment>
                                )
                            })}
                        </div>
                    )}
                    <center>
                        <br />
                        <ButtonImg
                            m2
                            label={T("S50")}
                            tooltip
                            data-tooltip={T("S23")}
                            icon={<RefreshCcw />}
                            onClick={getInterface}
                        />
                        <ButtonImg
                            m2
                            label={T("S54")}
                            tooltip
                            data-tooltip={T("S55")}
                            icon={<Download />}
                            onClick={(e) => {
                                useUiContextFn.haptic()
                                e.target.blur()
                                inputFile.current.value = ""
                                inputFile.current.click()
                            }}
                        />
                        <ButtonImg
                            m2
                            label={T("S52")}
                            tooltip
                            data-tooltip={T("S53")}
                            icon={<ExternalLink />}
                            onClick={(e) => {
                                useUiContextFn.haptic()
                                e.target.blur()
                                //console.log(interfaceSettings.current)
                                exportPreferences(interfaceSettings.current)
                            }}
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
                                    SaveSettings()
                                }}
                            />
                        )}
                    </center>
                </Fragment>
            )}
        </div>
    )
}

export {
    InterfaceTab,
    generateValidationGlobal,
    exportPreferences,
    exportPreferencesSection,
    importPreferencesSection,
    formatPreferences,
}
