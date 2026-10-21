/*
 shortcutKeys.ts - ESP3D WebUI keyboard shortcut helper

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

// A recorded shortcut is "<modifiers><key>", e.g. "Control+S", "Shift++" or "+".
// While a modifier is held without any other key, it is just the modifiers,
// e.g. "Control+" or "Control+Shift+".
const modifiersOnly = /^(Control\+|Alt\+|Shift\+|Meta\+)+$/

/**
 * True when the recorded shortcut is only modifiers and no key yet.
 * A literal "+" key (numpad plus, or Shift+= on many layouts) also ends
 * with "+", but it is a complete shortcut.
 */
const isIncompleteShortcut = (value: string): boolean =>
    modifiersOnly.test(value)

export { isIncompleteShortcut }
