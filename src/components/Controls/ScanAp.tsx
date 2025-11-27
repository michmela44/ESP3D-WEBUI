/*
ScanAp.tsx - ESP3D WebUI component file

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

import { Fragment,  FunctionalComponent } from "preact"
import { useState, useEffect } from "preact/hooks"
import { ButtonImg, Loading } from "./../Controls"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn, useModalsContext, useToastsContext } from "../../contexts"
import { T } from "./../Translations"
import { Lock, CheckCircle } from "preact-feather"

interface AccessPoint {
    SSID: string
    SIGNAL: number
    IS_PROTECTED: boolean
}

interface ScanApListProps {
    id: string
    setValue: (value: string) => void
    refreshfn: (fn: () => void) => void
}

const ScanApList: FunctionalComponent<ScanApListProps> = ({ id, setValue, refreshfn }) => {
    const { modals } = useModalsContext()
    const { toasts } = useToastsContext()
    const [isLoading, setIsLoading] = useState(true)

    const [APList, setApList] = useState<AccessPoint[]>([])
    const { targetCommands } = useTargetCommands()
    const ScanNetworks = () => {
        setIsLoading(true)
        const callbacks = {
            onSuccess: (result: string) => {
                setIsLoading(false)
                const jsonResult = JSON.parse(result)
                if (
                    jsonResult.cmd != 410 ||
                    jsonResult.status == "error" ||
                    !jsonResult.data
                ) {
                    toasts.addToast({ content: T("S194"), type: "error" })
                } else {
                setApList(jsonResult.data)
}
            },
            onFail: (error: string) => {
                setIsLoading(false)
                toasts.addToast({ content: error, type: "error" })
                setApList([])
            },
        }
        targetCommands("[ESP410]json=yes", undefined, { echo: false }, callbacks)
    }
    useEffect(() => {
        ScanNetworks()
        refreshfn(ScanNetworks)
    }, [])
    return (
        <Fragment>
            {isLoading && <Loading />}
            {!isLoading && (
                <table class="table">
                    <thead class="hide-low">
                        <tr>
                            <th>{T("SSID")}</th>
                            <th>{T("signal")}</th>
                            <th>{T("S49")}</th>
                            <th>{T("S48")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {APList.map((e) => {
                            const SSID = e.SSID.replace("&#39;", "'").replace(
                                "&#34;",
                                '"'
                            )
                            return (
                                <tr key={e.SSID}>
                                    <td>{SSID}</td>
                                    <td>{e.SIGNAL}%</td>
                                    <td>{e.IS_PROTECTED ? <Lock /> : ""}</td>
                                    <td>
                                        <ButtonImg
                                            m2
                                            ltooltip
                                            data-tooltip={T("S51")}
                                            icon={<CheckCircle />}
                                            onClick={() => {
                                                useUiContextFn.haptic()
                                                setValue(SSID)
                                                modals.removeModal(
                                                    modals.getModalIndex(id)
                                                )
                                            }}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </Fragment>
    )
}
export { ScanApList }
