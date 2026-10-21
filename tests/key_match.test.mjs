import assert from "node:assert/strict"
import test from "node:test"
import { findMatchingActions } from "../src/pages/dashboard/keyMatch.ts"

// Same shape as the runtime keymap/macro lists (after formatPreferences)
const item = (id, key) => ({
    id,
    index: 0,
    value: [
        { name: "name", value: id },
        { name: "key", value: key },
    ],
})
const all = () => true

test("a key bound to two actions runs both, in list order", () => {
    const keymap = [item("btndistSel+", "+"), item("btnHX", "X"), item("btndistSelZ+", "+")]
    assert.deepEqual(findMatchingActions("+", [keymap], all), ["btndistSel+", "btndistSelZ+"])
})

test("keymap and macro bindings of the same key both match", () => {
    const keymap = [item("btnHX", "X")]
    const macros = [item("macro1", "X")]
    assert.deepEqual(findMatchingActions("X", [keymap, macros], all), ["btnHX", "macro1"])
})

test("matching ignores case, a single match returns one action", () => {
    const keymap = [item("btnHX", "x"), item("btnHY", "Y")]
    assert.deepEqual(findMatchingActions("X", [keymap], all), ["btnHX"])
})

test("modifier combinations must match exactly", () => {
    const keymap = [item("btnStop", "Control+S"), item("btnHX", "S")]
    assert.deepEqual(findMatchingActions("Control+S", [keymap], all), ["btnStop"])
    assert.deepEqual(findMatchingActions("Shift+S", [keymap], all), [])
})

test("actions whose element is not on the page are skipped", () => {
    const keymap = [item("btndistSel+", "+"), item("btndistSelZ+", "+")]
    const present = (id) => id == "btndistSel+"
    assert.deepEqual(findMatchingActions("+", [keymap], present), ["btndistSel+"])
})

test("unbound entries and missing lists are ignored", () => {
    const keymap = [item("btnHX", ""), item("btnHY", undefined)]
    assert.deepEqual(findMatchingActions("", [keymap, undefined], all), [])
    assert.deepEqual(findMatchingActions("X", [undefined, null], all), [])
})

test("the same action is never returned twice", () => {
    const entry = {
        id: "btnHX",
        value: [
            { name: "key", value: "X" },
            { name: "key", value: "x" },
        ],
    }
    assert.deepEqual(findMatchingActions("X", [[entry]], all), ["btnHX"])
})
