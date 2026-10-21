/*
 keyMatch.ts - ESP3D WebUI keyboard shortcut matching

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
 * Returns the ids of every action bound to the pressed key, in list order.
 * A key may be bound to several actions on purpose (for example one key that
 * raises the XY and the Z jog distance), so all of them are returned.
 * Actions whose element is not on the page right now are skipped.
 *
 * @param keyval - The pressed key, e.g. "Control+S" or "+"
 * @param lists - Keymap and macro lists (items with a "key" sub-value)
 * @param elementExists - Whether the action's element is currently rendered
 */
const findMatchingActions = (
    keyval: string,
    lists: any[][],
    elementExists: (id: string) => boolean
): string[] => {
    const matches: string[] = []
    lists.forEach((list) => {
        if (!list) return
        list.forEach((element: any) => {
            element.value.forEach((sub: any) => {
                if (
                    sub.name == "key" &&
                    sub.value &&
                    sub.value.length > 0 &&
                    sub.value.toUpperCase() == keyval.toUpperCase() &&
                    elementExists(element.id) &&
                    !matches.includes(element.id)
                ) {
                    matches.push(element.id)
                }
            })
        })
    })
    return matches
}

export { findMatchingActions }
