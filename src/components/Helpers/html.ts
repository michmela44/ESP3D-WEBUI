/*html.ts - ESP3D WebUI helpers file

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

interface IframeCache {
    element: HTMLIFrameElement
    contentWindow: Window | null
    id: string
    isVisible: boolean
}

// Cache for iframe elements to avoid repeated DOM queries
let iframeCache: IframeCache[] = []
let cacheInvalidated = true

// Debounce timer for batched cache updates
let cacheUpdateTimer: ReturnType<typeof setTimeout> | null = null

// Mark cache as invalid when extensions are added/removed
const invalidateIframeCache = (): void => {
    cacheInvalidated = true
    // Debounce cache updates to avoid thrashing during rapid changes
    if (cacheUpdateTimer) {
        clearTimeout(cacheUpdateTimer)
    }
    cacheUpdateTimer = setTimeout(() => {
        updateIframeCache()
    }, 100)
}

// Update the iframe cache
const updateIframeCache = (): void => {
    const iframeList = document.querySelectorAll<HTMLIFrameElement>("iframe.extensionContainer")
    iframeCache = Array.from(iframeList).map(element => ({
        element,
        contentWindow: element.contentWindow,
        id: element.id,
        // Cache visibility state for performance
        isVisible: element.parentElement ? element.parentElement.style.display !== 'none' : false
    }))
    cacheInvalidated = false
}

// Setup MutationObserver to detect when iframes are added/removed
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupIframeObserver()
        })
    } else {
        setupIframeObserver()
    }
}

function setupIframeObserver(): void {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check if any added/removed nodes are iframes or contain iframes
                const hasIframeChanges = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes))
                    .some(node => {
                        if (node.nodeType === 1) { // Element node
                            const element = node as Element
                            return element.tagName === 'IFRAME' ||
                                   (element.classList && element.classList.contains('extensionContainer')) ||
                                   (element.querySelector && element.querySelector('iframe.extensionContainer') !== null)
                        }
                        return false
                    })
                if (hasIframeChanges) {
                    invalidateIframeCache()
                    break
                }
            }
        }
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

interface MessageData {
    type: string
    content: any
    id: string
}

const dispatchToExtensions = (type: string, data: any, targetId?: string): void => {
    // Update cache if invalidated, or if any cached elements are no longer in the DOM
    if (cacheInvalidated || iframeCache.some(cache => !cache.element || !cache.element.isConnected)) {
        updateIframeCache()
    }

    // Broadcast to all extensions
    for (const cache of iframeCache) {
        // Skip hidden extensions for non-critical message types
        // Always send notification, modal, and toast messages
        const isCriticalMessage = type === 'notification' || type === 'modal' || type === 'toast' || type === 'translate' || type === 'icon'

        if (isCriticalMessage || cache.isVisible) {
            try {
                if (cache.element.contentWindow) {
                    cache.element.contentWindow.postMessage(
                        { type: type, content: data, id: targetId },
                        "*"
                    )
                }
            } catch (e) {
                console.error(`Failed to send message to extension ${cache.id}:`, e)
            }
        }
    }
}

// Extend Document interface for vendor-prefixed fullscreen APIs
declare global {
    interface Document {
        webkitFullscreenElement?: Element
        mozFullScreenElement?: Element
        msFullscreenElement?: Element
        webkitFullscreenEnabled?: boolean
        mozFullScreenEnabled?: boolean
        msFullscreenEnabled?: boolean
    }
}

const getFullscreenElement = (): Element | null => {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null
    )
}

const isFullscreenSupported = (): boolean => {
    return (
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled ||
        false
    )
}

const isFullscreenActive = (): boolean => {
    return (
        !!document.fullscreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.mozFullScreenElement ||
        !!document.msFullscreenElement
    )
}

export { dispatchToExtensions, getFullscreenElement, isFullscreenSupported, isFullscreenActive, invalidateIframeCache }
export type { IframeCache, MessageData }
