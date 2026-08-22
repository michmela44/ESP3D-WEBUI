/*
 dark.ts - ESP3D WebUI built-in dark theme

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

import { buildThemeCss } from "./buildThemeCss"
import type { ThemePalette } from "./palette"

/**
 * Neutral dark palette keeping the blue accent of the default theme,
 * lightened so it stays readable on dark surfaces.
 */
const darkPalette: ThemePalette = {
    bg: "#1b1f26",
    surface: "#242A33",
    surfaceAlt: "#2C333E",
    surfaceRaised: "#333B47",
    accentSoft: "#2F3D4E",
    border: "#3C4451",
    text: "#DDE3EA",
    textMuted: "#8B95A3",
    accent: "#4DA3FF",
    accentStrong: "#7FBFFF",
    onAccent: "#0F1319",
    echo: "#6FB4FF",
    success: "#3DD68C",
    warning: "#FFB020",
    error: "#FF6B6B",
}

const darkThemeCss = buildThemeCss(darkPalette)

export { darkThemeCss, darkPalette }
