/*
dependencies.types.ts - Shared dependency condition types

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
 * Dependency condition for conditional field display.
 * Used to show/hide form fields based on the values of other settings.
 * Supports both setting-based and connection-based dependencies with OR groups.
 */
export interface DependencyCondition {
    /** Setting ID to check */
    id?: string
    /** Connection setting ID to check */
    connection_id?: string
    /** Expected value (equality check) - can be string, number, or boolean */
    value?: any
    /** Excluded value (inequality check) - can be string, number, or boolean */
    notvalue?: any
    /** String containment check */
    contains?: string
    /** OR groups for complex logic - any group matching makes condition true */
    orGroups?: DependencyCondition[][]
}

/** Backwards compatibility alias for DependencyCondition */
export type DependItem = DependencyCondition
