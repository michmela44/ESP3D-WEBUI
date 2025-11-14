/*
 HttpQueueContext.tsx - ESP3D WebUI context file

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
import { createContext, FunctionalComponent } from "preact"
import { useContext, useRef } from "preact/hooks"
import { httpAdapter } from "../adapters"
import { useUiContext } from "./UiContext"
import { getWebSocketService } from "../hooks/useWebSocketService";
import { useTargetContext } from "../targets"

// Type definitions
interface HttpRequest {
    id: string
    url: string
    params: any
    onSuccess: (response: any) => void
    onFail?: ((error: string) => void) | null
    onProgress?: (percent: number) => void
}

interface HttpQueueContextValue {
    addInQueue: (request: HttpRequest) => void
    addInTopQueue: (request: HttpRequest) => void
    removeRequests: (requestIds: string | string[]) => void
    getCurrentRequest: () => any
    removeAllRequests: () => void
    processRequests: () => void
}

interface HttpQueueContextProviderProps {
    children: any
}

let counterNoAnswer = 0
const MaxNoAnswerNb = 4

/*
 * Local const
 *
 */
const HttpQueueContext = createContext<HttpQueueContextValue | undefined>(undefined)
const useHttpQueueContext = (): HttpQueueContextValue => {
    const context = useContext(HttpQueueContext)
    // Allow usage before provider is mounted (for circular dependencies with WsContext)
    if (!context) {
        return {
            addInQueue: () => {},
            addInTopQueue: () => {},
            removeRequests: () => {},
            getCurrentRequest: () => null,
            removeAllRequests: () => {},
            processRequests: () => {}
        }
    }
    return context
}

const HttpQueueContextProvider: FunctionalComponent<HttpQueueContextProviderProps> = ({ children }) => {
    const { processData } = useTargetContext()
    const requestQueue = useRef<HttpRequest[]>([]) // Http queue for every components
    const isBusy = useRef<boolean>(false)
    const currentRequest = useRef<any>()
    const { connection } = useUiContext()

    //Add new Request to queue
    const addInQueue = (newRequest: HttpRequest) => {
        requestQueue.current = [...requestQueue.current, newRequest]
        if (!isBusy.current) executeHttpCall()
    }

    //Add new Request to top of queue
    const addInTopQueue = (newRequest: HttpRequest) => {
        requestQueue.current = [newRequest, ...requestQueue.current]
        if (!isBusy.current) executeHttpCall()
    }

    //Remove finished request from queue
    const removeRequestDone = () => {
        requestQueue.current = [...requestQueue.current].slice(1)
        currentRequest.current = null
    }

    //Remove finished request from queue
    const removeRequests = (requestIds: string | string[]) => {
        const idsArray = Array.isArray(requestIds) ? requestIds : [requestIds]
        const updatedRequestQueue = [...requestQueue.current].filter(
            ({ id }) => {
                return !idsArray.includes(id)
            }
        )
        requestQueue.current = updatedRequestQueue
    }

    //Get current active request in queue
    const getCurrentRequest = () => {
        return currentRequest.current
    }

    //Remove all request from queue
    const removeAllRequests = () => {
        if (currentRequest.current) currentRequest.current.abort()
        requestQueue.current = []
        currentRequest.current = null
    }

    //Process requests from queue
    const processRequests = () => {
        executeHttpCall()
    }

    //Process query in queue
    const executeHttpCall = async () => {
        if (!isBusy.current) isBusy.current = true
        const { url, params, onSuccess, onFail, onProgress } =
            requestQueue.current[0]
        let is401Error = false
        try {
            currentRequest.current = httpAdapter(url, params, onProgress || ((percent: number) => {     }))
            if (params.echo) {
                processData("echo", params.echo)
            }
            const response = await currentRequest.current.response
            onSuccess(response)
            counterNoAnswer = 0
        } catch (e: any) {
            if (e.code == 401) {
                is401Error = true
                connection.setConnectionState({
                    connected: connection.connectionState.connected,
                    page: "notauthenticated",
                })
            } else if (e.code == 499) {
                //just do not raise error screen
            } else {
                if (!e.code) {
                    counterNoAnswer++
                    console.log("Connection lost ?", counterNoAnswer)
                    if (counterNoAnswer > MaxNoAnswerNb) {
                        const ws = getWebSocketService()
                        if (ws) {
                            ws.disconnect("connectionlost")
                        }
                    }
                }
            }
            if (onFail) {
                onFail(e.message) //to-check
            }
        } finally {
            //check if need to remove or not
            if (!is401Error) {
                removeRequestDone()
                if (requestQueue.current.length > 0) {
                    executeHttpCall()
                } else {
                    isBusy.current = false
                }
            } else {
                currentRequest.current = null
            }
        }
    }

    return (
        <HttpQueueContext.Provider
            value={{
                addInQueue,
                addInTopQueue,
                removeRequests,
                getCurrentRequest,
                removeAllRequests,
                processRequests,
            }}
        >
            {children}
        </HttpQueueContext.Provider>
    )
}

export { HttpQueueContextProvider, useHttpQueueContext }
export type { HttpQueueContextValue, HttpRequest }
