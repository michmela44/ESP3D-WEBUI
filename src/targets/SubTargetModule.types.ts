/*
 SubTargetModule.types.ts - Type definitions for dynamic SubTarget modules

 Copyright (c) 2025 Mike Melancon. All rights reserved.

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

import type { FunctionalComponent, VNode } from "preact"
import type { TargetContextFn, TargetContextValue } from "./types"




/**
 * Processor module - handles response processing
 */
export interface ProcessorModule {
    startCatchResponse: (source: string, command: string, feedbackfn: any, arg?: any, cbfn?: any) => boolean
    stopCatchResponse: () => void
    handle: (type?: string, data?: string) => void
}

/**
 * Command variable definition
 */
export interface CommandVariable {
    [key: string]: any
}

/**
 * Variables and commands list module
 */
export interface VariablesListModule {
    commands: CommandVariable[]
    addCommand: (variable: CommandVariable) => void
    removeCommand: (name: string) => void
    modes: any[]
    hideFeatures: boolean
    allowEmptyLine: boolean
    formatCommand: (command: any) => string
}

/**
 * Event handler function type
 */
export type EventHandler = (...args: any[]) => void

/**
 * Events list module - manages custom events
 */
export interface EventsListModule {
    evts: Record<string, { fn: EventHandler }[]>
    on: (event: string, fn: EventHandler) => void
    off: (event: string, fn: EventHandler) => void
    emit: (event: string, data: any) => void
}

/**
 * SubTarget module exports - complete interface for target-specific modules
 */
export interface SubTargetModuleExports {
    /** Machine settings component */
    MachineSettings: FunctionalComponent<any>

    /** Machine settings configuration object */
    machineSettings: Record<string, any>

    /** Default panels list for the target */
    defaultPanelsList: readonly any[]

    /** Target identifier string */
    Target: string

    /** Files module with command and capability functions */
    // files: FilesModule

    /** Response processor module */
    processor: ProcessorModule

    /** Firmware URL list */
    fwUrl: readonly string[]

    /** Target name */
    Name: string

    /** Target-specific icons */
    iconsTarget: Record<string, VNode<any> | null>

    /** Restart delay in milliseconds */
    restartdelay: number

    /** Target context provider component */
    TargetContextProvider: FunctionalComponent<any>

    /** Hook to access target context */
    useTargetContext: () => TargetContextValue

    /** Functions from target context */
    useTargetContextFn: TargetContextFn

    /** Web UI build version */
    webUIbuild: string

    /** Variables and commands list */
    variablesList: VariablesListModule

    /** Custom events list */
    eventsList: EventsListModule

    /** Application logo component */
    AppLogo: FunctionalComponent<any>

    /** Web UI logo component */
    WebUILogo: FunctionalComponent<any>

    /** Quick action buttons bar component */
    QuickButtonsBar: FunctionalComponent<any>

    /** Background container component */
    BackgroundContainer: FunctionalComponent<any>
}
