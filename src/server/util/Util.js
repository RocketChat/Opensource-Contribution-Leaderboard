function post(req, callback) {
    if(req.method === 'POST') {
        let body = ''
        
        req.on('data', chunk => {
            body += chunk.toString()
        })

        req.on('end', callback(JSON.parse(body)))
    }
}

module.exports = {
    post
}