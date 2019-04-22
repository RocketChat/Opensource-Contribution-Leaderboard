const Promise = require("bluebird")
const API = require('./util/API')
const jsonfile = require('jsonfile')
const moment = require('moment')

const dataPath = '../assets/data/data.json'
const logPath = '../src/assets/data/log.json'
const dataBuffer = {}
const logBuffer = {}
let interval = 150

async function getAllContributorsInfo() {
    const Config = jsonfile.readFileSync('./config.json')
    const organization = Config.organization
    const contributors = Config.contributors

    interval = contributors.length // update interval

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, async contributor => {

        await Promise.delay(6000)
                
        API.getContributorInfo(organization, contributor).then( res => {
            dataBuffer[`${contributor}`] = res

            console.log(res)

            // Update contributors infomation
            jsonfile.writeFile(dataPath, dataBuffer, { spaces: 2 }, (err) => {
                if (err) console.error(err)
            })
        })

        // Record time
        logBuffer.endtime = Date.now()

        jsonfile.writeFile(logPath, logBuffer, { spaces: 2 }, (err) => {
            if (err) console.error(err)
        })
    })
}

getAllContributorsInfo()
setInterval(getAllContributorsInfo, interval * 6 * 1000)