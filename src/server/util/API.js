const axios = require('axios')
const Config = require('../config.json')

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
      console.log(err)
    }
}

async function checkRateLimit() {
    const res = await get(APIHOST + '/rate_limit')

    return res.data
}

async function getContributorAvatar(contributor) {
    const res = await get(APIHOST + '/users/' + contributor)

    return res.data.avatar_url
}

async function getOpenPRsNumber(organization, contributor) {
    const OpenPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Open`

    const res = await get(APIHOST + OpenPRsURL)

    return res.data.total_count
}

async function getMergedPRsNumber(organization, contributor) {
    const MergedPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Merged`

    const res = await get(APIHOST + MergedPRsURL)

    return res.data.total_count
}

async function getIssuesNumber(organization, contributor) {
    const IssuesURL = `/search/issues?q=is:issue+org:${organization}+author:${contributor}`

    const res = await get(APIHOST + IssuesURL)

    return res.data.total_count
}

async function getContributorInfo(organization, contributor) {
    const home = BASEURL + '/' + contributor
    const avatarUrl = await getContributorAvatar(contributor)
    const openPRsNumber = await getOpenPRsNumber(organization, contributor)
    const openPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:open`
    const mergedPRsNumber = await getMergedPRsNumber(organization, contributor)
    const mergedPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:merged`
    const issuesNumber = await getIssuesNumber(organization, contributor)
    const issuesLink = `${BASEURL}/issues?q=is:issue+org:${organization}+author:${contributor}`

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
    getOpenPRsNumber,
    getMergedPRsNumber,
    getIssuesNumber,
    getContributorInfo,
    checkRateLimit
}