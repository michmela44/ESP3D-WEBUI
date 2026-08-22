/*
 randen.ts - ESP3D WebUI built-in Randen theme (Victorian parchment)

 Palette and typography taken from
 https://openbrushograph.github.io/brushologist_ad.html

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
 * Parchment and printer's ink, straight from the reference page: #f4ecd8
 * ground, #fffaf0 paper, #5c4b3a rules and #8b0000 for anything that would
 * have been set in red. The status colours are muted to match rather than
 * borrowed from the usual bright palette.
 */
const randenPalette: ThemePalette = {
    bg: "#F4ECD8",
    surface: "#FFFAF0",
    surfaceAlt: "#EEE5CD",
    surfaceRaised: "#F4ECD8",
    accentSoft: "#EEE5CD",
    border: "#5C4B3A",
    text: "#2C251D",
    textMuted: "#7A6A58",
    accent: "#8B0000",
    accentStrong: "#B22222",
    onAccent: "#FFFAF0",
    echo: "#4A3E30",
    success: "#4A6B3D",
    warning: "#8A6A1F",
    error: "#8B0000",
    highlight: "#EEE5CD",
    fontFamily: `"Palatino Linotype", "Book Antiqua", Palatino, "Times New Roman", Times, serif`,
}

/** The rule colour, for composing borders. */
const RULE = "#5C4B3A"

/**
 * The letterpress layer: square corners, engraved rules, uppercase display
 * type and the pressed-paper shadow from the source page.
 */
const randenExtraCss = `
/* ---------- nothing in 1898 had rounded corners ---------- */
.panel,
.card,
.modal-container,
.btn,
.form-input,
.form-select,
input,
select,
.label,
.bordered,
.files-list,
.terminal,
.bar,
.item-selection-list {
    border-radius: 0;
}

/* ---------- paper ---------- */
.panel {
    border: 2px solid ${RULE};
    box-shadow:
        inset 0 0 24px rgba(0, 0, 0, 0.05),
        4px 4px 12px rgba(0, 0, 0, 0.18);
}

.modal-container {
    border: 2px solid ${RULE};
    box-shadow:
        inset 0 0 0 4px #FFFAF0,
        inset 0 0 0 5px ${RULE},
        inset 0 0 20px rgba(0, 0, 0, 0.05),
        5px 5px 15px rgba(0, 0, 0, 0.25);
}

/* The WiFi statistics callout is the page's double-ruled author's note */
.card {
    border: 3px double ${RULE};
    box-shadow: none;
}

/* ---------- display type is uppercase, spaced and centred on a rule ---------- */
.navbar,
.panel .navbar,
.panel .navbar-section,
.menu-container .navbar,
.tab .tab-item a,
.modal_title,
.title,
h1, h2, h3, h4, h5, h6 {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: normal;
}

.panel .navbar {
    border-bottom: 1px solid ${RULE};
}

.navbar,
.menu-container .navbar {
    border-bottom: 2px solid ${RULE};
}

/*
 * Deliberately NOT uppercased: field groups (text-transform inherits, so it
 * would reach the unit addons and turn "mm/min" into "MM/MIN"), and the
 * status/jog headers, which carry controller vocabulary - "Run", "MPos" -
 * that should be reproduced as the machine reports it.
 */
.fieldset-top-separator,
.fieldset-bottom-separator {
    border-color: ${RULE};
}

/* ---------- ink ---------- */
.btn {
    border: 1px solid ${RULE};
}

.btn:focus,
.btn:hover {
    background: #EEE5CD;
    border-color: ${RULE};
    color: #8B0000;
}

.btn.btn-primary {
    background: #8B0000;
    border-color: #5C1010;
    color: #FFFAF0;
}

.btn.btn-primary:focus,
.btn.btn-primary:hover,
.btn.btn-primary:active,
.btn.btn-primary.active {
    background: #B22222;
    border-color: #5C1010;
    color: #FFFAF0;
}

a,
.btn.btn-link {
    color: #8B0000;
    font-weight: bold;
}

.tab .tab-item a.active,
.tab .tab-item.active a {
    border-bottom: 2px solid #8B0000;
    color: #8B0000;
}

/* ---------- machine output stays monospaced ---------- */
/*
 * The palette sets a serif face for the whole UI, but G-code and controller
 * responses are column-aligned and must not be set in a proportional face.
 */
.terminal,
.terminal pre,
.tablet-terminal-output,
.tablet-terminal-output pre,
pre,
code,
.file-line-name,
.file-item-name {
    font-family: "SF Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas,
        "Courier New", monospace;
    letter-spacing: normal;
    text-transform: none;
}

/* ---------- the logo printed in a single ink ---------- */
svg.esp3dlogo [fill="#005B96"] {
    fill: #5C4B3A;
}

svg.esp3dlogo [fill="#6497B1"] {
    fill: #8B0000;
}
`

const randenThemeCss = buildThemeCss(randenPalette) + randenExtraCss

export { randenThemeCss, randenPalette }
