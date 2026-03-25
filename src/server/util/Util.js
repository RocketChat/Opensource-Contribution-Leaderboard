function post(req, res, callback) {
    if(req.method === 'POST') {
        let body = ''
        
        req.on('data', chunk => {
            body += chunk.toString()
        })

        req.on('end', () => {
            try {
                callback(JSON.parse(body))
            } catch (ex) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ message: 'Invalid JSON body' }))
            }
        })
    }
}

function findContributor(contributorName, admindata) {
    let result = null

    admindata.forEach((contributor) => {
        if (contributor.username === contributorName) {
            result = contributor
        }
    })

    return result
}

module.exports = {
    post,
    findContributor
}
