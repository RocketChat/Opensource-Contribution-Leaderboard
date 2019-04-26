const http = require('http')
const jsonfile = require('jsonfile')
const url = require('url')

const port = 52050

const server = http.createServer( (req, res) => {
    const params = url.parse(req.url, true).query

    try {
        const { contributors } = jsonfile.readFileSync('./config.json')
        
    } catch (ex) {
        console.log(ex)
    }

}).listen(port)