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
import { h } from "preact"
import { sortedFilesList, formatStatus } from "../../../components/Helpers"
import { canProcessFile } from "../../helpers"

const capabilities = {
    Process: (path, filename) => {
        return canProcessFile(filename)
    },
    UseFilters: () => true,
    IsFlatFS: () => false,
    Upload: () => {
        return true
    },
    Mount: () => {
        return false
    },
    UploadMultiple: () => {
        return true
    },
    Download: () => {
        return true
    },
    DeleteFile: () => {
        return true
    },
    DeleteDir: () => {
        return true
    },
    CreateDir: () => {
        return true
    },
}

const normalizePath = (path) => {
    let re = /\/\//g
    let p = path.replace(re, "/");
    return p;
  }
  
  
  const sdMountedPath = (path, filename) => {
    const mountPrefix = "/sd";
    console.log("MP ", path, filename);
    if (typeof(path) == 'undefined') {
      if (typeof(filename) == 'undefined') {
        return mountPrefix + "/";
      }
      return normalizePath(mountPrefix + "/" + encodeURIComponent(filename));
    }
    if (typeof(filename) == 'undefined') {
      return normalizePath(mountPrefix + path);
    }
    return normalizePath(mountPrefix + path + "/" + encodeURIComponent(filename));
  }

const commands = {
    // list: (path, filename) => {
    //     return {
    //       type: "url",
    //       url: sdMountedPath(path, filename),
    //       args: { action: "list" },
    //     };
    //   },
    list: (path, filename) => {
        return {
            type: "url",
            url: "upload",
            args: { path, action: "list" },
        }
    },
      upload: (path, filename) => {
        return {
          type: "url",
          url: "upload",
          args: { path },
        };
      },
      formatResult: (resultTxT) => {
        const res = JSON.parse(resultTxT);
        res.files = sortedFilesList(res.files);
        res.status = formatStatus(res.status);
        return res;
      },
      filterResult: (data, path) => {
        const res = {};
        res.files = sortedFilesList(filterResultFiles(data.files, path));
        res.status = formatStatus(data.status);
        return res;
      },
      deletedir: (path, filename) => {
        return {
          type: "url",
    //      url: "upload",
    //      args: { path, action: "deletedir", filename },
            url: "upload",
            args : { path, action: "deletedir", filename}
         
        };
      },
      delete: (path, filename) => {
        return {
          type: "url",
          url: "upload",
          args: { path, action: "delete", filename },
        };
      },
      createdir: (path, filename) => {
        return {
          type: "url",
          url: "upload",
          args: { path, action: "createdir", filename },
        };
      },
      download: (path, filename) => {
        return {
          type: "url",
          url: "/sd" + path + (path.endsWith("/") ? "" : "/") + filename,
          args: {},
        };
      },
      play: (path, filename) => {
        return {
          type: "cmd",
          cmd: "$SD/Run=" + path + (path == "/" ? "" : "/") + filename + "\n",
        };
      },
}

const DIRECTSD = { capabilities, commands }

export { DIRECTSD }
