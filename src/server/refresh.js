const Promise = require("bluebird")
const API = require('./util/API')
const jsonfile = require('jsonfile')
const fs = require('fs')

const dataBasePath = '../assets/data'
const dataPath = '../assets/data/data.json'
const logPath = '../assets/data/log.json'
const configPath = './config.json'

let interval = 150
let dataBuffer = {}
let logBuffer = {}
let delay = jsonfile.readFileSync(configPath).delay

if (!fs.existsSync(dataBasePath)) {
    fs.mkdirSync(dataBasePath)
}

if (fs.existsSync(dataPath)) {
    dataBuffer = jsonfile.readFileSync(dataPath)
}

if (fs.existsSync(logPath)) {
    logBuffer = jsonfile.readFileSync(logPath)
}

async function getAllContributorsInfo() {
    let Config = jsonfile.readFileSync(configPath)
    let organization = Config.organization
    let contributors = Config.contributors

    interval = contributors.length // update interval

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, async contributor => {

        await Promise.delay(delay * 1000)
                
        API.getContributorInfo(organization, contributor).then( res => {
            Config = jsonfile.readFileSync(configPath) // update Config
            delay = Config.delay // update delay

            if (!Config.contributors.includes(contributor)) return

            if (res.avatarUrl !== '' && res.issuesNumber !== -1 && res.mergedPRsNumber !== -1 && res.openPRsNumber != -1) {
                dataBuffer[`${contributor}`] = res
                console.log(res)
                // Update contributors infomation
                jsonfile.writeFile(dataPath, dataBuffer, { spaces: 2 }, (err) => {
                    if (err) console.error(err)
                })
            }
        })

        // Record time
        logBuffer.endtime = Date.now()

        jsonfile.writeFile(logPath, logBuffer, { spaces: 2 }, (err) => {
            if (err) console.error(err)
        })
    })
}

getAllContributorsInfo()
setInterval(getAllContributorsInfo, interval * delay * 1000)