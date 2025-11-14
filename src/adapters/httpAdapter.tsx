/*
 httpAdapter.tsx - ESP3D WebUI adapter file

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

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

// Type definitions
interface HttpAdapterParams {
    method?: string
    headers?: Headers | Record<string, string>
    body?: string | FormData | null
    id?: string | null
    [key: string]: any
}

interface HttpError extends Error {
    code?: number
}

interface HttpAdapterReturn {
    abort: (cb?: () => void) => void
    xhr: XMLHttpRequest
    response: Promise<string | Blob>
}

// Extended ProgressEvent for backwards compatibility with older browsers
interface ExtendedProgressEvent extends ProgressEvent {
    position?: number
    totalSize?: number
}

/**
 * Execute XMLHttpRequest
 * @param url - The URL to request
 * @param params - Request parameters
 * @param setUploadProgress - Progress callback that receives percentage (0-100)
 * @returns Object containing abort function, xhr instance, and response promise
 */
const httpAdapter = (
    url: string,
    params: HttpAdapterParams = {},
    setUploadProgress: (percent: number) => void = () => {}
): HttpAdapterReturn => {
    const { method = "GET", headers = {}, body = null, id = null } = params
    const sanitizedMethod = method.trim().toUpperCase()
    const xhr = new XMLHttpRequest()
    if (id && id.startsWith("download")) {
        xhr.responseType = "blob"
        xhr.addEventListener("progress", (e: ExtendedProgressEvent) => {
            const done = e.position || e.loaded
            const total = e.totalSize || e.total
            const perc = Math.floor((done / total) * 1000) / 10
            setUploadProgress(perc)
        })
    } else {
        xhr.upload.addEventListener("progress", (e: ExtendedProgressEvent) => {
            const done = e.position || e.loaded
            const total = e.totalSize || e.total
            const perc = Math.floor((done / total) * 1000) / 10
            setUploadProgress(perc)
        })
    }

    const cacheBustedUrl = (url: string): string => {
        const parsedUrl = new URL(url)
        // let params = parsedUrl.searchParams
       // params.get("t") == null && params.append("t", Date.now())
        return parsedUrl.toString()
    }

    xhr.open(sanitizedMethod, cacheBustedUrl(url), true) //Bypassing the cache

    /** handle URL params ? */

    /** header part */
    if (headers instanceof Headers)
        headers.forEach((value, header) => xhr.setRequestHeader(header, value))
    //handle Headers()
    else
        Object.entries(headers).forEach(([header, value]) =>
            xhr.setRequestHeader(header, value)
        ) //handle Object headers

    const response = new Promise<string | Blob>((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response)
            else {
                const e: HttpError = new Error(
                    `${xhr.status ? xhr.status : ""}${
                        xhr.statusText ? ` - ${xhr.statusText}` : ""
                    }`
                )
                e.code = xhr.status
                reject(e)
            }
        }
        xhr.onerror = () => {
            const e: HttpError = new Error(
                `${xhr.status ? xhr.status : "Connection time out"}${
                    xhr.status && xhr.statusText ? ` - ${xhr.statusText}` : ""
                }`
            )
            e.code = xhr.status
            reject(e)
        }

        xhr.onabort = () => {
            const e: HttpError = new Error("Request aborted")
            e.code = 499
            reject(e)
        }
    })

    const sendBody = ["POST", "PUT", "CONNECT", "PATCH"].includes(sanitizedMethod)
        ? body
        : null

    xhr.send(sendBody)

    return {
        abort: (cb?: () => void) => {
            xhr.abort()
            if (typeof cb == "function") return cb()
        },
        xhr,
        response,
    }
}

export { httpAdapter }
export type { HttpAdapterParams, HttpAdapterReturn, HttpError }
