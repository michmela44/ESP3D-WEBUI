/*
 index.ts - ESP3D WebUI built-in themes registry

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

import { darkThemeCss } from "./dark"
import { coconutThemeCss } from "./coconut"

/**
 * A theme shipped inside the WebUI, as opposed to a `theme-*` CSS file
 * uploaded to the ESP filesystem.
 */
interface BuiltinTheme {
    /** Value stored in preferences under the `theme` setting */
    id: string
    /** Translation key used to display the theme name */
    label: string
    /** CSS injected when the theme is selected */
    css: string
}

/**
 * Preferences value meaning "no theme", i.e. the stylesheet shipped in the
 * bundle is used as-is. Kept as-is for backward compatibility with existing
 * preferences.json files.
 */
const DEFAULT_THEME_ID = "default"

/**
 * Prefix isolating built-in theme ids from `theme-*` file names uploaded to
 * the ESP filesystem, so the two can never collide.
 */
const BUILTIN_THEME_PREFIX = "builtin-"

const builtinThemes: BuiltinTheme[] = [
    {
        id: `${BUILTIN_THEME_PREFIX}dark`,
        label: "S226",
        css: darkThemeCss,
    },
    {
        id: `${BUILTIN_THEME_PREFIX}coconut`,
        label: "S227",
        css: coconutThemeCss,
    },
]

/**
 * Look up a built-in theme by its preferences value.
 *
 * @param id - Value of the `theme` setting
 * @returns The matching theme, or undefined for `default` and for themes
 *          stored as files on the ESP filesystem
 */
const getBuiltinTheme = (id?: string): BuiltinTheme | undefined =>
    builtinThemes.find((theme) => theme.id === id)

/**
 * Tell whether a `theme` setting value refers to a built-in theme.
 *
 * @param id - Value of the `theme` setting
 * @returns True if the theme ships with the WebUI
 */
const isBuiltinTheme = (id?: string): boolean => getBuiltinTheme(id) !== undefined

export type { BuiltinTheme }
export {
    builtinThemes,
    getBuiltinTheme,
    isBuiltinTheme,
    DEFAULT_THEME_ID,
    BUILTIN_THEME_PREFIX,
}
