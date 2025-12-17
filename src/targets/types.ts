/*
 types.ts - TypeScript type definitions for Target contexts

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

// Type definitions for Target Context
export interface TargetContextFn {
    isStaId: (subsectionId: string, label: string, fieldData: any) => boolean
    processData: (type: string, data: any) => void
    [key: string]: any
}

export interface Positions {
    [axis: string]: string | number
}

export interface Status {
    state?: string
    status?: {
        machinetype?: string
        [key: string]: any
    }
    [key: string]: any
}

export interface StreamStatus {
    [key: string]: any
}

export interface TargetContextValue {
    positions: Positions
    status: Status
    message?: string | null
    alarmCode: number
    errorCode: number
    streamStatus: StreamStatus
    [key: string]: any
}

// Re-export for backward compatibility
export type { TargetContextFn as UseTargetContextFn }
