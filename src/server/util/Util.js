function post(req, callback) {
    if(req.method === 'POST') {
        let body = ''
        
        req.on('data', chunk => {
            body += chunk.toString()
        })

        req.on('end', () => {
            try {
                callback(JSON.parse(body))
            } catch (ex) {
                return
            }
        })
    }
}

module.exports = {
    post
}
