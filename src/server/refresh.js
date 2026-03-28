require('dotenv').config()
const Promise = require('bluebird')
const API = require('./util/API')
const jsonfile = require('jsonfile')
const fs = require('fs')

const dataBasePath = process.env.DATA_BASE_PATH || '../assets/data'
const dataPath = process.env.DATA_PATH || '../assets/data/data.json'
const logPath = process.env.LOG_PATH || '../assets/data/log.json'
const configPath = process.env.CONFIG_PATH || './config.json'
const rateLimitStopError = 'RATE_LIMIT_STOP'

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
    let contributors = Config.contributors
    let includedRepositories = Config.includedRepositories
    let startDate = Config.startDate

    interval = contributors.length < 150 ? 150 : (contributors.length + 10) // update interval

    // Record time
    logBuffer.starttime = Date.now()
    API.resetRateLimitExceeded()

    Promise.mapSeries(contributors, async contributor => {
        if (API.isRateLimitExceeded()) {
            throw new Error(rateLimitStopError)
        }

        await Promise.delay(delay * 1000)

        const res = await API.getContributorInfo(process.env.ORGANIZATION, contributor, includedRepositories, startDate)
        Config = jsonfile.readFileSync(configPath) // update Config
        delay = Config.delay // update delay

        if (res && res.avatarUrl !== '' && res.issuesNumber !== -1 && res.mergedPRsNumber !== -1 && res.openPRsNumber != -1) {
                
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

        // Record time
        logBuffer.endtime = Date.now()

        jsonfile.writeFile(logPath, logBuffer, { spaces: 2 }, (err) => {
            if (err) console.error(err)
        })
    }).catch((err) => {
        if (err.message === rateLimitStopError) {
            console.log('[WARNING] Refresh cycle stopped because the GitHub API rate limit was reached.')
            return
        }

        throw err
    })
}

getAllContributorsInfo()
setInterval(getAllContributorsInfo, interval * delay * 1000)
