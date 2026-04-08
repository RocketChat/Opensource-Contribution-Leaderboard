const { test } = require('node:test')
const assert = require('assert')
const { EventEmitter } = require('events')
const Util = require('../src/server/util/Util')

test('Util.post sends 400 JSON when body is not valid JSON', async () => {
    const req = new EventEmitter()
    req.method = 'POST'

    let settle
    const done = new Promise((resolve) => {
        settle = resolve
    })

    const res = {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
            this.headers[name] = value
        },
        end(payload) {
            this.body = payload
            settle()
        }
    }

    Util.post(req, res, () => {
        assert.fail('callback must not run when JSON.parse throws')
    })

    req.emit('data', Buffer.from('{not-json'))
    req.emit('end')

    await done

    assert.strictEqual(res.statusCode, 400)
    assert.strictEqual(res.headers['Content-Type'], 'application/json')
    assert.deepStrictEqual(JSON.parse(res.body), { message: 'Invalid JSON body' })
})
