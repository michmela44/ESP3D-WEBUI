import assert from "node:assert/strict"
import test from "node:test"
import {
    xyDistanceList,
    zDistanceList,
    stepJogDistance,
} from "../src/components/Panels/jogDistance.ts"
import { addMissingKeymapEntries } from "../src/tabs/interface/importHelper.ts"
import preferences from "../src/targets/CNC/FluidNC/preferences.json" with { type: "json" }

test("next/prev step through the XY distances", () => {
    assert.equal(stepJogDistance(xyDistanceList, 1, "next"), 10)
    assert.equal(stepJogDistance(xyDistanceList, "10", "next"), 50)
    assert.equal(stepJogDistance(xyDistanceList, "0.1", "next"), 1)
    assert.equal(stepJogDistance(xyDistanceList, 50, "prev"), 10)
})

test("next/prev step through the Z distances", () => {
    assert.equal(stepJogDistance(zDistanceList, 10, "next"), 25)
    assert.equal(stepJogDistance(zDistanceList, 25, "next"), 50)
    assert.equal(stepJogDistance(zDistanceList, 10, "prev"), 1)
})

test("stepping stops at the smallest and largest distance", () => {
    assert.equal(stepJogDistance(xyDistanceList, 100, "next"), 100)
    assert.equal(stepJogDistance(xyDistanceList, 0.1, "prev"), 0.1)
    assert.equal(stepJogDistance(zDistanceList, 50, "next"), 50)
    assert.equal(stepJogDistance(zDistanceList, "0.1", "prev"), 0.1)
})

test("an unknown current distance starts from the smallest one", () => {
    assert.equal(stepJogDistance(xyDistanceList, "-1", "next"), 1)
    assert.equal(stepJogDistance(xyDistanceList, "abc", "prev"), 0.1)
})

const defaultSettings = preferences.settings
const defaultKeymap = defaultSettings.jog.find((e) => e.id == "keymap").value
const keyOf = (list, id) => list.find((e) => e.id == id)?.key

test("default keymap binds the XY and Z distance actions to distinct keys", () => {
    const ids = ["btndistSel+", "btndistSel-", "btndistSelZ+", "btndistSelZ-"]
    const keys = ids.map((id) => keyOf(defaultKeymap, id))
    assert.deepEqual(keys, ["+", "-", "9", "7"])
    for (const key of keys) {
        assert.equal(defaultKeymap.filter((e) => e.key == key).length, 1, key)
    }
})

test("a keymap stored by an older build gets the missing Z actions, existing keys untouched", () => {
    const stored = [
        { id: "btn+X", name: "btn+X", key: "ArrowRight" },
        { id: "btndistSel+", name: "btndistSel+", key: "P" },
        { id: "btndistSel-", name: "btndistSel-", key: "M" },
    ]
    const result = addMissingKeymapEntries({ keymap: stored, other: 1 }, defaultSettings)
    assert.equal(result.other, 1)
    assert.deepEqual(result.keymap.slice(0, 3), stored)
    assert.equal(keyOf(result.keymap, "btndistSelZ+"), "9")
    assert.equal(keyOf(result.keymap, "btndistSelZ-"), "7")
    assert.equal(stored.length, 3, "input must not be mutated")
})

test("a new action never takes a key that is already bound (keymap or macro)", () => {
    const stored = [
        { id: "btnZX", name: "btnZX", key: "9" },
        { id: "btndistSel+", name: "btndistSel+", key: "+" },
    ]
    const macros = [{ id: "m1", name: "m1", key: "7" }]
    const result = addMissingKeymapEntries({ keymap: stored, macros }, defaultSettings)
    assert.equal(keyOf(result.keymap, "btndistSelZ+"), "")
    assert.equal(keyOf(result.keymap, "btndistSelZ-"), "")
})

test("a complete or absent keymap is returned unchanged", () => {
    const full = { keymap: defaultKeymap.map((e) => ({ ...e })) }
    assert.equal(addMissingKeymapEntries(full, defaultSettings), full)
    assert.equal(addMissingKeymapEntries(undefined, defaultSettings), undefined)
    const noKeymap = { theme: "default" }
    assert.equal(addMissingKeymapEntries(noKeymap, defaultSettings), noKeymap)
})
