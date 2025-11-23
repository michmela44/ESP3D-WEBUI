/*
 extracontent.tsx - ESP3D WebUI navigation page file

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
import { useEffect, useCallback, useState } from "preact/hooks"
import { elementsCache } from "../../areas/elementsCache"
import { ExtraContentItem } from "./extraContentItem"
import { eventBus } from "../../hooks/eventBus"
import {
    ButtonImg,
    FullScreenButton,
    CloseButton,
} from "../Controls"
import { T } from "../Translations"
import { RefreshCcw } from "preact-feather"
import { iconsFeather } from "../Images"
import { iconsTarget } from "../../targets"
import { useUiContextFn, useUiContext } from "../../contexts"

interface ExtraContentProps {
    id: string
    source: string
    refreshtime: number
    label: string
    type: "camera" | "image" | "extension" | "content"
    target: "panel" | "page"
    icon?: string
}

const ExtraContent = ({ id, source, refreshtime, label, type, target, icon }: ExtraContentProps) => {
    const [isFullScreen, setIsFullScreen] = useState(false)
    const { panels } = useUiContext()
    const extra_content_id = `extra_content_${id}`
    const target_id = `target_${id}`
    const iconsList = { ...iconsTarget, ...iconsFeather } as Record<string, any>
    console.log(`Extra Content ${  id}`)

    const updateContentPosition = () => {
        if (!useUiContextFn.panels.isVisible(id) && target == "panel") {
            return
        }
        const container = document.getElementById(target_id)
        if (container) {
            const { top, left, width, height } = container.getBoundingClientRect()
            eventBus.emit('updateState', { id: extra_content_id, position: { top, left, width, height }, isVisible: true, from: "extraContent(position)" })
        } else {
            console.error(`Element ${  target_id  } doesn't exist`)
        }
    }

    const handleScrollAndResize = useCallback(() => {
        requestAnimationFrame(updateContentPosition)
    }, [])

    useEffect(() => {
        if (useUiContextFn.panels.isVisible(id)) {
            const main = document.getElementById("main")
            if (main) {
                main.removeEventListener('scroll', handleScrollAndResize)
                main.removeEventListener('resize', handleScrollAndResize)
            }
            window.removeEventListener('resize', handleScrollAndResize)
            if (main) {
                main.addEventListener('scroll', handleScrollAndResize)
                main.addEventListener('resize', handleScrollAndResize)
            }
            window.addEventListener('resize', handleScrollAndResize)
            updateContentPosition()
        }
    }, [panels.updateTrigger])

    useEffect(() => {
        if (useUiContextFn.panels.isVisible(id)) {
            const panelElements = document.querySelectorAll(".panel-dashboard")
            const resizeObserver = new ResizeObserver((_entries) => {
                updateContentPosition()
            })
            panelElements.forEach((panelElement) => {
                resizeObserver.observe(panelElement)
            })
        }
    }, [panels.updateTrigger])

    useEffect(() => {
        if (!elementsCache.has(extra_content_id)) {
            console.error(`Error display element ${  extra_content_id}`, " because it doesn't exist")
        } else {
            if (target == "page") {
                updateContentPosition()
            }
        }

        const main = document.getElementById("main")
        if (main) {
            main.addEventListener('scroll', handleScrollAndResize)
            main.addEventListener('resize', handleScrollAndResize)
        }
        window.addEventListener('resize', handleScrollAndResize)

        return () => {
            const main = document.getElementById("main")
            if (main) {
                main.removeEventListener('scroll', handleScrollAndResize)
                main.removeEventListener('resize', handleScrollAndResize)
            }
            window.removeEventListener('resize', handleScrollAndResize)
            eventBus.emit('updateState', { id: extra_content_id, isVisible: false, from: "extraContent(return)" })
        }
    }, [])

    const handleRefresh = () => {
        useUiContextFn.haptic()
        eventBus.emit('updateState', { id: extra_content_id, isVisible: true, forceRefresh: true, from: `extraContent(refresh)-${  Date.now()}` })
        updateContentPosition()
    }

    const PanelRenderControls = () => (
        <span class="full-height">
            <ButtonImg
                xs
                m1
                nomin="yes"
                icon={<RefreshCcw style={{ width: "0.8rem", height: "0.8rem" }} />}
                onclick={handleRefresh}
            />
            <FullScreenButton elementId={extra_content_id} />
            <CloseButton elementId={id} hideOnFullScreen={true} />
        </span>
    )

    const PageRenderControls = () => (
        <div class="m-2 image-button-bar">
            <ButtonImg
                m1
                nomin="yes"
                icon={<RefreshCcw style={{ width: "0.8rem", height: "0.8rem" }} />}
                onclick={handleRefresh}
            />
            <FullScreenButton elementId={extra_content_id} asButton={true} />
        </div>
    )

    if (target === "page") {
        return (
            <div class="page-container" id={id}>
                <div id={target_id} class="page-target-container">
                    {/* content should fit this container */}
                </div>
                <PageRenderControls />
            </div>
        )
    }

    if (target === "panel") {
        const displayIcon = (icon && iconsList[icon]) || ""
        return (
            <Fragment>
                <div class="panel panel-dashboard panel-extra-content" id={id}>
                    <div class="navbar">
                        <span class="navbar-section feather-icon-container">
                            {displayIcon}
                            <strong class="text-ellipsis">{T(label)}</strong>
                        </span>
                        <span class="navbar-section">
                            {PanelRenderControls()}
                        </span>
                    </div>
                    <div class="panel-body panel-body-dashboard no-margin-no-padding panel-target-container" id={target_id}>
                        {/* content should fit this container */}
                    </div>
                </div>
            </Fragment>
        )
    }

    return null;
}

export { ExtraContent, ExtraContentItem }

