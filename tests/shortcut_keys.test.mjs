import assert from "node:assert/strict"
import test from "node:test"
import { isIncompleteShortcut } from "../src/tabs/interface/shortcutKeys.ts"

test("a literal + key is a complete shortcut", () => {
    assert.equal(isIncompleteShortcut("+"), false)
})

test("modifier plus the + key is a complete shortcut", () => {
    assert.equal(isIncompleteShortcut("Shift++"), false)
    assert.equal(isIncompleteShortcut("Control++"), false)
    assert.equal(isIncompleteShortcut("Control+Shift++"), false)
})

test("modifiers without a key are incomplete", () => {
    assert.equal(isIncompleteShortcut("Control+"), true)
    assert.equal(isIncompleteShortcut("Shift+"), true)
    assert.equal(isIncompleteShortcut("Control+Alt+"), true)
    assert.equal(isIncompleteShortcut("Control+Alt+Shift+Meta+"), true)
})

test("ordinary shortcuts are complete", () => {
    for (const value of ["X", "5", "Delete", "ArrowRight", "Control+S", "Control+0", "-", "/", "*"]) {
        assert.equal(isIncompleteShortcut(value), false, value)
    }
})
