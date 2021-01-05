const axios = require('axios')
const Config = require('../config.json')
const chalk = require('chalk')

const BASEURL = 'https://github.com'
const APIHOST = 'https://api.github.com'

async function get (url, _authToken) {
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

async function fetchRepositories(organization, page) {
    const res = await get(APIHOST + `/orgs/${organization}/repos?per_page=100&page=${page}`)
        if (res !== undefined) {
            return res.data.map((element)=> {
                return element["name"]
        })} 
        else {
            return ''
        }

}

async function getRepositories(organization) {
    console.log('Called')
    const results = []
    for(var page =1; page<=3; page++)
    {
        results.push(await fetchRepositories(organization, page))
    }
    results.flat()
    console.log(results)
    return results
}

async function getContributorAvatar(contributor) {

    const res = await get(APIHOST + '/users/' + contributor)

    if (res !== undefined) {
        return res.data.avatar_url
    } else {
        return ''
    }
}

async function getOpenPRsNumber(organization, contributor) {
    const OpenPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Open+created:>=${Config.startDate}`

    const res = await get(APIHOST + OpenPRsURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getMergedPRsNumber(organization, contributor) {
    const MergedPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Merged+created:>=${Config.startDate}`

    const res = await get(APIHOST + MergedPRsURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getIssuesNumber(organization, contributor) {
    const IssuesURL = `/search/issues?q=is:issue+org:${organization}+author:${contributor}+created:>=${Config.startDate}`

    const res = await get(APIHOST + IssuesURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getContributorInfo(organization, contributor) {
    const home = BASEURL + '/' + contributor
    const avatarUrl = await getContributorAvatar(contributor)
    const openPRsNumber = await getOpenPRsNumber(organization, contributor)
    const openPRsLink = `${BASEURL}/search?q=type:pr+org:${organization}+author:${contributor}+is:open+created:>=${Config.startDate}`
    const mergedPRsNumber = await getMergedPRsNumber(organization, contributor)
    const mergedPRsLink = `${BASEURL}/search?q=type:pr+org:${organization}+author:${contributor}+is:merged+created:>=${Config.startDate}`
    const issuesNumber = await getIssuesNumber(organization, contributor)
    const issuesLink = `${BASEURL}/search?q=type:issue+org:${organization}+author:${contributor}+created:>=${Config.startDate}`

    return {
        home,
        avatarUrl,
        openPRsNumber,
        openPRsLink,
        mergedPRsNumber,
        mergedPRsLink,
        issuesNumber,
        issuesLink
    }
}

module.exports = {
    getRepositories,
    getContributorAvatar,
    getOpenPRsNumber,
    getMergedPRsNumber,
    getIssuesNumber,
    getContributorInfo,
    checkRateLimit
}
