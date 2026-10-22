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
    // the request was removed from the queue before it was sent
    onCancel: () => void
}

type SendAboutRequest = (callbacks: AboutCallbacks) => void

// The device answered, but not with the expected [ESP420] data
class InvalidAboutReply extends Error {
    constructor() {
        super("Invalid About reply")
        this.name = "InvalidAboutReply"
    }
}

// The request was dropped from the HTTP queue (for example after a controller error)
class AboutRequestCancelled extends Error {
    constructor() {
        super("About request cancelled")
        this.name = "AboutRequestCancelled"
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
// called again. `onError` is called once when the request fails, even if
// nobody is waiting for the result any more; callers that join a request
// already in flight do not report its failure a second time.
const requestAbout = (send: SendAboutRequest, onError?: (error: Error) => void): Promise<AboutData[]> => {
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
            onCancel: () => reject(new AboutRequestCancelled()),
        })
    })
    inFlight = request
    const release = () => {
        if (inFlight === request) inFlight = undefined
    }
    request.then(release, release)
    if (onError) {
        request.catch((error: Error) => {
            try {
                onError(error)
            } catch (e) {
                console.log(e)
            }
        })
    }
    return request
}

export { requestAbout, parseAboutReply, InvalidAboutReply, AboutRequestCancelled }
export type { AboutData, AboutCallbacks, SendAboutRequest }
