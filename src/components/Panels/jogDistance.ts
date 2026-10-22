/*
 jogDistance.ts - ESP3D WebUI jog distance helper

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

// Selectable jog distances in ascending order. These are the values of the
// radio buttons in the jog panel (XY and Z have separate sets).
const xyDistanceList = [0.1, 1, 10, 50, 100]
const zDistanceList = [0.1, 1, 10, 25, 50]

/**
 * Returns the jog distance one step above ("next") or below ("prev") the
 * current one. Stops at the smallest and largest value instead of wrapping
 * around, so repeated key presses never jump from 100 mm back to 0.1 mm.
 * A current value that is not in the list is treated as the smallest one.
 */
const stepJogDistance = (
    list: number[],
    current: number | string,
    direction: "next" | "prev"
): number => {
    let index = list.indexOf(parseFloat(String(current)))
    if (index == -1) index = 0
    index =
        direction == "next"
            ? Math.min(index + 1, list.length - 1)
            : Math.max(index - 1, 0)
    return list[index]
}

export { xyDistanceList, zDistanceList, stepJogDistance }
