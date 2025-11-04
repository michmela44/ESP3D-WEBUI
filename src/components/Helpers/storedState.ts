/*
 storedState.ts - ESP3D WebUI helpers file

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
import { useState, useMemo } from "preact/hooks"

export const useStoredState = <T>(
    key: string,
    defaultValue: T
): [T, (newState: T | ((prev: T) => T)) => void] => {
    const stored = useMemo(() => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : null
        } catch (e) {
            return null
        }
    }, [key])

    const [state, setInternalState] = useState<T>(stored ?? defaultValue)

    const setState = (newState: T | ((prev: T) => T)): void => {
        setInternalState(prev => {
            const value = typeof newState === "function" ? (newState as (p: T) => T)(prev) : newState
            localStorage.setItem(key, JSON.stringify(value))
            return value
        })
    }

    return [state, setState]
}
