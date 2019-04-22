const Promise = require("bluebird")
const API = require('./util/API')
const jsonfile = require('jsonfile')
const moment = require('moment')

const dataPath = '../assets/data/data.json'
const logPath = '../assets/data/log.json'
const dataBuffer = jsonfile.readFileSync(dataPath)
const logBuffer = jsonfile.readFileSync(logPath)
let interval = 150
let delay = 6

async function getAllContributorsInfo() {
    const Config = jsonfile.readFileSync('./config.json')
    const organization = Config.organization
    const contributors = Config.contributors

    interval = contributors.length // update interval

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, async contributor => {

        await Promise.delay(delay * 1000)
                
        API.getContributorInfo(organization, contributor).then( res => {
            if (res.avatarUrl !== '' && res.issuesNumber !== -1 && res.mergedPRsLink !== -1 && res.openPRsNumber != -1) {
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