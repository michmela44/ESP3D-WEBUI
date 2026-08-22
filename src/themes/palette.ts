/*
 palette.ts - ESP3D WebUI built-in theme palette

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

/**
 * Colors a built-in theme needs to define.
 *
 * The base stylesheet hardcodes its colors (#005b96, blue, #f1f1fc, #fff, ...)
 * so a theme is expressed as a set of CSS overrides generated from this palette
 * by `buildThemeCss`. Every entry is a plain CSS color string.
 */
interface ThemePalette {
    /** Page background, behind the panels */
    bg: string
    /** Panels, modals, inputs background */
    surface: string
    /** Panel headers, navbars, table headers */
    surfaceAlt: string
    /** Buttons and other raised controls */
    surfaceRaised: string
    /** Hover / selected background tint (replaces #f1f1fc) */
    accentSoft: string
    /** Borders and separators (replaces #dadee4) */
    border: string
    /** Main text color */
    text: string
    /** Secondary / disabled text */
    textMuted: string
    /** Primary accent (replaces #005b96) */
    accent: string
    /** Stronger accent used for active/pressed states (replaces blue) */
    accentStrong: string
    /** Text drawn on top of an accent background */
    onAccent: string
    /** Terminal echo lines */
    echo: string
    /**
     * Callout background behind highlighted cards (the WiFi statistics panel).
     * Overrides the `--highlight-color` custom property, which defaults to a
     * pale yellow unsuited to dark themes. Falls back to `accentSoft`.
     */
    highlight?: string
    success: string
    warning: string
    error: string
    /** Optional font stack applied to the whole UI */
    fontFamily?: string
    /** Optional glow applied to accented text (retro themes) */
    textGlow?: string
}

export type { ThemePalette }
