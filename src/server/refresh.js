require('dotenv').config()
const Promise = require('bluebird')
const API = require('./util/API')
const jsonfile = require('jsonfile')
const fs = require('fs')

const dataBasePath = process.env.DATA_BASE_PATH || '../assets/data'
const dataPath = process.env.DATA_PATH || '../assets/data/data.json'
const logPath = process.env.LOG_PATH || '../assets/data/log.json'
const configPath = process.env.CONFIG_PATH || './config.json'

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
    let organization = process.env.ORGANIZATION || Config.organization
    let contributors = Array.isArray(Config.contributors) ? Config.contributors : []
    let includedRepositories = Array.isArray(Config.includedRepositories) ? Config.includedRepositories : []
    let startDate = Config.startDate

    interval = contributors.length < 150 ? 150 : (contributors.length + 10) // update interval

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, async contributor => {

        await Promise.delay(delay * 1000)

        try {
            const res = await API.getContributorInfo(
                organization,
                contributor,
                includedRepositories,
                startDate
            )
            Config = jsonfile.readFileSync(configPath) // update Config
            delay = Config.delay // update delay

            if (res && res.avatarUrl !== '' && res.issuesNumber !== -1 && res.mergedPRsNumber !== -1 && res.openPRsNumber !== -1) {
                
                dataBuffer = jsonfile.readFileSync(dataPath)

                if (Config.contributors.includes(contributor)) {
                    dataBuffer[`${contributor}`] = res
                    console.log(`${contributor} was updated: ${res.openPRsNumber} ${res.mergedPRsNumber} ${res.issuesNumber}`)

                    // Update contributors infomation
                    jsonfile.writeFile(dataPath, dataBuffer, { spaces: 2 }, (err) => {
                        if (err) console.error(err)
                    })
                }
            } else {
                console.log(`[WARNING] Skipped update for ${contributor}. Check GitHub token, rate limit, or network status.`)
            }
        } catch (err) {
            console.log(`[ERROR] Failed to update ${contributor}: ${err && err.message ? err.message : err}`)
        }

        // Record time
        logBuffer.endtime = Date.now()

        jsonfile.writeFile(logPath, logBuffer, { spaces: 2 }, (err) => {
            if (err) console.error(err)
        })
    })
}

getAllContributorsInfo()
setInterval(getAllContributorsInfo, interval * delay * 1000)
