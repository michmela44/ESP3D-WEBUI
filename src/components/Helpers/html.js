/*html.js - ESP3D WebUI helpers file

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

// Cache for iframe elements to avoid repeated DOM queries
let iframeCache = []
let cacheInvalidated = true

// Debounce timer for batched cache updates
let cacheUpdateTimer = null

// Mark cache as invalid when extensions are added/removed
const invalidateIframeCache = () => {
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
const updateIframeCache = () => {
    const iframeList = document.querySelectorAll("iframe.extensionContainer")
    iframeCache = Array.from(iframeList).map(element => ({
        element,
        contentWindow: element.contentWindow,
        id: element.id,
        // Cache visibility state for performance
        isVisible: element.parentElement && element.parentElement.style.display !== 'none'
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

function setupIframeObserver() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check if any added/removed nodes are iframes or contain iframes
                const hasIframeChanges = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes))
                    .some(node => {
                        if (node.nodeType === 1) { // Element node
                            return node.tagName === 'IFRAME' ||
                                   (node.classList && node.classList.contains('extensionContainer')) ||
                                   (node.querySelector && node.querySelector('iframe.extensionContainer'))
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

const dispatchToExtensions = (type, data, targetId) => {
    // Update cache if invalidated
    if (cacheInvalidated) {
        updateIframeCache()
    }

    // If targetId is specified, only send to that specific extension
    if (targetId) {
        const targetIframe = iframeCache.find(cache => cache.id === targetId)
        if (targetIframe && targetIframe.contentWindow) {
            try {
                targetIframe.contentWindow.postMessage(
                    { type: type, content: data, id: targetId },
                    "*"
                )
            } catch (e) {
                console.error(`Failed to send message to extension ${targetId}:`, e)
            }
        }
        return
    }

    // Broadcast to all extensions
    // Use cached list to avoid repeated DOM queries
    for (const cache of iframeCache) {
        // Skip hidden extensions for non-critical message types
        // Always send notification, modal, and toast messages
        const isCriticalMessage = type === 'notification' || type === 'modal' || type === 'toast' || type === 'translate' || type === 'icon'

        if (cache.contentWindow && (isCriticalMessage || cache.isVisible)) {
            try {
                cache.contentWindow.postMessage(
                    { type: type, content: data, id: cache.id },
                    "*"
                )
            } catch (e) {
                console.error(`Failed to send message to extension ${cache.id}:`, e)
                // Remove failed iframe from cache
                invalidateIframeCache()
            }
        }
    }
}


const getFullscreenElement = () => {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    )
}

const isFullscreenSupported = () => {
    return (
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled
    )
}

const isFullscreenActive = () => {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    )
}

export { dispatchToExtensions, getFullscreenElement, isFullscreenSupported, isFullscreenActive, invalidateIframeCache }
