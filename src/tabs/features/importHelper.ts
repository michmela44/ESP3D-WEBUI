/*
importHelper.ts - ESP3D WebUI helper file

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

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

import { FeaturesStructure } from './formatHelper';

// Import structure mirrors the export structure
export interface ImportEntry {
    id: string;
    value: string;
}

export interface ImportStructure {
    [section: string]: {
        [subsection: string]: ImportEntry[];
    };
}

// Result of import operation
export interface ImportResult {
    features: FeaturesStructure;
    hasErrors: boolean;
}

function importFeatures(
    currentFeaturesData: FeaturesStructure,
    importedFeatures: ImportStructure
): ImportResult {
    const currentFeatures: FeaturesStructure = JSON.parse(JSON.stringify(currentFeaturesData))
    let hasErrors = false

    Object.keys(importedFeatures).forEach((sectionId) => {
        const section = importedFeatures[sectionId]
        if (!section) return

        Object.keys(section).forEach((subsectionId) => {
            const subsection = section[subsectionId]
            if (!subsection) return

            subsection.forEach((entry) => {
                const currentSection = currentFeatures[sectionId]
                if (!currentSection) {
                    hasErrors = true
                    console.log(
                        "Cannot find section:",
                        sectionId,
                        ".",
                        subsectionId
                    )
                    return
                }

                const currentSubsection = currentSection[subsectionId]
                if (!Array.isArray(currentSubsection)) {
                    hasErrors = true
                    console.log(
                        "Cannot find section:",
                        sectionId,
                        ".",
                        subsectionId
                    )
                    return
                }

                const featureId = currentSubsection.find(
                    (element) => element.id === entry.id
                )
                if (featureId) {
                    featureId.value = entry.value
                } else {
                    hasErrors = true
                    console.log(
                        "Cannot find entry:",
                        sectionId,
                        ".",
                        subsectionId,
                        ".",
                        entry.id
                    )
                }
            })
        })
    })

    return { features: currentFeatures, hasErrors }
}

export { importFeatures }
