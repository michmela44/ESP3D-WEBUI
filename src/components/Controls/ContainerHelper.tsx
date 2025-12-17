/*
ContainerHelper.tsx - ESP3D WebUI component file

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

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

import { Fragment,  FunctionalComponent } from "preact"
import { ModalContainer } from "../Modal"
import { ToastsContainer } from "../Toast"
import { useState, useEffect } from "preact/hooks"
import { eventBus } from "../../hooks/eventBus"

interface ContainerHelperProps {
    id: string
    active?: boolean
}

interface UpdateStateMessage {
    isFullScreen?: boolean
    id?: string
}

const ContainerHelper: FunctionalComponent<ContainerHelperProps> = ({ id, active = false }) => {
    const [enabled, setEnabled] = useState(active)
    //console.log("ContainerHelper id", id ,"active", active)
    const listenerId = `listener_containerhelper_${id}`
    useEffect(() => {
        const handleUpdateState = (msg: UpdateStateMessage) => {
            if ('isFullScreen' in msg) {
                if (msg.isFullScreen) {
                    if (id == msg.id) {
                        setEnabled(true)
                    } else {
                        setEnabled(false)
                    }
                } else {
                    if (id === "top_container") {
                        setEnabled(true)
                    } else {
                        setEnabled(false)
                    }
                }
            }
        }
        eventBus.on("updateState", handleUpdateState, listenerId)
        return () => {
            //eventBus.off("updateState", handleUpdateState,listenerId)
        }
    })

    if (enabled) return (
        <Fragment>
            <ModalContainer />
            <ToastsContainer />
        </Fragment>
    )
    return null
}
export default ContainerHelper
