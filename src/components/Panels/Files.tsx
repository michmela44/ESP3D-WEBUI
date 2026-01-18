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

import { Fragment, TargetedMouseEvent } from "preact"
import type { FunctionalComponent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import { T } from "../Translations"
import { useFilesManager, fileSizeString, getCurrentPath, setFileRef } from "../../hooks/useFilesManager"
import type { FileEntry, PanelMenuItem } from "../../types/files.types"
import { FilesTab } from "../../pages/tablet/FilesTab"
import { Loading, ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { showConfirmationModal } from "../Modal"
import { HardDrive, Upload, RefreshCcw, FolderPlus, CornerRightUp, XCircle } from "preact-feather"
import { files } from "../../targets"
import { Folder, File, Trash2, Play } from "preact-feather"
import { Menu as PanelMenu } from "./"
import { eventBus } from "../../hooks/eventBus"

const FilesPanel: FunctionalComponent = () => {
    const id = "filesPanel"
    const [state, actions] = useFilesManager()
    const [menu, setMenu] = useState<PanelMenuItem[] | null>(null)
    const fileref = useRef<HTMLInputElement | null>(null)
    const dropRef = useRef<HTMLDivElement | null>(null)
    const { modals } = useModalsContext()
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

    // Register the file input ref with the hook and update multiple attribute when filesystem changes
    useEffect(() => {
        setFileRef(fileref.current)
        if (fileref.current && state.fileSystem) {
            fileref.current.multiple = files.capability(state.fileSystem, "UploadMultiple")
        }
    }, [state.fileSystem])

    useEffect(() => {
        const listenerId = eventBus.on(
            "updateState",
            (data: any) => {
                if (data.id === "filesPanel") {
                    setIsFullScreen(data.isFullScreen)
                }
            },
            "filesPanel-fullscreen"
        )

        return () => {
            eventBus.off("updateState", listenerId)
        }
    }, [])

    useEffect(() => {
        const newMenu = () => {
            const isError = state.filesList?.status === T("S22") || state.filesList?.status === T("S110")
            const rawMenuItems = [
                {
                    capability: "CreateDir",
                    label: T("S90"),
                    icon: (
                        <span class="feather-icon-container">
                            <FolderPlus style={{ width: "0.8rem", height: "0.8rem" }} />
                        </span>
                    ),
                    onClick: actions.showCreateDirModal,
                    disabled: isError,
                },
                {
                    capability: "Upload",
                    label: T("S89"),
                    displayToggle: () => (
                        <span class="feather-icon-container">
                            <Upload style={{ width: "0.8rem", height: "0.8rem" }} />
                        </span>
                    ),
                    onClick: actions.openFileUploadBrowser,
                    disabled: isError,
                },
                { divider: true },
                {
                    label: T("S50"),
                    onClick: actions.onRefresh,
                    icon: (
                        <span class="feather-icon-container">
                            <RefreshCcw style={{ width: "0.8rem", height: "0.8rem" }} />
                        </span>
                    ),
                },
            ]
            const capabilities = ["CreateDir", "Upload"].filter((cap) => files.capability(state.fileSystem, cap))

            return rawMenuItems.filter((item) => {
                if (item.capability) return capabilities.includes(item.capability)
                if (item.divider && capabilities.length <= 0) return false
                return true
            })
        }
        setMenu(newMenu())
    }, [state.fileSystem, state.filesList?.status])

    // Render compact panel view
    const renderCompactView = () => {
        const currentPath = getCurrentPath()

        return (
            <div class="panel panel-dashboard" id={id}>
                <ContainerHelper id={id} />
                {!isFullScreen && (
                    <Fragment>
                        <input type="file" ref={fileref} class="d-none" onChange={(e) => actions.filesSelected(e)} />
                        <div class="navbar">
                            <span class="navbar-section  feather-icon-container">
                                <HardDrive />
                                <strong class="text-ellipsis">{T("S65")}</strong>
                            </span>

                            <span class="navbar-section">
                                <span class="full-height">
                                    {state.fileSystem != "" && !state.isLoading && <PanelMenu items={menu || []} />}
                                    <FullScreenButton elementId={id} />
                                    <CloseButton elementId={id} hideOnFullScreen={true} />
                                </span>
                            </span>
                        </div>
                        <div class="input-group m-2">
                            <div>
                                <select
                                    class="form-select"
                                    onChange={(e) => actions.onSelectFS(e)}
                                    value={state.fileSystem}>
                                    {files.supported.map((element: any) => {
                                        if (element.depend)
                                            if (element.depend())
                                                return <option key={element.value} value={element.value}>{T(element.name)}</option>
                                    })}
                                </select>
                            </div>
                            <div class="form-control m-1">{state.filePath ? state.filePath : ""}</div>
                        </div>

                        <div
                            ref={dropRef}
                            class="drop-zone files-list m-1"
                            onDragOver={(e) => {
                                dropRef.current?.classList.add("drop-zone--over")
                                e.preventDefault()
                            }}
                            onDragLeave={(e) => {
                                dropRef.current?.classList.remove("drop-zone--over")
                                e.preventDefault()
                            }}
                            onDragEnd={(e) => {
                                dropRef.current?.classList.remove("drop-zone--over")
                                e.preventDefault()
                            }}
                            onDrop={(e) => {
                                dropRef.current?.classList.remove("drop-zone--over")
                                const dt = e.dataTransfer as DataTransfer
                                if (dt && dt.files.length) {
                                    const length = dt.items.length
                                    if (!fileref.current || (!fileref.current.multiple && length > 1)) {
                                        e.preventDefault()
                                        return
                                    }
                                }

                                if (fileref.current)
                                    (fileref.current as unknown as { files: FileList }).files = dt.files

                                actions.filesSelected(e as unknown as Event)
                                e.preventDefault()
                            }}>
                            {state.isLoading && state.fileSystem != "" && (
                                <Fragment>
                                    <div style="text-align:center">
                                        <Loading class="m-2" />

                                        <ButtonImg
                                            donotdisable
                                            icon={<XCircle />}
                                            label={T("S28")}
                                            btooltip
                                            data-tooltip={T("S28")}
                                            onClick={actions.onCancel}
                                        />
                                    </div>
                                </Fragment>
                            )}

                            {!state.isLoading && state.fileSystem != "" && state.filesList && (
                                <Fragment>
                                    {currentPath[state.fileSystem] != "/" && (
                                        <div
                                            class="file-line file-line-name"
                                            onClick={(e: TargetedMouseEvent<HTMLDivElement>) => {
                                                useUiContextFn.haptic()
                                                const newpath = currentPath[state.fileSystem].substring(
                                                    0,
                                                    currentPath[state.fileSystem].lastIndexOf("/")
                                                )

                                                currentPath[state.fileSystem] = newpath.length == 0 ? "/" : newpath
                                                actions.onRefresh(
                                                    e,
                                                    false
                                                )
                                            }}>
                                            <div class="form-control go-previous file-line-name file-line-action">
                                                <CornerRightUp />
                                                <label class="go-previous-text">...</label>
                                            </div>
                                        </div>
                                    )}
                                    {state.filesList.files.map((line: FileEntry) => {
                                        return (
                                            <div class="file-line form-control" key={line.name}>
                                                <div
                                                    class={`feather-icon-container file-line-name ${
                                                        files.capability(state.fileSystem, "Download") ||
                                                        line.size == -1
                                                            ? "file-line-action"
                                                            : ""
                                                    }`}
                                                    onClick={(e: TargetedMouseEvent<HTMLDivElement>) => {
                                                        useUiContextFn.haptic()
                                                        actions.ElementClicked(e as unknown as Event, line)
                                                    }}>
                                                    {line.size == -1 ? <Folder /> : <File />}
                                                    <label>{line.name}</label>
                                                </div>
                                                <div class="file-line-controls">
                                                    {line.size != -1 && (
                                                        <Fragment>
                                                            <div>{fileSizeString(line.size)}</div>
                                                            {files.capability(
                                                                state.fileSystem,
                                                                "Process",
                                                                currentPath[state.fileSystem],
                                                                line.name
                                                            ) && (
                                                                <ButtonImg
                                                                    m1
                                                                    ltooltip
                                                                    data-tooltip={T("S74")}
                                                                    icon={<Play />}
                                                                    onClick={(
                                                                        e: TargetedMouseEvent<HTMLButtonElement>
                                                                    ) => {
                                                                        e.currentTarget.blur()
                                                                        useUiContextFn.haptic()
                                                                        const cmd = files.command(
                                                                            state.fileSystem,
                                                                            "play",
                                                                            currentPath[state.fileSystem],
                                                                            line.name
                                                                        )
                                                                        actions.sendSerialCmd(cmd.cmd)
                                                                    }}
                                                                />
                                                            )}
                                                            {!files.capability(
                                                                state.fileSystem,
                                                                "Process",
                                                                currentPath[state.fileSystem],
                                                                line.name
                                                            ) && <div style="width:2rem" />}
                                                        </Fragment>
                                                    )}
                                                    {files.capability(
                                                        state.fileSystem,
                                                        line.size == -1 ? "DeleteDir" : "DeleteFile",
                                                        currentPath[state.fileSystem],
                                                        line.name
                                                    ) && (
                                                        <ButtonImg
                                                            m1
                                                            ltooltip
                                                            data-tooltip={line.size == -1 ? T("S101") : T("S100")}
                                                            icon={<Trash2 />}
                                                            onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                                useUiContextFn.haptic()
                                                                e.currentTarget.blur()
                                                                const content = (
                                                                    <Fragment>
                                                                        <div>
                                                                            {line.size == -1 ? T("S101") : T("S100")}:
                                                                        </div>
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
                            {!state.isLoading && state.filesList && state.filesList.occupation && (
                                <div class="filelist-occupation">
                                    <div class="flex-pack">
                                        {T("S98")}:{state.filesList.total}
                                    </div>
                                    <div class="m-1">-</div>
                                    <div class="flex-pack m-2">
                                        {T("S99")}:{state.filesList.used}
                                    </div>
                                    <div class="flex-pack hide-low m-1">
                                        <div class="bar bar-sm" style="width:4rem">
                                            <div
                                                class="bar-item"
                                                role="progressbar"
                                                style={`width:${state.filesList.occupation}%`}
                                                aria-valuenow={Number(state.filesList.occupation)}
                                                aria-valuemin={0}
                                                aria-valuemax={100}></div>
                                        </div>

                                        <span class="m-1">{state.filesList.occupation}%</span>
                                    </div>
                                </div>
                            )}
                            {!state.isLoading && state.filesList && state.filesList.status && (
                                <div class="file-status">{T(state.filesList.status)}</div>
                            )}
                        </div>
                    </Fragment>
                )}

                {isFullScreen && <FilesTab></FilesTab>}
            </div>
        )
    }

    return renderCompactView()
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
