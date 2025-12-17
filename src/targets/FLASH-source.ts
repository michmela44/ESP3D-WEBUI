/*
 FLASH-source.ts - ESP3D WebUI Target file

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
import { sortedFilesList, formatStatus } from "../components/Helpers"
import { useSettingsContextFn, useUiContextFn } from "../contexts"
import { UrlCommand } from "../types/files.types"

const capabilities = {
    Process: (): boolean => false,
    UseFilters: (): boolean => false,
    Upload: (): boolean => true,
    UploadMultiple: (): boolean => true,
    Download: (): boolean => true,
    DeleteFile: (): boolean => true,
    DeleteDir: (): boolean => true,
    CreateDir: (): boolean => true,
}


const commands = {
    list: (path: string): UrlCommand => {
        return {
            type: "url",
            url: "files",
            args: { path, action: "list" },
        }
    },
    upload: (path: string): UrlCommand => {
        const upath = (
            String(useSettingsContextFn.getValue("HostUploadPath")) + path
        ).replaceAll("//", "/")
        return {
            type: "url",
            url: "files",
            args: { path: upath },
        }
    },
    formatResult: (resultTxT: string): any => {
        const res = JSON.parse(resultTxT)
        if (useUiContextFn.getValue("sort_flashfs_files")){
            res.files = sortedFilesList(res.files)
        }
        res.status = formatStatus(res.status)
        return res
    },
    deletedir: (path: string, filename: string): UrlCommand => {
        return {
            type: "url",
            url: "files",
            args: { path, action: "deletedir", filename },
        }
    },
    delete: (path: string, filename: string): UrlCommand => {
        return {
            type: "url",
            url: "files",
            args: { path, action: "delete", filename },
        }
    },
    createdir: (path: string, filename: string): UrlCommand => {
        return {
            type: "url",
            url: "files",
            args: { path, action: "createdir", filename },
        }
    },
    download: (path: string, filename: string): UrlCommand => {
        const upath = (
            String(useSettingsContextFn.getValue("HostUploadPath")) +
            path +
            (path == "/" ? "" : "/") +
            filename
        ).replaceAll("//", "/")
        return {
            type: "url",
            url: upath,
            args: {},
        }
    },
}

const FLASH = { capabilities, commands }

export { FLASH }

