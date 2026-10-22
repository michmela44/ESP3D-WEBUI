/*
 pageTitle.ts - ESP3D WebUI helper file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

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

const DEFAULT_HOST_NAME = "ESP3D"

/**
 * Resolve the board name used in the browser tab.
 *
 * The name comes straight from the ESP800 payload, which on some firmwares
 * carries the literal string "undefined" rather than omitting the entry. A
 * plain `||` lets that through and the tab ends up titled "undefined", so the
 * string is rejected here alongside a missing or blank value.
 *
 * @param connectionSettings - Current connection settings, if already fetched
 * @returns The board name, or `ESP3D` when there is nothing usable
 */
const getHostName = (connectionSettings?: { HostName?: string } | null): string => {
    const name = connectionSettings?.HostName
    if (typeof name != "string") return DEFAULT_HOST_NAME
    const trimmed = name.trim()
    if (trimmed.length == 0 || trimmed == "undefined" || trimmed == "null")
        return DEFAULT_HOST_NAME
    return trimmed
}

/**
 * Build the browser tab title.
 *
 * @param connectionSettings - Current connection settings, if already fetched
 * @param suffix - Connection state shown in parentheses, e.g. "connecting"
 * @param prefix - Job progress shown ahead of the name, e.g. "42% Run"
 * @returns The title to assign to `document.title`
 */
const buildPageTitle = (
    connectionSettings?: { HostName?: string } | null,
    suffix?: string,
    prefix?: string
): string => {
    const name = getHostName(connectionSettings)
    const base = suffix ? `${name}(${suffix})` : name
    return prefix ? `${prefix} - ${base}` : base
}

/**
 * Set the browser tab title.
 *
 * @param connectionSettings - Current connection settings, if already fetched
 * @param suffix - Connection state shown in parentheses
 * @param prefix - Job progress shown ahead of the name
 */
const setPageTitle = (
    connectionSettings?: { HostName?: string } | null,
    suffix?: string,
    prefix?: string
): void => {
    document.title = buildPageTitle(connectionSettings, suffix, prefix)
}

export { getHostName, buildPageTitle, setPageTitle, DEFAULT_HOST_NAME }
