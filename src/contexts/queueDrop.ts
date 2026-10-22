/*
 queueDrop.ts - split the HTTP request queue when requests are removed

 Requests that are removed before they were sent get cancelled, so whoever
 waits for them can be told. The first entry is skipped while a request is
 being sent: it is stopped by aborting the running call instead.
*/

interface QueuedRequest {
    id: string
}

const dropQueued = <T extends QueuedRequest>(queue: T[], busy: boolean, drop: (request: T) => boolean) => {
    const kept: T[] = []
    const cancelled: T[] = []
    queue.forEach((request, index) => {
        if (!drop(request)) kept.push(request)
        else if (!(busy && index == 0)) cancelled.push(request)
    })
    return { kept, cancelled }
}

export { dropQueued }
