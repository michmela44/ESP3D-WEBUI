/*
 main.tsx - ESP3D WebUI MainPage file

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

import { useState, useEffect } from "preact/hooks"
import { Router } from "../components/Router"
import { useUiContext } from "../contexts"
import About from "../pages/about"
import Dashboard from "../pages/dashboard"
import Settings from "../pages/settings"
import ExtraPage from "../pages/extrapages"
import { FooterContainer } from "./footer"
import { processor, BackgroundContainer } from "../targets"
import type { RoutesMap, ExtraContent } from "../types/routes.types"

const mainRoutes: { current: RoutesMap } = { current: {} }

const defRoutes: RoutesMap = {
    DASHBOARD: {
        component: <Dashboard />,
        path: "/dashboard",
    },
    ABOUT: {
        component: <About />,
        path: "/about",
    },
    SETTINGS: {
        component: <Settings />,
        path: "/settings",
    },
}

const MainContainer: FunctionalComponent = () => {
    const { uisettings } = useUiContext()
    const [routes, setRoutes] = useState<RoutesMap>({ ...defRoutes })
    mainRoutes.current = { ...defRoutes }

    const newroutes = (): RoutesMap => {
        if (uisettings.getValue("showextracontents")) {
            const extraContents: ExtraContent[] = uisettings.getValue("extracontents")
            const extraPages = extraContents.reduce((acc: RoutesMap, curr: ExtraContent) => {
                const item = curr.value.reduce((accumulator: any, current: any) => {
                    accumulator[current.name] = current.initial
                    return accumulator
                }, {})

                if (item.target == "page") {
                    acc[`EXTRA-${  curr.id}`] = {
                        component: (
                            <ExtraPage
                                id={curr.id}
                                label={item.name}
                                source={item.source}
                                refreshtime={item.refreshtime}
                                type={item.type}
                            />
                        ),
                        path: `/extrapage/${  curr.id}`,
                    }
                }
                return acc
            }, routes)
            mainRoutes.current = { ...extraPages }
            return extraPages
        } else {
            mainRoutes.current = { ...defRoutes }
            return defRoutes
        }
    }

    useEffect(() => {
        setRoutes(newroutes())
    }, [uisettings])

    useEffect(() => {
        setInterval(() => {
            processor.handle()
        }, 10000)
    }, [])

    return (
        <div id="main" class="main-page-container">
            <BackgroundContainer />
            <Router routesList={routes} />
            <FooterContainer />
        </div>
    )
}

export { MainContainer, mainRoutes }
