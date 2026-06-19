/*
 BackgroundContainer.tsx - ESP3D WebUI Target file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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
import { useEffect } from "preact/hooks"
import { useTargetContext } from "../../.."
import { useToastsContext, useUiContext } from "../../../../contexts"
import { T } from "../../../../components/Translations"
import { useTargetCommands } from "../../../../hooks"

const last: { status: { state: string } } = { status: { state: "?" } }

function hexToRgba(hex: string, opacity: number): string {
    const h = hex.replace("#", "")
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`
}

const BackgroundContainer = () => {
    const { alarmCode, errorCode, status } = useTargetContext()
    const { toasts } = useToastsContext()
    const { targetCommands } = useTargetCommands()
    const { uisettings } = useUiContext()

    // Apply background image on the whole app
    useEffect(() => {
        const bgImage = uisettings.getValue("background_image")
        const app = document.getElementById("app")
        if (app) {
            if (bgImage && bgImage.trim() !== "") {
                app.style.backgroundImage = `url('${bgImage}')`
                app.style.backgroundSize = "cover"
                app.style.backgroundPosition = "center"
                app.style.backgroundRepeat = "no-repeat"
                app.style.backgroundAttachment = "fixed"
            } else {
                app.style.backgroundImage = ""
                app.style.backgroundSize = ""
                app.style.backgroundPosition = ""
                app.style.backgroundRepeat = ""
                app.style.backgroundAttachment = ""
            }
        }
    }, [uisettings])

    // Apply panel color CSS variables
    useEffect(() => {
        const root = document.documentElement

        // Read all values first
        const panelBg          = uisettings.getValue("panel_bg")
        const panelBgOpacity   = Number(uisettings.getValue("panel_bg_opacity") ?? 100)
        const panelText        = uisettings.getValue("panel_text")
        const panelHeaderBg    = uisettings.getValue("panel_header_bg")
        const panelHeaderBgOpacity = Number(uisettings.getValue("panel_header_bg_opacity") ?? 100)
        const panelHeaderText  = uisettings.getValue("panel_header_text")
        const accentColor      = uisettings.getValue("accent_color")
        const toggleColor      = uisettings.getValue("toggle_color")
        const tabText          = uisettings.getValue("tab_text")
        const tabActive        = uisettings.getValue("tab_active")
        const navbarBg         = uisettings.getValue("navbar_bg")
        const navbarBgOpacity  = Number(uisettings.getValue("navbar_bg_opacity") ?? 100)
        const menuText         = uisettings.getValue("menu_text")
        const dropdownBg       = uisettings.getValue("dropdown_bg")
        const dropdownBgOpacity = Number(uisettings.getValue("dropdown_bg_opacity") ?? 100)
        const dropdownText     = uisettings.getValue("dropdown_text")
        const fieldGroupText  = uisettings.getValue("field_group_text")

        // Apply panel colors
        if (panelBg)         root.style.setProperty("--panel-bg", hexToRgba(panelBg, panelBgOpacity))
        if (panelText)       root.style.setProperty("--panel-text", panelText)
        if (panelHeaderBg)   root.style.setProperty("--panel-header-bg", hexToRgba(panelHeaderBg, panelHeaderBgOpacity))
        if (panelHeaderText) root.style.setProperty("--panel-header-text", panelHeaderText)

        // Apply nav colors
        if (tabText)   root.style.setProperty("--tab-text", tabText)
        if (tabActive) root.style.setProperty("--tab-active", tabActive)
        if (navbarBg)  root.style.setProperty("--navbar-bg", hexToRgba(navbarBg, navbarBgOpacity))
        if (menuText)  root.style.setProperty("--menu-text", menuText)
        if (fieldGroupText) root.style.setProperty("--field-group-text", fieldGroupText)

        // Apply dropdown colors
        if (dropdownBg)   root.style.setProperty("--dropdown-bg", hexToRgba(dropdownBg, dropdownBgOpacity))
        if (dropdownText) root.style.setProperty("--dropdown-text", dropdownText)

        // Apply accent + toggle via injected style tag
        if (accentColor || toggleColor) {
            const ac = accentColor || "#005b96"
            const tc = toggleColor || ac
            root.style.setProperty("--accent-color", ac)
            const styleId = "custom-accent-style"
            let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
            if (!styleEl) {
                styleEl = document.createElement("style")
                styleEl.id = styleId
                document.head.appendChild(styleEl)
            }
            styleEl.innerHTML = `
                .btn-primary { background: ${ac} !important; border-color: ${ac} !important; }
                .btn-primary:hover { filter: brightness(0.9); }
                a { color: ${ac}; }
                .text-primary { color: ${ac} !important; }
                .form-switch input:checked + .form-icon {
                    background: ${tc} !important;
                    border-color: ${tc} !important;
                }
                .form-checkbox input:checked + .form-icon,
                .form-radio input:checked + .form-icon {
                    background: ${tc} !important;
                    border-color: ${tc} !important;
                }
            `
        }
    }, [uisettings])

    useEffect(() => {
        if (status.state !== last.status.state) {
            if (status.state == "Tool") {
                targetCommands("#TOOLCHANGE#")
            }
            last.status = status
        }
        if (alarmCode != 0 || errorCode != 0) {
            toasts.addToast({
                type: "error",
                content: T(
                    alarmCode != 0 ? `ALARM:${alarmCode}` : `error:${errorCode}`
                ),
            })
        }
    }, [alarmCode, errorCode, status])

    return null
}

export { BackgroundContainer }
