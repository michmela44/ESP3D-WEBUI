/*
exportHelper.js - ESP3D WebUI helper file

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

function exportPreferencesSection(interfaceSettingsDataSection, asFile = true, initial_value = false){
    const section = {}
    for (let key in interfaceSettingsDataSection) {
        for (let subkey in interfaceSettingsDataSection[key]) {
            if (interfaceSettingsDataSection[key][subkey].id) {
                if (interfaceSettingsDataSection[key][subkey].type == "group") {
                    interfaceSettingsDataSection[key][subkey].value.forEach(
                        (element) => {
                            section[element.id] = asFile
                                ? element.initial
                                : element.value
                        }
                    )
                } else if (
                    interfaceSettingsDataSection[key][subkey].type == "list"
                ) {
                    const itemsList = []
                    interfaceSettingsDataSection[key][subkey].value.forEach(
                        (element) => {
                            const item = {}
                            item.id = element.id
                            element.value.forEach((setting) => {
                                item[setting.name] = asFile
                                    ? setting.initial
                                    : setting.value
                            })
                            itemsList.push(item)
                        }
                    )
                    section[
                        interfaceSettingsDataSection[key][subkey].id
                    ] = itemsList
                } else {
                    section[
                        interfaceSettingsDataSection[key][subkey].id
                    ] = asFile || initial_value
                        ? interfaceSettingsDataSection[key][subkey].initial
                        : interfaceSettingsDataSection[key][subkey].value
                }
            }
        }
    }
    return section
}

function exportPreferences(interfaceSettingsData, asFile = true) {
    console.log("exportPreferences for")
    console.log(JSON.parse(JSON.stringify(interfaceSettingsData)))
    const preferences = {}
    const filename = "preferences.json"
    preferences.settings = {}
    if (interfaceSettingsData.custom)
        preferences.custom = interfaceSettingsData.custom
    if (interfaceSettingsData.extensions)
        preferences.extensions = interfaceSettingsData.extensions
    preferences.settings = exportPreferencesSection(interfaceSettingsData.settings, asFile)
    if (asFile) {
        const file = new Blob([JSON.stringify(preferences, null, " ")], {
            type: "application/json",
        })
        if (window.navigator.msSaveOrOpenBlob)
            // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename)
        else {
            // Others
            const a = document.createElement("a")
            const url = URL.createObjectURL(file)
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            setTimeout(function () {
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }, 0)
        }
    }
    console.log("exportPreferences done")
    console.log(preferences)
    return preferences
}

export { exportPreferences, exportPreferencesSection }
