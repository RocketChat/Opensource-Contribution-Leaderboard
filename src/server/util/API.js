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

async function getOpenPRsNumber(organization, contributor, includedRepositories) {
    let OpenPRsURL = `/search/issues?q=is:pr+author:${contributor}+is:Open+created:>=${Config.startDate}`
    includedRepositories.forEach((repository) => {
        OpenPRsURL+=`+repo:${organization}/${repository}`
    })

    const res = await get(APIHOST + OpenPRsURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getMergedPRsNumber(organization, contributor, includedRepositories) {
    let MergedPRsURL = `/search/issues?q=is:pr+author:${contributor}+is:Merged+created:>=${Config.startDate}`
    includedRepositories.forEach((repository) => {
        MergedPRsURL+=`+repo:${organization}/${repository}`
    })

    const res = await get(APIHOST + MergedPRsURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getIssuesNumber(organization, contributor, includedRepositories) {
    let IssuesURL = `/search/issues?q=is:issue+author:${contributor}+created:>=${Config.startDate}`
    includedRepositories.forEach((repository) => {
        IssuesURL+=`+repo:${organization}/${repository}`
    })

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
    const openPRsNumber = await getOpenPRsNumber(organization, contributor, Config.includedRepositories)
    let openPRsLink = `${BASEURL}/pulls?q=is:pr+author:${contributor}+is:open+created:>=${Config.startDate}`
    const mergedPRsNumber = await getMergedPRsNumber(organization, contributor, Config.includedRepositories)
    let mergedPRsLink = `${BASEURL}/pulls?q=is:pr+author:${contributor}+is:merged+created:>=${Config.startDate}`
    const issuesNumber = await getIssuesNumber(organization, contributor, Config.includedRepositories)
    let issuesLink = `${BASEURL}/issues?q=is:issue+author:${contributor}+created:>=${Config.startDate}`
    Config.includedRepositories.forEach(repository => {
        openPRsLink+=`repo:${organization}/${repository}`
        mergedPRsLink+=`repo:${organization}/${repository}`
        issuesLink+=`repo:${organization}/${repository}`
    })

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
