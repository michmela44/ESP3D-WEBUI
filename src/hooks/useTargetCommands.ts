/*
 useSettings.js - ESP3D WebUI hooks file

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

import { espHttpURL, replaceVariables } from "../components/Helpers"
import { useState } from "preact/hooks"
import { useUiContext } from "../contexts"
import { useHttpFn } from "./useHttpQueue"
import { variablesList, processor, useTargetContext } from "../targets"
import { useToastsContext } from "../contexts/ToastsContext"
import { getWebSocketService } from "../hooks/useWebSocketService"

const useTargetCommands = () => {
    const [isLoading, setIsLoading] = useState(false)
    const { createNewRequest } = useHttpFn
    const { toasts } = useToastsContext()

    const failToast = (error: string) => {
        toasts.addToast({ content: error, type: "error" })
        console.log(error)
    }

    // targetsCommands is the primary gateway for sending commands to a controller device.
    // commands:
    //    commands is a list of commands to send.  It can take many forms:
    //    * a string containing a single command
    //    * a string containing multiple commands separated by a delimiter
    //    * an array of single command strings or functions returning single command strings
    //    * a function that returns any of the above forms
    // delimiter:
    //    if delimiter is defined, it is used to separate the commands string
    //    into an array of single command strings
    // methodID:
    //    Sn object containing extra fields to add to the "method" object.
    //    It can be used to add, for example, "id:" and "max:" fields as needed
    // callbacks:
    //    callbacks is an object containing onSuccess: and onFail: fields to handle
    //    command success and failure.
    //    If callbacks is not defined, on success, noting is done and on failure,
    //    failToast as defined above is called
    //
    // Prior to sending each individual command, its string is processed with
    // "replaceVariables" to modify the command in a target-dependent manner

    const targetCommands = (commands: (string | (()=> string[]) | (string | (() => string))[]), delimiter?: (string | null | undefined | number), methodID?: { id?: string, max?: number, echo?: boolean}, callbacks?: { onSuccess?: (result: string) => void, onFail?: (error: string) => void})=> {
        if (typeof commands === "function") {
            commands = commands();
        }

        let cmdarr: (string| (() => string))[]
        if (typeof commands === "string") {
            if (typeof delimiter === "string") {
                cmdarr = commands.split(delimiter);
            } else {
                cmdarr = [commands]
            }
        } else {
            cmdarr = commands;
        }

        let method = {
            method: "GET",
        }

        // Additional fields can be added to the method object
        if (methodID?.id != null) {
            Object.assign(method, { id: methodID.id });
        }       

        if (methodID?.max != null) {
            Object.assign(method, { max: methodID.max });
        }

        if (!callbacks) {
            callbacks = {
                // The default success action is to do nothing
                onSuccess: (result) => {},
                // The default failure action is to create a toast with the error message
                onFail: (error) => {
                    toasts.addToast({ content: error, type: "error" })
                    console.log(error)
                }
            }
        }

        let sessionId:string | undefined = "";
        const ws = getWebSocketService()
        if (ws) {
            sessionId = ws.getSessionId();
        }

        // Commands is now an object (probaby an array)
        cmdarr.forEach((command: string | (() => string)) => {
            let cmd: string
            if (typeof command === "string") {
               cmd = command
            } else {
               cmd = command()
            }
            let replaced = replaceVariables(variablesList.commands, cmd)

            let args = {
                cmd: replaced,
            }
            if (sessionId) {
                Object.assign(args, { PAGEID: sessionId });
            }

        if (methodID?.echo == undefined || methodID.echo === true) { 
            Object.assign(method, { echo: replaceVariables(variablesList.commands, cmd, true) });
         }

            console.log(`cmd ${  replaced}`)
            createNewRequest(
                espHttpURL("command", args),
                method,
                callbacks
            )
        })
    }

    const sendSerialCmd = (cmd: string, updateUI: (res: any) => void) => {
        const callbacks = {
            onSuccess: (result: unknown) => {
                //Result is handled on ws so just do nothing
                if (updateUI) updateUI(result)
            },
            onFail: (error: string) => {
                console.log("Error:", error)
                setIsLoading(false)
                toasts.addToast({ content: error, type: "error" })
                processor.stopCatchResponse()
            },
        }
        targetCommands(cmd, undefined, undefined, callbacks)
    }

    return {
        targetCommands,
        sendSerialCmd,
        failToast,
    }

}

export { useTargetCommands }
