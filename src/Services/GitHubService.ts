/*
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

/**
 * GitHub API Service
 * Handles fetching release information and downloading assets from GitHub
 */

import type { GitHubAsset, GitHubRelease, GitHubServiceConfig } from "../types/github.types"
import { GitHubApiError } from "../types/github.types"

export class GitHubService {
    private baseUrl = "https://api.github.com"

    constructor(private config: GitHubServiceConfig) {}

    /**
     * Fetches the latest release from GitHub API
     * @returns Promise resolving to release metadata
     * @throws {GitHubApiError} If API call fails or response is invalid
     */
    async getLatestRelease(): Promise<GitHubRelease> {
        const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/releases/latest`

        try {
            const response = await fetch(url)

            if (!response.ok) {
                if (response.status === 403) {
                    // Rate limit exceeded
                    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
                    const rateLimitReset = response.headers.get("x-ratelimit-reset")

                    if (rateLimitRemaining === "0") {
                        const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : undefined
                        throw new GitHubApiError(
                            `GitHub API rate limit exceeded. Resets at ${
                                resetTime?.toLocaleTimeString() || "unknown time"
                            }`,
                            403,
                            0,
                            resetTime
                        )
                    }
                } else if (response.status === 404) {
                    throw new GitHubApiError("Repository or release not found", 404)
                }

                throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status)
            }

            const release = (await response.json()) as GitHubRelease
            return release
        } catch (error) {
            // Network error or parse error
            if (error instanceof GitHubApiError) {
                throw error
            }
            throw new GitHubApiError(
                `Failed to fetch release: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    /**
     * Finds an asset by name in a release
     * @param release The GitHub release object
     * @param assetName The name of the asset to find
     * @returns The asset if found, null otherwise
     */
    findAssetByName(release: GitHubRelease, assetName: string): GitHubAsset | null {
        return release.assets.find((asset) => asset.name === assetName) || null
    }

    /**
     * Fetches multiple releases from GitHub API
     * @param limit Maximum number of releases to fetch (default: 10)
     * @returns Promise resolving to array of releases
     * @throws {GitHubApiError} If API call fails or response is invalid
     */
    async getReleases(limit: number = 10): Promise<GitHubRelease[]> {
        const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/releases?per_page=${limit}`

        try {
            const response = await fetch(url)

            if (!response.ok) {
                if (response.status === 403) {
                    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
                    const rateLimitReset = response.headers.get("x-ratelimit-reset")

                    if (rateLimitRemaining === "0") {
                        const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : undefined
                        throw new GitHubApiError(
                            `GitHub API rate limit exceeded. Resets at ${
                                resetTime?.toLocaleTimeString() || "unknown time"
                            }`,
                            403,
                            0,
                            resetTime
                        )
                    }
                } else if (response.status === 404) {
                    throw new GitHubApiError("Repository not found", 404)
                }

                throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status)
            }

            const releases = (await response.json()) as GitHubRelease[]
            return releases
        } catch (error) {
            if (error instanceof GitHubApiError) {
                throw error
            }
            throw new GitHubApiError(
                `Failed to fetch releases: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    /**
     * Gets the download URL for an asset
     * The actual download should be done using the app's HTTP queue system
     * @param asset The asset to get the download URL for
     * @returns The browser download URL
     */
    getAssetDownloadUrl(asset: GitHubAsset): string {
        return asset.browser_download_url
    }
}
