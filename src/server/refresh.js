const Promise = require('bluebird')
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

if (!fs.existsSync(dataPath)) {
    jsonfile.writeFileSync(dataPath, {} )
}

if (fs.existsSync(logPath)) {
    logBuffer = jsonfile.readFileSync(logPath)
}

async function getAllContributorsInfo() {
    let Config = jsonfile.readFileSync(configPath)
    let organization = Config.organization
    let contributors = Config.contributors
    let includedRepositories = Config.includedRepositories

    interval = contributors.length < 150 ? 150 : (contributors.length + 10) // update interval

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, async contributor => {

        await Promise.delay(delay * 1000)

        API.getContributorInfo(organization, contributor, includedRepositories).then( res => {
            Config = jsonfile.readFileSync(configPath) // update Config
            delay = Config.delay // update delay

            if (res.avatarUrl !== '' && res.issuesNumber !== -1 && res.mergedPRsNumber !== -1 && res.openPRsNumber != -1) {
                
                dataBuffer = jsonfile.readFileSync(dataPath)

                if (Config.contributors.includes(contributor)) {
                    dataBuffer[`${contributor}`] = res
                    console.log(`${contributor} was updated: ${res.openPRsNumber} ${res.mergedPRsNumber} ${res.issuesNumber}`)

                    // Update contributors infomation
                    jsonfile.writeFile(dataPath, dataBuffer, { spaces: 2 }, (err) => {
                        if (err) console.error(err)
                    })
                }
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