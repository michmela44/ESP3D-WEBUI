/*
 elementsCache.tsx - ESP3D WebUI MainPage file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.
  Original code inspiration : 2021 Alexandre Aussourd

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
import { FunctionalComponent } from "preact"
import { useState, useEffect, useMemo } from "preact/hooks"
import { ExtraContentItem } from "../components/ExtraContent"
import { useUiContext, useUiContextFn, useSettingsContext } from "../contexts"

interface ExtraContentEntry {
    id: string
    value: Array<{
        name: string
        value: any
    }>
}

interface ExtractedValues {
    id: string
    [key: string]: any
}

const ElementsCache: FunctionalComponent = () => {
    const { ui } = useUiContext()
    const { interfaceSettings } = useSettingsContext()
    const [content, setContent] = useState<any[]>([])

    const extractValues = (entry: ExtraContentEntry): ExtractedValues => {
        const result: ExtractedValues = { id: `extra_content_${  entry.id}` }
        entry.value.forEach(param => {
            result[param.name] = param.value
        })
        return result
    }

    useEffect(() => {
        if (ui.ready && interfaceSettings.current?.settings?.extracontents) {
            //console.log("ElementsCache can now be created")
            const isEnabled = useUiContextFn.getValue("showextracontents")
            if (!isEnabled) {
                // console.log("ExtraContent are disabled")
                return
            }
            const isVisibleOnStart = useUiContextFn.getValue("openextrapanelsonstart") as boolean;
            const extraContentSettings = interfaceSettings.current.settings.extracontents
            const extraContentsEntry = extraContentSettings.find((entry: any) => entry.id === 'extracontents')

            if (extraContentsEntry?.value?.length > 0) {
                const newContent = extraContentsEntry.value.map((entry: ExtraContentEntry) => {
                    const item = extractValues(entry)
                    // console.log(item)
                    return (
                        <ExtraContentItem
                            key={item.id}
                            id={item.id}
                            source={item.source as string}
                            type={item.type as "camera" | "image" | "extension" | "content"}
                            name={item.name as string | undefined}
                            target={item.target as "panel" | "page"}
                            refreshtime={Number(item.refreshtime)}
                            isVisibleOnStart={isVisibleOnStart}
                        />
                    )
                })
                setContent(newContent)
            }
        }
    }, [ui.ready, interfaceSettings])

    const memoizedContent = useMemo(() => content, [content])

    return (
        <div style="position: fixed; top: 0; left: 0; width: 0; height: 0; overflow: visible;" id="elementsCache">
            {memoizedContent}
        </div>
    )
}

export default ElementsCache

const elementsCache = {

    isExtraContent: (id: string): boolean => {
        const itemid = `extra_content_${  id}`
        return elementsCache.has(itemid)
    },

    getRootfromId: (id: string): string => {
        return id.replace("extra_content_", "")
    },

    getIdFromRoot: (id: string): string => {
        return `extra_content_${  id}`
    },

    has: (id: string): boolean => {
        const cacheHost = document.getElementById("elementsCache")
        if (!cacheHost) return false
        return cacheHost.querySelector(`#${  id}`) !== null
    },

    get: (id: string): Element | null => {
        const cacheHost = document.getElementById("elementsCache")
        if (!cacheHost) return null
        return cacheHost.querySelector(`#${  id}`)
    }
}

export { ElementsCache, elementsCache }
