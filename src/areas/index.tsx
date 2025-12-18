/*
 index.tsx - ESP3D WebUI areas file

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
import { Fragment, FunctionalComponent, render, TargetedEvent } from "preact"
import { Menu } from "./menu"
import { iconsFeather } from "../components/Images"
import { machineSettings, iconsTarget } from "../targets"
import { ConnectionContainer } from "./connection"
import { MainContainer } from "./main"
import { useUiContext, useUiContextFn } from "../contexts/UiContext"
import { useModalsContext } from "../contexts/ModalsContext"
import { useToastsContext } from "../contexts/ToastsContext"
import {
    generateValidationGlobal as generateValidation,
    exportPreferences,
    exportPreferencesSection,
    importPreferencesSection,
} from "../tabs/interface"
import {
    useSettingsContext,
    useSettingsContextFn,
} from "../contexts/SettingsContext"
import { useSettings, useHttpQueue, useTargetCommands } from "../hooks"
import { useEffect } from "preact/hooks"
import { Field, FieldGroup } from "../components/Controls"
import { showKeepConnected, showModal } from "../components/Modal"
import { espHttpURL, dispatchToExtensions } from "../components/Helpers"
import { T, baseLangRessource } from "../components/Translations"
import { HelpCircle, Layout } from "preact-feather"

/*
 * Local const
 *
 */

const ViewContainer: FunctionalComponent = () => {
    const { connection, dialogs } = useUiContext()
    if (dialogs.showKeepConnected == true) {
        dialogs.setShowKeepConnected(false)
        showKeepConnected()
    }
    if (
        connection.connectionState.connected &&
        !connection.connectionState.updating
    )
        return (
            <Fragment>
                <Menu />
                <MainContainer />
            </Fragment>
        )
    else {
        return <ConnectionContainer />
    }
}

const ContentContainer: FunctionalComponent = () => {
    const { getConnectionSettings, getInterfaceSettings } = useSettings()
    const { connectionSettings, interfaceSettings, featuresSettings } =
        useSettingsContext()
    const { createNewRequest } = useHttpQueue()
    const { targetCommands } = useTargetCommands()
    const { toasts } = useToastsContext()
    const { modals } = useModalsContext()

    const processExtensionMessage = (eventMsg: any) => {
        if (eventMsg.data.type && eventMsg.data.target == "webui") {
            switch (eventMsg.data.type) {
                case "response":
                    //TBD: if need real both way communication
                    //between iFrame and Main UI
                    break
                case "cmd": {
                    const cmdCallbacks = {
                        onSuccess: (result: string) => {
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "cmd",
                                    {
                                        status: "success",
                                        response: result,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                        onFail: (error: string) => {
                            console.log(error)
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "cmd",
                                    {
                                        status: "error",
                                        error: error,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                    }
                    targetCommands(eventMsg.data.content, undefined, undefined, cmdCallbacks)
                    break
                }
                case "query": {
                    let cmd: string | undefined = undefined
                    const queryCallbacks = {
                        onSuccess: (result: string) => {
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "query",
                                    {
                                        status: "success",
                                        response: result,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                        onFail: (error: string) => {
                            console.log(error)
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "query",
                                    {
                                        status: "error",
                                        error: error,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                         },
                    }

                    if (eventMsg.data.url=="command" && !eventMsg.data.arg) {
                        console.log("Command")
                        console.log(eventMsg.data)
                        targetCommands(eventMsg.data.args.cmd, undefined, undefined, queryCallbacks)
                    } else {
                        // This does not fit into the targetCommands paradigm because
                        // either eventMsg.data.url is not "command" or eventMsg.data.args
                        // is not empty
                        createNewRequest(
                            espHttpURL(eventMsg.data.url, eventMsg.data.args),
                            { method: "GET" },
                            queryCallbacks
                        )
                    }
                    createNewRequest(
                        espHttpURL(eventMsg.data.url, eventMsg.data.args),
                        { method: "GET", echo: cmd },
                        {
                            onSuccess: (result: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "query",
                                        {
                                            status: "success",
                                            response: result,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onFail: (error: string) => {
                                console.log(error)
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "query",
                                        {
                                            status: "error",
                                            error: error,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                        }
                    )
                    break
                }
                case "upload": {
                    const formData = new FormData()
                    const file = new File(
                        [eventMsg.data.content],
                        eventMsg.data.filename
                    )
                    const initiator = {
                        type: "upload",
                        id: eventMsg.data.id,
                        url: eventMsg.data.url,
                        target: eventMsg.data.target,
                        path: eventMsg.data.path,
                        filename: eventMsg.data.filename,
                        size: eventMsg.data.size,
                        args: eventMsg.data.args,
                        noDispatch: eventMsg.data.noDispatch,
                    }
                    //TODO add support for additional POST arguments if needed
                    formData.append("path", eventMsg.data.path)
                    formData.append(
                        `${eventMsg.data.filename  }S`,
                        eventMsg.data.size
                    )
                    formData.append("myfiles", file, eventMsg.data.filename)
                    createNewRequest(
                        espHttpURL(eventMsg.data.url, eventMsg.data.args),
                        {
                            method: "POST",
                            id: eventMsg.data.id,
                            body: formData,
                        },
                        {
                            onSuccess: (result: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "upload",
                                        {
                                            status: "success",
                                            response: result,
                                            initiator: initiator,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onFail: (error: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "upload",
                                        {
                                            status: "error",
                                            error,
                                            finitiator: initiator,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onProgress: (e: any) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "upload",
                                        {
                                            status: "progress",
                                            progress: e,
                                            initiator: initiator,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                        }
                    )
                    break
                }
                case "download":
                    createNewRequest(
                        espHttpURL(eventMsg.data.url, eventMsg.data.args),
                        { method: "GET", id: "download" },
                        {
                            onSuccess: (result: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "download",
                                        {
                                            status: "success",
                                            response: result,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onFail: (error: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "download",
                                        {
                                            status: "error",
                                            error: error,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onProgress: (e: any) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "download",
                                        {
                                            status: "progress",
                                            progress: e,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                        }
                    )
                    break
                case "toast":
                    toasts.addToast({
                        content: eventMsg.data.content.text,
                        type: eventMsg.data.content.type,
                    })
                    break
                case "modal": {
                    let inputData: any = null
                    const validationBtn: any = {}
                    const content = eventMsg.data.content
                    const hasError = () => {
                        if (content.style == "fields") {
                            const stmp = JSON.stringify(content.fields)
                            if (
                                stmp.includes('haserror":true') ||
                                stmp.includes("haserror':true")
                            ) {
                                return true
                            }
                        }
                        return false
                    }

                    const exportResult = () => {
                        const settingsValues: any = {}
                        if (content.style == "fields") {
                            settingsValues.values = inputData
                            settingsValues.export = exportPreferencesSection(
                                settingsValues,
                                false
                            )
                        } else {
                            settingsValues.export = inputData
                        }

                        return settingsValues.export
                    }
                    const cb1 = () => {
                        if (
                            (content.style == "fields" ||
                                content.style == "input") &&
                            content.validation == "bt1"
                        ) {
                            if (hasError()) {
                                return
                            }
                            modals.removeModal(modals.getModalIndex(content.id))
                        }

                        setTimeout(() => {
                            dispatchToExtensions(
                                "modal",
                                {
                                    response: content.response1,
                                    inputData:
                                        content.validation == "bt1"
                                            ? exportResult()
                                            : "",
                                    initiator: eventMsg.data,
                                },
                                eventMsg.data.id
                            )
                        }, 500)
                    }
                    const cb2 = () => {
                        if (
                            (content.style == "fields" ||
                                content.style == "input") &&
                            content.validation == "bt2"
                        ) {
                            if (hasError()) {
                                return
                            }
                            modals.removeModal(modals.getModalIndex(content.id))
                        }

                        setTimeout(() => {
                            dispatchToExtensions(
                                "modal",
                                {
                                    response: content.response2,
                                    inputData:
                                        content.validation == "bt2"
                                            ? exportPreferences(
                                                  exportResult(),
                                                  false
                                              )
                                            : "",
                                    initiator: eventMsg.data,
                                },
                                eventMsg.data.id
                            )
                        }, 500)
                    }
                    if (content.style == "fields") {
                        if (content.validation == "bt1") {
                            validationBtn.id = content.bt1Id
                                ? content.bt1Id
                                : "bt1"
                        }
                        if (content.validation == "bt2") {
                            validationBtn.id = content.bt2Id
                                ? content.bt2Id
                                : "bt2"
                        }
                    }
                    if (content.style == "input") {
                        inputData = content.value
                    }
                    const modalContent: any = {}
                    if (content.style == "fields") {
                        //merge format and fields

                        const result = importPreferencesSection(
                            content.fields,
                            content.values
                        )
                        inputData = result.preferences

                        //This function is a replacement of the hook feature which is not available in this context
                        const checkValidation = (fieldData: any) => {
                            const id_group = `group-${  fieldData.id}`
                            if (typeof fieldData.initial == "undefined") {
                                fieldData.initial = fieldData.value
                            }
                            const validation = generateValidation(fieldData)
                            const element = document.getElementById(id_group)
                            if (!element) return
                            const divToRemove =
                                element.getElementsByClassName(
                                    "form-input-hint"
                                )
                            if (divToRemove.length > 0) {
                                element.removeChild(divToRemove[0])
                            }
                            if (validation.modified && validation.valid) {
                                element.classList.add("has-modification")
                                const newDiv = document.createElement("div")
                                render(validation.message, newDiv)
                                newDiv.classList.add(
                                    "form-input-hint",
                                    "text-center"
                                )
                                element.appendChild(newDiv)
                            } else {
                                const groupElement = document.getElementById(id_group)
                                if (groupElement) {
                                    groupElement.classList.remove("has-modification")
                                }
                            }
                            if (!validation.valid) {
                                const groupElement = document.getElementById(id_group)
                                if (groupElement) {
                                    groupElement.classList.add("has-error")
                                }
                                const newDiv = document.createElement("div")
                                newDiv.innerHTML = T(validation.message)
                                newDiv.classList.add(
                                    "form-input-hint",
                                    "text-center"
                                )

                                element.appendChild(newDiv)
                            } else {
                                const groupElement = document.getElementById(id_group)
                                if (groupElement) {
                                    groupElement.classList.remove("has-error")
                                }
                            }

                            const validationBtnElement = document.getElementById(validationBtn.id)
                            if (validationBtnElement) {
                                if (hasError()) {
                                    validationBtnElement.style.visibility = "hidden"
                                } else {
                                    validationBtnElement.style.visibility = "visible"
                                }
                            }
                        }
                        const renderFields = () => {
                            const section = inputData
                            return Object.keys(section).map((subsectionId) => {
                                const fieldData = section[subsectionId]
                                //console.log(fieldData)
                                if (fieldData.type == "group") {
                                    return (
                                        <FieldGroup
                                            key={subsectionId}
                                            id={fieldData.id}
                                            label={T(fieldData.label)}
                                        >
                                            {Object.keys(fieldData.value).map(
                                                (subData) => {
                                                    const subFieldData =
                                                        fieldData.value[subData]
                                                    const {
                                                        label,
                                                        initial,
                                                        type,
                                                        ...rest
                                                    } = subFieldData
                                                    return (
                                                        <Field key={subData}
                                                            label={T(
                                                                subFieldData.label
                                                            )}
                                                            value={
                                                                subFieldData.value
                                                            }
                                                            type={
                                                                subFieldData.type
                                                            }
                                                            setValue={(
                                                                val: any,
                                                                update = false
                                                            ) => {
                                                                if (!update) {
                                                                    subFieldData.value =
                                                                        val
                                                                }
                                                                checkValidation(
                                                                    subFieldData
                                                                )
                                                            }}
                                                            {...rest}
                                                        />
                                                    )
                                                }
                                            )}
                                        </FieldGroup>
                                    )
                                } else {
                                    const { label, initial, type, ...rest } =
                                        fieldData
                                    return (
                                        <Field
                                            key={subsectionId}
                                            label={T(label)}
                                            type={type}
                                            inline={
                                                type == "boolean" ||
                                                type == "icon"
                                                    ? true
                                                    : false
                                            }
                                            {...rest}
                                            setValue={(val: any, update = false) => {
                                                if (!update) {
                                                    fieldData.value = val
                                                }
                                                checkValidation(fieldData)
                                            }}
                                        />
                                    )
                                }
                            })
                        }

                        modalContent.content = renderFields()
                    } else {
                        modalContent.content = T(content.text)
                    }
                    let modal_content = modalContent.content
                    if (content.style != "fields") {
                        modal_content = (<div dangerouslySetInnerHTML={{ __html: modalContent.content }}></div>)
                    }
                    showModal({
                        modals,
                        title: T(content.title),
                        button2: content.bt2Txt
                             ? {
                                  cb: cb2,
                                  text: T(content.bt2Txt),
                                  id: "bt2",
                                  noclose:
                                      content.validation == "bt2"
                                          ? true
                                          : false,
                              }
                            : undefined,
                        button1: content.bt1Txt
                             ? {
                                  cb: cb1,
                                  text: T(content.bt1Txt),
                                  id: "bt1",
                                  noclose:
                                      content.validation == "bt1"
                                          ? true
                                          : false,
                              }
                            : undefined,
                        icon:
                        content.icon ? iconsFeather[content.icon as keyof typeof iconsFeather] : content.style == "question" ? (
                                <HelpCircle />
                            ) : (
                                <Layout />
                            ),
                        id: content.id,
                        content: (
                            <Fragment>
                                {modal_content}
                                {content.style == "input" && (
                                    <input
                                        class="form-input"
                                        onInput={(e: TargetedEvent<HTMLInputElement, Event>) => {
                                            inputData = e.currentTarget.value.trim()
                                        }}
                                        value={content.value}
                                    />
                                )}
                            </Fragment>
                        ),
                        hideclose: content.hideclose,
                        overlay: content.overlay,
                    })
                    break
                }
                case "sound":
                    if (eventMsg.data.content == "beep") useUiContextFn.beep()
                    if (eventMsg.data.content == "error")
                        useUiContextFn.beepError()
                    if (eventMsg.data.content == "seq")
                        useUiContextFn.beepSeq(eventMsg.data.seq)
                    break
                case "translate":
                    if (eventMsg.data.all) {
                        dispatchToExtensions(
                            "translate",
                            {
                                response: baseLangRessource,
                                initiator: eventMsg.data,
                            },
                            eventMsg.data.id
                        )
                    } else {
                        dispatchToExtensions(
                            "translate",
                            {
                                response: T(eventMsg.data.content),
                                initiator: eventMsg.data,
                            },
                            eventMsg.data.id
                        )
                    }
                    break
                case "icon": {
                    const iconToSend = iconsFeather[eventMsg.data.id as keyof typeof iconsFeather]
                    let iconSvgString = ""
                    if (iconToSend) {
                        //Temporary DOM
                        const tempElement = document.createElement("div")
                        //DO icon rendering
                        render(iconToSend, tempElement)
                        //Get the SVG string
                        iconSvgString = tempElement.firstChild ? (tempElement.firstChild as Element).outerHTML : ""
                        //Delete the temporary DOM
                        tempElement.remove()
                    } else {
                        iconSvgString = ""
                        console.error("Icon not found:", eventMsg.data.id)
                    }

                    dispatchToExtensions(
                        "icon",
                        {
                            response: iconSvgString.replaceAll("\"", "'"),
                            initiator: eventMsg.data,
                        },
                        eventMsg.data.id
                    )
                    break
                }
                case "extensionsData": {
                    //Get extension name
                    const section = eventMsg.data.id
                    //Get extensions settings
                    const data = eventMsg.data.content
                    //Some sanity check
                    if (!interfaceSettings.current.extensions) {
                        interfaceSettings.current.extensions = {}
                    }
                    if (!interfaceSettings.current.extensions[section]) {
                        interfaceSettings.current.extensions[section] = {}
                    }
                    //Update the settings
                    //Note: it will overwrite the whole section
                    interfaceSettings.current.extensions[section] = data

                    //now do a copy of interfaceSettings
                    const interfaceSettingsData = JSON.parse(
                        JSON.stringify(interfaceSettings.current)
                    )

                    //now update the settings section with export version

                    interfaceSettingsData.settings = exportPreferencesSection(interfaceSettingsData.settings, false, true)

                    //now stringify and save
                    const preferencestosave = JSON.stringify(
                        interfaceSettingsData,
                        null,
                        " "
                    )
                    //Create a blob
                    const blob = new Blob([preferencestosave], {
                        type: "application/json",
                    })
                    //Create a file
                    const preferencesFileName =
                        `${useSettingsContextFn.getValue("HostUploadPath") 
                        }preferences.json`
                    const formDataExtensions = new FormData()
                    const file_to_save = new File([blob], preferencesFileName)
                    formDataExtensions.append(
                        "path",
                        useSettingsContextFn.getValue("HostUploadPath")
                    )
                    formDataExtensions.append("creatPath", "true")
                    formDataExtensions.append(
                        `${preferencesFileName  }S`,
                        preferencestosave.length.toString()
                    )
                    formDataExtensions.append(
                        "myfiles",
                        file_to_save,
                        preferencesFileName
                    )
                    //Send the file
                    createNewRequest(
                        espHttpURL(useSettingsContextFn.getValue("HostTarget")),
                        {
                            method: "POST",
                            id: "preferences",
                            body: formDataExtensions,
                        },
                        {
                            onSuccess: (result: string) => {
                                dispatchToExtensions(
                                    "extensionsData",
                                    {
                                        response: { status: "success" },
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                            },
                            onFail: (error: string) => {
                                dispatchToExtensions(
                                    "extensionsData",
                                    {
                                        response: { status: "error" },
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                            },
                        }
                    )

                    break
                }
                case "capabilities": {
                    let response: any = {}
                    switch (eventMsg.data.id) {
                        case "connection":
                            response = JSON.parse(
                                JSON.stringify(connectionSettings.current)
                            )
                            break
                        case "settings":
                            response = JSON.parse(
                                JSON.stringify(machineSettings)
                            )
                            break
                        case "interface":
                            response = JSON.parse(
                                JSON.stringify(interfaceSettings.current)
                            )
                            break
                        case "features":
                            response = JSON.parse(
                                JSON.stringify(featuresSettings.current)
                            )
                            break
                        case "extensions":
                            if (interfaceSettings.current.extensions) {
                                if (
                                    interfaceSettings.current.extensions[
                                        eventMsg.data.name
                                    ]
                                ) {
                                    response = JSON.parse(
                                        JSON.stringify(
                                            interfaceSettings.current
                                                .extensions[eventMsg.data.name]
                                        )
                                    )
                                } else {
                                    response = "{}"
                                }
                            } else {
                                response = "{}"
                            }
                            break
                        default:
                            response = {}
                    }
                    dispatchToExtensions(
                        "capabilities",
                        {
                            response: response,
                            initiator: eventMsg.data,
                        },
                        eventMsg.data.id
                    )
                    break
                }
                case "dispatch":
                    dispatchToExtensions(
                        "dispatch",
                        {
                            response: eventMsg.data.content,
                            initiator: eventMsg.data,
                        },
                        eventMsg.data.targetid
                    )
                    break

                default:
                    //core and stream are only supposed to come from ESP3D or main FW
                    return
            }
        }
    }

    useEffect(() => {
        getConnectionSettings(getInterfaceSettings)
        window.addEventListener("message", processExtensionMessage, false)
    }, [])
    return <ViewContainer />
}

export { ContentContainer }
