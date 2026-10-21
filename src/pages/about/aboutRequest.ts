/*
 aboutRequest.ts - fetch the About page data ([ESP420]) once at a time

 The reply of [ESP420]json=yes is parsed here, and requests are shared:
 while one is in flight, every caller gets that same request instead of
 sending another one to the (small) device.
*/

interface AboutData {
    id: string
    value: string
}

interface AboutCallbacks {
    onSuccess: (result: string) => void
    onFail: (error: string) => void
}

type SendAboutRequest = (callbacks: AboutCallbacks) => void

// The device answered, but not with the expected [ESP420] data
class InvalidAboutReply extends Error {
    constructor() {
        super("Invalid About reply")
        this.name = "InvalidAboutReply"
    }
}

const parseAboutReply = (reply: unknown, expectedCmd: number): AboutData[] => {
    let json: any
    try {
        json = JSON.parse(String(reply))
    } catch {
        throw new InvalidAboutReply()
    }
    if (!json || json.cmd != expectedCmd || json.status == "error" || !Array.isArray(json.data)) {
        throw new InvalidAboutReply()
    }
    return json.data
}

let inFlight: Promise<AboutData[]> | undefined

// `send` issues the HTTP request and reports back through the callbacks.
// If a request is already in flight (for example the About page was left
// and opened again meanwhile), that request is returned and `send` is not
// called again.
const requestAbout = (send: SendAboutRequest): Promise<AboutData[]> => {
    if (inFlight) return inFlight
    const request = new Promise<AboutData[]>((resolve, reject) => {
        send({
            onSuccess: (result) => {
                try {
                    resolve(parseAboutReply(result, 420))
                } catch (e) {
                    reject(e)
                }
            },
            onFail: (error) => reject(new Error(error)),
        })
    })
    inFlight = request
    const release = () => {
        if (inFlight === request) inFlight = undefined
    }
    request.then(release, release)
    return request
}

export { requestAbout, parseAboutReply, InvalidAboutReply }
export type { AboutData, AboutCallbacks, SendAboutRequest }
