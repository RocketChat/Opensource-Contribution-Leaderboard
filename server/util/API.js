const axios = require('axios')

const BASEURL = 'https://github.com'
const APIHOST = 'https://api.github.com'

async function getContributorAvatar(contributor) {
    const res = await axios.get(APIHOST + '/users/' + contributor)

    return res.data.avatar_url
}

async function getOpenPRsNumber(organization, contributor) {
    const OpenPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Open`
    const res = await axios.get(APIHOST + OpenPRsURL)

    return res.data.total_count
}

async function getMergedPRsNumber(organization, contributor) {
    const MergedPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Merged`
    const res = await axios.get(APIHOST + MergedPRsURL)

    return res.data.total_count
}

async function getIssuesNumber(organization, contributor) {
    const IssuesURL = `/search/issues?q=is:issue+org:${organization}+author:${contributor}`
    const res = await axios.get(APIHOST + IssuesURL)

    return res.data.total_count
}

async function getContributorInfo(organization, contributor) {
    const home = BASEURL + '/' + contributor,
        avatarUrl = await getContributorAvatar(contributor),
        openPRsNumber = await getOpenPRsNumber(organization, contributor),
        openPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:open`
        mergedPRsNumber = await getMergedPRsNumber(organization, contributor),
        mergedPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:merged`,
        issuesNumber = await getIssuesNumber(organization, contributor),
        issuesLink = `${BASEURL}/issues?q=is:issue+org:${organization}+author:${contributor}`

    return {
        contributor,
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
    getContributorInfo
}