const axios = require('axios')
const Config = require('../config.json')
const chalk = require('chalk')

const BASEURL = 'https://github.com'
const APIHOST = 'https://api.github.com'

async function get (url, authToken) {
    try {
      let res = await axios.get(url, {
          headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'GSoC-Contribution-Leaderboard',
              'Authorization': 'token ' + Config.authToken
          }
      })
      return new Promise((resolve) => {
        if (res.code === 0) {
          resolve(res)
        } else {
          resolve(res)
        }
      })
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            console.log(chalk.yellow('[WARNING] Time Out.'))
            return
        }
        if (err.response !== undefined) {
            const message = err.response.data.message
            switch (message) {
                case 'Bad credentials':
                    console.log(chalk.red(('[ERROR] Your GitHub Token is not correct! Please check it in the config.json.')))
                    process.exit()
                    break
                default:
                    console.log(chalk.yellow('[WARNING] ' + message))
            }
        } else {
            console.log(err)
        }
    }
}

async function checkRateLimit() {

    const res = await get(APIHOST + '/rate_limit')

    if (res !== undefined) {
        return res.data.avatar_url
    } else {
        return {}
    }
}

async function getContributorAvatar(contributor) {

    const res = await get(APIHOST + '/users/' + contributor)

    if (res !== undefined) {
        return res.data.avatar_url
    } else {
        return ''
    }
}

async function getOpenPRsCreatedTimes(organization, contributor) {
    const OpenPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Open`

    const res = await get(APIHOST + OpenPRsURL)

    if (res !== undefined) {
        res.data.items.forEach((element, index) => {
            console.log("Open PR index for "+contributor+" "+ index, element["created_at"])
        })
        return res.data.items.map((element, index)=> {
            // console.log("Element "+index, element)
            return element["created_at"]
        })
    } else {
        return -1
    }
}

async function getMergedPRsCreatedTimes(organization, contributor) {
    const MergedPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Merged`

    const res = await get(APIHOST + MergedPRsURL)

    if (res !== undefined) {
        res.data.items.forEach((element, index) => {
            console.log("Merged PR index for "+contributor+" "+ index, element["created_at"])
        })
        return res.data.items.map((element, index)=> {
            // console.log("Element "+index, element)
            return element["created_at"]
        })
    } else {
        return -1
    }
}

async function getIssuesCreatedTimes(organization, contributor) {
    const IssuesURL = `/search/issues?q=is:issue+org:${organization}+author:${contributor}`

    const res = await get(APIHOST + IssuesURL)

    if (res !== undefined) {
        res.data.items.forEach((element, index) => {
            console.log("Issues Created index for "+contributor+" "+ index, element["created_at"])
        })
        return res.data.items.map((element, index)=> {
            // console.log("Element "+index, element)
            return element["created_at"]
        })
    } else {
        return -1
    }
}

async function getContributorInfo(organization, contributor) {
    const home = BASEURL + '/' + contributor
    const avatarUrl = await getContributorAvatar(contributor)
    const openPRsCreatedTimes = await getOpenPRsCreatedTimes(organization, contributor)
    const openPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:open`
    const mergedPRsCreatedTimes = await getMergedPRsCreatedTimes(organization, contributor)
    const mergedPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:merged`
    const issuesCreatedTimes = await getIssuesCreatedTimes(organization, contributor)
    const issuesLink = `${BASEURL}/issues?q=is:issue+org:${organization}+author:${contributor}`

    return {
        home,
        avatarUrl,
        openPRsCreatedTimes,
        openPRsLink,
        mergedPRsCreatedTimes,
        mergedPRsLink,
        issuesCreatedTimes,
        issuesLink
    }
}

module.exports = {
    getContributorAvatar,
    getOpenPRsCreatedTimes,
    getMergedPRsCreatedTimes,
    getIssuesCreatedTimes,
    getContributorInfo,
    checkRateLimit
}
