/*
 about.js - ESP3D WebUI navigation page file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.
 Original code inspiration : 2021 Alexandre Aussourd
 
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
import { FunctionalComponent, JSX } from "preact"
import { useEffect, useState, useRef } from "preact/hooks"
import {
    ButtonImg,
    Loading,
    CenterLeft,
    Progress,
} from "../../components/Controls"
import { useHttpQueue, useTargetCommands } from "../../hooks"
import { useWebSocketService } from "../../hooks/useWebSocketService"
import { espHttpURL } from "../../components/Helpers"
import { T } from "../../components/Translations"
import {
    useUiContext,
    useModalsContext,
    useToastsContext,
    useUiContextFn,
    useSettingsContext,
    useSettingsContextFn,
} from "../../contexts"
import { Esp3dVersion } from "../../components/App/version"
import { Github, RefreshCcw, UploadCloud, LifeBuoy, Info, BookOpen } from "preact-feather"
import { webUiUrl, fwUrl, Name, restartdelay } from "../../targets"
import {
    showConfirmationModal,
    showModal,
    showProgressModal,
} from "../../components/Modal"

interface AboutData {
    id: string
    value: string
}

interface ProgressBar {
    update?: (value: number) => void
}

let about: AboutData[] = []

//TODO: add link to translated documentation according language set for UI
const defaultHelpUrl = "http://wiki.fluidnc.com/"

/*
 * Local const
 *
 */
const CustomEntry: FunctionalComponent = (): JSX.Element => {
    const { interfaceSettings } = useSettingsContext()
    let HelpEntry: JSX.Element | null = null
    let InfoEntry: JSX.Element | null = null
    if (
        interfaceSettings.current.custom &&
        (interfaceSettings.current.custom.help ||
            interfaceSettings.current.custom.information)
    ) {
        if (interfaceSettings.current?.custom?.help) {
            const helpUrl = interfaceSettings.current.custom.help
            const onClickHelp = (e: MouseEvent) => {
                useUiContextFn.haptic();
                if (helpUrl) (window as any).open(helpUrl, "_blank");
                (e.target as HTMLElement).blur()
            }
            HelpEntry = (
                <ButtonImg
                    mx2
                    icon={<LifeBuoy />}
                    label={T("S72")}
                    onClick={onClickHelp}
                />
            )
        }
        if (interfaceSettings.current?.custom?.information) {
            const infoUrl = interfaceSettings.current.custom.information
            const onClickInfo = (e: MouseEvent) => {
                useUiContextFn.haptic();
                if (infoUrl) (window as any).open(infoUrl, "_blank");
                (e.target as HTMLElement).blur()
            }
            InfoEntry = (
                <ButtonImg
                    mx2
                    icon={<Info />}
                    label={T("S123")}
                    onClick={onClickInfo}
                />
            )
        }
        return (
            <li class="feather-icon-container">
                {HelpEntry} {InfoEntry}
            </li>
        )
    }

    const onClickHelp = (e: MouseEvent) => {
        useUiContextFn.haptic();
        (window as any).open(defaultHelpUrl, "_blank");
        (e.target as HTMLElement).blur()
    }
    HelpEntry = (
        <ButtonImg
            mx2
            tooltip
            data-tooltip={T("S225")}
            icon={<BookOpen />}
            label="FluidNC Wiki"
            onClick={onClickHelp}
        />
    )
    return (
        <li class="feather-icon-container">
            <span class="text-primary text-label">
                {T("S225")}:
            </span>
             {HelpEntry}
        </li>
    )

}

const About: FunctionalComponent = (): JSX.Element => {
    console.log("about")
    const { uisettings } = useUiContext()
    const { toasts } = useToastsContext()
    const { modals } = useModalsContext()
    const webSocketService = useWebSocketService();
    const { createNewRequest, abortRequest } = useHttpQueue()
    const { targetCommands } = useTargetCommands()
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const progressBar: ProgressBar = {}
    const [props, setProps] = useState<AboutData[]>([...about])
    const [isFwUpdate, setIsFwUpdate] = useState<boolean>(false)
    const inputFilesRef = useRef<HTMLInputElement>(null)
    const isFlashFS =
        connectionSettings.current.FlashFileSystem == "none" ? false : true
    const isSDFS =
        connectionSettings.current.SDConnection == "none" ? false : true

    const getProps = (): void => {
        setIsLoading(true)
        const callbacks = {
                onSuccess: (result: any) => {
                    const jsonResult = JSON.parse(result)
                    if (
                        jsonResult.cmd != 420 ||
                        jsonResult.status == "error" ||
                        !jsonResult.data
                    ) {
                        toasts.addToast({ content: T("S194"), type: "error" })
                        setIsLoading(false)
                        return
                    }
                    setProps([...jsonResult.data])
                    about = [...jsonResult.data]
                    setIsLoading(false)
                },
                onFail: (error: any) => {
                    setIsLoading(false)
                    toasts.addToast({ content: error, type: "error" })
                    console.log(error)
                },
        }
        targetCommands("[ESP420]json=yes", undefined, undefined, callbacks)
    }

    //from https://stackoverflow.com/questions/5916900/how-can-you-detect-the-version-of-a-browser
    function getBrowserInformation(): string {
        var ua = navigator.userAgent,
            tem: any,
            M: any =
                ua.match(
                    /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
                ) || []
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || []
            return `IE ${  tem[1] || ""}`
        }
        if (M[1] === "Chrome") {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/)
            if (tem != null)
                return tem.slice(1).join(" ").replace("OPR", "Opera")
        }
        M = M[2]
            ? [M[1], M[2]]
            : [navigator.appName, navigator.appVersion, "-?"]
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1])
        return M.join(" ")
    }

    const onFWUpdate = (e: MouseEvent) => {
        useUiContextFn.haptic();
        (e.target as HTMLElement).blur()
        setIsFwUpdate(true)
        if (inputFilesRef.current) {
            inputFilesRef.current.value = ""
            inputFilesRef.current.accept = ".bin, .bin.gz"
            inputFilesRef.current.multiple = false
            inputFilesRef.current.click()
        }
    }
    const onFWGit = (e: MouseEvent) => {
        useUiContextFn.haptic()
        const i = useSettingsContextFn.getValue("Screen")
        let url = ""
        if (interfaceSettings.current.custom && interfaceSettings.current.custom.fwurl) {
            url = interfaceSettings.current.custom.fwurl
        } else if (i && i != "none") {
            url = fwUrl[1]
        } else {
            url = fwUrl[0]
        }

        (window as any).open(url, "_blank")
        (e.target as HTMLElement).blur()
    }

    const downloadFromGithub = (): void => {
        // Use jsDelivr CDN which provides CORS-enabled access to GitHub releases
        const cdnUrl = "https://cdn.jsdelivr.net/gh/michmela44/ESP3D-WEBUI@latest/index.html.gz"

        showProgressModal({
            modals,
            title: T("S32"),
            button1: { cb: abortRequest, text: T("S28") },
            content: <Progress progressBar={progressBar} max={100} />,
        })

        fetch(cdnUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const contentLength = response.headers.get("content-length")
                const total = parseInt(contentLength || "0", 10)
                const reader = response.body?.getReader()

                if (!reader) {
                    throw new Error("Unable to read response body")
                }

                let loaded = 0
                const chunks: BlobPart[] = []

                const readChunk = (): Promise<Blob> => {
                    return reader.read().then((result) => {
                        if (result.done) {
                            return new Blob(chunks, { type: "application/gzip" })
                        }
                        const chunk = result.value
                        chunks.push(chunk)
                        loaded += chunk.byteLength
                        if (total > 0) {
                            const percentComplete = (loaded / total) * 100
                            if (progressBar.update && typeof progressBar.update === "function") {
                                progressBar.update(percentComplete)
                            }
                        }
                        return readChunk()
                    })
                }

                return readChunk()
            })
            .then((blob) => {
                const formData = new FormData()
                formData.append("path", useSettingsContextFn.getValue("HostUploadPath"))
                formData.append("createPath", "true")

                const filename = "index.html.gz"
                const arg = `${useSettingsContextFn.getValue("HostUploadPath") + filename  }S`
                formData.append(arg, String(blob.size))
                formData.append(
                    "myfiles",
                    blob,
                    useSettingsContextFn.getValue("HostUploadPath") + filename
                )

                setIsFwUpdate(false)
                createNewRequest(
                    espHttpURL(useSettingsContextFn.getValue("HostTarget")),
                    { method: "POST", id: "upload", body: formData },
                    {
                        onSuccess: () => {
                            if (
                                progressBar.update &&
                                typeof progressBar.update === "function"
                            )
                                progressBar.update(100)
                            modals.removeModal(modals.getModalIndex("upload"))
                            webSocketService.disconnect("connecting")
                            window.location.reload()
                        },
                        onFail: (error: any) => {
                            modals.removeModal(modals.getModalIndex("upload"))
                            toasts.addToast({ content: error, type: "error" })
                        },
                        onProgress: (e: number) => {
                            if (
                                progressBar.update &&
                                typeof progressBar.update === "function"
                            )
                                progressBar.update(50 + e / 2) // Scale to 50-100 for upload portion
                        },
                    }
                )
            })
            .catch((error) => {
                modals.removeModal(modals.getModalIndex("upload"))
                toasts.addToast({
                    content: `Failed to download from GitHub: ${error.message}`,
                    type: "error"
                })
            })
    }
    const onWebUiUpdate = (e: MouseEvent) => {
        useUiContextFn.haptic();
        (e.target as HTMLElement).blur()

        showModal({
            modals,
            title: "Web UI Update",
            content: <CenterLeft><p>Choose how to update the Web UI:</p></CenterLeft>,
            button1: {
                text: "Upload from Disk",
                cb: () => {
                    setIsFwUpdate(false)
                    if (inputFilesRef.current) {
                        inputFilesRef.current.value = ""
                        inputFilesRef.current.accept = "*"
                        inputFilesRef.current.multiple = true
                        inputFilesRef.current.click()
                    }
                },
            },
            button2: {
                text: "Download from GitHub",
                cb: downloadFromGithub,
            },
            id: "webui-update",
            hideclose: false,
        })
    }
    const onWebUiGit = (e: MouseEvent) => {
        useUiContextFn.haptic();
        (window as any).open(webUiUrl, "_blank")
        (e.target as HTMLElement).blur()
    }

    const uploadFiles = (): void => {
        const list = inputFilesRef.current?.files
        if (!list) return
        const formData = new FormData()
        formData.append("path", useSettingsContextFn.getValue("HostUploadPath"))
        formData.append("createPath", "true")
        if (list.length > 0) {
            for (let i = 0; i < list.length; i++) {
                const file = list[i]
                const arg =
                    `${useSettingsContextFn.getValue("HostUploadPath") +
                    file.name 
                    }S`
                //append file size first to check updload is complete
                formData.append(arg, String(file.size))
                formData.append(
                    "myfiles",
                    file,
                    useSettingsContextFn.getValue("HostUploadPath") + file.name
                )
            }
        }
        showProgressModal({
            modals,
            title: T("S32"),
            button1: { cb: abortRequest, text: T("S28") },
            content: <Progress progressBar={progressBar} max={100} />,
        })
        const base = isFwUpdate
            ? "updatefw"
            : useSettingsContextFn.getValue("HostTarget")
        console.log(base)
        createNewRequest(
            espHttpURL(base),
            { method: "POST", id: "upload", body: formData },
            {
                onSuccess: (result: any) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(100)
                    modals.removeModal(modals.getModalIndex("upload"))
                    webSocketService.disconnect(isFwUpdate ? "restart" : "connecting")

                    if (isFwUpdate) {
                        setTimeout(() => {
                            window.location.reload()
                        }, restartdelay * 1000)
                    } else window.location.reload()
                },
                onFail: (error: any) => {
                    modals.removeModal(modals.getModalIndex("upload"))
                    toasts.addToast({ content: error, type: "error" })
                },
                onProgress: (e: number) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(e)
                },
            }
        )
    }

    const valueTranslated = (value: string): string => {
        if (
            value.startsWith("ON (") ||
            value.startsWith("OFF (") ||
            value.startsWith("shared (")
        ) {
            const reg_search = /(?<label>[^\(]*)\s\((?<content>[^\)]*)/
            let res = reg_search.exec(value)
            if (res && res.groups) {
                return `${T(res.groups.label)  } (${  T(res.groups.content)  })`
            }
        }

        return T(value)
    }

    const filesSelected = (e: Event) => {
        const list = inputFilesRef.current?.files
        if (!list || list.length === 0) return
        const titleConfirmation = isFwUpdate ? T("S30") : T("S31")
        const fileList = Array.from(list)
        const content = (
            <CenterLeft>
                <ul>
                    {fileList.reduce((accumulator: JSX.Element[], currentElement: File) => {
                        return [
                            ...accumulator,
                            <li key={currentElement.name}>{currentElement.name}</li>,
                        ]
                    }, [])}
                </ul>
            </CenterLeft>
        )
        showConfirmationModal({
            modals,
            title: titleConfirmation,
            content,
            button1: {
                cb: () => {
                    uploadFiles()
                },
                text: T("S27"),
            },
            button2: {
                text: T("S28"),
            },
        })
    }

    useEffect(() => {
        if (uisettings.getValue("autoload") && props.length == 0) getProps()
        else setIsLoading(false)
    })

    return (
        <div id="about" class="container">
            <input
                ref={inputFilesRef}
                type="file"
                class="d-none"
                onChange={filesSelected}
            />
            <h4>
                {T("S12").replace(
                    "%s",
                    interfaceSettings.current &&
                        interfaceSettings.current.custom &&
                        interfaceSettings.current.custom.name
                        ? interfaceSettings.current.custom.name
                        : Name
                )}
            </h4>
            {isLoading && <Loading />}

            {!isLoading && props && (
                <div>
                    <hr />
                    <CenterLeft>
                        <ul>
                            <li>
                                <span class="text-primary text-label">
                                    {T("S150")}:{" "}
                                </span>
                                <span class="text-dark">
                                    <Esp3dVersion />
                                </span>
                                <ButtonImg
                                    sm
                                    mx2
                                    tooltip
                                    data-tooltip={T("S20")}
                                    icon={<Github />}
                                    onClick={onWebUiGit}
                                />
                                {(isFlashFS || isSDFS) && (
                                    <ButtonImg
                                        sm
                                        mx2
                                        tooltip
                                        data-tooltip={T("S171")}
                                        icon={<UploadCloud />}
                                        label={T("S25")}
                                        onClick={onWebUiUpdate}
                                    />
                                )}
                            </li>
                            <li>
                                <span class="text-primary text-label">
                                    {T("FW ver")}:
                                </span>
                                <span class="text-dark">
                                    {props.find(
                                        (element) => element.id == "FWVersion"
                                    ) &&
                                        props.find(
                                            (element) => element.id == "FWVersion"
                                        )?.value}
                                </span>
                                <ButtonImg
                                    sm
                                    mx2
                                    tooltip
                                    data-tooltip={T("S20")}
                                    icon={<Github />}
                                    onClick={onFWGit}
                                />
                                {connectionSettings.current.WebUpdate ==
                                    "Enabled" && (
                                    <ButtonImg
                                        sm
                                        mx2
                                        tooltip
                                        data-tooltip={T("S172")}
                                        icon={<UploadCloud />}
                                        label={T("S25")}
                                        onClick={onFWUpdate}
                                    />
                                )}
                            </li>
                            <CustomEntry />
                            <li>
                                <span class="text-primary text-label">
                                    {T("S18")}:
                                </span>
                                <span class="text-dark">
                                    {getBrowserInformation()}
                                </span>
                            </li>
                            {props.map(({ id, value }: AboutData) => {
                                if (id != "FW ver")
                                    return (
                                        <li key={id}>
                                            <span class="text-primary text-label">
                                                {T(id)}:
                                            </span>
                                            <span class="text-dark">
                                                {valueTranslated(value)}
                                            </span>
                                        </li>
                                    )
                            })}
                        </ul>
                    </CenterLeft>
                    <hr />
                    <div style="text-align: center;">
                        <ButtonImg
                            icon={<RefreshCcw />}
                            label={T("S50")}
                            tooltip
                            data-tooltip={T("S23")}
                            onClick={() => {
                                useUiContextFn.haptic()
                                getProps()
                            }}
                        />
                    </div>
                </div>
            )}
            <br />
        </div>
    )
}

export default About
