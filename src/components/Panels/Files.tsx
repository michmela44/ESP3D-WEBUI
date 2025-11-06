/*
Files.js - ESP3D WebUI component file

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

import { Fragment, h } from "preact"
import type { FunctionalComponent, JSX, ComponentChildren } from "preact"
import { useEffect, useState, useRef } from "preact/hooks"
import { T } from "../Translations"
import { useHttpFn } from "../../hooks"
import type { UseHttpFn } from "../../hooks/useHttpQueue"
import { espHttpURL, getBrowserTime } from "../Helpers"
import {
    Loading,
    ButtonImg,
    CenterLeft,
    Progress,
    FullScreenButton,
    CloseButton,
    ContainerHelper,
} from "../Controls"
import { useUiContext, useUiContextFn } from "../../contexts"
import { showModal, showConfirmationModal, showProgressModal } from "../Modal"
import {
    HardDrive,
    Upload,
    RefreshCcw,
    FolderPlus,
    CornerRightUp,
    Edit3,
    XCircle,
} from "preact-feather"
import { files, processor, useTargetContextFn } from "../../targets"
import { Folder, File, Trash2, Play } from "preact-feather"
import { Menu as PanelMenu } from "./"

// Local helper types to tighten any without changing behavior
type FileEntry = {
    name: string;
    shortname: string;
    size: number;
    datetime: string;
    [key: string]: any;
}
type UrlCommand = { type: "url"; url: string; args: Record<string, any> }
type CmdCommand = { type: "cmd"; cmd: string }
type SupportedFS = { value: string; name: string; depend?: () => boolean }
interface PanelMenuItem {
    divider?: boolean
    label?: ComponentChildren
    icon?: ComponentChildren
    onClick?: (e: JSX.TargetedMouseEvent<HTMLElement>) => void
    displayToggle?: () => ComponentChildren
}

// Strongly-typed FilesList interface
interface FilesList {
    files: FileEntry[];
    path: string;
    total: string;
    used: string;
    occupation: string;
    status: string;
}


let currentFS: string = ""
const currentPath: Record<string, string> = {}
const filesListCache: Record<string, FilesList> = {}
let currentFSNeedInit = true

function fileSizeString(size : number | string) {
    if (typeof size === "string") return size;
    if (size === -1) return ""
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    let i = 0
    while (size >= 1024) {
        size /= 1024
        ++i
    }
    return `${size.toFixed(2)} ${units[i]}`
}

/*
 * Local const
 *
 */
const FilesPanel: FunctionalComponent = () => {

    const valids = files.supported.reduce((acc: string[], element: SupportedFS) => {
        if (element.depend)
            if (element.depend())
                {
                    acc.push(element.value)
                }
        return acc
    },[])
    if (currentFS == "") {
        currentFS = useUiContextFn.getValue("default_filesystem")
        if (typeof currentFS === "undefined" || !valids.includes(currentFS)) currentFS = ""
    } 
    const id = "filesPanel"
    const [filePath, setFilePath] = useState<string>(currentPath[currentFS])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [fileSystem, setFileSystem] = useState<string>(currentFS)
    const [filesList, setFilesList] = useState<FilesList | undefined>(filesListCache[currentFS])
    const [menu, setMenu] = useState<PanelMenuItem[] | null>(null)
    const { createNewRequest, abortRequest } = useHttpFn as UseHttpFn
    const { processData } = useTargetContextFn
    const { modals, toasts } = useUiContext()
    const fileref = useRef<HTMLInputElement | null>(null)
    const dropRef = useRef<HTMLDivElement | null>(null)
    const progressBar: { update?: (n: number) => void } = {}
    //console.log("currentFS", currentFS)
    //console.log(currentFS)
    const onCancel = (): void => {
        useUiContextFn.haptic()
        processor.stopCatchResponse()
        setIsLoading(false)
        toasts.addToast({ content: T("S175"), type: "error" })
        filesListCache[currentFS] = {
            files: [],
            path: "",
            total: "0",
            used: "0",
            occupation: "0",
            status: "S22"
        }
        setFilesList(filesListCache[currentFS])
    }

    const sendSerialCmd = (command: string): void => {
        const cmds = command.split(";")
        cmds.forEach((cmd: string) => {
            createNewRequest(
                espHttpURL("command", { cmd: cmd }),
                { method: "GET", echo: cmd },
                {
                    onSuccess: (_result: unknown) => {
                        //Result is handled on ws so just do nothing
                    },
                    onFail: (error: string) => {
                        console.log(error)
                        processor.stopCatchResponse()
                        setIsLoading(false)
                        toasts.addToast({ content: error, type: "error" })
                    },
                }
            )
        })
    }

    const sendURLCmd = (cmd: UrlCommand): void => {
        createNewRequest(
            espHttpURL(cmd.url, cmd.args),
            { method: "GET" },
            {
                onSuccess: (result: unknown) => {
                    filesListCache[currentFS] = files.command(
                        currentFS,
                        "formatResult",
                        result
                    )
                    setFilesList(filesListCache[currentFS])
                    setIsLoading(false)
                },
                onFail: (error: string) => {
                    console.log(error)
                    setIsLoading(false)
                    toasts.addToast({ content: error, type: "error" })
                },
            }
        )
    }

    const processFeedback = (feedback: any): void => {
        if (feedback.status) {
            if (feedback.command == "list") {
                if (feedback.status == "error") {
                    console.log("got error")
                    toasts.addToast({
                        content: T("S4"),
                        type: "error",
                    })
                    filesListCache[currentFS] = {
                        files: [],
                        path: "",
                        total: "0",
                        used: "0",
                        occupation: "0",
                        status: "S22"
                    }
                    setFilesList(filesListCache[currentFS])
                } else {
                    filesListCache[currentFS] = files.command(
                        currentFS,
                        "formatResult",
                        feedback
                    )
                    //check if flatFS and filter if necessary
                    if (files.capability(currentFS, "IsFlatFS")) {
                        setFilesList(
                            files.command(
                                currentFS,
                                "filterResult",
                                filesListCache[currentFS],
                                currentPath[currentFS]
                            )
                        )
                    } else {
                        setFilesList(filesListCache[currentFS])
                    }
                }
            } else {
                //this is affected only by serial commands
                if (
                    feedback.command == "delete" ||
                    feedback.command == "createdir"
                ) {
                    if (feedback.status == "error") {
                        console.log("got error")
                        toasts.addToast({
                            content:
                                feedback.command == "delete"
                                    ? T("S85").replace("%s", feedback.arg)
                                    : T("S84").replace("%s", feedback.arg),
                            type: "error",
                        })
                    } else {
                        //Success now refresh content"
                        onRefresh(null, false)
                        return
                    }
                }
            }
            setIsLoading(false)
        }
        setIsLoading(false)
    }

    const uploadFiles = (): void => {
        setIsLoading(true)
        const cmd = files.command(currentFS, "upload", currentPath[currentFS])
        const list = fileref.current?.files
        if (list && list.length > 0) {
            showProgressModal({
                modals,
                title: T("S32"),
                button1: {
                    cb: abortRequest,
                    text: T("S28"),
                },
                content: <Progress progressBar={progressBar} max={100} />,
            })
            //prepare POST data
            const formData = new FormData()
            formData.append("path", currentPath[currentFS])
            for (let i = 0; i < list.length; i++) {
                const file = list[i]

                let fileName = ""
                const needFormatFileName = files.command(
                    currentFS,
                    "needFormatFileName",
                    cmd.args.path,
                    fileref.current!.files![i].name
                )
                if (
                    needFormatFileName.type != "error" &&
                    needFormatFileName.name
                ) {
                    fileName = needFormatFileName.name
                } else {
                    fileName = file.name
                }
                const arg =
                    cmd.args.path +
                    (cmd.args.path.endsWith("/") ? "" : "/") +
                    fileName +
                    "S"
                //append file size first to check updload is complete
                formData.append(arg, String(file.size))
                //append last modified time
                //no need timezone because will be saved as it is on FileSystem
                const time_string = getBrowserTime(file.lastModified)
                const argt = arg.substring(0, arg.length - 1) + "T"
                formData.append(argt, time_string)
                //append file
                formData.append(
                    "myfiles",
                    file,
                    cmd.args.path +
                        (cmd.args.path.endsWith("/") ? "" : "/") +
                        fileName
                )
            }
            //now do request
            createNewRequest(
                espHttpURL(cmd.url),
                { method: "POST", id: "upload", body: formData },
                {
                    onSuccess: (result: unknown) => {
                        modals.removeModal(modals.getModalIndex("upload"))
                        const cmdpost = files.command(
                            currentFS,
                            "postUpload",
                            currentPath[currentFS],
                            fileref.current!.files![0].name
                        )
                        if (cmdpost.type == "error" || cmdpost.type == "none") {
                            filesListCache[currentFS] = files.command(
                                currentFS,
                                "formatResult",
                                result
                            )
                            setFilesList(filesListCache[currentFS])
                            setIsLoading(false)
                        } else {
                            if (cmdpost.type == "refresh") {
                                //this is needed because the board is still busy
                                setTimeout(() => {
                                    onRefresh(null, cmdpost.arg)
                                }, cmdpost.timeOut)
                            }
                        }
                    },
                    onFail: (error) => {
                        modals.removeModal(modals.getModalIndex("upload"))
                        toasts.addToast({ content: error, type: "error" })
                        setIsLoading(false)
                    },
                onProgress: (percent: number) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(percent)
                },
            }
        )
    }
    }

    const filesSelected = (_e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
        const content = []
        const length = fileref.current?.files?.length || 0
        for (let index = 0; index < length; index++) {
            content.push(<li>{fileref.current!.files![index].name}</li>)
            if (
                !files.capability(
                    currentFS,
                    "Upload",
                    currentPath[currentFS],
                    fileref.current!.files![index].name
                )
            ) {
                const eMsg = files.capability(
                    currentFS,
                    "Upload",
                    currentPath[currentFS],
                    fileref.current!.files![index].name,
                    true
                )
                toasts.addToast({ content: T(eMsg), type: "error" })
            }
        }

        showConfirmationModal({
            modals,
            title: T("S31"),
            content: <CenterLeft>{content}</CenterLeft>,
            button1: {
                cb: uploadFiles,
                text: T("S27"),
            },
            button2: { text: T("S28") },
        })
    }

    const downloadFile = (element: FileEntry) => {
        const cmd = files.command(
            currentFS,
            "download",
            currentPath[currentFS],
            element.name
        )
        showProgressModal({
            modals,
            title: T("S108"),
            button1: {
                cb: abortRequest,
                text: T("S28"),
            },
            content: <Progress progressBar={progressBar} max={100} />,
        })
        createNewRequest(
            espHttpURL(cmd.url, cmd.args),
            { method: "GET", id: "download" },
            {
                onSuccess: (result: BlobPart) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(100)
                    setTimeout(() => {
                        modals.removeModal(modals.getModalIndex("progression"))
                    }, 2000)

                    const file = new Blob([result], {
                        type: "application/octet-stream",
                    })
                    const nav = window.navigator as Navigator & {
                        msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean
                    }
                    if (typeof nav.msSaveOrOpenBlob === "function")
                        // IE10+
                        nav.msSaveOrOpenBlob(file, element.name)
                    else {
                        // Others
                        let a = document.createElement("a"),
                            url = URL.createObjectURL(file)
                        a.href = url
                        a.download = element.name
                        document.body.appendChild(a)
                        a.click()
                        setTimeout(function () {
                            document.body.removeChild(a)
                            window.URL.revokeObjectURL(url)
                        }, 0)
                    }
                },
                onFail: (error) => {
                    modals.removeModal(modals.getModalIndex("progression"))
                    toasts.addToast({ content: error, type: "error" })
                },
                onProgress: (percent: number) => {
                    if (
                        progressBar.update &&
                        typeof progressBar.update === "function"
                    )
                        progressBar.update(percent)
                },
            }
        )
    }

    const createDirectory = (name: string) => {
        const cmd = files.command(
            currentFS,
            "createdir",
            currentPath[currentFS],
            name
        )
        if (cmd.type == "url") {
            sendURLCmd(cmd)
        } else if (cmd.type == "cmd") {
            if (
                processor.startCatchResponse(
                    currentFS,
                    "createdir",
                    processFeedback,
                    name
                )
            ) {
                setIsLoading(true)
                sendSerialCmd(cmd.cmd)
            }
        }
    }

    const deleteCommand = (element: FileEntry) => {
        const cmd = files.command(
            currentFS,
            element.size == -1 ? "deletedir" : "delete",
            currentPath[currentFS],
            element.name
        )
        if (cmd.type == "url") {
            sendURLCmd(cmd as UrlCommand)
        } else if (cmd.type == "cmd") {
            //do the catching

            if (
                processor.startCatchResponse(
                    currentFS,
                    "delete",
                    processFeedback,
                    element.name
                )
            ) {
                setIsLoading(true)
                sendSerialCmd(cmd.cmd)
            }
        }
    }
    const setupFileInput = () => {
        if (currentFS == "") return
        if (fileref.current) fileref.current.multiple = files.capability(currentFS, "UploadMultiple")
        if (files.capability(currentFS, "UseFilters")) {
            let f = useUiContextFn.getValue("filesfilter").trim()
            if (f.length > 0 && f != "*") {
                f = "." + f.replace(/;/g, ",.")
            } else f = "*"
            if (fileref.current) fileref.current.accept = f
        } else {
            if (fileref.current) fileref.current.accept = "*"
        }
    }
    const onSelectFS = (e?: JSX.TargetedEvent<HTMLSelectElement, Event>, norefresh: boolean = false) => {
        if (e) currentFS = e.currentTarget.value
        setupFileInput()
        setFileSystem(currentFS)
        if (!currentPath[currentFS]) {
            currentPath[currentFS] = "/"
        }
        if (!norefresh) onRefresh(e, true)
    }

    const ElementClicked = (e: JSX.TargetedMouseEvent<HTMLElement>, line: FileEntry) => {
        if (line.size == -1) {
            currentPath[currentFS] =
                currentPath[currentFS] +
                (currentPath[currentFS] == "/" ? "" : "/") +
                line.name
            onRefresh(e, files.capability(currentFS, "IsFlatFS"))
        } else {
            if (files.capability(currentFS, "Download")) {
                const content = <li>{line.name}</li>
                showConfirmationModal({
                    modals,
                    title: T("S87"),
                    content,
                    button1: {
                        cb: () => {
                            downloadFile(line)
                        },
                        text: T("S27"),
                    },
                    button2: { text: T("S28") },
                })
            }
        }
    }

    const onRefresh = (e?: Event | null, usecache: boolean = false) => {
        if (e) useUiContextFn.haptic()
        setIsLoading(true)
        setFilePath(currentPath[currentFS])
        if (usecache && filesListCache[currentFS]) {
            if (files.capability(currentFS, "IsFlatFS")) {
                setFilesList(
                    files.command(
                        currentFS,
                        "filterResult",
                        filesListCache[currentFS],
                        currentPath[currentFS]
                    )
                )
            } else {
                setFilesList(filesListCache[currentFS])
            }
            setIsLoading(false)
        } else {
            const cmd = files.command(currentFS, "list", currentPath[currentFS])
            if (cmd.type == "url") {
                createNewRequest(
                    espHttpURL(cmd.url, cmd.args),
                    { method: "GET" },
                    {
                        onSuccess: (result: unknown) => {
                            filesListCache[currentFS] = files.command(
                                currentFS,
                                "formatResult",
                                result
                            )
                            setFilesList(filesListCache[currentFS])
                            setIsLoading(false)
                        },
                        onFail: (error) => {
                            console.log(error)
                            setIsLoading(false)
                            toasts.addToast({ content: error, type: "error" })
                        },
                    }
                )
            } else if (cmd.type == "cmd") {
                if (
                    processor.startCatchResponse(
                        currentFS,
                        "list",
                        processFeedback
                    )
                )
                    sendSerialCmd(cmd.cmd)
            }
        }
    }

    useEffect(() => {
        if (currentFS == "") {
            const fs = files.supported.find((element: SupportedFS) => {
                if (element.depend) if (element.depend()) return true
                return false
            })
            if (fs) {
                currentFS = fs.value
                onSelectFS(undefined, !useUiContextFn.getValue("autoload"))
                currentFSNeedInit = false
            }
        } else {
            if (currentFSNeedInit) {
                currentFSNeedInit = false
                onSelectFS(undefined, !useUiContextFn.getValue("autoload"))
            }
        }
        setupFileInput()
    }, [])
    const openFileUploadBrowser = () => {
        useUiContextFn.haptic()
        if (fileref.current) {
            fileref.current.value = ""
            fileref.current.click()
        }
    }
    const showCreateDirModal = () => {
        useUiContextFn.haptic()
        let name: string = ""
        showModal({
            modals,
            title: T("S104"),
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (name.length > 0) createDirectory(name)
                },
                text: T("S106"),
            },
            icon: <Edit3 />,
            id: "inputName",
            content: (
                <Fragment>
                    <div>{T("S105")}</div>
                    <input
                        class="form-input"
                        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                            name = e.currentTarget.value.trim()
                        }}
                    />
                </Fragment>
            ),
        })
    }

    useEffect(() => {
        const newMenu = () => {
            const rawMenuItems = [
                {
                    capability: "CreateDir",
                    label: T("S90"),
                    icon: (
                        <span class="feather-icon-container">
                            <FolderPlus style={{ width: "0.8rem", height: "0.8rem" }} />
                        </span>
                    ),
                    onClick: showCreateDirModal,
                },
                {
                    capability: "Upload",
                    label: T("S89"),
                    displayToggle: () => (
                        <span class="feather-icon-container">
                            <Upload style={{ width: "0.8rem", height: "0.8rem" }} />
                        </span>
                    ),
                    onClick: openFileUploadBrowser,
                },
                { divider: true },
                {
                    label: T("S50"),
                    onClick: onRefresh,
                    icon: (
                        <span class="feather-icon-container">
                            <RefreshCcw style={{ width: "0.8rem", height: "0.8rem" }} />
                        </span>
                    ),
                },
            ]
            const capabilities = ["CreateDir", "Upload"].filter((cap) =>
                files.capability(currentFS, cap)
            )

            return rawMenuItems.filter((item) => {
                if (item.capability)
                    return capabilities.includes(item.capability)
                if (item.divider && capabilities.length <= 0) return false
                return true
            })
        }
        setMenu(newMenu())
    }, [fileSystem])

    console.log("[Files panel] Render")
    return (
        <div class="panel panel-dashboard" id={id}>
            <input
                type="file"
                ref={fileref}
                class="d-none"
                onChange={filesSelected}
            />
            <ContainerHelper id={id} /> 
            <div class="navbar">
                <span class="navbar-section  feather-icon-container">
                    <HardDrive />
                    <strong class="text-ellipsis">{T("S65")}</strong>
                </span>

                <span class="navbar-section">
                    <span class="full-height">
                        {fileSystem != "" && !isLoading && (
                            <PanelMenu items={menu || []} />
                        )}
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
            <div class="input-group m-2">
                <div>
                    <select
                        class="form-select"
                        onChange={onSelectFS}
                        value={currentFS}
                    >
                        {files.supported.map((element: SupportedFS) => {
                            if (element.depend)
                                if (element.depend())
                                    return (
                                        <option value={element.value}>
                                            {T(element.name)}
                                        </option>
                                    )
                        })}
                    </select>
                </div>
                <div class="form-control m-1">{filePath ? filePath : ""}</div>
            </div>

            <div
                ref={dropRef}
                class="drop-zone files-list m-1"
                onDragOver={(e) => {
                    dropRef.current!.classList.add("drop-zone--over")
                    e.preventDefault()
                }}
                onDragLeave={(e) => {
                    dropRef.current!.classList.remove("drop-zone--over")
                    e.preventDefault()
                }}
                onDragEnd={(e) => {
                    dropRef.current!.classList.remove("drop-zone--over")
                    e.preventDefault()
                }}
                onDrop={(e) => {
                    dropRef.current!.classList.remove("drop-zone--over")
                    const dt = e.dataTransfer as DataTransfer
                    if (dt && dt.files.length) {
                        const length = dt.items.length
                        if (!fileref.current || (!fileref.current.multiple && length > 1)) {
                            toasts.addToast({
                                content: T("S193"),
                                type: "error",
                            })
                            console.log("Multiple detected abort")
                            e.preventDefault()
                            return
                        }
                        //webkitGetAsEntry seems experimental
                        type ItemWithWebkit = DataTransferItem & {
                            webkitGetAsEntry?: () => { isDirectory?: boolean }
                        }
                        if (dt.items && (dt.items[0] as unknown as ItemWithWebkit).webkitGetAsEntry?.()) {
                            for (let i = 0; i < length; i++) {
                                const entry = (dt.items[i] as unknown as ItemWithWebkit).webkitGetAsEntry?.()
                                if (entry && entry.isDirectory) {
                                    toasts.addToast({
                                        content: T("S192"),
                                        type: "error",
                                    })
                                    console.log("Directory detected abort")
                                    e.preventDefault()
                                    return
                                }
                            }
                        }
                    }

                    if (fileref.current) (fileref.current as unknown as { files: FileList }).files = dt.files

                    filesSelected(e as unknown as JSX.TargetedEvent<HTMLInputElement, Event>)
                    e.preventDefault()
                }}
            >
                {isLoading && fileSystem != "" && (
                    <Fragment>
                        <div style="text-align:center">
                            <Loading class="m-2" />

                            <ButtonImg
                                donotdisable
                                icon={<XCircle />}
                                label={T("S28")}
                                btooltip
                                data-tooltip={T("S28")}
                                onClick={onCancel}
                            />
                        </div>
                    </Fragment>
                )}

                {!isLoading && fileSystem != "" && filesList && (
                    <Fragment>
                        {currentPath[currentFS] != "/" && (
                            <div
                                class="file-line file-line-name"
                                        onClick={(e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
                                            useUiContextFn.haptic()
                                            const newpath = currentPath[
                                                currentFS
                                            ].substring(
                                        0,
                                        currentPath[currentFS].lastIndexOf("/")
                                    )

                                    currentPath[currentFS] =
                                        newpath.length == 0 ? "/" : newpath
                                    onRefresh(
                                        e,
                                        files.capability(currentFS, "IsFlatFS")
                                    )
                                }}
                            >
                                <div
                                    class="form-control go-previous file-line-name file-line-action"
                                >
                                    <CornerRightUp />
                                    <label class="go-previous-text">...</label>
                                </div>
                            </div>
                        )}
                        {filesList.files.map((line: FileEntry) => {
                            return (
                                <div class="file-line form-control">
                                    <div
                                        class={`feather-icon-container file-line-name ${
                                            files.capability(
                                                fileSystem,
                                                "Download"
                                            ) || line.size == -1
                                                ? "file-line-action"
                                                : ""
                                        }`}
                                        onClick={(e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
                                            useUiContextFn.haptic()
                                            ElementClicked(e, line)
                                        }}
                                    >
                                        {line.size == -1 ? (
                                            <Folder />
                                        ) : (
                                            <File />
                                        )}
                                        <label>{line.name}</label>
                                    </div>
                                    <div class="file-line-controls">
                                        {line.size != -1 && (
                                            <Fragment>
                                                <div>{fileSizeString(line.size)}</div>
                                                {files.capability(
                                                    currentFS,
                                                    "Process",
                                                    currentPath[currentFS],
                                                    line.name
                                                ) && (
                                                    <ButtonImg
                                                        m1
                                                        ltooltip
                                                        data-tooltip={T("S74")}
                                                        icon={<Play />}
                                                        onClick={(e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
                                                            e.currentTarget.blur()
                                                            useUiContextFn.haptic()
                                                            const cmd =
                                                                files.command(
                                                                    currentFS,
                                                                    "play",
                                                                    currentPath[
                                                                        currentFS
                                                                    ],
                                                                    line.name
                                                                )
                                                            sendSerialCmd(
                                                                cmd.cmd
                                                            )
                                                        }}
                                                    />
                                                )}
                                                {!files.capability(
                                                    currentFS,
                                                    "Process",
                                                    currentPath[currentFS],
                                                    line.name
                                                ) && <div style="width:2rem" />}
                                            </Fragment>
                                        )}
                                        {files.capability(
                                            currentFS,
                                            line.size == -1
                                                ? "DeleteDir"
                                                : "DeleteFile",
                                            currentPath[currentFS],
                                            line.name
                                        ) && (
                                            <ButtonImg
                                                m1
                                                ltooltip
                                                data-tooltip={
                                                    line.size == -1
                                                        ? T("S101")
                                                        : T("S100")
                                                }
                                                icon={<Trash2 />}
                                                onClick={(e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
                                                    useUiContextFn.haptic()
                                                    e.currentTarget.blur()
                                                    const content = (
                                                        <Fragment>
                                                            <div>
                                                                {line.size == -1
                                                                    ? T("S101")
                                                                    : T("S100")}
                                                                :
                                                            </div>
                                                            <div style="text-align:center">
                                                                <li>
                                                                    {line.name}
                                                                </li>
                                                            </div>
                                                        </Fragment>
                                                    )
                                                    showConfirmationModal({
                                                        modals,
                                                        title: T("S26"),
                                                        content,
                                                        button1: {
                                                            cb: () => {
                                                                deleteCommand(
                                                                    line
                                                                )
                                                            },
                                                            text: T("S27"),
                                                        },
                                                        button2: {
                                                            text: T("S28"),
                                                        },
                                                    })
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </Fragment>
                )}
            </div>
            <div class="files-list-footer">
                {!isLoading && filesList && filesList.occupation && (
                    <div class="filelist-occupation">
                        <div class="flex-pack">
                            {T("S98")}:{filesList.total}
                        </div>
                        <div class="m-1">-</div>
                        <div class="flex-pack m-2">
                            {T("S99")}:{filesList.used}
                        </div>
                        <div class="flex-pack hide-low m-1">
                            <div class="bar bar-sm" style="width:4rem">
                                <div
                                    class="bar-item"
                                    role="progressbar"
                                    style={`width:${filesList.occupation}%`}
                                    aria-valuenow={filesList.occupation}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                ></div>
                            </div>

                            <span class="m-1">{filesList.occupation}%</span>
                        </div>
                    </div>
                )}
                {!isLoading && filesList && filesList.status && (
                    <div class="file-status">{T(filesList.status)}</div>
                )}
            </div>
        </div>
    )
}

const FilesPanelElement = {
    id: "filesPanel",
    content: <FilesPanel />,
    name: "S65",
    icon: "HardDrive",
    show: "showfilespanel",
    onstart: "openfilesonstart",
    settingid: "files",
}

export { FilesPanel, FilesPanelElement }
