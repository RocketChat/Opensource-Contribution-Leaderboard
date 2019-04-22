const Promise = require("bluebird")
const API = require('./util/API')
const jsonfile = require('jsonfile')

const dataPath = '../src/assets/data/data.json'
const logPath = '../src/assets/data/log.json'
const dataBuffer = jsonfile.readFileSync('../src/assets/data/data.json')
const logBuffer = jsonfile.readFileSync('../src/assets/data/log.json')

async function getAllContributorsInfo() {
    const Config = jsonfile.readFileSync('../config.json')
    const contributors = Config.contributors

    // Record time
    logBuffer.starttime = Date.now()

    Promise.mapSeries(contributors, contributor => {
        return Promise.delay(500)
            .then( async () => {
                const organization = Config.organization
                
                API.getContributorInfo(organization, contributor).then( res => {
                    dataBuffer[`${contributor}`] = res
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
            }).delay(10000)
    })
}

getAllContributorsInfo()
setInterval(getAllContributorsInfo, 20 * 60 * 1000)