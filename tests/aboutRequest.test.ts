// Runs the real src/pages/about/aboutRequest.ts:
//   node --test tests/aboutRequest.test.ts   (Node 22.18+ strips the types itself)
import test from "node:test"
import assert from "node:assert/strict"
import { requestAbout, parseAboutReply, InvalidAboutReply } from "../src/pages/about/aboutRequest.ts"
import type { AboutCallbacks } from "../src/pages/about/aboutRequest.ts"

const reply = (cmd: number, data: unknown = [{ id: "Free memory", value: "120.74 KB" }]) =>
    JSON.stringify({ cmd: String(cmd), status: "ok", data })

test("parseAboutReply accepts a valid [ESP420] reply", () => {
    assert.deepEqual(parseAboutReply(reply(420), 420), [{ id: "Free memory", value: "120.74 KB" }])
})

test("parseAboutReply rejects anything else", () => {
    for (const bad of [
        "",
        "error: 3\n",
        "<html>oops</html>",
        reply(421),
        JSON.stringify({ cmd: "420", status: "error", data: "Try again" }),
        JSON.stringify({ cmd: "420", status: "ok", data: "not a list" }),
        "null",
    ]) {
        assert.throws(() => parseAboutReply(bad, 420), InvalidAboutReply, `should reject ${JSON.stringify(bad)}`)
    }
})

test("a second caller shares the request that is already in flight", async () => {
    const sent: AboutCallbacks[] = []
    const send = (callbacks: AboutCallbacks) => sent.push(callbacks)
    const first = requestAbout(send)
    const second = requestAbout(send)
    assert.equal(sent.length, 1, "only one request may be sent")
    assert.equal(first, second)
    sent[0].onSuccess(reply(420))
    assert.deepEqual(await first, await second)
})

test("a new request is sent once the previous one has finished", async () => {
    let sent = 0
    const send = (callbacks: AboutCallbacks) => {
        sent++
        callbacks.onSuccess(reply(420))
    }
    await requestAbout(send)
    await requestAbout(send)
    assert.equal(sent, 2)
})

test("a failed request rejects, and the next call is sent again", async () => {
    let sent = 0
    const failing = (callbacks: AboutCallbacks) => {
        sent++
        callbacks.onFail("503 - Service Unavailable")
    }
    await assert.rejects(requestAbout(failing), { message: "503 - Service Unavailable" })
    await assert.rejects(requestAbout(failing), { message: "503 - Service Unavailable" })
    assert.equal(sent, 2)
})

test("a reply that is not [ESP420] data rejects with InvalidAboutReply", async () => {
    await assert.rejects(
        requestAbout((callbacks) => callbacks.onSuccess("error: 3\n")),
        InvalidAboutReply
    )
})

test("a send() that throws rejects and does not block later requests", async () => {
    await assert.rejects(
        requestAbout(() => {
            throw new Error("queue unavailable")
        }),
        { message: "queue unavailable" }
    )
    const data = await requestAbout((callbacks) => callbacks.onSuccess(reply(420)))
    assert.equal(data.length, 1)
})
