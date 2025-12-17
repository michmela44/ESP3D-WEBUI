/*
 DIRECTSD-source.js - ESP3D WebUI Target file

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
import { sortedFilesList, formatStatus, filterResultFiles } from "../../../components/Helpers"
import { canProcessFile } from "../../helpers"
import { useUiContextFn } from "../../../contexts"
import { CmdCommand, UrlCommand } from "../../../types/files.types"

const capabilities = {
    Process: (path: string, filename: string): boolean => {
        return canProcessFile(filename)
    },
    UseFilters: (): boolean => true,
    Upload: (): boolean => {
        return true
    },
    UploadMultiple: (): boolean => {
        return true
    },
    Download: (): boolean => {
        return true
    },
    DeleteFile: (): boolean => {
        return true
    },
    DeleteDir: (): boolean => {
        return true
    },
    CreateDir: (): boolean => {
        return true
    },
}

const commands = {
    // list: (path, filename) => {
    //     return {
    //       type: "url",
    //       url: sdMountedPath(path, filename),
    //       args: { action: "list" },
    //     };
    //   },
    list: (path: string): UrlCommand => {
        return {
            type: "url",
            url: "upload",
            args: { path, action: "list" },
        }
    },
    upload: (path: string): UrlCommand => {
        return {
          type: "url",
          url: "upload",
          args: { path },
        };
    },
    formatResult: (resultTxT: string): any => {
        const res = JSON.parse(resultTxT);
        if (useUiContextFn.getValue("sort_sd_files")){
            res.files = sortedFilesList(res.files)
        }
        res.status = formatStatus(res.status);
        return res;
    },
    filterResult: (data: any, path: string): any => {
        const res: any = {};
        res.files = sortedFilesList(filterResultFiles(data.files, path));
        res.status = formatStatus(data.status);
        return res;
    },
    deletedir: (path: string, filename: string): UrlCommand => {
        return {
          type: "url",
    //      url: "upload",
    //      args: { path, action: "deletedir", filename },
            url: "upload",
            args : { path, action: "deletedir", filename}
         
        };
    },
    delete: (path: string, filename: string): UrlCommand => {
        return {
          type: "url",
          url: "upload",
          args: { path, action: "delete", filename },
        };
    },
    createdir: (path: string, filename: string): UrlCommand => {
        return {
          type: "url",
          url: "upload",
          args: { path, action: "createdir", filename },
        };
    },
    download: (path: string, filename: string): UrlCommand => {
        return {
          type: "url",
          url: `/sd${  path  }${path.endsWith("/") ? "" : "/"  }${filename}`,
          args: {},
        };
    },
    play: (path: string, filename: string): CmdCommand => {
        return {
          type: "cmd",
          cmd: `$SD/Run=${  path  }${path == "/" ? "" : "/"  }${filename  }\n`,
        };
    },
}

const DIRECTSD = { capabilities, commands }

export { DIRECTSD }

