/*
 FilesTab.tsx - ESP3D WebUI Tablet Files Tab

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

import { FunctionalComponent, Fragment } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import { T } from "../../components/Translations"
import { useFilesManager, fileSizeString, getCurrentPath, setFileRef } from "../../hooks/useFilesManager"
import type { FileEntry, FilesList, SortField, SortOrder } from "../../types/files.types"
import { Loading } from "../../components/Controls"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { showConfirmationModal } from "../../components/Modal"
import {
    Upload,
    RefreshCcw,
    FolderPlus,
    CornerRightUp,
    XCircle,
    ArrowUp,
    ArrowDown,
    Minimize,
    Folder,
    File,
    Trash2,
    Play,
} from "preact-feather"
import { files } from "../../targets"

const FilesTab: FunctionalComponent = () => {
    const [state, actions] = useFilesManager()
    const [sortBy, setSortBy] = useState<SortField>("name")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
    const [isFullScreen, setIsFullScreen] = useState(false)
    const fileref = useRef<HTMLInputElement | null>(null)
    const { modals } = useModalsContext()

    // Register the file input ref with the hook and update multiple attribute when filesystem changes
    useEffect(() => {
        setFileRef(fileref.current)
        if (fileref.current && state.fileSystem) {
            fileref.current.multiple = files.capability(state.fileSystem, "UploadMultiple")
        }
    }, [state.fileSystem])

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
    }, [])

    // Sort files
    const sortFiles = (filesList: FilesList) => {
        if (!filesList || !filesList.files) return filesList

        const sorted = { ...filesList }
        sorted.files = [...filesList.files].sort((a, b) => {
            // Always keep directories first
            if (a.size === -1 && b.size !== -1) return -1
            if (a.size !== -1 && b.size === -1) return 1

            let comparison = 0
            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name)
                    break
                case "size":
                    // For directories (size -1), compare by name
                    if (a.size === -1 && b.size === -1) {
                        comparison = a.name.localeCompare(b.name)
                    } else {
                        comparison = (a.size || 0) - (b.size || 0)
                    }
                    break
                case "date":
                    // Compare by date if available, otherwise by name
                    if (a.datetime && b.datetime) {
                        comparison = a.datetime.localeCompare(b.datetime)
                    } else {
                        comparison = a.name.localeCompare(b.name)
                    }
                    break
            }

            return sortOrder === "asc" ? comparison : -comparison
        })

        return sorted
    }

    const toggleSort = (field: SortField) => {
        useUiContextFn.haptic()
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    const currentPath = getCurrentPath()
    const isError = state.filesList?.status === T("S22") || state.filesList?.status === T("S110")
    return (
        <div class="tablet-files-container">
            <input ref={fileref} type="file" class="d-none" onChange={(e) => actions.filesSelected(e)} />

            {/* Toolbar */}
            <div class="tablet-files-toolbar">
                {/* File System Selection */}
                <div class="files-toolbar-section">
                    <div class="btn-group btn-group-block">
                        {files.supported.map((fs: any) => {
                            if (fs.depend && !fs.depend()) return null
                            return (
                                <button
                                    key={fs.value}
                                    class={`btn btn-sm ${state.fileSystem === fs.value ? "btn-primary" : ""}`}
                                    onClick={() => {
                                        const mockEvent = {
                                            currentTarget: { value: fs.value },
                                            target: { value: fs.value },
                                        } as any
                                        actions.onSelectFS(mockEvent)
                                    }}>
                                    {T(fs.name)}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Sort Buttons */}
                {state.fileSystem != "" && !state.isLoading && (
                    <div class="files-toolbar-section files-toolbar-sort">
                        <span class="sort-label">Sort:</span>
                        <div class="btn-group btn-group-block">
                            <button
                                class={`btn btn-sm ${sortBy === "name" ? "btn-primary" : ""}`}
                                onClick={() => toggleSort("name")}
                                title="Sort by name">
                                Name{" "}
                                {sortBy === "name" &&
                                    (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                            </button>
                            <button
                                class={`btn btn-sm ${sortBy === "size" ? "btn-primary" : ""}`}
                                onClick={() => toggleSort("size")}
                                title="Sort by size">
                                Size{" "}
                                {sortBy === "size" &&
                                    (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                            </button>
                            <button
                                class={`btn btn-sm ${sortBy === "date" ? "btn-primary" : ""}`}
                                onClick={() => toggleSort("date")}
                                title="Sort by date">
                                Date{" "}
                                {sortBy === "date" &&
                                    (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {state.fileSystem != "" && !state.isLoading && (
                    <div class="files-toolbar-section files-toolbar-actions">
                        <button
                            class="btn btn-sm"
                            onClick={(e) => actions.onRefresh(e as unknown as Event)}
                            title={T("S50")}>
                            <RefreshCcw size={16} />
                        </button>
                        {files.capability(state.fileSystem, "Upload") && (
                            <button
                                class="btn btn-sm"
                                onClick={actions.openFileUploadBrowser}
                                title={T("S89")}
                                disabled={isError}>
                                <Upload size={16} />
                            </button>
                        )}
                        {files.capability(state.fileSystem, "CreateDir") && (
                            <button
                                class="btn btn-sm"
                                onClick={actions.showCreateDirModal}
                                title={T("S90")}
                                disabled={isError}>
                                <FolderPlus size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Minimize/Exit Button - only show when in fullscreen context */}
                {isFullScreen && (
                    <button
                        class="btn btn-sm"
                        onClick={() => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen()
                            }
                        }}
                        title="Exit fullscreen"
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "1.2rem",
                            minWidth: "2.2rem",
                        }}>
                        <Minimize size={16} />
                    </button>
                )}
            </div>

            {/* Current Path */}
            <div class="tablet-files-path">{state.filePath ? state.filePath : "/"}</div>

            {/* Files List */}
            <div
                class="tablet-files-list"
                onDragOver={(e) => {
                    e.preventDefault()
                }}
                onDragLeave={(e) => {
                    e.preventDefault()
                }}
                onDragEnd={(e) => {
                    e.preventDefault()
                }}
                onDrop={(e) => {
                    e.preventDefault()
                }}>
                {state.isLoading && state.fileSystem != "" && (
                    <div class="tablet-files-loading">
                        <Loading class="m-2" />
                        <button class="btn" onClick={actions.onCancel}>
                            <XCircle size={16} />
                            <span class="ml-1">{T("S28")}</span>
                        </button>
                    </div>
                )}

                {!state.isLoading && state.fileSystem != "" && state.filesList && (
                    <Fragment>
                        {currentPath[state.fileSystem] != "/" && (
                            <div
                                class="tablet-file-item"
                                onClick={(e) => {
                                    useUiContextFn.haptic()
                                    const newpath = currentPath[state.fileSystem].substring(
                                        0,
                                        currentPath[state.fileSystem].lastIndexOf("/")
                                    )

                                    currentPath[state.fileSystem] = newpath.length == 0 ? "/" : newpath
                                    actions.onRefresh(e, false)
                                }}>
                                <div class="file-item-name">
                                    <CornerRightUp size={20} />
                                    <span>...</span>
                                </div>
                            </div>
                        )}
                        {sortFiles(state.filesList).files.map((line: FileEntry) => {
                            return (
                                <div class="tablet-file-item" key={line.name}>
                                    <div
                                        class="file-item-name"
                                        onClick={(e) => {
                                            useUiContextFn.haptic()
                                            actions.ElementClicked(e as unknown as Event, line)
                                        }}>
                                        {line.size == -1 ? <Folder size={20} /> : <File size={20} />}
                                        <span>{line.name}</span>
                                    </div>
                                    <div class="file-item-controls">
                                        {line.datetime && <span class="file-item-date">{line.datetime}</span>}
                                        {line.size != -1 && (
                                            <Fragment>
                                                <span class="file-item-size">{fileSizeString(line.size)}</span>
                                                {files.capability(
                                                    state.fileSystem,
                                                    "Process",
                                                    currentPath[state.fileSystem],
                                                    line.name
                                                ) && (
                                                    <button
                                                        class="btn btn-sm btn-action"
                                                        title={T("S74")}
                                                        onClick={(e) => {
                                                            const el = e.target as HTMLElement
                                                            el.blur()
                                                            useUiContextFn.haptic()
                                                            const cmd = files.command(
                                                                state.fileSystem,
                                                                "play",
                                                                currentPath[state.fileSystem],
                                                                line.name
                                                            )
                                                            actions.sendSerialCmd(cmd.cmd)
                                                        }}>
                                                        <Play size={16} />
                                                    </button>
                                                )}
                                            </Fragment>
                                        )}
                                        {files.capability(
                                            state.fileSystem,
                                            line.size == -1 ? "DeleteDir" : "DeleteFile",
                                            currentPath[state.fileSystem],
                                            line.name
                                        ) && (
                                            <button
                                                class="btn btn-sm btn-action"
                                                title={line.size == -1 ? T("S101") : T("S100")}
                                                onClick={(e) => {
                                                    useUiContextFn.haptic()
                                                    const el = e.target as HTMLElement
                                                    el.blur()
                                                    const content = (
                                                        <Fragment>
                                                            <div>{line.size == -1 ? T("S101") : T("S100")}:</div>
                                                            <div style="text-align:center">
                                                                <li>{line.name}</li>
                                                            </div>
                                                        </Fragment>
                                                    )
                                                    showConfirmationModal({
                                                        modals,
                                                        title: T("S26"),
                                                        content,
                                                        button1: {
                                                            cb: () => {
                                                                actions.deleteCommand(line)
                                                            },
                                                            text: T("S27"),
                                                        },
                                                        button2: {
                                                            text: T("S28"),
                                                        },
                                                    })
                                                }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </Fragment>
                )}
            </div>

            {/* Footer */}
            {!state.isLoading && state.filesList && (state.filesList.occupation || state.filesList.status) && (
                <div
                    class="tablet-files-footer"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        {state.filesList.occupation && (
                            <Fragment>
                                <span>
                                    {T("S98")}: {state.filesList.total}
                                </span>
                                <span>-</span>
                                <span>
                                    {T("S99")}: {state.filesList.used}
                                </span>
                                <span>({state.filesList.occupation}%)</span>
                            </Fragment>
                        )}
                    </div>
                    <div style={{ marginLeft: "auto" }}>{state.filesList.status && T(state.filesList.status)}</div>
                </div>
            )}
        </div>
    )
}

export { FilesTab }
