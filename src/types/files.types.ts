/*
files.types.ts - Shared types for Files panel and FilesTab

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

import type { ComponentChildren, TargetedMouseEvent } from "preact"

// File entry in the file system
export type FileEntry = {
    name: string
    shortname?: string
    size: number
    datetime?: string
    [key: string]: any
}

// URL-based command
export type UrlCommand = {
    type: "url"
    url: string
    args: Record<string, any>
}

// Serial command
export type CmdCommand = {
    type: "cmd"
    cmd: string
}

// Serial command
export type ErrorCommand = {
    type: "error"
}

// Command union type
export type FileCommand = UrlCommand | CmdCommand | ErrorCommand

/**
 * Supported file types with dependency conditions
 */
export interface SupportedFileType {
    value: string
    name: string
    depend: () => boolean
}


/**
 * File command function type - executes file operations
 */
export type FileCommands = (filesystem: string, cmd: string, ...args: any[]) => any

/**
 * Capability check function type
 */
export type CapabilityCheck = (filesystem: string, capability: string, ...args: any[]) => any



/**
 * Files module - handles file operations and capabilities
 */
export interface FilesModule {
    command: FileCommands
    capability: CapabilityCheck
    supported: readonly SupportedFileType[]
}



// Panel menu item configuration
export interface PanelMenuItem {
    divider?: boolean
    label?: ComponentChildren
    icon?: ComponentChildren
    onClick?: (e: TargetedMouseEvent<HTMLElement>) => void
    displayToggle?: () => ComponentChildren
    disabled?: boolean
}

// File list structure returned from API
export interface FilesList {
    files: FileEntry[]
    path: string
    total: string
    used: string
    occupation: string
    status: string
}

// Sort options for FilesTab
export type SortField = "name" | "size" | "date"
export type SortOrder = "asc" | "desc"
