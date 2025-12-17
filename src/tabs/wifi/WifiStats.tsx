/*
 WifiStats.tsx - WiFi Statistics Display Component

 Copyright (c) 2025 Mike Melancon. All rights reserved.

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

import { FunctionalComponent, Fragment, TargetedMouseEvent } from "preact"
import { ButtonImg } from "../../components/Controls"
import { RefreshCw } from "preact-feather"
import { useUiContextFn } from "../../contexts"
import { T } from "../../components/Translations"

interface WiFiStatsData {
    currentWifiMode?: string
    signal?: string | number
    connectedTo?: string
    apSSID?: string
    ip?: string
    netmask?: string
    gateway?: string
}

interface WifiStatsProps {
    stats: WiFiStatsData
    onRefresh: () => void
}

const WifiStats: FunctionalComponent<WifiStatsProps> = ({ stats, onRefresh }) => {
    return (
        <Fragment>
            <div class="card"  style={{ background: "var(--highlight-color)" }}>
                <div class="card-body">
                   
                    <div class="container">
                        <div class="columns">
                            <div class="column col-10">
                                <div class="columns">
                                    <div class="column col-11"> <h4>WiFi Statistics</h4></div>
                                    <div class="column col-1" > <ButtonImg
                                    tooltip className="px-2"
                                    data-tooltip={T("S23")}
                                    icon={<RefreshCw />}
                                    onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                        useUiContextFn.haptic()
                                        e.currentTarget.blur()
                                        onRefresh()
                                    }}
                                /></div>
                                </div>
                                <div class="columns">
                                    <div class="column col-3"> <b>WiFi mode:</b></div>
                                    <div class="column col-9">{stats?.currentWifiMode}</div>
                                </div>
                                <div class="columns">
                                    <div class="column col-3"> <b>Signal:</b></div>
                                    <div class="column col-9">{stats?.signal}</div>
                                </div>
                                <div class="columns">
                                    <div class="column col-3"> <b>SSID:</b></div>
                                    <div class="column col-9">{stats?.connectedTo ?? stats?.apSSID ?? "—"}</div>
                                </div>
                                <div class="columns">
                                    <div class="column col-3"> <b>IP:</b></div>
                                    <div class="column col-9">{stats?.ip}</div>
                                </div>
                                <div class="columns">
                                    <div class="column col-3"> <b>Netmask:</b></div>
                                    <div class="column col-9">{stats?.netmask}</div>
                                </div>
                                <div class="columns">
                                    <div class="column col-3"> <b>Gateway:</b></div>
                                    <div class="column col-9">{stats?.gateway}</div>
                                </div>
                            </div>
                            <div class="column col-2"></div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default WifiStats
