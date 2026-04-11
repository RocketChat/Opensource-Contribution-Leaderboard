require('dotenv').config()
const Promise = require('bluebird')
const API = require('./util/API')
const jsonfile = require('jsonfile')
const fs = require('fs')

const dataBasePath = process.env.DATA_BASE_PATH || '../assets/data'
const dataPath = process.env.DATA_PATH || '../assets/data/data.json'
const logPath = process.env.LOG_PATH || '../assets/data/log.json'
const configuredConfigPath = process.env.CONFIG_PATH || './config.json'
const defaultConfigPath = './config-example.json'
if (!fs.existsSync(configuredConfigPath) && fs.existsSync(defaultConfigPath)) {
    jsonfile.writeFileSync(
        configuredConfigPath,
        jsonfile.readFileSync(defaultConfigPath),
        { spaces: 2 }
    )
}
const configPath = configuredConfigPath

function ensureJsonFile(filePath, defaultValue) {
    if (!fs.existsSync(filePath)) {
        jsonfile.writeFileSync(filePath, defaultValue, { spaces: 2 })
        return defaultValue
    }

    try {
        return jsonfile.readFileSync(filePath)
    } catch (error) {
        jsonfile.writeFileSync(filePath, defaultValue, { spaces: 2 })
        return defaultValue
    }
}

let interval = 150
if (!fs.existsSync(dataBasePath)) {
    fs.mkdirSync(dataBasePath)
}

let dataBuffer = ensureJsonFile(dataPath, {})
let logBuffer = ensureJsonFile(logPath, {})
let delay = jsonfile.readFileSync(configPath).delay

async function getAllContributorsInfo() {
    let Config = jsonfile.readFileSync(configPath)
    let contributors = Config.contributors
    let includedRepositories = Config.includedRepositories
    let startDate = Config.startDate

    interval = contributors.length < 150 ? 150 : (contributors.length + 10) // update interval

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, async contributor => {

        await Promise.delay(delay * 1000)

        API.getContributorInfo(process.env.ORGANIZATION || 'RocketChat', contributor, includedRepositories, startDate).then( res => {
            Config = jsonfile.readFileSync(configPath) // update Config
            delay = Config.delay // update delay

            if (res.avatarUrl !== '' && res.issuesNumber !== -1 && res.mergedPRsNumber !== -1 && res.openPRsNumber != -1) {
                
                dataBuffer = ensureJsonFile(dataPath, {})

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