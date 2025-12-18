/*
 Router.tsx - ESP3D WebUI router file

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 modified by Luc LEBOSSE 2021
 
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
import { Fragment, FunctionalComponent, VNode, ComponentChildren, HTMLAttributes } from "preact"
import { useState, useEffect, useCallback } from "preact/hooks"
import { Loading } from "../Controls"
import { useRouterContext } from "../../contexts"
import type { RouteDef, RoutesMap, ParentRoutesRef } from "../../types/routes.types"

interface RouterProps {
  children?: ComponentChildren
  routesList: RoutesMap
  parentRoutes?: ParentRoutesRef
  // Historically used as a truthy flag; may be string. We only check truthiness.
  localDefault?: boolean | string
}

const Router: FunctionalComponent<RouterProps> = ({ children, routesList, parentRoutes, localDefault }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { setActiveRoute, setRoutes, activeRoute, routes, defaultRoute, activeTab } = useRouterContext()

  function parseLocation(): string {
    if (typeof window !== "undefined") {
      const location = window.location.hash.slice(1).toLowerCase()
      if (location == "/settings") {
        window.location.href = `/#${  activeTab.current}`
        return activeTab.current
      } else {
        return location
      }
    } else {
      return defaultRoute as unknown as string // SSR fallback, though not used in this app
    }
  }

  const localDefaultRoute = localDefault ? activeTab.current : defaultRoute.current

  const elements = Object.values(routesList)
  const defaultElement = elements.find((element) => element.path == localDefaultRoute) || elements[0]
  const [ActiveComponent, setActiveComponent] = useState<VNode<any>>(defaultElement.component)

  const setActiveRouteAndComp = () => {
    let found = false
    setIsLoading(true)
    const location = parseLocation().split("/")
    const path = parseLocation()
    for (let i = 0; i < location.length; i++) {
      const subLocation = location.slice(0, i + 1).join("/")
      for (const key in routesList) {
        if (Object.prototype.hasOwnProperty.call(routesList, key)) {
          const element = routesList[key]
          if (element.path === subLocation || subLocation == element.path) {
            setActiveRoute(element.path)
            setActiveComponent(element.component)
            found = true
            setIsLoading(false)
            break
          }
        }
      }
    }
    if (!found) {
      if (parentRoutes) {
        for (let i = 0; i < location.length; i++) {
          const subLocation = location.slice(0, i + 1).join("/")
          for (const key in parentRoutes.current) {
            if (Object.prototype.hasOwnProperty.call(parentRoutes.current, key)) {
              const element = parentRoutes.current[key]
              if (element.path === subLocation || subLocation == element.path) {
                setActiveRoute(element.path)
                setActiveComponent(element.component)
                found = true
                setIsLoading(false)
                break
              }
            }
          }
        }
      } else {
        window.location.href = `/#${  defaultRoute.current}`
      }
    }

    if (!found) {
      if (path.startsWith("/settings/")) {
        window.location.href = `/#${  activeTab.current}`
      } else {
        if (path.startsWith("/extrapage/")) {
          // not valid extra page
        } else {
          window.location.href = `/#${  defaultRoute.current}`
        }
      }
    }
  }

  const handleHashChange = useCallback(() => {
    setActiveRouteAndComp()
  }, [])

  useEffect(() => {
    setRoutes({ ...routes, ...routesList })
    setActiveRouteAndComp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeRoute.startsWith("/settings/")) {
      if (activeTab.current != activeRoute) {
        activeTab.current = activeRoute
        setActiveRouteAndComp()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoute])

  useEffect(() => {
    setActiveRouteAndComp()
    if (activeRoute.startsWith("/settings/")) {
      activeTab.current = activeRoute
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return isLoading ? (
    <Loading large />
  ) : (
    <Fragment>
      {ActiveComponent}
      {children}
    </Fragment>
  )
}

interface LinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, "href" | "className"> {
  activeClassName?: string
  className?: string
  href: string
  children?: ComponentChildren
}

const Link: FunctionalComponent<LinkProps> = ({
  activeClassName = "",
  className = "",
  href,
  children,
  ...rest
}) => {
  const { activeRoute } = useRouterContext()
  const [mergedClassName, setMergedClassName] = useState<string | undefined>()

  useEffect(() => {
    const route = window.location.hash.slice(1).toLowerCase()
    if ((activeRoute == "/settings" && href == route) || (route.startsWith("/settings") && href == "/settings")) {
      setMergedClassName(`${className} ${activeClassName}`)
    } else
      setMergedClassName(
        activeRoute === href ? `${className} ${activeClassName}` : className
      )
  }, [activeRoute, activeClassName, className, href])

  return mergedClassName
    ? (
      <a href={`#${href}`} className={mergedClassName} {...rest}>
        {children}
      </a>
    )
    : null
}

export { Router, Link }
