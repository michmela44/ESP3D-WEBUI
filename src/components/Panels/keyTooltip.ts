/*
 keyTooltip.ts - ESP3D WebUI tooltip text for keyboard shortcuts

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

/**
 * The key currently bound to an action in the keymap, if any.
 *
 * @param keymap - The runtime keymap list (items with a "key" sub-value)
 * @param id - The action id, e.g. "btnHX"
 */
const boundKey = (keymap: any[] | undefined, id: string): string | undefined => {
    const entry = keymap?.find((element: any) => element.id == id)
    const sub = entry?.value?.find((item: any) => item.name == "key")
    return sub && typeof sub.value == "string" && sub.value.length > 0
        ? sub.value
        : undefined
}

/**
 * Tooltip text "<action> [<key>]", the same form as the entries of the
 * keymap list in the settings. Just the action name when no key is bound.
 */
const actionTooltip = (label: string, key: string | undefined): string =>
    key ? `${label} [${key}]` : label

export { boundKey, actionTooltip }
