import './style/bootstrap.css'
import './style/style.css'
import axios from 'axios'
import moment from 'moment'
import { io } from 'socket.io-client'

let spamPenaltyThreshold = 0

function refreshTable(newData) {
    const table = document.querySelector('table')
    const data = newData
    const list = Object.keys(data)
    let contributors = []
    list.forEach(username => {
        contributors.push({
            username,
            mergedPRsNumber: data[username].mergedPRsNumber,
            openPRsNumber: data[username].openPRsNumber,
            issuesNumber: data[username].issuesNumber
        })
    })

    // reder total contributor numbers
    const totalNumbers = list.length
    const totalEm = document.querySelector('.total')
    totalEm.innerText = 'Total: ' + totalNumbers

    contributors = contributors.sort((a, b) => {
        if (spamPenaltyThreshold > 0) {
            const aPenalized = a.openPRsNumber > spamPenaltyThreshold || a.issuesNumber > spamPenaltyThreshold
            const bPenalized = b.openPRsNumber > spamPenaltyThreshold || b.issuesNumber > spamPenaltyThreshold
            const aTopTier = !aPenalized && a.mergedPRsNumber > 0
            const bTopTier = !bPenalized && b.mergedPRsNumber > 0
            if (aTopTier && !bTopTier) return -1
            if (!aTopTier && bTopTier) return 1
        }

        var pref1, pref2, pref3 // preference is specified here
        const queryString = window.location.search
        const urlParams = new URLSearchParams(queryString)
        switch (urlParams.get('sort')) { //assigns according to parameter-sort (default 'm')
        case 'p':
            pref1 = 'openPRsNumber'
            pref2 = 'mergedPRsNumber'
            pref3 = 'issuesNumber'
            break
        case 'i':
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
        if (a[pref1] < b[pref1]) {
            return 1
        }
        if (a[pref1] > b[pref1]) {
            return -1
        }
        if (a[pref2] < b[pref2]) {
            return 1
        }
        if (a[pref2] > b[pref2]) {
            return -1
        }
        if (a[pref3] < b[pref3]) {
            return 1
        }
        if (a[pref3] > b[pref3]) {
            return -1
        }
        return 0
    })
    while (table.rows.length > 1) {
        table.deleteRow(1)
    }
    var allOpenPRs = 0
    var allMergedPRs = 0
    var allIssues = 0
    contributors.forEach((contributor, index) => {
        const tr = document.createElement('tr')

        // avatar
        const tdAvatar = document.createElement('td')
        const avatar = document.createElement('img')
        avatar.src = data[contributor.username].avatarUrl
        avatar.height = '42'
        avatar.width = '42'
        tdAvatar.appendChild(avatar)
        tr.appendChild(tdAvatar)

        // username
        const tdUsername = document.createElement('td')
        const username = document.createElement('a')
        const rank = document.createElement('span')
        username.href = data[contributor.username].home
        username.innerText = contributor.username
        rank.innerText = index + 1
        tr.id = contributor.username
        tdUsername.appendChild(username)
        tdUsername.appendChild(rank)
        tr.appendChild(tdUsername)

        // empty td tag
        tr.appendChild(document.createElement('td'))

        // Open PRs
        const tdOpenPRs = document.createElement('td')
        const openPRs = document.createElement('a')
        openPRs.href = data[contributor.username].openPRsLink
        openPRs.innerText = data[contributor.username].openPRsNumber
        if (data[contributor.username].openPRsNumber === 0) {
            openPRs.className = 'inactiveLink'
        }
        tdOpenPRs.appendChild(openPRs)
        tr.appendChild(tdOpenPRs)

        // Merged PRs
        const tdMergedPRs = document.createElement('td')
        const mergedPRs = document.createElement('a')
        mergedPRs.href = data[contributor.username].mergedPRsLink
        mergedPRs.innerText = data[contributor.username].mergedPRsNumber
        if (data[contributor.username].mergedPRsNumber === 0) {
            mergedPRs.className = 'inactiveLink'
        }
        tdMergedPRs.appendChild(mergedPRs)
        tr.appendChild(tdMergedPRs)

        // Issues
        const tdIssues = document.createElement('td')
        const issues = document.createElement('a')
        issues.href = data[contributor.username].issuesLink
        issues.innerText = data[contributor.username].issuesNumber
        if (data[contributor.username].issuesNumber === 0) {
            issues.className = 'inactiveLink'
        }
        tdIssues.appendChild(issues)
        tr.appendChild(tdIssues)

        table.appendChild(tr)

        allOpenPRs = allOpenPRs + data[contributor.username].openPRsNumber
        allMergedPRs = allMergedPRs + data[contributor.username].mergedPRsNumber
        allIssues = allIssues + data[contributor.username].issuesNumber
    })
    const allOpenPRsRef = document.getElementById('allOpenPRs')
    const allMergedPRsRef = document.getElementById('allMergedPRs')
    const allIssuesRef = document.getElementById('allIssues')
    const allContributionsInfoRef = document.getElementById('allContributionsInfo')
    allOpenPRsRef.innerText = ' ' + allOpenPRs
    allMergedPRsRef.innerText = ' ' + allMergedPRs
    allIssuesRef.innerText = ' ' + allIssues
    allContributionsInfoRef.innerText = allMergedPRs + ' Merged PRs, ' + allOpenPRs + ' Open PRs, and ' + allIssues + ' Issues.'
}

axios.get('/api/config')
    .then(res => {
        const { organization, organizationGithubUrl, organizationHomepage } = res.data
        spamPenaltyThreshold = res.data.spamPenaltyThreshold || 0
        const footer = document.querySelector('.footer .text-muted')
        footer.textContent = ''

        const homepageLink = document.createElement('a')
        homepageLink.href = organizationHomepage
        homepageLink.target = '_blank'
        homepageLink.rel = 'noopener noreferrer'
        homepageLink.textContent = organizationHomepage

        const separator = document.createTextNode(' | ')

        const githubLink = document.createElement('a')
        githubLink.href = organizationGithubUrl
        githubLink.target = '_blank'
        githubLink.rel = 'noopener noreferrer'
        githubLink.textContent = 'Github(' + organization + ')'

        footer.appendChild(homepageLink)
        footer.appendChild(separator)
        footer.appendChild(githubLink)

        return axios.get('/api/data')
    })
    .then(res => {
        refreshTable(res.data)
    })

axios.get('/api/log')
    .then(res => {
        const { starttime, endtime } = res.data
        const relativeTime = moment(new Date(endtime)).from(new Date(starttime))
        console.log(relativeTime)
        if (relativeTime.match(/[\da]+.+/) !== null) {
            const lastupdate = document.querySelector('.lastupdate')
            lastupdate.innerText = `Last Updated: ${relativeTime.match(/[\da]+.+/)[0]} ago`
        }
    })

const socket = io()
socket.on('refresh table', (data) => {
    refreshTable(data)
})

// Theme: follow OS by default, allow user override
const themeToggle = document.getElementById('theme-toggle')
const sunIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>'
const moonIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>'

function getEffectiveTheme() {
    const explicit = document.documentElement.getAttribute('data-theme')
    if (explicit) return explicit
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function updateThemeIcon() {
    themeToggle.innerHTML = getEffectiveTheme() === 'dark' ? sunIcon : moonIcon
}

updateThemeIcon()

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!document.documentElement.hasAttribute('data-theme')) {
        updateThemeIcon()
    }
})

themeToggle.addEventListener('click', () => {
    const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    updateThemeIcon()
})
