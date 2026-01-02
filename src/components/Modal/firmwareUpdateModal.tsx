/*
 firmwareUpdateModal.tsx - ESP3D WebUI component file

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

import { useUiContextFn } from "../../contexts"
import type { GitHubRelease } from "../../types/github.types"
import type { ModalManager } from "../../types/modals.types"
import { Download } from "preact-feather"

interface FirmwareUpdateModalParams {
    modals: ModalManager
    releases: GitHubRelease[]
    currentVersion: string
    onUploadFile: () => void
    onViewReleaseNotes: () => void
}

const showFirmwareUpdateModal = ({
    modals,
    releases,
    currentVersion,
    onUploadFile,
    onViewReleaseNotes,
}: FirmwareUpdateModalParams): void => {
    let selectedReleaseIndex = 0
    let showPrereleases = false

    const getFilteredReleases = (): GitHubRelease[] => {
        return showPrereleases ? releases : releases.filter((r) => !r.prerelease)
    }

    const updateReleaseSelector = () => {
        const filteredReleases = getFilteredReleases()
        const selector = document.getElementById("firmware-release-selector") as HTMLSelectElement
        const infoBox = document.getElementById("firmware-selected-release-info")

        if (!selector || !infoBox) return

        // Clear and repopulate selector
        selector.innerHTML = ""
        filteredReleases.forEach((release, index) => {
            const option = document.createElement("option")
            option.value = index.toString()
            option.text = release.name + (index === 0 ? " (Latest)" : "")
            selector.appendChild(option)
        })

        // Reset to first release
        selectedReleaseIndex = 0
        selector.value = "0"

        // Update info box
        if (filteredReleases.length > 0) {
            const selectedRelease = filteredReleases[0]
            infoBox.innerHTML = `${selectedRelease.tag_name} - Released ${new Date(
                selectedRelease.published_at
            ).toLocaleDateString()}`
        }

        // Update download buttons
        updateDownloadButtons()
    }

    const updateDownloadButtons = () => {
        const filteredReleases = getFilteredReleases()
        const win64Button = document.getElementById("firmware-download-win64") as HTMLButtonElement
        const posixButton = document.getElementById("firmware-download-posix") as HTMLButtonElement

        if (!win64Button || !posixButton || filteredReleases.length === 0) return

        const selectedRelease = filteredReleases[selectedReleaseIndex]
        const hasWin64 = selectedRelease.assets.some((a) => a.name.includes("win64"))
        const hasPosix = selectedRelease.assets.some((a) => a.name.includes("posix"))

        win64Button.disabled = !hasWin64
        posixButton.disabled = !hasPosix
    }

    const downloadFirmware = (platform: "win64" | "posix") => {
        useUiContextFn.haptic()

        const filteredReleases = getFilteredReleases()
        if (filteredReleases.length === 0) return

        const selectedRelease = filteredReleases[selectedReleaseIndex]
        const asset = selectedRelease.assets.find((a) => a.name.includes(platform))

        if (!asset) {
            console.error(`${platform} asset not found in release ${selectedRelease.tag_name}`)
            return
        }

        // Trigger browser download
        const link = document.createElement("a")
        link.href = asset.browser_download_url
        link.download = asset.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleUploadFile = (e?: Event) => {
        if (e) e.stopPropagation()
        useUiContextFn.haptic()
        const modalIndex = modals.getModalIndex("firmware-update")
        if (modalIndex !== -1) {
            modals.removeModal(modalIndex)
        }
        onUploadFile()
    }

    const handleViewReleaseNotes = (e?: Event) => {
        if (e) e.stopPropagation()
        useUiContextFn.haptic()
        onViewReleaseNotes()
    }

    const closeModal = (e?: Event) => {
        if (e) e.stopPropagation()
        useUiContextFn.haptic()
        const modalIndex = modals.getModalIndex("firmware-update")
        if (modalIndex !== -1) {
            modals.removeModal(modalIndex)
        }
    }

    const compareVersions = (current: string, target: string): string => {
        // Remove 'FluidNC ' prefix, 'v' prefix and any prerelease suffix
        // Examples: "FluidNC v3.9.9" -> "3.9.9", "v3.9.9" -> "3.9.9", "v3.7-rc4" -> "3.7"
        const cleanCurrent = current.replace(/^FluidNC\s+/i, "").replace(/^v/, "").split(/[-_]/)[0]
        const cleanTarget = target.replace(/^FluidNC\s+/i, "").replace(/^v/, "").split(/[-_]/)[0]

        const currentParts = cleanCurrent.split(".").map(Number)
        const targetParts = cleanTarget.split(".").map(Number)

        for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i++) {
            const currentPart = currentParts[i] || 0
            const targetPart = targetParts[i] || 0

            if (currentPart < targetPart) return "upgrade"
            if (currentPart > targetPart) return "downgrade"
        }
        return "same"
    }

    const filteredReleases = getFilteredReleases()
    const latestRelease = filteredReleases.length > 0 ? filteredReleases[0] : null

    if (modals.getModalIndex("firmware-update") === -1) {
        modals.addModal({
            id: "firmware-update",
            title: (
                <div class="text-primary feather-icon-container modal_title">
                    <Download />
                    <label>Download Firmware from GitHub</label>
                </div>
            ),
            content: (
                <div class="text-left">
                    {/* Version comparison box */}
                    <div class="mb-3 p-3" style="background-color: #f8f9fa; border-radius: 4px;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div style="flex: 1;">
                                <small class="text-muted d-block">Current Version</small>
                                <strong>{currentVersion}</strong>
                            </div>
                            {latestRelease && (
                                <>
                                    <div style="flex: 1; text-align: center; padding: 0 1rem;">
                                        {compareVersions(currentVersion, latestRelease.tag_name) === "upgrade" && (
                                            <span class="text-success">Upgrade Available</span>
                                        )}
                                        {compareVersions(currentVersion, latestRelease.tag_name) === "same" && (
                                            <span class="text-muted">Up to date</span>
                                        )}
                                        {compareVersions(currentVersion, latestRelease.tag_name) === "downgrade" && (
                                            <span class="text-warning">Downgrade</span>
                                        )}
                                    </div>
                                    <div style="flex: 1; text-align: right;">
                                        <small class="text-muted d-block">Latest Release</small>
                                        <strong class="text-success">
                                            {latestRelease.tag_name}
                                            {latestRelease.prerelease && (
                                                <span class="text-warning ml-1">(Pre-release)</span>
                                            )}
                                        </strong>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Prerelease toggle */}
                    <div class="form-group mb-3">
                        <label class="form-checkbox">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    showPrereleases = (e.target as HTMLInputElement).checked
                                    updateReleaseSelector()
                                }}
                            />
                            <i class="form-icon"></i>
                            Show pre-release versions
                        </label>
                    </div>

                    {/* Release selector */}
                    <div class="mt-3">
                        <label class="form-label">
                            <strong>Select version to download:</strong>
                        </label>
                        <select
                            id="firmware-release-selector"
                            class="form-control"
                            onChange={(e) => {
                                selectedReleaseIndex = parseInt((e.target as HTMLSelectElement).value)
                                const filteredReleases = getFilteredReleases()
                                const infoBox = document.getElementById("firmware-selected-release-info")
                                if (infoBox && filteredReleases[selectedReleaseIndex]) {
                                    const selectedRelease = filteredReleases[selectedReleaseIndex]
                                    infoBox.innerHTML = `${selectedRelease.tag_name} - Released ${new Date(
                                        selectedRelease.published_at
                                    ).toLocaleDateString()}`
                                }
                                updateDownloadButtons()
                            }}
                        >
                            {filteredReleases.map((release, index) => (
                                <option key={release.id} value={index}>
                                    {release.name}
                                    {release.prerelease ? " (Pre-release)" : ""}
                                    {index === 0 ? " (Latest)" : ""}
                                </option>
                            ))}
                        </select>
                        <small id="firmware-selected-release-info" class="text-muted d-block mt-1">
                            {filteredReleases[0]?.tag_name} - Released{" "}
                            {new Date(filteredReleases[0]?.published_at || "").toLocaleDateString()}
                        </small>
                    </div>

                    <hr />

                    {/* Download instructions */}
                    <div class="mb-3">
                        <strong>Download Instructions:</strong>
                        <ol class="mt-2 mb-2" style="padding-left: 1.5rem;">
                            <li>Choose your platform below and click download</li>
                            <li>Extract the downloaded zip file</li>
                            <li>Locate the .bin file inside the extracted folder</li>
                            <li>Return to previous dialog to upload the .bin to your device</li>
                        </ol>
                    </div>

                    {/* Download buttons */}
                    <div class="d-flex justify-content-around mb-3">
                        <button
                            id="firmware-download-win64"
                            class="btn btn-primary"
                            onClick={() => downloadFirmware("win64")}
                            disabled={!filteredReleases[0]?.assets.some((a) => a.name.includes("win64"))}
                        >
                            Download Windows (win64)
                        </button>
                       
                        <button
                            id="firmware-download-posix"
                            class="btn btn-primary"
                            style={{margin: "0 0 0 10px"}}
                            onClick={() => downloadFirmware("posix")}
                            disabled={!filteredReleases[0]?.assets.some((a) => a.name.includes("posix"))}
                        >
                            Download Linux/Mac (posix)
                        </button>
                    </div>

                    {/* <hr /> */}

                    {/* Action button */}
                    {/* <div class="d-flex justify-content-center">
                        <button class="btn" onClick={handleViewReleaseNotes}>
                            View Release Notes
                        </button>
                    </div> */}
                </div>
            ),
            // footer: (
            //     <div>
            //         <button class="btn mx-2" onClick={closeModal}>
            //             Close
            //         </button>
            //     </div>
            // ),
            overlay: undefined,
            hideclose: false,
        })
    }
}

export { showFirmwareUpdateModal }
export type { FirmwareUpdateModalParams }
