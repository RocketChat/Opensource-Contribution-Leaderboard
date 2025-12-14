import './style/style.css'
import './style/bootstrap.css'
import axios from 'axios'
import moment from 'moment'
import { io } from 'socket.io-client'

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
    table.innerHTML = table.rows[0].innerHTML
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

axios.get('/api/data').then(res => {
    Object.keys(res.data).length != 0 ? stopLoader() : ''
    refreshTable(res.data)
})

axios.get('/api/config')
    .then(res => {
        const { organization, organizationGithubUrl, organizationHomepage } = res.data
        const footer = document.querySelector('.footer .text-muted')
        footer.innerHTML = `
        <a href="${organizationHomepage}" target="_blank" rel="noopener noreferrer">${organizationHomepage}</a> |
        <a href="${organizationGithubUrl}" target="_blank" rel="noopener noreferrer">Github(${organization})</a>`.trim()
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
    data ? stopLoader() : null
    refreshTable(data)
})

function stopLoader() {
    const loader = document.querySelector('.loader')
    loader.style.display = 'none'
}