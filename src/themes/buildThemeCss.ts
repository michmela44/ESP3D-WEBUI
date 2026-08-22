/*
 buildThemeCss.ts - ESP3D WebUI built-in theme CSS generator

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

import type { ThemePalette } from "./palette"

/**
 * Build the arrow used by `.form-select` as an inline SVG data URI.
 * Spectre hardcodes a dark arrow, unreadable on a dark background.
 *
 * @param color - Arrow color, `#` is percent-encoded for the data URI
 * @returns A `url(...)` value usable as a CSS background
 */
const selectArrow = (color: string): string => {
    const fill = encodeURIComponent(color)
    return (
        `url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'` +
        `%20viewBox='0%200%204%205'%3E%3Cpath%20fill='${fill}'` +
        `%20d='M2%200L0%202h4zm0%205L0%203h4z'/%3E%3C/svg%3E")`
    )
}

/**
 * Generate the CSS overrides implementing a theme.
 *
 * The result is injected as a single `<style>` element appended to `<head>`
 * after the application stylesheet, so plain selectors already win on equal
 * specificity; `!important` is only used where the base rules use it too.
 *
 * @param palette - Colors describing the theme
 * @returns The theme stylesheet as a string
 */
const buildThemeCss = (palette: ThemePalette): string => {
    const p = palette
    const glow = p.textGlow ? `text-shadow: ${p.textGlow};` : ""
    const font = p.fontFamily
        ? `html, body, .btn, .form-input, .form-select, input, select, textarea, button {
    font-family: ${p.fontFamily};
}`
        : ""

    return `
/*
 * WifiStats applies --highlight-color through an inline style, so redefining
 * the custom property is the only way to retheme it (and needs no !important).
 */
:root {
    --highlight-color: ${p.highlight ?? p.accentSoft};
}

/* ---------- base surfaces ---------- */
html,
body,
#app,
.main-page-container,
#main-container,
.empty,
section,
.page-container,
.page-target-container,
.panel-target-container,
.extra-content-container,
.body-extension {
    background-color: ${p.bg};
    color: ${p.text};
}

${font}

.panel,
.card,
.modal-container,
.dropdown .menu,
.menu {
    background-color: ${p.surface};
    color: ${p.text};
}

.panel {
    border: 0.05rem solid ${p.border};
}

.modal-overlay {
    background: rgba(0, 0, 0, 0.75);
}

/* ---------- navbars and panel headers ---------- */
.navbar,
.panel .navbar,
.panel .navbar-section,
.menu-container .navbar,
span.navbar-section {
    background-color: ${p.surfaceAlt};
    color: ${p.accent};
    ${glow}
}

.navbar {
    border-bottom: 0.05rem solid ${p.border};
}

a svg.esp3dlogo,
.logo {
    color: ${p.accent} !important;
}

/*
 * The FluidNC logo bakes the color of its lettering into the SVG as a
 * presentation attribute, which is invisible on a dark background. The
 * attribute selector repaints only the letters and leaves the brand-colored
 * wave alone.
 */
svg.esp3dlogo [fill="#20262C"] {
    fill: ${p.text};
    stroke: ${p.bg};
}

/* The logos also bake in a white background/cutout, which shows as a white
   blob once the navbar behind them is dark. */
svg.esp3dlogo[fill="white"] {
    fill: ${p.surfaceAlt};
}

svg.esp3dlogo [stroke="white"] {
    stroke: ${p.surfaceAlt};
}

/* ---------- text helpers ---------- */
.text-dark,
label.text-dark,
span.text-dark,
.slider-ctrl label,
span.input-group-addon {
    color: ${p.text} !important;
}

.text-muted,
.text-gray {
    color: ${p.textMuted} !important;
}

.text-primary,
.files-list-footer,
.field-group,
.menu-item,
.tab-item,
.jog-position-header,
.jog-position-sub-header,
.extra-control-header {
    color: ${p.accent} !important;
}

.text-success {
    color: ${p.success} !important;
}

.text-warning {
    color: ${p.warning} !important;
}

.text-error {
    color: ${p.error} !important;
}

.extra-control-value,
.status-control-value,
.jog-position-value,
.temperatures-value,
.extruder-ctrl-name,
.temperature-ctrl-name {
    color: ${p.text};
    ${glow}
}

/* ---------- active items ---------- */
section .active,
li .active,
a.active svg,
a.active label.hide-low,
.file-line-action:active {
    color: ${p.accentStrong} !important;
    ${glow}
}

.mobile-view section .active,
.mobile-view li .active {
    background-color: ${p.accentSoft} !important;
}

/* ---------- buttons ---------- */
.btn {
    background: ${p.surfaceRaised};
    border-color: ${p.border};
    color: ${p.text};
}

.btn:focus,
.btn:hover {
    background: ${p.accentSoft};
    border-color: ${p.accent};
    color: ${p.accent};
}

.btn:active,
.btn.active {
    background: ${p.accent};
    border-color: ${p.accent};
    color: ${p.onAccent};
}

.btn[disabled],
.btn:disabled,
.btn.disabled {
    background: ${p.surfaceRaised};
    border-color: ${p.border};
    color: ${p.textMuted};
}

.btn.btn-primary {
    background: ${p.accent};
    border-color: ${p.accent};
    color: ${p.onAccent};
}

.btn.btn-primary:focus,
.btn.btn-primary:hover,
.btn.btn-primary:active,
.btn.btn-primary.active {
    background: ${p.accentStrong};
    border-color: ${p.accentStrong};
    color: ${p.onAccent};
}

.btn.btn-link {
    background: transparent;
    border-color: transparent;
    color: ${p.accent};
}

.btn.btn-link.active,
.btn.btn-link:active,
.btn.btn-link:focus,
.btn.btn-link:hover {
    background: transparent;
    color: ${p.accentStrong};
}

/* Spectre gives .btn-clear a hardcoded dark color, invisible on dark surfaces */
.btn.btn-clear {
    background: transparent;
    color: ${p.text};
    opacity: 0.7;
}

.btn.btn-clear:hover,
.btn.btn-clear:focus {
    background: ${p.accentSoft};
    color: ${p.accentStrong};
    opacity: 1;
}

.btn-header,
.btn-close,
.nested-button {
    background-color: ${p.accentSoft};
    color: ${p.accent};
}

.mobile-view .btn-header,
.btn-header:hover,
.mobile-view .btn-close,
.btn-close:hover {
    color: ${p.onAccent} !important;
    background-color: ${p.accentStrong} !important;
}

.btn.btn-screen {
    background: transparent;
    color: currentColor;
}

.btn.btn-screen:hover {
    background: ${p.accentStrong};
    color: ${p.onAccent};
}

.badge-container {
    border-color: ${p.accent};
}

button svg,
.feather-icon-container svg {
    stroke: currentColor;
}

/* ---------- flat (radio) buttons ---------- */
.flatbtn label {
    background: ${p.surface};
    border-color: ${p.accent};
    color: ${p.accent};
}

.flatbtn input[type="radio"]:active + label {
    background: ${p.accentStrong};
    color: ${p.onAccent};
}

.flatbtn input[type="radio"]:checked + label {
    background: ${p.accent};
    color: ${p.onAccent};
}

.flatbtn input[type="radio"]:disabled ~ label {
    color: ${p.textMuted};
    border-color: ${p.border};
}

/* ---------- emergency button ---------- */
.emergency-btn {
    color: ${p.error};
    background-color: ${p.surface};
    border-color: ${p.error};
}

.emergency-btn:hover {
    background-color: ${p.error};
    color: ${p.onAccent};
}

.emergency-btn:active {
    color: ${p.error};
    background-color: ${p.surface};
}

/* ---------- forms ---------- */
.form-input,
.form-select,
input,
select,
textarea,
span.form-input {
    background-color: ${p.surface};
    border-color: ${p.border};
    color: ${p.text};
}

.form-input::placeholder {
    color: ${p.textMuted};
}

.form-input:focus,
.form-select:focus,
input:focus,
select:focus {
    border-color: ${p.accent};
    box-shadow: 0 0 0 0.1rem ${p.accentSoft};
}

.form-input[readonly],
.form-input:disabled,
.form-select:disabled,
input:disabled,
select:disabled {
    background-color: ${p.surfaceAlt};
    color: ${p.textMuted};
}

.form-select:not([multiple]):not([size]) {
    background: ${p.surface} ${selectArrow(p.textMuted)} no-repeat right 0.35rem center/0.4rem 0.5rem;
}

.form-select:not([multiple]):not([size]) option {
    background-color: ${p.surface};
    color: ${p.text};
}

.input-group .input-group-addon {
    background: ${p.surfaceAlt};
    border-color: ${p.border};
    color: ${p.text};
}

.form-label,
.form-group .form-label,
label {
    color: ${p.text};
}

.form-input-hint {
    color: ${p.textMuted};
}

.form-checkbox .form-icon,
.form-radio .form-icon,
.form-switch .form-icon {
    background: ${p.surface};
    border-color: ${p.border};
}

.form-checkbox input:checked + .form-icon,
.form-radio input:checked + .form-icon,
.form-switch input:checked + .form-icon {
    background: ${p.accent};
    border-color: ${p.accent};
}

.form-checkbox input:focus + .form-icon,
.form-radio input:focus + .form-icon,
.form-switch input:focus + .form-icon {
    border-color: ${p.accent};
    box-shadow: 0 0 0 0.1rem ${p.accentSoft};
}

input[type="range"]::-webkit-slider-thumb,
input[type="range"]::-moz-range-thumb,
input[type="range"]::-ms-thumb {
    background: ${p.accent};
}

/* ---------- modification / validation states ---------- */
.has-modification .form-input,
.form-input.is-modified,
.has-modification .form-select,
.form-select.is-modified {
    background: ${p.surface};
    border-color: ${p.warning};
}

.bordered,
.files-list,
.terminal,
.fieldset-bottom-separator,
.fieldset-top-separator {
    border-color: ${p.border};
}

/* ---------- menus ---------- */
.menu .menu-item > .menu-entry:focus,
.menu .menu-item > .menu-entry:hover,
.item-selection-list:hover,
.notification-line:hover,
.file-line:hover {
    background-color: ${p.accentSoft};
    color: ${p.accentStrong};
}

.panel .menu-item:active,
.panel .menu-item.active {
    background: ${p.accent};
    color: ${p.onAccent};
}

.menu .divider,
.divider {
    border-color: ${p.border};
}

/* ---------- tabs ---------- */
.tab {
    border-bottom-color: ${p.border};
}

.tab .tab-item a {
    color: ${p.accent};
}

.tab .tab-item a:focus,
.tab .tab-item a:hover {
    color: ${p.accentStrong};
}

.tab .tab-item a.active,
.tab .tab-item.active a {
    color: ${p.accentStrong};
    border-bottom-color: ${p.accentStrong};
}

/* ---------- tables ---------- */
.table,
.table td,
.table th {
    color: ${p.text};
    border-color: ${p.border};
}

.table th {
    background-color: ${p.surfaceAlt};
}

.table tbody tr:hover,
.table.table-striped tbody tr:nth-of-type(odd) {
    background: ${p.surfaceAlt};
}

/* ---------- terminal ---------- */
.terminal,
.tablet-terminal-output {
    background-color: ${p.surface};
    color: ${p.text};
    border-color: ${p.border};
}

.terminal .echo,
.tablet-terminal-output pre.echo,
.tablet-terminal-output pre .info {
    color: ${p.echo};
}

.terminal .error,
.tablet-terminal-output pre.error,
.tablet-terminal-output pre .error {
    color: ${p.error};
}

.tablet-terminal-output pre.warning,
.tablet-terminal-output pre .warning {
    color: ${p.warning};
}

.terminal .action,
.tablet-terminal-output pre.action {
    color: ${p.success};
}

.comment {
    background: ${p.accentSoft};
    color: ${p.accent};
}

/* ---------- files ---------- */
.file-line,
.file-item-name,
.file-line-name {
    color: ${p.text};
}

.tablet-files-container,
.tablet-files-list,
.tablet-files-toolbar,
.tablet-files-path,
.tablet-files-footer,
.tablet-file-item {
    background-color: ${p.surface};
    color: ${p.text};
    border-color: ${p.border};
}

.drop-zone--over {
    background: linear-gradient(90deg, ${p.accent} 50%, transparent 50%),
        linear-gradient(90deg, ${p.accent} 50%, transparent 50%),
        linear-gradient(0deg, ${p.accent} 50%, transparent 50%),
        linear-gradient(0deg, ${p.accent} 50%, transparent 50%);
    background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    background-size: 15px 4px, 15px 4px, 4px 15px, 4px 15px;
}

/* ---------- progress and labels ---------- */
.bar,
.progress {
    background: ${p.surfaceAlt};
}

.bar .bar-item {
    background: ${p.accent};
    color: ${p.onAccent};
}

.label {
    background: ${p.surfaceAlt};
    color: ${p.text};
}

.label.label-primary {
    background: ${p.accent};
    color: ${p.onAccent};
}

.label.label-success {
    background: ${p.success};
    color: ${p.onAccent};
}

.label.label-warning {
    background: ${p.warning};
    color: ${p.onAccent};
}

.label.label-error {
    background: ${p.error};
    color: ${p.onAccent};
}

/* ---------- toasts and tooltips ---------- */
.toast {
    background: ${p.surfaceAlt};
    border-color: ${p.border};
    color: ${p.text};
}

.toast.toast-success {
    background: ${p.success};
    border-color: ${p.success};
    color: ${p.onAccent};
}

.toast.toast-error {
    background: ${p.error};
    border-color: ${p.error};
    color: ${p.onAccent};
}

.tooltip::after {
    background: ${p.surfaceAlt};
    color: ${p.text};
}

/* ---------- spectre background utilities ---------- */
.bg-secondary {
    background: ${p.accentSoft} !important;
}

.bg-primary {
    background: ${p.accent} !important;
    color: ${p.onAccent} !important;
}

.bg-dark {
    background: ${p.surfaceAlt} !important;
    color: ${p.text} !important;
}

.bg-warning {
    background: ${p.warning} !important;
    color: ${p.onAccent} !important;
}

.bg-error {
    background: ${p.error} !important;
    color: ${p.onAccent} !important;
}

/* ---------- dashboard controls (status, jog, probe) ---------- */
.status-control,
.extra-control,
.jog-position-ctrl,
.jog-axis-group {
    border-color: ${p.border};
}

.status-control-header,
.extra-control-header,
.jog-position-header,
.jog-position-sub-header,
.jog-distance-selector-header {
    background-color: ${p.accentSoft};
    color: ${p.accent};
    border-color: ${p.border};
}

.jog-distance-selector-header {
    border: 0.05rem solid ${p.accent} !important;
}

#selectAxisList {
    border-color: ${p.accent} !important;
}

.status-control-value,
.buttons-bar-label {
    color: ${p.accent};
}

.jog-position-clickable:hover {
    background-color: ${p.accentSoft};
}

.jog-position-clickable:active {
    background-color: ${p.accent};
    color: ${p.onAccent};
}

/* FluidNC target reuses these for extra terminal message levels */
.terminal .warning {
    color: ${p.warning};
}

.terminal .info {
    color: ${p.echo};
}

/* ---------- scrollbars ---------- */
/*
 * Panels scroll internally, so unthemed scrollbars show up as bright bars in
 * the middle of the UI. scrollbar-color inherits, so setting it on html is
 * enough for the standard property; the -webkit- rules cover Chromium/Safari.
 */
html {
    scrollbar-color: ${p.accent} ${p.surfaceAlt};
    scrollbar-width: thin;
}

::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

::-webkit-scrollbar-track {
    background: ${p.surfaceAlt};
}

::-webkit-scrollbar-thumb {
    background: ${p.accent};
    border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
    background: ${p.accentStrong};
}

::-webkit-scrollbar-corner {
    background: ${p.surfaceAlt};
}

/* ---------- misc ---------- */
.modal_title,
.title,
h1, h2, h3, h4, h5, h6 {
    color: ${p.text};
}

.loading::after,
.loading-panel::after {
    border-color: ${p.accent};
    border-right-color: transparent;
    border-top-color: transparent;
}

.chart {
    filter: invert(1) hue-rotate(180deg);
}
`
}

export { buildThemeCss }
