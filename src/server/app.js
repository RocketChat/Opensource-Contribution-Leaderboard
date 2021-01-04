import { createServer } from 'http'
import { readFileSync, writeFileSync, readFile, writeFile } from 'jsonfile'
import { parse } from 'url'
import { post } from './util/Util'
import { getContributorAvatar, getContributorInfo } from './util/API'
import { existsSync } from 'fs'
import { spawn } from 'child_process'
import express, { static } from 'express'
const app = express()
import proxy from 'http-proxy-middleware'
import { resolve } from 'path'

const configPath = './config.json'
const admindataPath = './admindata.json'
const dataPath = '../assets/data/data.json'
const logPath = '../assets/data/log.json'
const port = readFileSync(configPath).serverPort
const proxyOption = {
    target: 'http://localhost:'+ port +'/',
    pathRewrite: {'^/api' : ''},
    changeOrigin: true
}
const websocketProxyOption = {
    target: 'http://localhost:'+ port +'/',
    changeOrigin: true
}

if (process.env.NODE_ENV !== 'development') {
    app.use('/api', proxy(proxyOption))
    app.all('/server/*', (req, res, next) => {
        res.status(403).send(
        {
            message: 'Access Forbidden'
        })
    })
    app.use('/socket.io', proxy(websocketProxyOption))
    app.use('/', static(resolve(__dirname, '..')))
    app.listen(8080)
}

if (!existsSync(admindataPath)) {
    writeFileSync(admindataPath, [] )
}

// spawn - `node refresh.js`
const refresh = spawn('node', ['refresh.js'], { shell: true, stdio: 'inherit'})
process.on('exit', () => {
    refresh.kill() // kill it when exit
})

const server = createServer( (req, res) => {
    const route = parse(req.url).pathname
    const params = parse(req.url, true).query
    const { adminPassword } = readFileSync(configPath)

    switch (route) {
        case '/data':
            res.setHeader('Cache-Control', 'no-store')
            readFile(dataPath, (err, obj) => {
                if (err) console.log('[ERROR]' + err)
                res.end(JSON.stringify(obj))
            })
            break
        case '/log':
            res.setHeader('Cache-Control', 'no-store')
            readFile(logPath, (err, obj) => {
                if (err) console.log('[ERROR]' + err)
                res.end(JSON.stringify(obj))
            })
            break  
        case '/config':
            const Config = readFileSync(configPath)
            res.end(JSON.stringify({
                organization: Config.organization,
                organizationHomepage: Config.organizationHomepage,
                organizationGithubUrl: Config.organizationGithubUrl
            }))
            break
        case '/login':
            if (req.method === 'GET') {
                res.end('Permission denied\n')
                return
            }

            let { delay, contributors, startDate } = readFileSync(configPath)
            const contributorsList = []

            post(req, async params => {
                const { token } = params
                if (token === adminPassword) {
                    await Promise.all(contributors.map( async contributor => {
                        const admindata = readFileSync('./admindata.json')
                        const existContributor = findContributor(contributor, admindata)
                        
                        if ( existContributor !== null) {
                            contributorsList.push(existContributor)
                        } else {
                            const avatarUrl = await getContributorAvatar(contributor)
                            if(avatarUrl !== '') {
                                contributorsList.push({
                                    username: contributor,
                                    avatarUrl: avatarUrl
                                })
                            }
                        }
                    }))

                    res.end(JSON.stringify({ code: 0, delay, contributors: contributorsList, startDate })) // success
                    writeFileSync(admindataPath, contributorsList)
                } else {
                    res.end(JSON.stringify({ code: 1, delay: 0, contributors: {}, startDate: "" })) // wrong
                }
            })
           break
        case '/setStartDate':
            if (req.method === 'GET') {
                res.end('Permission denied\n')
                return
            }
            post(req, params => {
                const { token, startDate } = params

                if (token !== adminPassword) {
                    res.end(JSON.stringify({ message: 'Authentication failed' }))
                } else {
                    // set startDate in config.json
                    const Config = readFileSync(configPath)
                    Config.startDate = startDate
                    writeFileSync(configPath, Config, { spaces: 2 })

                    res.end(JSON.stringify({ message: 'Success' }))
                }
            })
            break
        case '/setInterval':
            if (req.method === 'GET') {
                res.end('Permission denied\n')
                return
            }

            post(req, params => {
                const { token, interval } = params

                if (token !== adminPassword) {
                    res.end(JSON.stringify({ message: 'Authentication failed' }))
                } else {
                    // set delay in config.json
                    const Config = readFileSync(configPath)
                    Config.delay = interval
                    writeFileSync(configPath, Config, { spaces: 2 })

                    res.end(JSON.stringify({ message: 'Success' }))
                }
            })
            break
        case '/remove':
            if (req.method === 'GET') {
                res.end('Permission denied\n')
                return
            }

            post(req, params => {
                const { token, username } = params

                if (token !== adminPassword) {
                    res.end(JSON.stringify({ message: 'Authentication failed' }))
                } else {
                    const Config = readFileSync(configPath)
                    // Remove this contributor in config.json
                    Config.contributors.forEach( (contributor, index, object) => {
                        if (contributor == username) {
                            object.splice(index, 1)
                        }
                    })
                    writeFileSync(configPath, Config, { spaces:2 })

                    // Remove this contributor in the data.json
                    const data = readFileSync(dataPath)
                    delete data[username]
                    writeFileSync(dataPath, data, { spaces: 2 })

                    res.end(JSON.stringify({ message: 'Success' }))
                }
            })
            break
        case '/add':
            if (req.method === 'GET') {
                res.end('Permission denied\n')
                return
            }

            post(req, params => {
                const { token, username } = params

                if (token !== adminPassword) {
                    res.end(JSON.stringify({ message: 'Authentication failed' }))
                } else {
                    const Config = readFileSync(configPath)

                    if (Config.contributors.includes(username)) {
                        res.end(JSON.stringify({ message: `${username} aready exists` }))
                        return
                    }

                    getContributorAvatar(username).then( result => {
                        if (result === '') {
                            res.end(JSON.stringify({ message: 'Not found' }))
                        } else {
                            // Add this contributor in config.json
                            Config.contributors.unshift(username)
                            writeFileSync(configPath, Config, { spaces:2 })

                            // Add this contributor in the data.json
                            const data = readFileSync(dataPath)
                            getContributorInfo(Config.organization, username).then( result => {
                                if (result.avatarUrl !== '' && result.issuesNumber !== -1 && result.mergedPRsNumber !== -1 && result.openPRsNumber != -1) {
                                    data[`${username}`] = result
                                    // Update contributors infomation
                                    writeFile(dataPath, data, { spaces: 2 }, (err) => {
                                        if (err) console.error(err)
                                    })
                                }
                            })

                            res.end(JSON.stringify({
                                message: 'Success',
                                avatarUrl: result
                        }))
                        }
                    })
                }
            })
            break
        default:
            res.end('Permission denied\n')
            break
    }
}).listen(port)

const io = require('socket.io')(server);
io.on('connection', (socket) => {
    const intervalId = setInterval(() => {
        readFile(dataPath, (err, obj) => {
            if (err) console.log('[ERROR]' + err)
            socket.emit('refresh table', obj);
        });
    }, 15000);
    socket.on('disconnect', () => {
        clearInterval(intervalId);
    });
});
  

const findContributor=(contributorName, admindata)=> {
    let result = null

    admindata.forEach( contributor => {
        if (contributor.username === contributorName) {
            result = contributor
        }
    })

    return result
}