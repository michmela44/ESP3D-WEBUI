/*
 releaseNotesModal.tsx - ESP3D WebUI component file

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
import { BookOpen } from "preact-feather"

interface ReleaseNotesModalParams {
    modals: ModalManager
    releases: GitHubRelease[]
    githubUrl: string
}

const showReleaseNotesModal = ({ modals, releases, githubUrl }: ReleaseNotesModalParams): void => {
    let showPrereleases = false

    const getFilteredReleases = (): GitHubRelease[] => {
        return showPrereleases ? releases : releases.filter((r) => !r.prerelease)
    }

    const updateReleasesList = () => {
        const filteredReleases = getFilteredReleases()
        const container = document.getElementById("release-notes-container")
        if (!container) return

        // Clear and rebuild the releases list
        container.innerHTML = ""

        filteredReleases.forEach((release, index) => {
            const releaseDiv = document.createElement("div")
            releaseDiv.className = index > 0 ? "mt-4" : ""

            const headerDiv = document.createElement("div")
            headerDiv.className = "d-flex justify-content-between align-items-start"

            const titleDiv = document.createElement("div")
            const title = document.createElement("h5")
            title.className = "text-primary mb-1"
            title.innerHTML = `${release.name}${index === 0 ? '<span class="text-success ml-2">(Latest)</span>' : ""}${release.prerelease ? '<span class="text-warning ml-2">(Pre-release)</span>' : ""}`

            const dateSmall = document.createElement("small")
            dateSmall.className = "text-muted"
            dateSmall.textContent = `Released on ${formatDate(release.published_at)}`

            titleDiv.appendChild(title)
            titleDiv.appendChild(dateSmall)
            headerDiv.appendChild(titleDiv)

            releaseDiv.appendChild(headerDiv)

            if (release.body) {
                const bodyDiv = document.createElement("div")
                bodyDiv.className = "mt-2"
                bodyDiv.innerHTML = getTruncatedBody(release.body)
                releaseDiv.appendChild(bodyDiv)
            }

            if (index < filteredReleases.length - 1) {
                const hr = document.createElement("hr")
                releaseDiv.appendChild(hr)
            }

            container.appendChild(releaseDiv)
        })
    }

    const openGitHub = (e?: Event) => {
        if (e) e.stopPropagation()
        useUiContextFn.haptic()
        const modalIndex = modals.getModalIndex("release-notes")
        if (modalIndex !== -1) {
            modals.removeModal(modalIndex)
        }
        (window as any).open(githubUrl, "_blank")
    }

    const closeModal = (e?: Event) => {
        if (e) e.stopPropagation()
        useUiContextFn.haptic()
        const modalIndex = modals.getModalIndex("release-notes")
        if (modalIndex !== -1) {
            modals.removeModal(modalIndex)
        }
    }

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    // Simple markdown to HTML converter for common patterns
    const markdownToHtml = (markdown: string): string => {
        let html = markdown

        // Code blocks ```code``` - protect these first
        const codeBlocks: string[] = []
        html = html.replace(/```([^`]+)```/g, (match, code) => {
            codeBlocks.push(code)
            return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`
        })

        // Inline code `code`
        const inlineCodes: string[] = []
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            inlineCodes.push(code)
            return `\x00INLINECODE${inlineCodes.length - 1}\x00`
        })

        // Headers (##, ###, etc)
        html = html.replace(/^### (.*$)/gim, "<h6>$1</h6>")
        html = html.replace(/^## (.*$)/gim, "<h5>$1</h5>")
        html = html.replace(/^# (.*$)/gim, "<h4>$1</h4>")

        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/__(.+?)__/g, "<strong>$1</strong>")

        // Italic (*text* or _text_) - but avoid conflicts with bold and don't match across lines
        html = html.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, "<em>$1</em>")
        html = html.replace(/(?<!<strong>)_([^_\n]+?)_(?!<\/strong>)/g, "<em>$1</em>")

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

        // Unordered lists (lines starting with *, -, or +) - BEFORE line breaks
        html = html.replace(/^\s*[\*\-\+] (.+)$/gim, "<li>$1</li>")

        // Wrap consecutive <li> in <ul>
        html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
            return "<ul>" + match.replace(/\n/g, "") + "</ul>"
        })

        // Line breaks (but not inside pre/code/ul/li)
        html = html.replace(/\n(?!<\/?(pre|code|ul|li|h[4-6]))/g, "<br>")

        // Restore code blocks
        codeBlocks.forEach((code, index) => {
            html = html.replace(`\x00CODEBLOCK${index}\x00`, `<pre><code>${code}</code></pre>`)
        })

        // Restore inline code
        inlineCodes.forEach((code, index) => {
            html = html.replace(`\x00INLINECODE${index}\x00`, `<code>${code}</code>`)
        })

        return html
    }

    // Truncate release body to first few lines for preview
    const getTruncatedBody = (body: string): string => {
        const lines = body.split("\n").filter((line) => line.trim() !== "")
        const truncated = lines.slice(0, 10).join("\n")
        return markdownToHtml(truncated)
    }

    const filteredReleases = getFilteredReleases()

    if (modals.getModalIndex("release-notes") === -1) {
        modals.addModal({
            id: "release-notes",
            title: (
                <div class="text-primary feather-icon-container modal_title">
                    <BookOpen />
                    <label>Recent Releases</label>
                </div>
            ),
            content: (
                <div class="text-left">
                    {/* Prerelease toggle */}
                    <div class="form-group mb-3">
                        <label class="form-checkbox">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    showPrereleases = (e.target as HTMLInputElement).checked
                                    updateReleasesList()
                                }}
                            />
                            <i class="form-icon"></i>
                            Show pre-release versions
                        </label>
                    </div>

                    <hr />

                    {/* Dynamic releases container */}
                    <div id="release-notes-container">
                        {filteredReleases.map((release, index) => (
                            <div key={release.id} class={index > 0 ? "mt-4" : ""}>
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 class="text-primary mb-1">
                                            {release.name}
                                            {index === 0 && <span class="text-success ml-2">(Latest)</span>}
                                            {release.prerelease && (
                                                <span class="text-warning ml-2">(Pre-release)</span>
                                            )}
                                        </h5>
                                        <small class="text-muted">
                                            Released on {formatDate(release.published_at)}
                                        </small>
                                    </div>
                                </div>
                                {release.body && (
                                    <div
                                        class="mt-2"
                                        dangerouslySetInnerHTML={{ __html: getTruncatedBody(release.body) }}
                                    />
                                )}
                                {index < filteredReleases.length - 1 && <hr />}
                            </div>
                        ))}
                    </div>
                </div>
            ),
            footer: (
                <div>
                    <button class="btn mx-2" onClick={openGitHub}>
                        View More on GitHub
                    </button>
                </div>
            ),
            overlay: undefined,
            hideclose: false,
        })
    }
}

export { showReleaseNotesModal }
export type { ReleaseNotesModalParams }
