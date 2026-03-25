const http = require('http')

function request(port, path, { method = 'GET', body = null, rawBody = null } = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port,
            path,
            method,
            headers: {},
        }

        const payload = rawBody != null
            ? String(rawBody)
            : body !== null
                ? JSON.stringify(body)
                : null

        if (payload !== null) {
            options.headers['Content-Type'] = 'application/json'
            options.headers['Content-Length'] = Buffer.byteLength(payload)
        }

        const req = http.request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => (data += chunk))
            res.on('end', () => {
                let parsed = data
                try {
                    parsed = JSON.parse(data)
                } catch {
                    // keep as string
                }
                resolve({ status: res.statusCode, body: parsed, raw: data, headers: res.headers })
            })
        })

        req.on('error', reject)

        if (payload !== null) {
            req.write(payload)
        }
        req.end()
    })
}

module.exports = { request }
