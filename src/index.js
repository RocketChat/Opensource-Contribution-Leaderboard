import './style/style.css'
import './style/bootstrap.css'
import axios from 'axios'
import moment from 'moment'
import { io } from 'socket.io-client'

function createLink(
    href,
    innerText,
    options = { newTab: false, className: '' }
) {
    const { newTab, className } = options

    const link = document.createElement('a')
    link.href = href
    link.innerText = innerText
    if (className) {
        link.className = className
    }
    if (newTab) {
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
    }
    return link
}

function refreshTable(newData) {
    const table = document.querySelector('table')
    const data = newData
    const list = Object.keys(data)
    let contributors = []
    list.forEach((username) => {
        contributors.push({
            username,
            ...data[username],
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
        switch (
            urlParams.get('sort') //assigns according to parameter-sort (default 'm')
        ) {
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
    contributors.forEach((contributor, index) => {
        const {
            username,
            home,
            avatarUrl,
            openPRsLink,
            openPRsNumber,
            mergedPRsLink,
            mergedPRsNumber,
            issuesLink,
            issuesNumber,
        } = contributor

        const tr = document.createElement('tr')
        tr.id = username

        // avatar
        const tdAvatar = document.createElement('td')
        const avatar = document.createElement('img')
        avatar.src = avatarUrl
        avatar.height = '42'
        avatar.width = '42'
        tdAvatar.appendChild(avatar)
        tr.appendChild(tdAvatar)

        const tdUsername = document.createElement('td')

        // profileLink
        const profileLink = createLink(home, username)

        // rank
        const rank = document.createElement('span')
        rank.innerText = index + 1

        tdUsername.appendChild(profileLink)
        tdUsername.appendChild(rank)
        tr.appendChild(tdUsername)

        // empty td tag
        tr.appendChild(document.createElement('td'))

        // Open PRs
        const tdOpenPRs = document.createElement('td')
        const openPRs = createLink(openPRsLink, openPRsNumber, {
            className: openPRsNumber === 0 ? 'inactiveLink' : '',
        })
        tdOpenPRs.appendChild(openPRs)
        tr.appendChild(tdOpenPRs)

        // Merged PRs
        const tdMergedPRs = document.createElement('td')
        const mergedPRs = createLink(mergedPRsLink, mergedPRsNumber, {
            className: mergedPRsNumber === 0 ? 'inactiveLink' : '',
        })
        tdMergedPRs.appendChild(mergedPRs)
        tr.appendChild(tdMergedPRs)

        // Issues
        const tdIssues = document.createElement('td')
        const issues = createLink(issuesLink, issuesNumber, {
            className: issuesNumber === 0 ? 'inactiveLink' : '',
        })
        tdIssues.appendChild(issues)
        tr.appendChild(tdIssues)

        table.appendChild(tr)
    })
}

axios.get('/api/data').then((res) => {
    refreshTable(res.data)
})

axios.get('/api/config').then((res) => {
    const {
        organization,
        organizationGithubUrl,
        organizationHomepage,
    } = res.data
    const footer = document.querySelector('.footer .text-muted')
    footer.innerHTML = `
        <a href='${organizationHomepage}' target='_blank' rel='noopener noreferrer'>${organizationHomepage}</a> |
        <a href='${organizationGithubUrl}' target='_blank' rel='noopener noreferrer'>Github(${organization})</a>`.trim()
})

axios.get('/api/log').then((res) => {
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
