/*
QuickStopButton.tsx - ESP3D WebUI component file

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

import { TargetedMouseEvent } from "preact"
import { AlertCircle } from "preact-feather"
import { useTargetCommands } from "../../../hooks"
import { useUiContextFn } from "../../../contexts"
import { T } from "../../../components/Translations"
import { ButtonImg } from "../../../components/Controls"

const QuickStopButton = () => {
    const { targetCommands } = useTargetCommands()

    return (
        <ButtonImg
            m1
            rtooltip
            label={T("P15")}
            className="emergency-btn"
            icon={<AlertCircle />}
            data-tooltip={T("P15")}
            id="btnEStop"
            onclick={(_e: TargetedMouseEvent<HTMLButtonElement>) => {
                useUiContextFn.haptic()
                const cmds = useUiContextFn.getValue("emergencystop")
                targetCommands(cmds, ';')
            }}
        />
    )
}

export { QuickStopButton }
