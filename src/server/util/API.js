const axios = require('axios')
const chalk = require('chalk')

const BASEURL = 'https://github.com'
const APIHOST = 'https://api.github.com'
let hasLoggedBadCredentials = false

function getRateLimitResetMessage(headers) {
    const resetHeader = headers && headers['x-ratelimit-reset']
    if (!resetHeader) {
        return ''
    }
    const resetTime = Number(resetHeader) * 1000
    if (!Number.isFinite(resetTime)) {
        return ''
    }
    return ` Retry after ${new Date(resetTime).toISOString()}.`
}

async function get(url, _authToken) {
    try {
        let res = await axios.get(url, {
            headers: {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'GSoC-Contribution-Leaderboard',
                Authorization: 'token ' + process.env.AUTH_TOKEN,
            },
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
            console.log(chalk.yellow('[WARNING] GitHub API request timed out.'))
            return
        }
        if (err.response !== undefined) {
            const message = err.response.data.message
            if (message === 'Bad credentials') {
                if (!hasLoggedBadCredentials) {
                    console.log(
                        chalk.red(
                            '[ERROR] GitHub token is invalid or expired. Please update the AUTH_TOKEN env variable and restart the server.'
                        )
                    )
                    hasLoggedBadCredentials = true
                }
                return
            }
            if (message && message.indexOf('API rate limit exceeded') === 0) {
                console.log(
                    chalk.yellow(
                        '[WARNING] GitHub API rate limit exceeded.' +
                            getRateLimitResetMessage(err.response.headers)
                    )
                )
                return
            }
            console.log(chalk.yellow('[WARNING] ' + message))
        } else {
            console.log(
                chalk.yellow(
                    `[WARNING] GitHub API request failed: ${
                        err.message || 'Unknown network error'
                    }`
                )
            )
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
    const res = await get(
        APIHOST + `/orgs/${organization}/repos?per_page=100&page=${page}`
    )
    if (res !== undefined) {
        return res.data.map((element) => {
            return element['name']
        })
    } else {
        return ''
    }
}

async function getRepositories(organization) {
    const results = []
    let page = 1,
        repositories = [],
        fetchFlag = true
    while (fetchFlag) {
        repositories = await fetchRepositories(organization, page)
        results.push(repositories)
        if (repositories.length <= 99) {
            fetchFlag = false
        }
        page++
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

async function getOpenPRsNumber(OpenPRsURL) {
    const res = await get(APIHOST + OpenPRsURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getMergedPRsNumber(MergedPRsURL) {
    const res = await get(APIHOST + MergedPRsURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getIssuesNumber(IssuesURL) {
    const res = await get(APIHOST + IssuesURL)

    if (res !== undefined) {
        return res.data.total_count
    } else {
        return -1
    }
}

async function getContributorInfo(
    organization,
    contributor,
    includedRepositories,
    startDate
) {
    if (!Array.isArray(includedRepositories)) {
        includedRepositories = []
    }
    const home = BASEURL + '/' + contributor
    const avatarUrl = await getContributorAvatar(contributor)
    let OpenPRsURL = `/search/issues?q=is:pr+author:${contributor}+is:Open+created:>=${startDate}`
    let openPRsLink = `${BASEURL}/search?q=type:pr+author:${contributor}+is:open+created:>=${startDate}`
    let MergedPRsURL = `/search/issues?q=is:pr+author:${contributor}+is:Merged+created:>=${startDate}`
    let mergedPRsLink = `${BASEURL}/search?q=type:pr+author:${contributor}+is:merged+created:>=${startDate}`
    let IssuesURL = `/search/issues?q=is:issue+author:${contributor}+created:>=${startDate}`
    let issuesLink = `${BASEURL}/search?q=type:issue+author:${contributor}+created:>=${startDate}`
    includedRepositories.forEach((repository) => {
        openPRsLink += `+repo:${organization}/${repository}`
        mergedPRsLink += `+repo:${organization}/${repository}`
        issuesLink += `+repo:${organization}/${repository}`

        OpenPRsURL += `+repo:${organization}/${repository}`
        MergedPRsURL += `+repo:${organization}/${repository}`
        IssuesURL += `+repo:${organization}/${repository}`
    })
    openPRsLink += '+-label:chore'
    mergedPRsLink += '+-label:chore'
    issuesLink += '+-label:chore'
    OpenPRsURL += '+-label:chore'
    MergedPRsURL += '+-label:chore'
    IssuesURL += '+-label:chore'
    const openPRsNumber = await getOpenPRsNumber(OpenPRsURL)
    const mergedPRsNumber = await getMergedPRsNumber(MergedPRsURL)
    const issuesNumber = await getIssuesNumber(IssuesURL)

    return {
        home,
        avatarUrl,
        openPRsNumber,
        openPRsLink,
        mergedPRsNumber,
        mergedPRsLink,
        issuesNumber,
        issuesLink,
    }
}

async function getStats(data) {
    let totalOpenPRs = 0,
        totalMergedPRs = 0,
        totalIssues = 0
    Object.values(data).map((contributor) => {
        totalOpenPRs += contributor.openPRsNumber
        totalMergedPRs += contributor.mergedPRsNumber
        totalIssues += contributor.issuesNumber
    })
    return {
        totalContributors: Object.keys(data).length,
        totalOpenPRs: totalOpenPRs,
        totalMergedPRs: totalMergedPRs,
        totalIssues: totalIssues,
    }
}

async function getRanks(data, parameter = 'mergedprs', spamPenaltyThreshold = 0) {
    var pref1, pref2, pref3 // preference is specified here
    switch (
        parameter //assigns according to parameter-sort (default 'mergedprs')
    ) {
    case 'openprs':
        pref1 = 'openPRsNumber'
        pref2 = 'mergedPRsNumber'
        pref3 = 'issuesNumber'
        break
    case 'issues':
        pref1 = 'issuesNumber'
        pref2 = 'mergedPRsNumber'
        pref3 = 'openPRsNumber'
        break

    default:
        pref1 = 'mergedPRsNumber'
        pref2 = 'openPRsNumber'
        pref3 = 'issuesNumber'
        break
    }

    const threshold = parseInt(spamPenaltyThreshold) || 0

    const contributors = Object.keys(data)
    return contributors.sort((a, b) => {
        if (threshold > 0) {
            const aPenalized = data[a].openPRsNumber > threshold || data[a].issuesNumber > threshold
            const bPenalized = data[b].openPRsNumber > threshold || data[b].issuesNumber > threshold
            const aTopTier = !aPenalized && data[a].mergedPRsNumber > 0
            const bTopTier = !bPenalized && data[b].mergedPRsNumber > 0
            if (aTopTier && !bTopTier) return -1
            if (!aTopTier && bTopTier) return 1
        }

        if (data[a][pref1] < data[b][pref1]) {
            return 1
        }
        if (data[a][pref1] > data[b][pref1]) {
            return -1
        }
        if (data[a][pref2] < data[b][pref2]) {
            return 1
        }
        if (data[a][pref2] > data[b][pref2]) {
            return -1
        }
        if (data[a][pref3] < data[b][pref3]) {
            return 1
        }
        if (data[a][pref3] > data[b][pref3]) {
            return -1
        }
        return 0
    })
}

module.exports = {
    getRepositories,
    getContributorAvatar,
    getOpenPRsNumber,
    getMergedPRsNumber,
    getIssuesNumber,
    getContributorInfo,
    checkRateLimit,
    getStats,
    getRanks,
}
