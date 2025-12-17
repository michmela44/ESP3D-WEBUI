/*
 extraContentItem.js - ESP3D WebUI navigation page file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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
import { Fragment } from "preact"
import { useState, useEffect, useCallback, useRef, useMemo } from "preact/hooks"
import { espHttpURL, invalidateIframeCache } from "../Helpers"
import { useHttpFn } from "../../hooks"
import { ButtonImg, ContainerHelper } from "../Controls"
import { T } from "../Translations"
import { Play, Pause, Aperture } from "preact-feather"
import { eventBus } from "../../hooks/eventBus"
import { useUiContextFn } from "../../contexts"
import { elementsCache } from "../../areas/elementsCache"

interface ExtraContentItemProps {
    id: string
    source: string
    type: "camera" | "image" | "extension" | "content"
    name?: string
    target: "panel" | "page"
    refreshtime: number
    isVisibleOnStart?: boolean
}

// Polyfill for requestIdleCallback for browsers that don't support it
const requestIdleCallback: (cb: any, opts?: any) => any = (window as any).requestIdleCallback || function(cb: any) {
    const start = Date.now()
    return setTimeout(() => {
        cb({
            didTimeout: false,
            timeRemaining: function() {
                return Math.max(0, 50 - (Date.now() - start))
            }
        })
    }, 1)
}

const visibilityState: Record<string, boolean> = {};
const isLoadedState: Record<string, boolean> = {};

const ExtraContentItem = ({
    id,
    source,
    type,
    name,
    target,
    refreshtime,
    isVisibleOnStart,
}: ExtraContentItemProps) => {
    const [contentUrl, setContentUrl] = useState("")
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const { createNewRequest } = useHttpFn
    const element_id = id.replace("extra_content_", type)
    const refreshIntervalRef = useRef<number | null>(null)
    //console.log(`Rendering ExtraContentItem ${id} at ${Date.now()}`);
    if (visibilityState[id] === undefined) {
        visibilityState[id] = false;
        if (type=="extension" && isLoadedState[id]){    
            // @ts-ignore element/msg are only defined in update handler below
            const iframeElement = element.querySelector('iframe.extensionContainer') as any;
            if (iframeElement){
                // @ts-ignore element/msg are only defined in update handler below
                // // // iframeElement.contentWindow.postMessage(
                // // //     { type: "notification", content: {isVisible: msg.isVisible}, id },
                // // //     "*"
                // // // )
            }
        }
    }
    if (isLoadedState[id] === undefined) {
        isLoadedState[id] = false;
    }

    const handleContentSuccess = useCallback((result: BlobPart) => {
        let blob : Blob
        switch (type) {
            case "camera":
            case "image":
                blob = new Blob([result], { type: "image/jpeg" })
                break
            case "extension":
            case "content":
                blob = new Blob([result], { type: "text/html" })
                break
            default:
                blob = new Blob([result], { type: "text/plain" })
        }
        const url = URL.createObjectURL(blob)
        setContentUrl(url)
        setHasError(false)
        setIsLoading(false)
        isLoadedState[id] = true;
    }, [type])

    const handleContentError = useCallback((error: any) => {
        console.error(`Error loading content for ${id}:`, error)
        setHasError(true)
        setIsLoading(false)
        isLoadedState[id] = false;
    }, [id])

    const loadContent = useCallback(() => {

        if (target=="page"){
            //console.log("Loading content for page " + id)
            //console.log(useUiContextFn.panels.isVisible(elementsCache.getRootfromId(id)))
        }

        if (isPaused || !visibilityState[id] ||  (target=="panel" && !useUiContextFn.panels.isVisible(elementsCache.getRootfromId(id)))) {
           //console.log("Not loading content for " + id + " because it is paused or not visible")
            return
        }
        //console.log("Loading content for " + id)
        if (source.startsWith("http")) {
            setContentUrl(source)
            setHasError(false)
            setIsLoading(false)
            isLoadedState[id] = true
        } else {
            if (isLoadedState[id] && !refreshIntervalRef.current){
                //console.log("Already loaded")
                return
            }
            setIsLoading(true)
            const idquery = type === "content" ? type + id : `download${  id}`
            let url = source
            if (url.endsWith(".gz")) {
                url = url.substring(0, url.length - 3)
            }

            // For extensions, use requestIdleCallback to defer loading during busy periods
            // This prevents extensions from blocking critical UI updates
            const performLoad = () => {
                createNewRequest(
                    espHttpURL(url),
                    { method: "GET", id: idquery, max: 1 },
                    {
                        onSuccess: handleContentSuccess,
                        onFail: handleContentError,
                    }
                )
            }

            if (type === "extension" && !visibilityState[id]) {
                // Defer loading of hidden extensions
                requestIdleCallback(performLoad, { timeout: 2000 })
            } else {
                // Load visible content immediately
                performLoad()
            }
        }
    }, [id, source, type, createNewRequest, handleContentSuccess, handleContentError, isPaused])

    useEffect(() => {
        loadContent()
    }, [loadContent])

    useEffect(() => {
        const listenerId = `listener_${id}`;
        const handleUpdateState = (msg: any) => {
            if (msg.id == id) { 
                //console.log(`Received message for ${id} with listener ${listenerId}`, msg);
                const element = document.getElementById(id) as any
                if ( 'forceRefresh' in msg && msg.forceRefresh) {
                    //console.log(`Processing forceRefresh for ${id}`);
                    isLoadedState[id] = false;
                    loadContent()
                }
                if ('isVisible' in msg) {
                    if (element) {
                        //console.log("Updating visibility for element " + id + " to " + msg.isVisible)
                        element.style.display = msg.isVisible ? 'block' : 'none';
                        //is it the same as the current state?
                        if (visibilityState[id]!= msg.isVisible){
                            //if it is extension, check if the content is loaded
                            if (type=="extension" && isLoadedState[id]){
                                const iframeElement = element.querySelector('iframe.extensionContainer') as any;
                                if (iframeElement){
                                    iframeElement.contentWindow.postMessage(
                                        { type: "notification", content: {isVisible: msg.isVisible}, id },
                                        "*"
                                    )
                                }
                            }
                            // Invalidate cache when visibility changes for performance optimization
                            if (type === "extension") {
                                invalidateIframeCache()
                            }
                        }
                        visibilityState[id]= msg.isVisible;
                        if (!isLoadedState[id] && msg.isVisible) {
                            loadContent()
                            }

                    } else {
                        console.error(`Element ${  id  } doesn't exist`)
                    }

                }
                if ('position' in msg) {
                    //console.log("Updating position for element " + id )
                    //console.log(msg.position)
                    const element = document.getElementById(id) as any
                    element.style.top = `${msg.position.top}px`;
                    element.style.left = `${msg.position.left}px`;
                    element.style.width = `${msg.position.width}px`;
                    element.style.height = `${msg.position.height}px`;
                }
            }
        }
        eventBus.on("updateState", handleUpdateState, listenerId)
        return () => {
            //console.log(`Removing listener ${listenerId} for ${id}`);
            //eventBus.off("updateState", handleUpdateState, listenerId)
        }
    }, [id, loadContent])

    useEffect(() => {
        if (refreshtime > 0 && (type === "camera" || type === "image") && visibilityState[id] && !isPaused) {
            //console.log("Updating refresh interval for " + id)
            if (!refreshIntervalRef.current){
                //console.log("Starting refresh interval for " + id+ " with refreshtime " + refreshtime)
                refreshIntervalRef.current = window.setInterval(loadContent, refreshtime)
            }
        }
        return () => {
            if (refreshIntervalRef.current) {
                //console.log("Stopping refresh interval for " + id)
                clearInterval(refreshIntervalRef.current)
                refreshIntervalRef.current = null
            }
        }
    }, [refreshtime, type, isPaused, loadContent])


    const handleError = () => {
        setHasError(true)
        setIsLoading(false)
        isLoadedState[id] = false;
    }

    const handleLoad = () => {
        setHasError(false)
        setIsLoading(false)
        isLoadedState[id] = true;
        // Invalidate cache since a new iframe has loaded
        if (type === "extension") {
            invalidateIframeCache()
        }
        const iframeElement = document.getElementById(element_id) as HTMLIFrameElement | null
        if (type === "extension" && iframeElement && iframeElement.contentWindow) {

            const doc = iframeElement.contentWindow.document as Document

            const body = doc.querySelector("body")
            if (!body){
                console.error("body not found")
                return
            }
            body.classList.add("body-extension")

            // Optimized CSS injection - only inject critical CSS immediately
            // Defer non-critical CSS to avoid blocking
            requestIdleCallback(() => {
                const css = document.querySelectorAll("style")
                const criticalCSS: Element[] = []
                const deferredCSS: Element[] = []

                // Separate critical from non-critical CSS
                css.forEach((csstag) => {
                    // Consider CSS critical if it's small or contains core styles
                    const cssText = csstag.textContent || ''
                    const isCritical = cssText.length < 5000 ||
                                      cssText.includes('.body-extension') ||
                                      cssText.includes('body') ||
                                      cssText.includes(':root')

                    if (isCritical) {
                        criticalCSS.push(csstag)
                    } else {
                        deferredCSS.push(csstag)
                    }
                })

                // Inject critical CSS immediately
                criticalCSS.forEach((csstag) => {
                    doc.head.appendChild(csstag.cloneNode(true))
                })

                // Defer non-critical CSS injection
                if (deferredCSS.length > 0) {
                    requestIdleCallback(() => {
                        deferredCSS.forEach((csstag) => {
                            doc.head.appendChild(csstag.cloneNode(true))
                        })
                    })
                }
            }, { timeout: 500 })

            if (iframeElement){
                iframeElement.contentWindow.postMessage(
                    { type: "notification", content: {isConnected: true, isVisible: visibilityState[id]}, id },
                    "*"
                )
            }
        }
    }

    const captureImage = useCallback(() => {
        if (type === "camera" || type === "image") {
            const image = document.getElementById(element_id) as HTMLImageElement | null;
            if (image && image.complete) {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.drawImage(image, 0, 0);
                
                canvas.toBlob((blob: Blob | null) => {
                    if (!blob) return;
                    const typeImage = type === "camera" ? "image/jpeg" : blob.type;
                    const filename = `snap.${typeImage.split("/")[1]}`;
                    
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(blob, filename);
                    } else {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.style.display = "none";
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 100);
                    }
                }, type === "camera" ? "image/jpeg" : "image/png");
            } else {
                console.error("Image not loaded or not found");
            }
        }
    }, [type, element_id]);

    const togglePause = useCallback(() => {
        setIsPaused(prevPaused => {
            const newPausedState = !prevPaused;
            if (newPausedState) {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            } else {
                if (refreshtime > 0 && (type === "camera" || type === "image") && visibilityState[id]) {
                    refreshIntervalRef.current = window.setInterval(loadContent, refreshtime);
                }
            }
            return newPausedState;
        });
    }, [refreshtime, type, loadContent]);

    const renderContent = useMemo(() => (
        (() => {
        if (isLoading && type !== "image" && type !== "camera") {
            return <div>Loading...</div>
        }

        if (hasError) {
            return (
                <div id={`fallback_${  element_id}`} class="fallback-content">
                    <p>Error loading {type}</p>
                    <p>Please check the URL</p>
                </div>
            )
        }

        if (type === "camera" || type === "image") {
            return (
                <div class="picture-container">
                <img
                    src={contentUrl}
                    alt={name ? name : "image jpeg"}
                    class={type === "camera" ? "cameraContainer" : "imageContainer"}
                    id={element_id}
                    onError={handleError}
                    onLoad={handleLoad}
                />
                </div>
            )
        } else {
            return (
                <iframe
                    src={contentUrl}
                    class={type === "extension" ? "extensionContainer" : "contentContainer"}
                    id={element_id}
                    onError={handleError}
                    onLoad={handleLoad}
                />
            )
        }
        })()
    ), [isLoading, hasError, type, contentUrl, name, element_id, handleError, handleLoad]);

    const RenderControls = useMemo(() => (
        <div class="m-2 image-button-bar">
            {(type === "camera" || type === "image") && (
                <ButtonImg
                    m1
                    tooltip
                    data-tooltip={T("S186")}
                    icon={<Aperture />}
                    onclick={captureImage}
                />
            )}
            {Number(refreshtime) > 0 && (type === "camera" || type === "image") && (
                <ButtonImg
                    m1
                    tooltip
                    data-tooltip={isPaused ? T("S185") : T("S184")}
                    icon={isPaused ? <Play /> : <Pause />}
                    onclick={togglePause}
                />
            )}
        </div>
    ), [type, refreshtime, isPaused, captureImage, togglePause]);
    return (
        <div id={id} class="extra-content-container">
            <ContainerHelper id={id} />
            {renderContent}
            {RenderControls}
        </div>
    )
}

export { ExtraContentItem }
