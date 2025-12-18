/*
modals.types.ts - Shared types for modal system

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

import type { ComponentChildren } from "preact"

/**
 * Modal manager interface for adding/removing modals.
 * Provides methods to manage the modal stack.
 */
export interface ModalManager {
    /** Get index of modal by ID, returns -1 if not found */
    getModalIndex: (id: string) => number
    /** Remove modal at given index */
    removeModal: (index: number) => void
    /** Add a new modal to the stack */
    addModal: (modal: any) => void
}

/**
 * Generic button configuration for modals.
 * Used for action buttons in modal footers.
 */
export interface ButtonConfig {
    /** Button text label */
    text: string
    /** Optional button ID for DOM reference */
    id?: string
    /** Callback function when button is clicked */
    cb?: () => void
    /** If true, don't close modal when button is clicked */
    noclose?: boolean
}

/**
 * Parameters for showing a generic modal dialog.
 */
export interface ShowModalParams {
    /** Modal manager instance */
    modals: ModalManager
    /** Modal title text */
    title: string
    /** Primary action button config */
    button1?: ButtonConfig
    /** Secondary action button config */
    button2?: ButtonConfig
    /** Modal body content */
    content: ComponentChildren
    /** Optional icon to display in title */
    icon?: ComponentChildren
    /** Unique identifier for the modal */
    id: string
    /** If true, hide the close button */
    hideclose?: boolean
    /** If true, show overlay behind modal */
    overlay?: boolean
}

/**
 * Parameters for showing a confirmation modal dialog.
 */
export interface ShowConfirmationModalParams {
    /** Modal manager instance */
    modals: ModalManager
    /** Modal title text */
    title: string
    /** Modal body content */
    content: ComponentChildren
    /** Primary action button config */
    button1?: ButtonConfig
    /** Secondary action button config */
    button2?: ButtonConfig
}

/**
 * Simplified button configuration for progress modals.
 */
export interface ProgressButton {
    /** Button text label */
    text: string
    /** Callback function when button is clicked */
    cb?: () => void
}

/**
 * Parameters for showing a progress modal dialog.
 */
export interface ShowProgressModalParams {
    /** Modal manager instance */
    modals: ModalManager
    /** Modal title text */
    title: string
    /** Button config (typically a cancel/close button) */
    button1: ProgressButton
    /** Modal body content (typically progress indicator) */
    content: ComponentChildren
}
