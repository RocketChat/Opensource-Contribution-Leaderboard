const http = require('http')
const jsonfile = require('jsonfile')
const url = require('url')
const Util = require('./util/Util')
const API = require('./util/API')
const fs = require('fs')

const port = 52050
const admindataPath = './admindata.json'

if (!fs.existsSync(admindataPath)) {
    jsonfile.writeFileSync(admindataPath, [] )
}

const server = http.createServer( (req, res) => {
    const route = url.parse(req.url).pathname
    const params = url.parse(req.url, true).query

    switch (route) {
        
        case '/login':
            const { adminPassword, delay, contributors } = jsonfile.readFileSync('./config.json')
            const contributorsList = []

            Util.post(req, async params => {
                const { token } = params
                if (token == adminPassword) {
                    await Promise.all(contributors.map( async contributor => {
                        const admindata = jsonfile.readFileSync('./admindata.json')
                        const existContributor = findContributor(contributor, admindata)
                        
                        if ( existContributor !== null) {
                            contributorsList.push(existContributor)
                        } else {
                            const avatarUrl = await API.getContributorAvatar(contributor)
                            console.log(avatarUrl)
                            if(avatarUrl !== '') {
                                contributorsList.push({
                                    username: contributor,
                                    avatarUrl: avatarUrl
                                })
                            }
                        }
                    }))

                    res.end(JSON.stringify({ code: 0, delay, contributors: contributorsList })) // success
                    jsonfile.writeFileSync(admindataPath, contributorsList)
                } else {
                    res.end(JSON.stringify({ code: 1, delay: 0, contributors: {} })) // wrong
                }
            })
           break
        default:
            res.end('Hello World!')
            break
    }
}).listen(port)


function findContributor(contributorName, admindata) {
    let result = null

    admindata.forEach( contributor => {
        if (contributor.username === contributorName) {
            result = contributor
        }
    })

    return result
}