/*
 genericModal.tsx - ESP3D WebUI component file

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
import { h, ComponentChildren } from "preact"
import { useUiContextFn } from "../../contexts"

interface ButtonConfig {
    text: string
    id?: string
    cb?: () => void
    noclose?: boolean
}

interface ShowModalParams {
    modals: {
        getModalIndex: (id: string) => number
        removeModal: (index: number) => void
        addModal: (modal: any) => void
    }
    title: string
    button1?: ButtonConfig
    button2?: ButtonConfig
    content: ComponentChildren
    icon?: ComponentChildren
    id: string
    hideclose?: boolean
    overlay?: boolean
}

const showModal = ({
    modals,
    title,
    button1,
    button2,
    content,
    icon,
    id,
    hideclose,
    overlay,
}: ShowModalParams): void => {
    const defaultCb1 = () => {
        useUiContextFn.haptic()
        if (button1 && button1.noclose != true)
            modals.removeModal(modals.getModalIndex(id))
        if (button1 && button1.cb) button1.cb()
    }
    const defaultCb2 = () => {
        useUiContextFn.haptic()
        if (button2 && button2.noclose != true)
            modals.removeModal(modals.getModalIndex(id))
        if (button2 && button2.cb) button2.cb()
    }
    if (modals.getModalIndex(id) == -1)
        modals.addModal({
            id,
            title: (
                <div class="text-primary feather-icon-container modal_title">
                    {icon}
                    <label>{title}</label>
                </div>
            ),
            content: content,
            footer: (
                <div>
                    {button1 && (
                        <button
                            id={button1.id ? button1.id : undefined}
                            class="btn mx-2"
                            onClick={defaultCb1}
                        >
                            {button1.text}
                        </button>
                    )}

                    {button2 && (
                        <button
                            id={button2.id ? button2.id : undefined}
                            class="btn mx-2"
                            onClick={defaultCb2}
                        >
                            {button2.text}
                        </button>
                    )}
                </div>
            ),
            overlay: overlay,
            hideclose: hideclose,
        })
}

export { showModal }
export type { ShowModalParams, ButtonConfig }
