const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('events')
const path = require('path')

const Util = require(path.resolve(__dirname, '../../src/server/util/Util'))

function mockReq(method, body) {
    const req = new EventEmitter()
    req.method = method
    // Simulate sending data after a tick
    if (body !== undefined) {
        process.nextTick(() => {
            req.emit('data', Buffer.from(body))
            req.emit('end')
        })
    }
    return req
}

function mockRes() {
    const res = {
        statusCode: null,
        headers: {},
        body: null,
        writeHead(code, headers) {
            res.statusCode = code
            Object.assign(res.headers, headers)
        },
        end(data) {
            res.body = data
        },
    }
    return res
}

describe('Util.post', () => {
    test('calls callback with parsed JSON on valid POST', async () => {
        const req = mockReq('POST', '{"key":"value"}')
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.deepStrictEqual(params, { key: 'value' })
                resolve()
            })
        })
    })

    test('returns 400 for invalid JSON on POST', async () => {
        const req = mockReq('POST', '{bad-json')
        const res = mockRes()

        await new Promise((resolve) => {
            // post will call res.end, not callback
            const origEnd = res.end
            res.end = (data) => {
                origEnd.call(res, data)
                resolve()
            }
            Util.post(req, res, () => {
                assert.fail('callback should not be called for invalid JSON')
            })
        })

        assert.strictEqual(res.statusCode, 400)
        assert.deepStrictEqual(JSON.parse(res.body), { message: 'Invalid JSON body' })
    })

    test('returns 400 for empty POST body', async () => {
        const req = mockReq('POST', '')
        const res = mockRes()

        await new Promise((resolve) => {
            const origEnd = res.end
            res.end = (data) => {
                origEnd.call(res, data)
                resolve()
            }
            Util.post(req, res, () => {
                assert.fail('callback should not be called for empty body')
            })
        })

        assert.strictEqual(res.statusCode, 400)
        assert.deepStrictEqual(JSON.parse(res.body), { message: 'Invalid JSON body' })
    })

    test('does nothing for non-POST requests', async () => {
        const req = mockReq('GET')
        const res = mockRes()
        let callbackCalled = false

        Util.post(req, res, () => {
            callbackCalled = true
        })

        // Give it a tick to ensure nothing happens
        await new Promise((resolve) => setTimeout(resolve, 50))
        assert.strictEqual(callbackCalled, false)
        assert.strictEqual(res.statusCode, null)
        assert.strictEqual(res.body, null)
    })

    test('handles nested JSON objects', async () => {
        const nested = { a: { b: { c: [1, 2, 3] } }, d: true }
        const req = mockReq('POST', JSON.stringify(nested))
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.deepStrictEqual(params, nested)
                resolve()
            })
        })
    })

    test('handles JSON array body', async () => {
        const req = mockReq('POST', '[1,2,3]')
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.deepStrictEqual(params, [1, 2, 3])
                resolve()
            })
        })
    })

    test('handles multi-chunk POST body', async () => {
        const req = new EventEmitter()
        req.method = 'POST'
        const res = mockRes()
        const fullBody = { key: 'value', nested: { a: 1 } }
        const json = JSON.stringify(fullBody)
        const mid = Math.floor(json.length / 2)

        process.nextTick(() => {
            req.emit('data', Buffer.from(json.slice(0, mid)))
            req.emit('data', Buffer.from(json.slice(mid)))
            req.emit('end')
        })

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.deepStrictEqual(params, fullBody)
                resolve()
            })
        })
    })

    test('handles UTF-8 multi-byte characters in JSON', async () => {
        const body = { name: '日本語テスト', emoji: '🚀' }
        const req = mockReq('POST', JSON.stringify(body))
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.deepStrictEqual(params, body)
                resolve()
            })
        })
    })
})

describe('Util.findContributor', () => {
    test('returns matching contributor object', () => {
        const admindata = [
            { username: 'alice', avatarUrl: 'https://example.com/alice.png' },
            { username: 'bob', avatarUrl: 'https://example.com/bob.png' },
        ]
        const result = Util.findContributor('bob', admindata)
        assert.deepStrictEqual(result, { username: 'bob', avatarUrl: 'https://example.com/bob.png' })
    })

    test('returns null for non-existent contributor', () => {
        const admindata = [
            { username: 'alice', avatarUrl: 'https://example.com/alice.png' },
        ]
        const result = Util.findContributor('nonexistent', admindata)
        assert.strictEqual(result, null)
    })

    test('returns null for empty admindata array', () => {
        const result = Util.findContributor('alice', [])
        assert.strictEqual(result, null)
    })

    test('is case-sensitive', () => {
        const admindata = [
            { username: 'Alice', avatarUrl: 'https://example.com/alice.png' },
        ]
        assert.strictEqual(Util.findContributor('alice', admindata), null)
        assert.notStrictEqual(Util.findContributor('Alice', admindata), null)
    })

    test('returns last match if duplicates exist', () => {
        const admindata = [
            { username: 'alice', avatarUrl: 'first' },
            { username: 'alice', avatarUrl: 'second' },
        ]
        const result = Util.findContributor('alice', admindata)
        assert.strictEqual(result.avatarUrl, 'second')
    })

    test('preserves extra fields on matched contributor', () => {
        const admindata = [
            { username: 'alice', avatarUrl: 'https://example.com/a.png', extraField: 42, role: 'admin' },
        ]
        const result = Util.findContributor('alice', admindata)
        assert.strictEqual(result.extraField, 42)
        assert.strictEqual(result.role, 'admin')
    })

    test('handles username with special characters', () => {
        const admindata = [
            { username: 'my-user_123', avatarUrl: 'https://example.com/a.png' },
        ]
        const result = Util.findContributor('my-user_123', admindata)
        assert.notStrictEqual(result, null)
        assert.strictEqual(result.username, 'my-user_123')
    })
})

describe('Util.post - additional edge cases', () => {
    test('returns 400 when callback throws (catch block is broad)', async () => {
        const req = mockReq('POST', '{"valid":"json"}')
        const res = mockRes()

        await new Promise((resolve) => {
            const origEnd = res.end
            res.end = (data) => {
                origEnd.call(res, data)
                resolve()
            }
            Util.post(req, res, () => {
                throw new Error('callback error')
            })
        })

        assert.strictEqual(res.statusCode, 400)
        assert.deepStrictEqual(JSON.parse(res.body), { message: 'Invalid JSON body' })
    })

    test('handles numeric JSON body', async () => {
        const req = mockReq('POST', '42')
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.strictEqual(params, 42)
                resolve()
            })
        })
    })

    test('handles boolean JSON body', async () => {
        const req = mockReq('POST', 'true')
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.strictEqual(params, true)
                resolve()
            })
        })
    })

    test('handles null JSON body', async () => {
        const req = mockReq('POST', 'null')
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.strictEqual(params, null)
                resolve()
            })
        })
    })

    test('handles large POST body (100KB JSON)', async () => {
        const largeArray = Array.from({ length: 5000 }, (_, i) => ({ index: i, value: 'x'.repeat(10) }))
        const req = mockReq('POST', JSON.stringify(largeArray))
        const res = mockRes()

        await new Promise((resolve) => {
            Util.post(req, res, (params) => {
                assert.strictEqual(params.length, 5000)
                assert.strictEqual(params[0].index, 0)
                assert.strictEqual(params[4999].index, 4999)
                resolve()
            })
        })
    })
})
