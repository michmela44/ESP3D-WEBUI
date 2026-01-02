/*
 VersionBadge.tsx - ESP3D WebUI component file

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

import { FunctionalComponent } from "preact"

interface VersionBadgeProps {
    current: string
    latest: string
}

/**
 * Compare two semantic versions
 * @param current Current version (e.g., "3.0.8")
 * @param latest Latest version (e.g., "3.0.9")
 * @returns -1 if current < latest, 0 if equal, 1 if current > latest
 */
const compareVersions = (current: string, latest: string): number => {
    const currentParts = current.split('.').map(Number)
    const latestParts = latest.split('.').map(Number)

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0
        const latestPart = latestParts[i] || 0

        if (currentPart < latestPart) return -1
        if (currentPart > latestPart) return 1
    }

    return 0
}

const VersionBadge: FunctionalComponent<VersionBadgeProps> = ({ current, latest }) => {
    // Remove 'v' prefix if present and get just major.minor.patch
    const cleanCurrent = current.split('.').slice(0, 3).join('.')
    const cleanLatest = latest.replace(/^v/, '').split('.').slice(0, 3).join('.')

    const comparison = compareVersions(cleanCurrent, cleanLatest)
    const isUpdateAvailable = comparison < 0

    if (isUpdateAvailable) {
        return (
            <span class="text-warning mx-2">
                (Update available: {latest})
            </span>
        )
    }

    // Up to date - don't show anything to reduce clutter
    return <span/>
}

export { VersionBadge }
