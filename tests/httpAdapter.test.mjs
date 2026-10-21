// Runs the real src/adapters/httpAdapter.tsx against a minimal fake XMLHttpRequest:
//   node --test tests/httpAdapter.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const source = readFileSync(fileURLToPath(new URL("../src/adapters/httpAdapter.tsx", import.meta.url)), "utf8")
const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
})
const loaded = { exports: {} }
new Function("module", "exports", "require", outputText)(loaded, loaded.exports, require)
const { httpAdapter } = loaded.exports

class FakeXhr {
    static last
    timeout = 0
    status = 0
    statusText = ""
    response = ""
    upload = { addEventListener() {} }
    constructor() {
        FakeXhr.last = this
    }
    addEventListener() {}
    open(method, url) {
        this.method = method
        this.url = url
    }
    setRequestHeader() {}
    send() {}
    abort() {
        this.onabort?.()
    }
}
globalThis.XMLHttpRequest = FakeXhr
globalThis.Headers = class {}

const url = "http://192.0.2.42/command?cmd=%5BESP420%5Djson%3Dyes"

test("timeoutMs is applied to the request", () => {
    httpAdapter(url, { timeoutMs: 10_000 })
    assert.equal(FakeXhr.last.timeout, 10_000)
})

test("without timeoutMs the request keeps the browser default (no timeout)", () => {
    httpAdapter(url, {})
    assert.equal(FakeXhr.last.timeout, 0)
})

test("a timed out request rejects with code 408", async () => {
    const { response } = httpAdapter(url, { timeoutMs: 10_000 })
    FakeXhr.last.ontimeout()
    await assert.rejects(response, (e) => e.code === 408 && /timeout/i.test(e.message))
})

test("a normal answer still resolves", async () => {
    const { response } = httpAdapter(url, { timeoutMs: 10_000 })
    FakeXhr.last.status = 200
    FakeXhr.last.response = "ok"
    FakeXhr.last.onload()
    assert.equal(await response, "ok")
})
