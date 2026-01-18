/*
useFilesManager.ts - Shared files management hook

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

import { h } from "preact"
import { useEffect, useState } from "preact/hooks"
import { T } from "../components/Translations"
import { useHttpFn } from "./useHttpQueue"
import type { UseHttpFn } from "./useHttpQueue"
import { useTargetCommands  } from "./useTargetCommands"
import { espHttpURL, getBrowserTime } from "../components/Helpers"
import { useUiContextFn, useModalsContext, useToastsContext } from "../contexts"
import { showModal, showConfirmationModal, showProgressModal } from "../components/Modal"
import Progress from "../components/Controls/Progress"
import { files, processor } from "../targets"
import type {
    FileEntry,
    FilesList,
    SupportedFileType,
    UrlCommand,
} from "../types/files.types"

// Module-level state shared across hook instances
let currentFS: string = ""
const currentPath: Record<string, string> = {}
const filesListCache: Record<string, FilesList> = {}
let currentFSNeedInit = true

export function fileSizeString(size: number | string): string {
    if (typeof size === "string") return size
    if (size === -1) return ""
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    let i = 0
    while (size >= 1024) {
        size /= 1024
        ++i
    }
    return `${size.toFixed(2)} ${units[i]}`
}

export interface FilesManagerState {
    filePath: string
    isLoading: boolean
    fileSystem: string
    filesList: FilesList | undefined
}

export interface FilesManagerActions {
    onSelectFS: (e?: Event, norefresh?: boolean) => void
    onRefresh: (e?: Event | null, usecache?: boolean) => void
    uploadFiles: () => void
    filesSelected: (e: Event) => void
    downloadFile: (element: FileEntry) => void
    createDirectory: (name: string) => void
    deleteCommand: (element: FileEntry) => void
    ElementClicked: (e: Event, line: FileEntry) => void
    openFileUploadBrowser: () => void
    showCreateDirModal: () => void
    onCancel: () => void
    setupFileInput: () => void
    sendSerialCmd: (command: string) => void
    sendURLCmd: (cmd: UrlCommand) => void
    processFeedback: (feedback: any) => void
}

export function useFilesManager(): [FilesManagerState, FilesManagerActions] {
    const valids = files.supported.reduce((acc: string[], element: SupportedFileType) => {
        if (element.depend) if (element.depend()) acc.push(element.value)
        return acc
    }, [])

    if (currentFS === "") {
        currentFS = useUiContextFn.getValue("default_filesystem")
        if (typeof currentFS === "undefined" || !valids.includes(currentFS))
            currentFS = ""
    }

    const [filePath, setFilePath] = useState<string>(currentPath[currentFS] || "/")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [fileSystem, setFileSystem] = useState<string>(currentFS)
    const [filesList, setFilesList] = useState<FilesList | undefined>(
        filesListCache[currentFS]
    )
    const { createNewRequest, abortRequest } = useHttpFn as UseHttpFn
    const { targetCommands } = useTargetCommands()
    const { modals } = useModalsContext()
    const { toasts } = useToastsContext()

    // Use a ref wrapper that works with module-level refs
    const fileref = {
        get current(): HTMLInputElement | null {
            return hookFileRef
        },
        set current(value: HTMLInputElement | null) {
            hookFileRef = value
        }
    }

    const progressBar: { update?: (n: number) => void } = {}

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
            status: "S22",
        }
        setFilesList(filesListCache[currentFS])
    }

    const sendSerialCmd = (command: string): void => {
        const callbacks = {
            onSuccess: (_result: string) => {
                //Result is handled on ws so just do nothing
            },
            onfail: (error: string) => {
                console.log(error)
                processor.stopCatchResponse()
                setIsLoading(false)
                toasts.addToast({ content: error, type: "error" })
            },
        }
        targetCommands(command, ";", undefined, callbacks)
    }

    const sendURLCmd = (cmd: UrlCommand): void => {
        createNewRequest(
            espHttpURL(cmd.url, cmd.args),
            { method: "GET" },
            {
                onSuccess: (result: string) => {
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
                        status: "S22",
                    }
                    setFilesList(filesListCache[currentFS])
                } else {
                    filesListCache[currentFS] = files.command(
                        currentFS,
                        "formatResult",
                        feedback
                    )

                    setFilesList(filesListCache[currentFS])
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
                content: h(Progress, { progressBar, max: 100 }),
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
                    `${cmd.args.path +
                    (cmd.args.path.endsWith("/") ? "" : "/") +
                    fileName 
                    }S`
                //append file size first to check updload is complete
                formData.append(arg, String(file.size))
                //append last modified time
                //no need timezone because will be saved as it is on FileSystem
                const time_string = getBrowserTime(file.lastModified)
                const argt = `${arg.substring(0, arg.length - 1)  }T`
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
                    onSuccess: (result: string) => {
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

    const filesSelected = (_e: Event) => {
        const content: any[] = []
        const length = fileref.current?.files?.length || 0
        for (let index = 0; index < length; index++) {
            const file = fileref.current!.files![index]
            content.push(h("li", {}, file.name))
            if (
                !files.capability(
                    currentFS,
                    "Upload",
                    currentPath[currentFS],
                    file.name
                )
            ) {
                const eMsg = files.capability(
                    currentFS,
                    "Upload",
                    currentPath[currentFS],
                    file.name,
                    true
                )
                toasts.addToast({ content: T(eMsg), type: "error" })
            }
        }

        showConfirmationModal({
            modals,
            title: T("S31"),
            content: h("div", {}, content),
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
            content: h(Progress, { progressBar, max: 100 }),
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
                        setTimeout(() => {
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
        if (fileref.current)
            fileref.current.multiple = files.capability(
                currentFS,
                "UploadMultiple"
            )
        if (files.capability(currentFS, "UseFilters")) {
            let f = useUiContextFn.getValue("filesfilter").trim()
            if (f.length > 0 && f != "*") {
                f = `.${f.replace(/;/g, ",.")}`
            } else f = "*"
            if (fileref.current) fileref.current.accept = f
        } else {
            if (fileref.current) fileref.current.accept = "*"
        }
    }

    const onSelectFS = (e?: Event | any, norefresh: boolean = false) => {
        if (e) {
            // Handle both select elements and button clicks
            let fsValue: any = null

            // Try to get value from various possible sources
            if (e.target?.value) {
                fsValue = e.target.value
            } else if (e.currentTarget?.value) {
                fsValue = e.currentTarget.value
            }

            // Update currentFS if we found a value
            if (fsValue) {
                currentFS = fsValue
            }
        }
        setupFileInput()
        setFileSystem(currentFS)
        if (!currentPath[currentFS]) {
            currentPath[currentFS] = "/"
        }
        if (!norefresh) onRefresh(e, true)
    }

    const ElementClicked = (e: Event, line: FileEntry) => {
        if (line.size == -1) {
            currentPath[currentFS] =
                currentPath[currentFS] +
                (currentPath[currentFS] == "/" ? "" : "/") +
                line.name
            onRefresh(e, false)
        } else {
            if (files.capability(currentFS, "Download")) {
                const content = h("li", {}, line.name)
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
            setFilesList(filesListCache[currentFS])
            setIsLoading(false)
        } else {
            const cmd = files.command(currentFS, "list", currentPath[currentFS])
            if (cmd.type == "url") {
                createNewRequest(
                    espHttpURL(cmd.url, cmd.args),
                    { method: "GET" },
                    {
                        onSuccess: (result: string) => {
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
                        processFeedback,
                        undefined
                    )
                )
                    sendSerialCmd(cmd.cmd)
            }
        }
    }

    useEffect(() => {
        if (currentFS == "") {
            const fs = files.supported.find((element: SupportedFileType) => {
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
            icon: null,
            id: "inputName",
            content: h(
                "div",
                {},
                h("div", {}, T("S105")),
                h("input", {
                    class: "form-input",
                    onInput: (e: Event) => {
                        if (e.target instanceof HTMLInputElement) {
                            name = e.target.value.trim()
                        }
                    },
                })
            ),
        })
    }

    const state: FilesManagerState = {
        filePath,
        isLoading,
        fileSystem,
        filesList,
    }

    const actions: FilesManagerActions = {
        onSelectFS,
        onRefresh,
        uploadFiles,
        filesSelected,
        downloadFile,
        createDirectory,
        deleteCommand,
        ElementClicked,
        openFileUploadBrowser,
        showCreateDirModal,
        onCancel,
        setupFileInput,
        sendSerialCmd,
        sendURLCmd,
        processFeedback,
    }

    return [state, actions]
}

// Module-level refs that can be accessed from components
let hookFileRef: HTMLInputElement | null = null
let hookDropRef: HTMLDivElement | null = null

// Export refs for external access
export function setFileRef(ref: HTMLInputElement | null): void {
    hookFileRef = ref
}

export function setDropRef(ref: HTMLDivElement | null): void {
    hookDropRef = ref
}

export function getFileRef(): { current: HTMLInputElement | null } {
    return { current: hookFileRef }
}

export function getDropRef(): { current: HTMLDivElement | null } {
    return { current: hookDropRef }
}

export function getCurrentFS(): string {
    return currentFS
}

export function getCurrentPath(): Record<string, string> {
    return currentPath
}

export function getFilesListCache(): Record<string, FilesList> {
    return filesListCache
}
