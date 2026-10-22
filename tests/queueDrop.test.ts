// Runs the real src/contexts/queueDrop.ts:
//   node --test tests/queueDrop.test.ts   (Node 22.18+ strips the types itself)
import test from "node:test"
import assert from "node:assert/strict"
import { dropQueued } from "../src/contexts/queueDrop.ts"

const queue = [{ id: "a" }, { id: "b" }, { id: "c" }]

test("dropping everything cancels the waiting requests, not the one being sent", () => {
    const { kept, cancelled } = dropQueued(queue, true, () => true)
    assert.deepEqual(kept, [])
    assert.deepEqual(cancelled.map((r) => r.id), ["b", "c"])
})

test("when nothing is being sent every dropped request is cancelled", () => {
    const { cancelled } = dropQueued(queue, false, () => true)
    assert.deepEqual(cancelled.map((r) => r.id), ["a", "b", "c"])
})

test("only the matching requests are dropped", () => {
    const { kept, cancelled } = dropQueued(queue, true, (r) => r.id == "c")
    assert.deepEqual(kept.map((r) => r.id), ["a", "b"])
    assert.deepEqual(cancelled.map((r) => r.id), ["c"])
})

test("the input queue is not changed", () => {
    dropQueued(queue, true, () => true)
    assert.equal(queue.length, 3)
})
