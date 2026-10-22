// Runs the real src/pages/about/aboutRequest.ts:
//   node --test tests/aboutRequest.test.ts   (Node 22.18+ strips the types itself)
import test from "node:test"
import assert from "node:assert/strict"
import { requestAbout, parseAboutReply, InvalidAboutReply, AboutRequestCancelled } from "../src/pages/about/aboutRequest.ts"
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

test("a request dropped from the queue rejects and frees the slot for the next visit", async () => {
    const sent: AboutCallbacks[] = []
    const send = (callbacks: AboutCallbacks) => sent.push(callbacks)
    const first = requestAbout(send)
    assert.ok(sent[0].onCancel, "the queue needs a way to report a dropped request")
    sent[0].onCancel?.()
    await assert.rejects(first, AboutRequestCancelled)
    const second = requestAbout(send)
    assert.equal(sent.length, 2, "a later visit must send a new request")
    sent[1].onSuccess(reply(420))
    assert.equal((await second).length, 1)
})

test("a failure is reported once per request, even when the first caller has gone", async () => {
    const sent: AboutCallbacks[] = []
    const send = (callbacks: AboutCallbacks) => sent.push(callbacks)
    const reported: string[] = []
    const first = requestAbout(send, (error) => reported.push(error.message))
    const second = requestAbout(send, (error) => reported.push(`second ${error.message}`))
    first.catch(() => {}) // the page that sent it no longer listens
    sent[0].onFail("503 - Service Unavailable")
    await assert.rejects(second, { message: "503 - Service Unavailable" })
    assert.deepEqual(reported, ["503 - Service Unavailable"])
})

test("an error handler that throws does not leave an unhandled rejection", async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on("unhandledRejection", onUnhandled)
    try {
        const request = requestAbout(
            (callbacks) => callbacks.onFail("503 - Service Unavailable"),
            () => {
                throw new Error("toast failed")
            }
        )
        await assert.rejects(request, { message: "503 - Service Unavailable" })
        await new Promise((resolve) => setTimeout(resolve, 20))
        assert.deepEqual(unhandled, [])
    } finally {
        process.off("unhandledRejection", onUnhandled)
    }
})
