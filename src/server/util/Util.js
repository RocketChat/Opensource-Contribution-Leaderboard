function post(req, res, callback) {
    if (req.method === 'POST') {
        let body = ''

        req.on('data', (chunk) => {
            body += chunk.toString()
        })

        req.on('end', () => {
            try {
                callback(JSON.parse(body))
            } catch (ex) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ message: 'Invalid JSON body' }))
                return
            }
        })
    }
}

module.exports = {
    post
}
