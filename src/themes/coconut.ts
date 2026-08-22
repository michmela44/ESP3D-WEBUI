/*
 coconut.ts - ESP3D WebUI built-in coconut theme (80s green phosphor terminal)

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
 * Green phosphor CRT palette: near-black backgrounds, a single green hue for
 * everything, amber reserved for warnings the way old terminals used it.
 */
const coconutPalette: ThemePalette = {
    bg: "#05100A",
    surface: "#08180F",
    surfaceAlt: "#0C2416",
    surfaceRaised: "#103020",
    accentSoft: "#143A22",
    border: "#1F6B3C",
    text: "#4DFF88",
    textMuted: "#2E9455",
    accent: "#33FF66",
    accentStrong: "#B8FFD0",
    onAccent: "#04180C",
    echo: "#7CFFA8",
    success: "#33FF66",
    warning: "#FFB000",
    error: "#FF5F56",
    fontFamily: `"SF Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, "Courier New", monospace`,
    textGlow: "0 0 4px rgba(51, 255, 102, 0.55)",
}

/**
 * Retro extras layered on top of the generated CSS: CRT scanlines, a phosphor
 * glow on the page, square-ish corners and uppercased headers.
 */
const coconutExtraCss = `
/* ---------- CRT screen ---------- */
body {
    background-image:
        repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.28) 0px,
            rgba(0, 0, 0, 0.28) 1px,
            transparent 1px,
            transparent 3px
        ),
        radial-gradient(ellipse at center, #0A2014 0%, #05100A 100%);
    background-attachment: fixed;
}

#app {
    background-color: transparent;
}

/* Panels glow like a phosphor tube instead of casting a soft shadow */
.panel,
.modal-container,
.card {
    border-radius: 0;
    box-shadow: 0 0 12px rgba(51, 255, 102, 0.12) inset,
        0 0 6px rgba(51, 255, 102, 0.15);
}

.column .panel {
    box-shadow: 0 0 12px rgba(51, 255, 102, 0.12) inset,
        0 0 6px rgba(51, 255, 102, 0.15);
}

/* ---------- squared-off, uppercased chrome ---------- */
.btn,
.form-input,
.form-select,
input,
select,
.label,
.bar,
.toast,
.bordered,
.files-list,
.terminal,
.item-selection-list {
    border-radius: 0;
}

.navbar,
.panel .navbar,
.panel .navbar-section,
.tab .tab-item a,
.modal_title,
.title {
    text-transform: uppercase;
    letter-spacing: 0.06em;
}


/* ---------- blinking caret on the terminal ---------- */
.terminal,
.tablet-terminal-output {
    text-shadow: 0 0 4px rgba(51, 255, 102, 0.45);
}

/* The logo becomes a single-color green stencil instead of a blue mark */
a svg.esp3dlogo,
.logo {
    filter: drop-shadow(0 0 3px rgba(51, 255, 102, 0.6));
}

svg.esp3dlogo [fill="#005B96"] {
    fill: #1F6B3C;
}

svg.esp3dlogo [fill="#6497B1"] {
    fill: #33FF66;
}
`

const coconutThemeCss = buildThemeCss(coconutPalette) + coconutExtraCss

export { coconutThemeCss, coconutPalette }
