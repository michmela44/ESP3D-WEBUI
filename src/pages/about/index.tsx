import { FunctionalComponent, JSX } from "preact"
import { useEffect, useState, useRef } from "preact/hooks"
import { ButtonImg, Loading, CenterLeft, Progress } from "../../components/Controls"
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
import { Esp3dVersion, webUIversion } from "../../components/App/version"
import { Github, RefreshCcw, UploadCloud, LifeBuoy, Info, BookOpen, Download } from "preact-feather"
import { webUiUrl, fwUrl, Name, restartdelay } from "../../targets"
import {
    showConfirmationModal,
    showModal,
    showProgressModal,
    showReleaseNotesModal,
    showFirmwareUpdateModal,
} from "../../components/Modal"
import { GitHubService } from "../../Services/GitHubService"
import type { GitHubRelease } from "../../types/github.types"
import { VersionBadge } from "../../components/VersionBadge"

interface AboutData {
    id: string
    value: string
}

interface ProgressBar {
    update?: (value: number) => void
}

let about: AboutData[] = []

const defaultHelpUrl = "http://wiki.fluidnc.com/"

const CustomEntry: FunctionalComponent = (): JSX.Element => {
    const { interfaceSettings } = useSettingsContext()
    let HelpEntry: JSX.Element | null = null
    let InfoEntry: JSX.Element | null = null
    if (
        interfaceSettings.current.custom &&
        (interfaceSettings.current.custom.help || interfaceSettings.current.custom.information)
    ) {
        if (interfaceSettings.current?.custom?.help) {
            const helpUrl = interfaceSettings.current.custom.help
            const onClickHelp = (e: MouseEvent) => {
                useUiContextFn.haptic()
                if (helpUrl) (window as any).open(helpUrl, "_blank")
                ;(e.target as HTMLElement).blur()
            }
            HelpEntry = <ButtonImg mx2 icon={<LifeBuoy />} label={T("S72")} onClick={onClickHelp} />
        }
        if (interfaceSettings.current?.custom?.information) {
            const infoUrl = interfaceSettings.current.custom.information
            const onClickInfo = (e: MouseEvent) => {
                useUiContextFn.haptic()
                if (infoUrl) (window as any).open(infoUrl, "_blank")
                ;(e.target as HTMLElement).blur()
            }
            InfoEntry = <ButtonImg mx2 icon={<Info />} label={T("S123")} onClick={onClickInfo} />
        }
        return (
            <li class="feather-icon-container">
                {HelpEntry} {InfoEntry}
            </li>
        )
    }

    const onClickHelp = (e: MouseEvent) => {
        useUiContextFn.haptic()
        ;(window as any).open(defaultHelpUrl, "_blank")
        ;(e.target as HTMLElement).blur()
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
            <span class="text-primary text-label">{T("S225")}:</span>
            {HelpEntry}
        </li>
    )
}

const About: FunctionalComponent = (): JSX.Element => {
    console.log("about")
    const { uisettings } = useUiContext()
    const { toasts } = useToastsContext()
    const { modals } = useModalsContext()
    const webSocketService = useWebSocketService()
    const { createNewRequest, abortRequest } = useHttpQueue()
    const { targetCommands } = useTargetCommands()
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const progressBar: ProgressBar = {}
    const [props, setProps] = useState<AboutData[]>([...about])
    const [isFwUpdate, setIsFwUpdate] = useState<boolean>(false)
    const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null)
    const [availableReleases, setAvailableReleases] = useState<GitHubRelease[]>([])
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
    const [latestFirmwareRelease, setLatestFirmwareRelease] = useState<GitHubRelease | null>(null)
    const [availableFirmwareReleases, setAvailableFirmwareReleases] = useState<GitHubRelease[]>([])
    const inputFilesRef = useRef<HTMLInputElement>(null)
    const isFlashFS = connectionSettings.current.FlashFileSystem == "none" ? false : true
    const isSDFS = connectionSettings.current.SDConnection == "none" ? false : true

    const getProps = (): void => {
        setIsLoading(true)
        const callbacks = {
            onSuccess: (result: any) => {
                const jsonResult = JSON.parse(result)
                if (jsonResult.cmd != 420 || jsonResult.status == "error" || !jsonResult.data) {
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
            M: any = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || []
            return `IE ${tem[1] || ""}`
        }
        if (M[1] === "Chrome") {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/)
            if (tem != null) return tem.slice(1).join(" ").replace("OPR", "Opera")
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"]
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1])
        return M.join(" ")
    }

    const onFWUpdate = (e: MouseEvent) => {
        useUiContextFn.haptic()
        ;(e.target as HTMLElement).blur()

        const uploadFromDisk = () => {
            setIsFwUpdate(true)
            if (inputFilesRef.current) {
                inputFilesRef.current.value = ""
                inputFilesRef.current.accept = ".bin"
                inputFilesRef.current.multiple = false
                inputFilesRef.current.click()
            }
        }

        const downloadFromGithub = () => {
            const currentFirmwareVersion = props.find((element) => element.id == "FW version")?.value || "Unknown"

            showFirmwareUpdateModal({
                modals,
                releases: availableFirmwareReleases,
                currentVersion: currentFirmwareVersion,
                onUploadFile: () => {
                    setIsFwUpdate(true)
                    if (inputFilesRef.current) {
                        inputFilesRef.current.value = ""
                        inputFilesRef.current.accept = ".bin"
                        inputFilesRef.current.multiple = false
                        inputFilesRef.current.click()
                    }
                },
                onViewReleaseNotes: () => {
                    const releasesToShow =
                        availableFirmwareReleases.length > 0 ? availableFirmwareReleases.slice(0, 10) : []

                    if (releasesToShow.length === 0) {
                        toasts.addToast({
                            content: "No firmware release information available",
                            type: "error",
                        })
                        return
                    }

                    showReleaseNotesModal({
                        modals,
                        releases: releasesToShow,
                        githubUrl: "https://github.com/bdring/FluidNC/releases",
                    })
                },
            })
        }

        showModal({
            modals,
            title: "Update Firmware",
            content: (
                <CenterLeft>
                    <div class="mb-4">
                        <p class="mb-3 text-center">Choose an update method:</p>

                        <div class="mb-3">
                            <button
                                class="btn btn-primary btn-lg btn-block"
                                onClick={downloadFromGithub}
                                disabled={availableFirmwareReleases.length === 0}>
                                <Download size={18} class="mr-2" style="vertical-align: middle;" />
                                Download from GitHub
                            </button>
                            <small class="text-muted d-block mt-1 text-center">
                                Download firmware release, extract, then upload .bin file
                            </small>
                        </div>

                        <div class="divider text-center" data-content="OR" />

                        <div class="mb-3">
                            <button class="btn btn-primary btn-lg btn-block" onClick={uploadFromDisk}>
                                <UploadCloud size={18} class="mr-2" style="vertical-align: middle;" />
                                Upload File from Computer
                            </button>
                            <small class="text-muted d-block mt-1 text-center">
                                Select a .bin file you already have
                            </small>
                        </div>

                        <div class="text-center mt-3">
                            <a
                                href="#"
                                class="text-primary"
                                onClick={(e) => {
                                    e.preventDefault()
                                    useUiContextFn.haptic()
                                    const releasesToShow =
                                        availableFirmwareReleases.length > 0
                                            ? availableFirmwareReleases.slice(0, 10)
                                            : []

                                    if (releasesToShow.length === 0) {
                                        toasts.addToast({
                                            content: "No firmware release information available",
                                            type: "error",
                                        })
                                        return
                                    }

                                    showReleaseNotesModal({
                                        modals,
                                        releases: releasesToShow,
                                        githubUrl: "https://github.com/bdring/FluidNC/releases",
                                    })
                                }}>
                                <BookOpen size={14} style="vertical-align: middle;" /> View Release Notes
                            </a>
                        </div>
                    </div>
                </CenterLeft>
            ),
            id: "firmware-update-choice",
            hideclose: false,
        })
    }
    const onFWGit = (e: MouseEvent) => {
        useUiContextFn.haptic()
        const i = useSettingsContextFn.getValue("Screen")
        let url = ""
        if (interfaceSettings.current.custom && interfaceSettings.current.custom.fwurl) {
            url = interfaceSettings.current.custom.fwurl
        } else if (i && i != "none" && (fwUrl as readonly any[]).length > 1) {
            url = (fwUrl as readonly any[])[1]
        } else {
            url = fwUrl[0] || ""
        }

        ;(window as any).open(url, "_blank")
        ;(e.target as HTMLElement).blur()
    }

    const checkForUpdates = async () => {
        setIsCheckingUpdates(true)
        try {
            const githubService = new GitHubService({
                owner: "michmela44",
                repo: "ESP3D-WEBUI",
                assetName: "index.html.gz",
            })
            const latest = await githubService.getLatestRelease()
            setLatestRelease(latest)

            const releases = await githubService.getReleases(10)
            setAvailableReleases(releases)
        } catch (error) {
            console.error("Failed to check for updates:", error)
        } finally {
            setIsCheckingUpdates(false)
        }
    }

    const checkForFirmwareUpdates = async () => {
        try {
            const githubService = new GitHubService({
                owner: "bdring",
                repo: "FluidNC",
                assetName: "", 
            })
            const latest = await githubService.getLatestRelease()
            setLatestFirmwareRelease(latest)

            const releases = await githubService.getReleases(10)
            setAvailableFirmwareReleases(releases)
        } catch (error) {
            console.error("Failed to check for firmware updates:", error)
        }
    }

    const showDownloadModal = () => {
        if (availableReleases.length === 0) {
            toasts.addToast({
                content: "No releases available. Check your internet connection.",
                type: "error",
            })
            return
        }

        let selectedReleaseIndex = 0

        const downloadSelectedRelease = () => {
            const selectedRelease = availableReleases[selectedReleaseIndex]
            const githubService = new GitHubService({
                owner: "michmela44",
                repo: "ESP3D-WEBUI",
                assetName: "index.html.gz",
            })

            const asset = githubService.findAssetByName(selectedRelease, "index.html.gz")
            if (!asset) {
                toasts.addToast({
                    content: `Asset 'index.html.gz' not found in release ${selectedRelease.tag_name}`,
                    type: "error",
                })
                return
            }

            const downloadUrl = asset.browser_download_url
            const link = document.createElement("a")
            link.href = downloadUrl
            link.download = "index.html.gz"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            const downloadModalIndex = modals.getModalIndex("github-download")
            if (downloadModalIndex !== -1) {
                modals.removeModal(downloadModalIndex)
            }

            toasts.addToast({
                content: `Downloading ${selectedRelease.tag_name}. Use 'Upload to Device' button after download completes.`,
                type: "success",
            })
        }

        const cancelDownload = () => {
            const downloadModalIndex = modals.getModalIndex("github-download")
            if (downloadModalIndex !== -1) {
                modals.removeModal(downloadModalIndex)
            }
        }

        const compareVersions = (current: string, target: string): string => {
            const cleanCurrent = current.split(".").slice(0, 3).join(".")
            const cleanTarget = target.replace(/^v/, "").split(".").slice(0, 3).join(".")

            const currentParts = cleanCurrent.split(".").map(Number)
            const targetParts = cleanTarget.split(".").map(Number)

            for (let i = 0; i < 3; i++) {
                if ((currentParts[i] || 0) < (targetParts[i] || 0)) return "upgrade"
                if ((currentParts[i] || 0) > (targetParts[i] || 0)) return "downgrade"
            }
            return "same"
        }

        showModal({
            modals,
            title: "Download Web UI from GitHub",
            content: (
                <CenterLeft>
                    <div class="mb-3 p-3" style="background-color: #f8f9fa; border-radius: 4px;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div style="flex: 1;">
                                <small class="text-muted d-block">Current Version</small>
                                <strong>{webUIversion}</strong>
                            </div>
                            {latestRelease && (
                                <>
                                    <div style="flex: 1; text-align: center; padding: 0 1rem;">
                                        {compareVersions(webUIversion, latestRelease.tag_name) === "upgrade" && (
                                            <span class="text-success">Upgrade Available</span>
                                        )}
                                        {compareVersions(webUIversion, latestRelease.tag_name) === "same" && (
                                            <span class="text-muted">Up to date</span>
                                        )}
                                    </div>
                                    <div style="flex: 1; text-align: right;">
                                        <small class="text-muted d-block">Latest Release</small>
                                        <strong class="text-success">{latestRelease.tag_name}</strong>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div class="mt-3">
                        <label class="form-label">
                            <strong>Select version to download:</strong>
                        </label>
                        <select
                            id="release-selector"
                            class="form-control"
                            onChange={(e) => {
                                selectedReleaseIndex = parseInt((e.target as HTMLSelectElement).value)
                                const infoBox = document.getElementById("selected-release-info")
                                if (infoBox) {
                                    const selectedRelease = availableReleases[selectedReleaseIndex]
                                    infoBox.innerHTML = `${selectedRelease.tag_name} - Released ${new Date(
                                        selectedRelease.published_at
                                    ).toLocaleDateString()}`
                                }
                            }}>
                            {availableReleases.map((release, index) => (
                                <option key={release.id} value={index}>
                                    {release.name}
                                    {index === 0 ? " (Latest)" : ""}
                                </option>
                            ))}
                        </select>
                        <small id="selected-release-info" class="text-muted d-block mt-1">
                            {availableReleases[0]?.tag_name} - Released{" "}
                            {new Date(availableReleases[0]?.published_at || "").toLocaleDateString()}
                        </small>
                    </div>
                </CenterLeft>
            ),
            button1: {
                text: "Download",
                cb: downloadSelectedRelease,
                noclose: true,
            },
            button2: {
                text: "Cancel",
                cb: cancelDownload,
                noclose: true,
            },
            id: "github-download",
            hideclose: false,
        })
    }

    const showReleaseNotes = () => {
        const releasesToShow = availableReleases.length > 0 ? availableReleases.slice(0, 10) : []

        if (releasesToShow.length === 0) {
            toasts.addToast({
                content: "No release information available",
                type: "error",
            })
            return
        }

        showReleaseNotesModal({
            modals,
            releases: releasesToShow,
            githubUrl: "https://github.com/michmela44/ESP3D-WEBUI/releases",
        })
    }
    const onWebUiUpdate = (e: MouseEvent) => {
        useUiContextFn.haptic()
        ;(e.target as HTMLElement).blur()

        showModal({
            modals,
            title: "Update Web UI",
            content: (
                <CenterLeft>
                    <div class="mb-4">
                        <p class="mb-3 text-center">Choose an update method:</p>

                        <div class="mb-3">
                            <button
                                class="btn btn-primary btn-lg btn-block"
                                onClick={() => {
                                    showDownloadModal()
                                }}
                                disabled={availableReleases.length === 0}>
                                <Download size={18} class="mr-2" style="vertical-align: middle;" />
                                Download from GitHub
                            </button>
                            <small class="text-muted d-block mt-1 text-center">
                                Download a release, then upload it to your device
                            </small>
                        </div>

                        <div class="divider text-center" data-content="OR" />

                        <div class="mb-3">
                            <button
                                class="btn btn-primary btn-lg btn-block"
                                onClick={() => {
                                    setIsFwUpdate(false)
                                    if (inputFilesRef.current) {
                                        inputFilesRef.current.value = ""
                                        inputFilesRef.current.accept = "*"
                                        inputFilesRef.current.multiple = true
                                        inputFilesRef.current.click()
                                    }
                                }}>
                                <UploadCloud size={18} class="mr-2" style="vertical-align: middle;" />
                                Upload File from Computer
                            </button>
                            <small class="text-muted d-block mt-1 text-center">
                                Select an index.html.gz file you already have
                            </small>
                        </div>

                        <div class="text-center mt-3">
                            <a
                                href="#"
                                class="text-primary"
                                onClick={(e) => {
                                    e.preventDefault()
                                    useUiContextFn.haptic()
                                    showReleaseNotes()
                                }}>
                                <BookOpen size={14} style="vertical-align: middle;" /> View Release Notes
                            </a>
                        </div>
                    </div>
                </CenterLeft>
            ),
            id: "webui-upload",
            hideclose: false,
        })
    }
    const onWebUiGit = (e: MouseEvent) => {
        useUiContextFn.haptic()
        ;(window as any)
            .open(
                webUiUrl,
                "_blank"
            )(e.target as HTMLElement)
            .blur()
    }

    const uploadFiles = (renameToIndexHtml = false): void => {
        const list = inputFilesRef.current?.files
        if (!list) return
        const formData = new FormData()
        formData.append("path", useSettingsContextFn.getValue("HostUploadPath"))
        formData.append("createPath", "true")
        if (list.length > 0) {
            for (let i = 0; i < list.length; i++) {
                const file = list[i]
                const fileName = renameToIndexHtml && file.name.endsWith(".html.gz") ? "index.html.gz" : file.name
                const arg = `${useSettingsContextFn.getValue("HostUploadPath") + fileName}S`
                formData.append(arg, String(file.size))
                formData.append("myfiles", file, useSettingsContextFn.getValue("HostUploadPath") + fileName)
            }
        }
        showProgressModal({
            modals,
            title: T("S32"),
            button1: { cb: abortRequest, text: T("S28") },
            content: <Progress progressBar={progressBar} max={100} />,
        })
        const base = isFwUpdate ? "updatefw" : useSettingsContextFn.getValue("HostTarget")
        console.log(base)
        createNewRequest(
            espHttpURL(base),
            { method: "POST", id: "upload", body: formData },
            {
                onSuccess: (_result: any) => {
                    if (progressBar.update && typeof progressBar.update === "function") progressBar.update(100)
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
                    if (progressBar.update && typeof progressBar.update === "function") progressBar.update(e)
                },
            }
        )
    }

    const valueTranslated = (value: string): string => {
        if (value.startsWith("ON (") || value.startsWith("OFF (") || value.startsWith("shared (")) {
            const reg_search = /(?<label>[^\(]*)\s\((?<content>[^\)]*)/
            let res = reg_search.exec(value)
            if (res && res.groups) {
                return `${T(res.groups.label)} (${T(res.groups.content)})`
            }
        }

        return T(value)
    }

    const filesSelected = (_e: Event) => {
        const list = inputFilesRef.current?.files
        if (!list || list.length === 0) return
        const titleConfirmation = isFwUpdate ? T("S30") : T("S31")
        const fileList = Array.from(list)

        const hasIncorrectWebUIName =
            !isFwUpdate && fileList.some((file) => file.name.endsWith(".html.gz") && file.name !== "index.html.gz")

        if (hasIncorrectWebUIName) {
            const incorrectFiles = fileList.filter(
                (file) => file.name.endsWith(".html.gz") && file.name !== "index.html.gz"
            )

            const renameAndUpload = () => {
                useUiContextFn.haptic()
                const modalIndex = modals.getModalIndex("filename-warning")
                if (modalIndex !== -1) {
                    modals.removeModal(modalIndex)
                }
                showConfirmationModal({
                    modals,
                    title: titleConfirmation,
                    content: (
                        <CenterLeft>
                            <p class="text-success mb-2">
                                File will be renamed to <code>index.html.gz</code> during upload.
                            </p>
                            <ul>
                                <li>index.html.gz</li>
                            </ul>
                        </CenterLeft>
                    ),
                    button1: {
                        cb: () => {
                            uploadFiles(true)
                        },
                        text: T("S27"),
                    },
                    button2: {
                        text: T("S28"),
                    },
                })
            }

            const continueAnyway = () => {
                useUiContextFn.haptic()
                const modalIndex = modals.getModalIndex("filename-warning")
                if (modalIndex !== -1) {
                    modals.removeModal(modalIndex)
                }
                showStandardConfirmation()
            }

            const cancelUpload = () => {
                useUiContextFn.haptic()
                const modalIndex = modals.getModalIndex("filename-warning")
                if (modalIndex !== -1) {
                    modals.removeModal(modalIndex)
                }
            }

            modals.addModal({
                id: "filename-warning",
                title: (
                    <div class="text-primary feather-icon-container modal_title">
                        <label>Warning: Incorrect Filename</label>
                    </div>
                ),
                content: (
                    <CenterLeft>
                        <p class="text-warning mb-2">
                            <strong>The following file(s) have incorrect names:</strong>
                        </p>
                        <ul class="mb-2">
                            {incorrectFiles.map((file) => (
                                <li key={file.name}>{file.name}</li>
                            ))}
                        </ul>
                        <p class="mb-2">
                            The built-in WebUI will only work with the exact filename <code>index.html.gz</code>.
                        </p>
                        <p class="mb-0">What would you like to do?</p>
                    </CenterLeft>
                ),
                footer: (
                    <div>
                        <button class="btn btn-primary mx-2" onClick={renameAndUpload}>
                            Rename and Upload
                        </button>
                        <button class="btn mx-2" onClick={continueAnyway}>
                            Upload Anyway
                        </button>
                        <button class="btn mx-2" onClick={cancelUpload}>
                            Cancel
                        </button>
                    </div>
                ),
                overlay: undefined,
                hideclose: false,
            })
            return
        }

        const showStandardConfirmation = () => {
            const content = (
                <CenterLeft>
                    <ul>
                        {fileList.reduce((accumulator: JSX.Element[], currentElement: File) => {
                            return [...accumulator, <li key={currentElement.name}>{currentElement.name}</li>]
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

        showStandardConfirmation()
    }

    useEffect(() => {
        if (uisettings.getValue("autoload") && props.length == 0) getProps()
        else setIsLoading(false)
    })

    useEffect(() => {
        checkForUpdates()
        checkForFirmwareUpdates()
    }, [])

    return (
        <div id="about" class="container">
            <input ref={inputFilesRef} type="file" class="d-none" onChange={filesSelected} />
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
                                <span class="text-primary text-label">{T("S150")}: </span>
                                <span class="text-dark">
                                    <Esp3dVersion />
                                </span>
                                {latestRelease && (
                                    <VersionBadge
                                        current={webUIversion}
                                        latest={latestRelease.tag_name.replace("v", "")}
                                    />
                                )}
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
                                <span class="text-primary text-label">{T("FW ver")}:</span>
                                <span class="text-dark">
                                    {props.find((element) => element.id == "FW version") &&
                                        props.find((element) => element.id == "FW version")?.value}
                                </span>
                                {latestFirmwareRelease && props.find((element) => element.id == "FW version") && (
                                    <VersionBadge
                                        current={
                                            props
                                                .find((element) => element.id == "FW version")
                                                ?.value.replace(/^FluidNC\s+/i, "")
                                                .replace(/^v/, "")
                                                .split(/[-_]/)[0] || ""
                                        }
                                        latest={latestFirmwareRelease.tag_name.replace(/^v/, "").split(/[-_]/)[0]}
                                    />
                                )}
                                <ButtonImg sm mx2 tooltip data-tooltip={T("S20")} icon={<Github />} onClick={onFWGit} />
                                {connectionSettings.current.WebUpdate == "Enabled" && (
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
                                <span class="text-primary text-label">{T("S18")}:</span>
                                <span class="text-dark">{getBrowserInformation()}</span>
                            </li>
                            {props.map(({ id, value }: AboutData) => {
                                if (id != "FW ver")
                                    return (
                                        <li key={id}>
                                            <span class="text-primary text-label">{T(id)}:</span>
                                            <span class="text-dark">{valueTranslated(value)}</span>
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
