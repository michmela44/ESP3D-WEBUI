import assert from "node:assert/strict"
import test from "node:test"
import { boundKey, actionTooltip } from "../src/components/Panels/keyTooltip.ts"

// Same shape as the runtime keymap (after formatPreferences)
const entry = (id, key) => ({
    id,
    index: 0,
    value: [
        { name: "name", value: id },
        ...(key === undefined ? [] : [{ name: "key", value: key }]),
    ],
})
const keymap = [entry("btnHX", "X"), entry("btnStop", "Control+S"), entry("btnHY", ""), entry("btnZX")]

test("boundKey returns the key of the action", () => {
    assert.equal(boundKey(keymap, "btnHX"), "X")
    assert.equal(boundKey(keymap, "btnStop"), "Control+S")
})

test("boundKey is undefined for unbound, empty or unknown actions and a missing keymap", () => {
    assert.equal(boundKey(keymap, "btnHY"), undefined)
    assert.equal(boundKey(keymap, "btnZX"), undefined)
    assert.equal(boundKey(keymap, "nope"), undefined)
    assert.equal(boundKey(undefined, "btnHX"), undefined)
})

test("tooltip shows the action name and the key like the keymap list", () => {
    assert.equal(actionTooltip("Home X", "X"), "Home X [X]")
    assert.equal(actionTooltip("Stop Jog", "Control+S"), "Stop Jog [Control+S]")
})

test("tooltip is only the name when no key is bound", () => {
    assert.equal(actionTooltip("Home X", undefined), "Home X")
})
