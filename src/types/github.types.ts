/**
 * TypeScript type definitions for GitHub REST API
 */

/**
 * GitHub release asset metadata
 */
export interface GitHubAsset {
    id: number
    name: string
    size: number
    browser_download_url: string
    content_type: string
    created_at: string
    updated_at: string
}

/**
 * GitHub release metadata
 */
export interface GitHubRelease {
    id: number
    tag_name: string
    name: string
    body: string
    draft: boolean
    prerelease: boolean
    created_at: string
    published_at: string
    assets: GitHubAsset[]
}

/**
 * Configuration for GitHubService
 */
export interface GitHubServiceConfig {
    owner: string
    repo: string
    assetName: string
}

/**
 * Custom error class for GitHub API errors
 */
export class GitHubApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public rateLimitRemaining?: number,
        public rateLimitReset?: Date
    ) {
        super(message)
        this.name = 'GitHubApiError'
    }
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (percent: number) => void
