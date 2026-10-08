import { fsRequest } from "./wasmBridgeTransport"

// File-operation helpers for wasmBridgeHttpAdapter.ts. FluidNC's web
// server has one endpoint per file system for list/createdir/delete/
// deletedir/upload -- /upload (and /sdfiles) for the SD card, /files for
// LocalFS -- which DIRECTSD-source.ts/FLASH-source.ts use as their url.
// Downloads are different: they are a plain resource path ("/sd/..." for
// the SD card, HostUploadPath-prefixed for LocalFS), so the file system is
// inferred from that shape instead.
export type Root = "native_sd" | "native_localfs"

export function rootForCommandUrl(url: string): Root {
    return url === "upload" || url === "sdfiles" ? "native_sd" : "native_localfs"
}

export function rootAndPathForDownloadUrl(url: string): { root: Root; path: string } {
    if (url === "/sd" || url.startsWith("/sd/")) {
        return { root: "native_sd", path: url.slice(3) || "/" }
    }
    return { root: "native_localfs", path: url || "/" }
}

export function joinPath(dir: string, name: string): string {
    return (dir.endsWith("/") ? dir : `${dir}/`) + name
}

// Real hardware's /upload endpoint returns a fresh directory listing after
// any write operation (delete/deletedir/createdir/upload alike) -- see
// useFilesManager.ts's uploadFiles(): with no "postUpload" command defined
// for DIRECTSD/FLASH, its onSuccess always runs the raw response through
// formatResult(), the same path list/delete/createdir already take. This
// mirrors that: perform the op, then resolve with a listing of dir.
export function opThenList(root: Root, dir: string, op: Promise<unknown>): Promise<string> {
    return op.then(() => fsRequest("list", { root, path: dir })).then((listing) => JSON.stringify(listing))
}

// A list/delete/deletedir/createdir request (the action/path/filename
// query arguments real hardware's /files and /upload endpoints take),
// resolving with the directory listing JSON those endpoints return.
export function urlFileOp(root: Root, args: Record<string, string>): Promise<string> {
    const dir = args.path ?? "/"
    const action = args.action ?? "list"
    switch (action) {
        case "list":
            return fsRequest("list", { root, path: dir }).then((listing) => JSON.stringify(listing))
        case "delete":
            return opThenList(root, dir, fsRequest("delete", { root, path: joinPath(dir, args.filename) }))
        case "deletedir":
            return opThenList(root, dir, fsRequest("deletedir", { root, path: joinPath(dir, args.filename) }))
        case "createdir":
            return opThenList(root, dir, fsRequest("mkdir", { root, path: joinPath(dir, args.filename) }))
        default:
            return Promise.reject(new Error(`Unsupported file operation: ${action}`))
    }
}
