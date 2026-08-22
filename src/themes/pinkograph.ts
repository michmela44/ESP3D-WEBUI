/*
 pinkograph.ts - ESP3D WebUI built-in Pinkograph theme (neon pink on black)

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
 * Neon signage: bright true pink lit against deep violet, with cyan as the
 * classic second tube. The pink stays at hue 330 so it never drifts into
 * magenta - the purple belongs to the surfaces behind it, not the accent.
 */
const pinkographPalette: ThemePalette = {
    bg: "#0B0014",
    surface: "#16032A",
    surfaceAlt: "#22064A",
    surfaceRaised: "#2C0857",
    accentSoft: "#3C0A66",
    border: "#FF6BB5",
    text: "#FFEAF4",
    textMuted: "#E3A0C0",
    accent: "#FF6BB5",
    accentStrong: "#FFA6D4",
    onAccent: "#14001F",
    echo: "#00F5FF",
    success: "#39FF14",
    warning: "#FFD400",
    error: "#FF3860",
    highlight: "#2C0857",
    textGlow: "0 0 6px rgba(255, 107, 181, 0.95), 0 0 18px rgba(255, 107, 181, 0.55)",
}

/** Neon pink, as an rgb triplet for composing glow shadows. */
const PINK = "255, 107, 181"
/** The second tube. */
const CYAN = "0, 245, 255"

/**
 * The lighting rig: glow shadows, a pulsing sign and a couple of gradients.
 * Animations are disabled under prefers-reduced-motion.
 */
const pinkographExtraCss = `
/* ---------- the room the signs hang in ---------- */
body {
    background-color: #0B0014;
    background-image:
        radial-gradient(circle at 12% -5%, rgba(${PINK}, 0.20), transparent 45%),
        radial-gradient(circle at 88% 105%, rgba(${CYAN}, 0.14), transparent 45%);
    background-attachment: fixed;
}

/* ---------- every surface is a lit tube ---------- */
.panel,
.card,
.modal-container {
    border: 1px solid rgba(${PINK}, 0.75);
    box-shadow:
        0 0 10px rgba(${PINK}, 0.48),
        0 0 26px rgba(${PINK}, 0.26),
        inset 0 0 16px rgba(${PINK}, 0.10);
}

.panel .navbar,
.panel .navbar-section {
    background: linear-gradient(90deg, #2A0654 0%, #3C0A66 50%, #2A0654 100%);
    border-bottom: 1px solid rgba(${PINK}, 0.6);
}

/* ---------- the main sign, humming ---------- */
.navbar,
.menu-container .navbar {
    background: linear-gradient(90deg, #16032A 0%, #2C0857 50%, #16032A 100%);
    border-bottom: 2px solid rgba(${PINK}, 0.9);
    animation: pinkograph-hum 2.6s ease-in-out infinite;
}

@keyframes pinkograph-hum {
    0%, 100% {
        box-shadow: 0 2px 10px rgba(${PINK}, 0.45), 0 2px 26px rgba(${PINK}, 0.20);
    }
    50% {
        box-shadow: 0 2px 18px rgba(${PINK}, 0.85), 0 2px 44px rgba(${PINK}, 0.40);
    }
}

/* ---------- controls ---------- */
/*
 * Buttons are not uppercased: they also carry user data (macro names, file
 * names, "1.5s" polling intervals), and there is no class separating those
 * from label buttons. The uppercase flash lives on the chrome instead.
 */
.btn {
    border: 1px solid rgba(${PINK}, 0.65);
    box-shadow: 0 0 9px rgba(${PINK}, 0.42);
}

.btn:focus,
.btn:hover {
    color: #FFFFFF;
    border-color: #FFA6D4;
    box-shadow:
        0 0 10px rgba(${PINK}, 0.85),
        0 0 26px rgba(${PINK}, 0.45);
    text-shadow: 0 0 8px rgba(${PINK}, 0.9);
}

.btn.btn-primary {
    background: linear-gradient(135deg, #FF6BB5 0%, #FFA6D4 100%);
    color: #14001F;
    text-shadow: none;
    box-shadow: 0 0 12px rgba(${PINK}, 0.7), 0 0 30px rgba(${PINK}, 0.35);
}

/* Cyan is the focus tube, so focus never gets lost in all the pink */
.form-input:focus,
.form-select:focus,
input:focus,
select:focus {
    border-color: #00F5FF;
    box-shadow: 0 0 8px rgba(${CYAN}, 0.75), 0 0 20px rgba(${CYAN}, 0.35);
}

.form-input,
.form-select,
input,
select {
    box-shadow: inset 0 0 8px rgba(${PINK}, 0.12);
}

.form-checkbox input:checked + .form-icon,
.form-radio input:checked + .form-icon,
.form-switch input:checked + .form-icon {
    background: linear-gradient(135deg, #FF6BB5, #FFA6D4);
    box-shadow: 0 0 8px rgba(${PINK}, 0.8);
}

/* ---------- headings and active items burn brightest ---------- */
.panel .navbar .navbar-section,
.modal_title label,
.title {
    text-shadow: 0 0 6px rgba(${PINK}, 0.9), 0 0 18px rgba(${PINK}, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.tab .tab-item a.active,
.tab .tab-item.active a {
    border-style: solid;
    border-width: 0 0 2px 0;
    border-color: #FF6BB5;
    box-shadow: 0 3px 12px -2px rgba(${PINK}, 0.9);
    text-shadow: 0 0 8px rgba(${PINK}, 0.9);
}

/* ---------- readouts ---------- */
.bar .bar-item {
    background: linear-gradient(90deg, #FF6BB5, #FFA6D4, #00F5FF);
    box-shadow: 0 0 10px rgba(${PINK}, 0.8);
}

.terminal,
.tablet-terminal-output {
    box-shadow: inset 0 0 16px rgba(${PINK}, 0.10);
}

.emergency-btn {
    box-shadow: 0 0 10px rgba(255, 56, 96, 0.6);
}

/* ---------- neon logo ---------- */
a svg.esp3dlogo,
.logo {
    filter: drop-shadow(0 0 4px rgba(${PINK}, 0.9))
        drop-shadow(0 0 10px rgba(${PINK}, 0.45));
}

svg.esp3dlogo [fill="#005B96"] {
    fill: #EE4A93;
}

svg.esp3dlogo [fill="#6497B1"] {
    fill: #FF6BB5;
}

/* Flashing signs are a migraine risk - honour the OS preference */
@media (prefers-reduced-motion: reduce) {
    .navbar,
    .menu-container .navbar {
        animation: none;
        box-shadow: 0 2px 14px rgba(${PINK}, 0.55);
    }
}
`

const pinkographThemeCss = buildThemeCss(pinkographPalette) + pinkographExtraCss

export { pinkographThemeCss, pinkographPalette }
