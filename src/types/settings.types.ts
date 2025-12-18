/*
settings.types.ts - Shared types for ESP settings API

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

/**
 * Raw setting item from ESP400 API response.
 * Contains machine settings in a compact format from the firmware.
 */
export interface RawSettingItem {
    /** Parameter ID */
    P: string
    /** Type (B=byte, I=integer, F=float, S=string, M=mask, X=xmask, A=IP address) */
    T: string
    /** Value */
    V: string
    /** Help text/label */
    H: string
    /** Options for select fields */
    O?: Array<{ [key: string]: string }>
    /** Minimum value */
    M?: string
    /** Maximum value (Size) */
    S?: string
    /** Minimum Secondary value */
    MS?: string
    /** Need Restart flag */
    R?: string
    /** Unit/append text */
    U?: string
    /** Precision (for floats) */
    E?: string
    /** Field path (section/subsection) */
    F: string
}

/**
 * Option for select fields in settings UI
 */
export interface SelectOption {
    /** Display label */
    label: string
    /** Option value */
    value: string
}

/**
 * Formatted setting field properties for UI rendering.
 * Transformed from RawSettingItem for easier UI consumption.
 */
export interface SettingFieldProps {
    /** Field identifier */
    id: string
    /** Initial/original value */
    initial: string
    /** Display label */
    label: string
    /** Field type (select, number, text, mask, xmask) */
    type: string
    /** Current value */
    value: string
    /** Original type cast from API */
    cast: string
    /** Unit text to append */
    append?: string
    /** Precision for float values */
    prec?: string
    /** Options for select fields */
    options?: SelectOption[]
    /** Flag indicating restart required after change */
    needRestart?: string
    /** Maximum value/length */
    max?: number
    /** Minimum value/length */
    min?: number
    /** Secondary minimum value */
    minSecondary?: number
    /** Special format (e.g., "ip") */
    format?: string
}

/** Field type names for settings */
export type FieldTypeName = "select" | "number" | "text" | "mask" | "xmask"

/**
 * Structured features data organized by section and subsection.
 * Used to render the features/settings tab UI.
 */
export interface FeaturesStructure {
    [section: string]: {
        [subsection: string]: SettingFieldProps[]
    }
}

/**
 * Validation field data with tracking flags.
 * Extended from SettingFieldProps with validation state.
 */
export interface ValidationFieldData extends SettingFieldProps {
    /** Whether the field has been modified */
    hasmodified?: boolean
    /** Whether the field has a validation error */
    haserror?: boolean
}
