/*
 useHttpQueue.tsx - ESP3D WebUI hooks file

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
import { useState, useRef } from "preact/hooks"
import { useHttpQueueContext } from "../contexts"
import { generateUID } from "../components/Helpers"

// Type definitions
interface HttpRequestParams {
    id?: string
    method?: string
    echo?: string
    max?: number
    [key: string]: any
}

interface HttpCallbacks {
    onSuccess?: (result: string) => void
    onFail?: (error: string) => void
    onProgress?: (percent: number) => void
}

interface HttpRequest {
    id: string
    url: string
    params: HttpRequestParams
    onSuccess: (result: string | Blob) => void
    onProgress: (e: ProgressEvent) => void
    onFail: ((error: string) => void) | null
}

interface HttpQueueReturn {
    createNewRequest: (url: string, params: HttpRequestParams, callbacks?: HttpCallbacks) => void
    processRequestsNow: () => void
    createNewTopRequest: (url: string, params: HttpRequestParams, callbacks?: HttpCallbacks) => void
    abortRequest: (id?: string) => void
    setKillOnUnmount: (kill: boolean) => void
}

interface UseHttpFn {
    createNewRequest: (url: string, params: HttpRequestParams, callbacks?: HttpCallbacks) => void
    abortRequest: (id?: string) => void
}

const useHttpFn: UseHttpFn = {} as UseHttpFn

/*
 * Local const
 *
 */
const useHttpQueue = (): HttpQueueReturn => {
    const {
        addInQueue,
        addInTopQueue,
        removeRequests,
        getCurrentRequest,
        processRequests,
    } = useHttpQueueContext()
    const [killOnUnmount, setKillOnUnmount] = useState<boolean>(true)
    const localRequests = useRef<string[]>([])

    const createNewTopRequest = (url: string, params: HttpRequestParams, callbacks: HttpCallbacks = {}): void => {
        const {
            onSuccess: onSuccessCb,
            onFail: onFailCb,
            onProgress: onProgressCb,
        } = callbacks
        const id = params.id ? params.id : generateUID()
        localRequests.current = [...localRequests.current, id]
        addInTopQueue({
            id,
            url,
            params,
            onSuccess: (result: string | Blob) => {
                if (onSuccessCb) onSuccessCb(result as string)
            },
            onProgress: (percent: number) => {
                if (onProgressCb) onProgressCb(percent)
            },
            onFail: onFailCb
                ? (error: string) => {
                      if (onFailCb) onFailCb(error)
                  }
                : null,
        })
    }

    const createNewRequest = (url: string, params: HttpRequestParams, callbacks: HttpCallbacks = {}): void => {
        const {
            onSuccess: onSuccessCb,
            onFail: onFailCb,
            onProgress: onProgressCb,
        } = callbacks
        const id = params.id ? params.id : generateUID()

        if (params.max != undefined) {
            const totalInQueue = localRequests.current.reduce(
                (total, current) => {
                    if (id == current) return total + 1
                    else return total
                },
                0
            )
            if (totalInQueue >= params.max) return
        }
        localRequests.current = [...localRequests.current, id]
        addInQueue({
            id,
            url,
            params,
            onSuccess: (result: string | Blob) => {
                if (onSuccessCb) onSuccessCb(result as string)
                localRequests.current.splice(
                    localRequests.current.indexOf(id),
                    1
                )
            },
            onProgress: (percent: number) => {
                if (onProgressCb) onProgressCb(percent)
            },
            onFail: (error: string) => {
                localRequests.current.splice(
                    localRequests.current.indexOf(id),
                    1
                )
                if (onFailCb) onFailCb(error)
            },
        })
    }

    const abortRequest = (id?: string): void => {
        if (id) {
            removeRequests(id)
        }
        const currentRequest = getCurrentRequest()
        if (currentRequest) {
            currentRequest.abort()
        } else {
            // Toaster no current request
        }
    }

    const processRequestsNow = (): void => {
        processRequests()
    }

    useHttpFn.createNewRequest = createNewRequest
    useHttpFn.abortRequest = abortRequest

    return {
        createNewRequest,
        processRequestsNow,
        createNewTopRequest,
        abortRequest,
        setKillOnUnmount,
    }
}

export { useHttpQueue, useHttpFn }
export type { HttpRequestParams, HttpCallbacks, HttpRequest, HttpQueueReturn, UseHttpFn }
