/*
 Navbar.js - ESP3D WebUI navigation bar file


 Copyright (c) 2021 Luc Lebosse. All rights reserved.
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
import { Fragment,  ComponentChildren, TargetedMouseEvent } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import { iconsFeather } from "../Images"
import { iconsTarget, AppLogo } from "../../targets"
import { Link } from "../Router"
import { T } from "../Translations"
import {
    useSettingsContext,
    useUiContext,
    useModalsContext,
    useRouterContext,
    useUiContextFn,
} from "../../contexts"
import { useWebSocketService } from "../../hooks/useWebSocketService";
import { useHttpQueue } from "../../hooks"
import { espHttpURL } from "../Helpers"
import { showConfirmationModal } from "../Modal"
import {
    Server,
    Settings,
    LogOut,
    Trello,
    ChevronDown,
    Smartphone,
    Maximize,
    Minimize,
} from "preact-feather"

/*
 * Local const
 *
 */
interface NavLinkItem {
    label: any
    icon: any
    href: string
    id?: string
}

const defaultLinks: NavLinkItem[] = [
    {
        label: <AppLogo bgcolor="#ffffff" />,
        icon: null,
        href: "/about",
    },
    {
        label: "S13",
        icon: <Server />,
        href: "/dashboard",
        id: "dashboardLink",
    },
    {
        label: "S14",
        icon: <Settings />,
        href: "/settings",
        id: "settingsLink",
    },
]

// Utility to detect iOS/iPadOS
function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes("Macintosh") && "ontouchend" in document)
}

const Navbar = () => {
    const { connectionSettings } = useSettingsContext()
    const { uisettings } = useUiContext()
    const { modals } = useModalsContext()
    const { createNewRequest } = useHttpQueue()
    const webSocketService = useWebSocketService();
    const buttonExtraPage = useRef<HTMLAnchorElement | null>(null)
    const menuExtraPage = useRef<HTMLUListElement | null>(null)
    const iconsList: Record<string, any> = { ...iconsTarget, ...iconsFeather }
    const [textbutton, setTextButton] = useState<ComponentChildren>(
        <Fragment>
            <Trello />
            <label class="hide-low">{T("S155")}</label>
        </Fragment>
    )
    const [hrefbutton, setHrefButton] = useState<string | undefined>(undefined)
    const [isFullscreen, setIsFullscreen] = useState(false)

    /*
    auto-scroll textarea into view if mobile keyboard is blocking textarea to prevent
    page resize and navbar from snapping out of viewport due to using fixed heights
    */
    window.visualViewport?.addEventListener("resize", () => {
        window.scrollTo(0, 0);
    });


    const disconnectNow = () => {
        const formData = new FormData()
        formData.append("DISCONNECT", "YES")
        createNewRequest(
            espHttpURL("login"),
            { method: "POST", id: "login", body: formData },
            {
                onSuccess: (_result: string) => {
                    webSocketService.disconnect("sessiontimeout")
                },
                onFail: (_error: string) => {
                    webSocketService.disconnect("sessiontimeout")
                },
            }
        )
    }
    const menuLinks: NavLinkItem[] = []
    if (uisettings.current) {
        if (uisettings.getValue("showextracontents")) {
            const extraContents = uisettings.getValue("extracontents")

            const extraPages = extraContents.reduce((acc: NavLinkItem[], curr: any) => {
                const item = curr.value.reduce((accumulator: any, current: any) => {
                    accumulator[current.name] = current.initial
                    return accumulator
                }, {})

                if (item.target == "page") {
                    const pageIcon = iconsList[item.icon]
                        ? iconsList[item.icon]
                        : ""
                    acc.push({
                        label: item.name,
                        icon: pageIcon,
                        href: `/#/extrapage/${  curr.id}`,
                        id: curr.id,
                    })
                }

                return acc
            }, [])
            menuLinks.push(...extraPages)
        }
    }
 
    const onDisconnect = () => {
        useUiContextFn.haptic()
        showConfirmationModal({
            modals,
            title: T("S26"),
            content: T("S152"),
            button1: { cb: disconnectNow, text: T("S27") },
            button2: { text: T("S28") },
        })
    }

    const toggleFullscreen = () => {
        useUiContextFn.haptic()
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true)
            }).catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`)
            })
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    setIsFullscreen(false)
                })
            }
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    if (uisettings.current) {
        return (
            <header class="navbar">
                <section class="navbar-section">
                    {defaultLinks &&
                        defaultLinks.map(({ label, icon, href, id }) => {
                            if (
                                href == "/informations" &&
                                !uisettings.getValue("showinformationpage")
                            )
                                return
                            return (
                                <Link key={href}
                                    onClick={(_e: TargetedMouseEvent<HTMLAnchorElement>) => {
                                        useUiContextFn.haptic()
                                        if (buttonExtraPage.current)
                                            buttonExtraPage.current.classList.remove(
                                                "active"
                                            )
                                    }}
                                    id={id}
                                    className={
                                        href == "/about"
                                            ? "navbar-brand logo no-box "
                                            : connectionSettings.current
                                                    .FWTarget == 0 &&
                                                href == "/dashboard"
                                              ? "d-none"
                                              : "btn btn-link no-box feather-icon-container"
                                    }
                                    activeClassName="active"
                                    href={href}
                                >
                                    {icon}
                                    <label
                                        class={
                                            href == "/about" ? "" : "hide-low"
                                        }
                                    >
                                        {typeof label === "string" ? T(label) : label}
                                    </label>
                                </Link>
                            )
                        })}
                    {menuLinks && menuLinks.length > 0 && (
                        <Fragment>
                            {hrefbutton && (
                                <Link
                                    id="extrapagebutton"
                                    className="btn btn-link no-box feather-icon-container"
                                    activeClassName="active"
                                    href={hrefbutton}
                                >
                                    {textbutton}
                                </Link>
                            )}

                            <div class="dropdown dropdown-right">
                                <a
                                    class="btn btn-link no-box dropdown-toggle feather-icon-container"
                                    ref={buttonExtraPage}
                                    onClick={(_e: TargetedMouseEvent<HTMLAnchorElement>) => {
                                        useUiContextFn.haptic()
                                        if (menuExtraPage.current)
                                            menuExtraPage.current.classList.remove(
                                                "d-none"
                                            )
                                    }}
                                    tabIndex={0}
                                >
                                    {!hrefbutton && (
                                        <label class="hide-low">
                                            {T("S155")}
                                        </label>
                                    )}
                                    <ChevronDown />
                                </a>
                                <ul class="menu" ref={menuExtraPage}>
                                    {menuLinks &&
                                        menuLinks.map(
                                            ({ label, icon, href, id }) => {
                                                return (
                                                    <li key={href} class="menu-item">
                                                        <a
                                                            id={id}
                                                            class="feather-icon-container"
                                                            href={href}
                                                            onClick={(_e: TargetedMouseEvent<HTMLAnchorElement>) => {
                                                                useUiContextFn.haptic()
                                                                if (
                                                                    menuExtraPage.current
                                                                )
                                                                    menuExtraPage.current.classList.add(
                                                                        "d-none"
                                                                    )
                                                                if (
                                                                    buttonExtraPage.current
                                                                )
                                                                    buttonExtraPage.current.classList.add(
                                                                        "active"
                                                                    )
                                                                setTextButton(
                                                                    <Fragment>
                                                                        {icon}
                                                                        <label class="hide-low">
                                                                            {
                                                                                label
                                                                            }
                                                                        </label>
                                                                    </Fragment>
                                                                )
                                                                setHrefButton(
                                                                    href.replace(
                                                                        "#/",
                                                                        ""
                                                                    )
                                                                )
                                                            }}
                                                        >
                                                            {icon}
                                                            <label>
                                                                {label}
                                                            </label>
                                                        </a>
                                                    </li>
                                                )
                                            }
                                        )}
                                </ul>
                            </div>
                        </Fragment>
                    )}
                </section>
                <section class="navbar-section">
                    {!isIOS() && (
                        <span
                            className="btn btn-link no-box feather-icon-container"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
                        >
                            {isFullscreen ? <Minimize /> : <Maximize />}
                            <label style="cursor:pointer;" class="hide-low">
                                {/* {isFullscreen ? "Exit" : "Fullscreen"} */}
                            </label>
                        </span>
                    )}
                    <span
                        className={
                            connectionSettings.current.Authentication ==
                            "Disabled"
                                ? "d-none"
                                : "btn btn-link no-box mx-2 feather-icon-container"
                        }
                        onClick={onDisconnect}
                    >
                        <LogOut />
                        <label style="cursor:pointer;" class="hide-low">
                            {T("S151")}
                        </label>
                    </span>
                </section>
            </header>
        )
    }
    return null
}

export { Navbar }
