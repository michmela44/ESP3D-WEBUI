import type { HttpAdapterParams, HttpAdapterReturn, HttpError } from "../../../adapters/httpAdapter"
import { fsRequest } from "./wasmBridgeTransport"
import { runBridgeCommand } from "./wasmBridgeCommands"
import { joinPath, rootAndPathForDownloadUrl, rootForCommandUrl, urlFileOp } from "./wasmBridgeFiles"

// An httpAdapter (see adapters/httpAdapter.tsx) for the FluidNC WASM demo,
// where there is no HTTP server: the demo page's own static server answers
// these URLs, and knows nothing about FluidNC. Every HTTP request the WebUI
// makes -- commands, the file manager, preferences.json, theme/language
// packs, extensions, pack uploads and the keep-alive ping -- is answered
// here instead, mirroring the endpoints FluidNC's own web server provides
// (WebUIServer.cpp):
//  - /command?cmd=...             a command (or ?PING=, the keep-alive)
//  - /files, /upload, /sdfiles    file operations on LocalFS / SD: GET with
//                                 action/path/filename, or a multipart POST
//                                 upload, each answered with a listing
//  - /login                       a no-op (authentication is off)
//  - any other path               a file read from LocalFS (/sd/... from SD)
// Anything this can't handle fails with an HTTP-style status code, never
// code 0, which the http queue would count as a lost connection.

const FILE_ENDPOINTS = ["files", "upload", "sdfiles"]

function httpError(code: number, message: string): HttpError {
    const e: HttpError = new Error(`${code} - ${message}`)
    e.code = code
    return e
}

async function upload(endpoint: string, body: FormData): Promise<string> {
    const root = rootForCommandUrl(endpoint)
    const dir = String(body.get("path") ?? "/")
    const files: File[] = []
    body.forEach((value) => {
        if (value instanceof File) files.push(value)
    })
    for (const value of files) {
        // Callers name the file part with its full destination path
        // (e.g. "/preferences.json"); fall back to joining with path.
        const path = value.name.startsWith("/") ? value.name : joinPath(dir, value.name)
        await fsRequest("write", { root, path, bytes: await value.arrayBuffer() })
    }
    return urlFileOp(root, { action: "list", path: dir })
}

async function handle(url: URL, method: string, params: HttpAdapterParams): Promise<string | Blob> {
    const endpoint = url.pathname.replace(/^\/+/, "")
    const args: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
        args[key] = value
    })

    if (endpoint === "command") {
        if ("PING" in args) {
            return ""
        }
        const cmd = args.cmd ?? args.commandText ?? args.plain
        if (cmd === undefined) {
            throw httpError(400, "Missing command")
        }
        return runBridgeCommand(cmd)
    }
    if (endpoint === "login") {
        return ""
    }
    if (FILE_ENDPOINTS.includes(endpoint)) {
        if (method === "POST") {
            if (!(params.body instanceof FormData)) {
                throw httpError(400, "Expected a multipart upload")
            }
            return upload(endpoint, params.body)
        }
        return urlFileOp(rootForCommandUrl(endpoint), args)
    }
    if (method !== "GET") {
        throw httpError(501, `${method} /${endpoint} is not supported in the demo`)
    }

    const { root, path } = rootAndPathForDownloadUrl(url.pathname)
    let bytes: ArrayBuffer
    try {
        bytes = await fsRequest("read", { root, path, binary: true })
    } catch {
        throw httpError(404, "Not Found")
    }
    // Same response shape as a real XMLHttpRequest: a Blob when the caller
    // asked for one (an id starting with "download"), text otherwise.
    return params.id?.startsWith("download") ? new Blob([bytes]) : new TextDecoder().decode(bytes)
}

const wasmBridgeHttpAdapter = (
    url: string,
    params: HttpAdapterParams = {},
    setUploadProgress: (percent: number) => void = () => {}
): HttpAdapterReturn => {
    const method = (params.method ?? "GET").trim().toUpperCase()
    let aborted = false
    let rejectAbort: ((e: HttpError) => void) | undefined
    const abortPromise = new Promise<never>((_, reject) => {
        rejectAbort = reject
    })
    const work = handle(new URL(url), method, params).then((result) => {
        setUploadProgress(100)
        return result
    })
    return {
        abort: (cb?: () => void) => {
            if (!aborted) {
                aborted = true
                rejectAbort?.(httpError(499, "Request aborted"))
            }
            if (typeof cb == "function") return cb()
        },
        // No real request exists; nothing in the WebUI reads this field.
        xhr: undefined as unknown as XMLHttpRequest,
        response: Promise.race([work, abortPromise]),
    }
}

export { wasmBridgeHttpAdapter }
