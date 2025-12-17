/*
 index.ts - ESP3D WebUI translations engine
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
import LangRessourceSubTarget from "../../targets/CNC/FluidNC/translations/en.json"
import LangRessourceTarget from "../../targets/CNC/translations/en.json"
import LangRessourceBase from "../../targets/translations/en.json"
import listLanguagePacks from "./languages.json"

/**
 * Language resource interface - maps string IDs to translation strings
 */
interface LanguageResource {
    [key: string]: string
}

/**
 * Base language resource combining all translation sources
 */
const baseLangRessource: LanguageResource = {
    ...(LangRessourceSubTarget as LanguageResource),
    ...(LangRessourceTarget as LanguageResource),
    ...(LangRessourceBase as LanguageResource),
}

/**
 * Current language resource - defaults to base resource
 */
let currentLanguage: LanguageResource = baseLangRessource

/**
 * Set the current language resource
 * @param lang - Language resource to set as current
 */
const setCurrentLanguage = (lang: LanguageResource): void => {
    currentLanguage = lang
}

/**
 * Get text from translation ID according to language selection
 * Falls back to base language text if no corresponding ID found
 *
 * @param id - Translation ID key
 * @param base - If true, use base language resource
 * @param ressourcelanguage - Optional specific language resource to use
 * @returns Translated text or the ID if translation not found
 */
function T(
    id: string | number | object | null | undefined,
    base: boolean = false,
    ressourcelanguage: LanguageResource | null = null
): string {
    // Return string representation of ID if invalid
    if (!id || typeof id === "object" || !isNaN(Number(id)) || !isNaN(Number((id as string)?.charAt?.(0)))) {
        return String(id ?? "")
    }

    // Select language resource
    let translatedText: string | undefined
    if (base) {
        translatedText = baseLangRessource[id as string]
    } else if (ressourcelanguage) {
        translatedText = ressourcelanguage[id as string]
    } else {
        translatedText = currentLanguage[id as string]
    }

    // Fallback to base resource if not found
    if (typeof translatedText === "undefined") {
        translatedText = baseLangRessource[id as string]
        if (typeof translatedText === "undefined") {
            translatedText = id as string
        }
    }

    return translatedText
}

/**
 * Get human-readable language name from language pack filename
 *
 * @param languagePack - Language pack filename (e.g., "lang-en.json")
 * @returns Human-readable language name or original filename if not found
 */
function getLanguageName(languagePack: string): string {
    const id = languagePack.replace("lang-", "").replace(".json", "")

    // Return ID if invalid
    if (!id || typeof id === "object" || !isNaN(Number(id)) || !isNaN(Number(id.charAt(0)))) {
        return id
    }

    // Lookup language name in language packs list
    const lang = listLanguagePacks[id as keyof typeof listLanguagePacks]
    if (typeof lang === "undefined") return languagePack
    return lang
}

export { T, getLanguageName, setCurrentLanguage, baseLangRessource }
export type { LanguageResource }
