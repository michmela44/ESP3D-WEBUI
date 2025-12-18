/*
routes.types.ts - Shared types for routing system

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

import type { VNode, JSX } from "preact"

/**
 * Single route definition.
 * Represents a component mapped to a URL path.
 */
export interface RouteDef {
    /** Component to render for this route */
    component: VNode<any> | JSX.Element
    /** URL path for this route (e.g., "/dashboard", "/settings/wifi") */
    path: string
}

/**
 * Map of route keys to route definitions.
 * Keys are used as identifiers (e.g., "DASHBOARD", "SETTINGS").
 */
export interface RoutesMap {
    [key: string]: RouteDef
}

/**
 * Reference to parent routes for nested routing.
 * Used when a child router needs access to parent routes.
 */
export interface ParentRoutesRef {
    current: RoutesMap
}

/**
 * Extra content configuration for dynamic page creation.
 * Used for user-defined extra pages.
 */
export interface ExtraContent {
    /** Unique identifier for the extra content */
    id: string
    /** Configuration values for the extra content */
    value: Array<{
        name: string
        initial: any
    }>
}
