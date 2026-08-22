/*
 gayograph.ts - ESP3D WebUI built-in Gayograph theme (bright pink, pride rainbow)

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
 * Hot pink on near-white, with a deep plum ink that keeps long machine
 * readouts legible. The rainbow lives in the accents rather than the text,
 * so the UI stays usable while running a machine.
 */
const gayographPalette: ThemePalette = {
    bg: "#FFF0F8",
    surface: "#FFFFFF",
    surfaceAlt: "#FFE3F2",
    surfaceRaised: "#FFEDF6",
    accentSoft: "#FFD6EE",
    border: "#FF9FD5",
    text: "#4A0033",
    textMuted: "#9E5480",
    accent: "#E5006E",
    accentStrong: "#C4005E",
    onAccent: "#FFFFFF",
    echo: "#8E00C9",
    success: "#009E5C",
    warning: "#E07A00",
    error: "#D6003F",
    highlight: "#FFE3F2",
}

/** The six-stripe pride flag, used for vivid accents. */
const PRIDE =
    "#E40303, #FF8C00, #FFED00, #008026, #24408E, #732982"

/** A washed-out version of the same, light enough to carry dark text. */
const PRIDE_PASTEL =
    "#FFE0E6, #FFEEDC, #FFFBDC, #E2F7E7, #DFE7FA, #EEE0F5"

/**
 * The flamboyant layer: rainbow rules, gradients and sparkle that the
 * palette-driven CSS has no way to express.
 */
const gayographExtraCss = `
body {
    background-image: linear-gradient(160deg, #FFF0F8 0%, #FFE8F6 45%, #F6EAFF 100%);
    background-attachment: fixed;
}

/* ---------- the main navbar flies the flag along its whole edge ---------- */
.navbar,
.menu-container .navbar {
    border-bottom: 3px solid transparent;
    border-image: linear-gradient(90deg, ${PRIDE}) 1;
}

.menu-container .navbar {
    background: linear-gradient(90deg, ${PRIDE_PASTEL});
    color: #7A0047;
}

/*
 * Panel headers get the washed-out version and a plain pink edge - a vivid
 * stripe on every panel would drown the dashboard. Declared after the rule
 * above so it wins for panel headers only.
 */
.panel .navbar,
.panel .navbar-section {
    background: linear-gradient(90deg, ${PRIDE_PASTEL});
    color: #7A0047;
    border-image: none;
    border-bottom: 0.05rem solid #FF9FD5;
}

.panel .navbar .btn.btn-clear {
    color: #7A0047;
}

/* ---------- everything is a little rounder ---------- */
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
.terminal {
    border-radius: 0.4rem;
}

.panel,
.card,
.modal-container {
    box-shadow: 0 2px 14px rgba(229, 0, 110, 0.12);
}

/* ---------- primary buttons are a pink-to-violet gradient ---------- */
.btn.btn-primary {
    background: linear-gradient(135deg, #FF2E9A 0%, #E5006E 55%, #A5008E 100%);
    border-color: #E5006E;
    color: #FFFFFF;
}

.btn.btn-primary:focus,
.btn.btn-primary:hover,
.btn.btn-primary:active,
.btn.btn-primary.active {
    background: linear-gradient(135deg, #FF57AE 0%, #C4005E 55%, #8B0079 100%);
    border-color: #C4005E;
    color: #FFFFFF;
}

/*
 * The active tab flies the full flag. The widths are set per-edge because the
 * tab anchor carries a border on all four sides, and border-image would
 * otherwise paint a rainbow box instead of an underline.
 */
.tab .tab-item a.active,
.tab .tab-item.active a {
    border-style: solid;
    border-width: 0 0 3px 0;
    border-color: transparent;
    border-image: linear-gradient(90deg, ${PRIDE}) 1;
}

/* ---------- progress bars and switches ---------- */
.bar .bar-item {
    background: linear-gradient(90deg, ${PRIDE});
}

.form-checkbox input:checked + .form-icon,
.form-radio input:checked + .form-icon,
.form-switch input:checked + .form-icon {
    background: linear-gradient(135deg, #FF2E9A, #A5008E);
    border-color: #E5006E;
}

/* ---------- headings shade from pink into violet ---------- */
.title,
.modal_title label {
    background: linear-gradient(90deg, #E5006E 0%, #C4008B 50%, #7A2DAF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
}

/* A little sparkle on the section headings, decorative only */
.title::after {
    content: " \\2728";
    -webkit-text-fill-color: initial;
}

/* ---------- the WiFi statistics callout gets a rainbow edge ---------- */
.card {
    border: 2px solid transparent;
    border-image: linear-gradient(135deg, ${PRIDE}) 1;
}

/* ---------- pink logo ---------- */
svg.esp3dlogo [fill="#005B96"] {
    fill: #C4005E;
}

svg.esp3dlogo [fill="#6497B1"] {
    fill: #FF2E9A;
}
`

const gayographThemeCss = buildThemeCss(gayographPalette) + gayographExtraCss

export { gayographThemeCss, gayographPalette }
