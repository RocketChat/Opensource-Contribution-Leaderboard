const { describe, test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const {
    startServer,
    stopServer,
    getActivePort,
} = require('./setup')

const SOCKET_TEST_PORT = 63112

describe('Socket.io E2E Tests', () => {
    let io
    let port

    before(async () => {
        await startServer(SOCKET_TEST_PORT)
        port = getActivePort()
        // Dynamic import of socket.io-client (installed in root package.json)
        io = require('socket.io-client')
    })

    after(async () => {
        await stopServer()
    })

    test('client receives "refresh table" event with data object', async () => {
        const socket = io(`http://127.0.0.1:${port}`, {
            transports: ['websocket'],
            reconnection: false,
        })

        try {
            const data = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timed out waiting for "refresh table" event (20s)'))
                }, 20000)

                socket.on('refresh table', (obj) => {
                    clearTimeout(timeout)
                    resolve(obj)
                })

                socket.on('connect_error', (err) => {
                    clearTimeout(timeout)
                    reject(new Error('Socket connect error: ' + err.message))
                })
            })

            assert.strictEqual(typeof data, 'object')
            assert.ok(Object.keys(data).length > 0, 'refresh table data should not be empty')
            // Verify it looks like contributor data
            const firstKey = Object.keys(data)[0]
            assert.ok('openPRsNumber' in data[firstKey], 'data should contain contributor objects')
        } finally {
            socket.disconnect()
        }
    })

    test('server cleans up interval on disconnect', async () => {
        const socket = io(`http://127.0.0.1:${port}`, {
            transports: ['websocket'],
            reconnection: false,
        })

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve)
            socket.on('connect_error', reject)
        })

        // Disconnect and verify no errors
        socket.disconnect()

        // Give the server a moment to clean up
        await new Promise((resolve) => setTimeout(resolve, 200))

        // If disconnection cleanup failed, the server would crash on next interval tick
        // Verify the server is still responsive
        const { request } = require('./helpers')
        const res = await request(port, '/stats')
        assert.strictEqual(res.status, 200)
    })

    test('multiple clients each receive "refresh table" data independently', async () => {
        const sockets = []
        const NUM_CLIENTS = 3

        try {
            const results = await Promise.all(
                Array.from({ length: NUM_CLIENTS }, () => {
                    const socket = io(`http://127.0.0.1:${port}`, {
                        transports: ['websocket'],
                        reconnection: false,
                    })
                    sockets.push(socket)

                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Timed out waiting for "refresh table"'))
                        }, 25000)

                        socket.on('refresh table', (obj) => {
                            clearTimeout(timeout)
                            resolve(obj)
                        })

                        socket.on('connect_error', (err) => {
                            clearTimeout(timeout)
                            reject(err)
                        })
                    })
                })
            )

            assert.strictEqual(results.length, NUM_CLIENTS)
            for (const data of results) {
                assert.strictEqual(typeof data, 'object')
                assert.ok(Object.keys(data).length > 0)
            }
        } finally {
            sockets.forEach((s) => s.disconnect())
        }
    })

    test('socket data matches GET /data response', async () => {
        const socket = io(`http://127.0.0.1:${port}`, {
            transports: ['websocket'],
            reconnection: false,
        })

        try {
            const socketData = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timed out waiting for "refresh table" event'))
                }, 20000)

                socket.on('refresh table', (obj) => {
                    clearTimeout(timeout)
                    resolve(obj)
                })

                socket.on('connect_error', (err) => {
                    clearTimeout(timeout)
                    reject(new Error('Socket connect error: ' + err.message))
                })
            })

            // Fetch the same data via HTTP
            const { request } = require('./helpers')
            const httpRes = await request(port, '/data')

            // Socket data and HTTP data should match
            assert.deepStrictEqual(
                Object.keys(socketData).sort(),
                Object.keys(httpRes.body).sort(),
                'socket and HTTP /data should have same contributor keys'
            )

            // Spot-check a contributor's data matches
            const firstKey = Object.keys(socketData)[0]
            assert.deepStrictEqual(socketData[firstKey], httpRes.body[firstKey])
        } finally {
            socket.disconnect()
        }
    })

    test('rapid connect and disconnect does not crash the server', async () => {
        for (let i = 0; i < 5; i++) {
            const socket = io(`http://127.0.0.1:${port}`, {
                transports: ['websocket'],
                reconnection: false,
            })

            await new Promise((resolve, reject) => {
                socket.on('connect', resolve)
                socket.on('connect_error', reject)
            })

            socket.disconnect()
        }

        // Give the server time to process all disconnects
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Server should still be responsive
        const { request } = require('./helpers')
        const res = await request(port, '/data')
        assert.strictEqual(res.status, 200)
        assert.ok(Object.keys(res.body).length > 0)
    })
})
