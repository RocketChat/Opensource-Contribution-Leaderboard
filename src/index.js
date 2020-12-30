import './style/style.css'
import './style/bootstrap.css'
import axios from 'axios'
import moment, { relativeTimeRounding } from 'moment'
import { relative } from 'path';
import { io } from 'socket.io-client';

// Make year dynamic once frontend code gets ready
const year = 2020
function refreshTable(newData){
    const table = document.querySelector('table')
    const data = newData
    const list = Object.keys(data)
    let contributors = []
    list.forEach( username => {
        contributors.push({
            username,
            mergedPRsNumber: data[username].mergedPRsCreatedTimes.filter((created_time)=> {
                return (new Date(created_time).getFullYear() == year)
            }).length,
            openPRsNumber: data[username].openPRsCreatedTimes.filter((created_time)=> {
                return (new Date(created_time).getFullYear() == year)
            }).length,
            issuesNumber: data[username].issuesCreatedTimes.filter((created_time)=> {
                return (new Date(created_time).getFullYear() == year)
            }).length
        })
    })

    // reder total contributor numbers
    const totalNumbers = list.length
    const totalEm = document.querySelector('.total')
    totalEm.innerText = 'Total: ' + totalNumbers

    contributors = contributors.sort( (a, b) => {
        if ( a.mergedPRsNumber < b.mergedPRsNumber ){
            return 1;
        }
        if ( a.mergedPRsNumber > b.mergedPRsNumber ){
            return -1;
        }
        if ( a.openPRsNumber < b.openPRsNumber ){
            return 1;
        }
        if ( a.openPRsNumber > b.openPRsNumber ){
            return -1;
        }
        if ( a.issuesNumber < b.issuesNumber ){
            return 1;
        }
        if ( a.issuesNumber > b.issuesNumber ){
            return -1;
        }
        return 0;
    })
    table.innerHTML = table.rows[0].innerHTML;
    contributors.forEach( contributor => {
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
        username.href = data[contributor.username].home
        username.innerText = contributor.username
        tr.id = contributor.username
        tdUsername.appendChild(username)
        tr.appendChild(tdUsername)

        // empty td tag
        tr.appendChild(document.createElement('td'))

        // Open PRs
        const tdOpenPRs = document.createElement('td')
        const openPRs = document.createElement('a')
        openPRs.href = data[contributor.username].openPRsLink+`+created:>=${year}-01-01`
        openPRs.innerText = data[contributor.username].openPRsCreatedTimes.filter((created_time)=> {
            return (new Date(created_time).getFullYear() == year)
        }).length
        console.log("Inner Text = ", openPRs.innerText)
        tdOpenPRs.appendChild(openPRs)
        tr.appendChild(tdOpenPRs)

        // Merged PRs
        const tdMergedPRs = document.createElement('td')
        const mergedPRs = document.createElement('a')
        mergedPRs.href = data[contributor.username].mergedPRsLink+`+created:>=${year}-01-01`
        mergedPRs.innerText = data[contributor.username].mergedPRsCreatedTimes.filter((created_time)=> {
            return (new Date(created_time).getFullYear() == year)
        }).length
        tdMergedPRs.appendChild(mergedPRs)
        tr.appendChild(tdMergedPRs)

        // Issues
        const tdIssues = document.createElement('td')
        const issues = document.createElement('a')
        issues.href = data[contributor.username].issuesLink+`+created:>=${year}-01-01`
        issues.innerText = data[contributor.username].issuesCreatedTimes.filter((created_time)=> {
            return (new Date(created_time).getFullYear() == year)
        }).length
        tdIssues.appendChild(issues)
        tr.appendChild(tdIssues)

        table.appendChild(tr)
    })
}

axios.get('/api/data')
    .then( res => {
        refreshTable(res.data);
    })

axios.get('/api/config')
    .then( res => {
        const {organization, organizationGithubUrl, organizationHomepage} = res.data
        const footer = document.querySelector('.footer .text-muted')
        footer.innerHTML = `
        <a href="${organizationHomepage}" target="_blank" rel="noopener noreferrer">${organizationHomepage}</a> |
        <a href="${organizationGithubUrl}" target="_blank" rel="noopener noreferrer">Github(${organization})</a>`.trim()
    })

axios.get('/api/log')
    .then( res => {
        const {starttime, endtime} = res.data
        const relativeTime = moment(new Date(endtime)).from(new Date(starttime))
        console.log(relativeTime)
        if(relativeTime.match(/[\da]+.+/) !== null) {
            const lastupdate = document.querySelector('.lastupdate')
            lastupdate.innerText = `Last Updated: ${relativeTime.match(/[\da]+.+/)[0]} ago`
        }
    })

const socket = io();
socket.on('refresh table', (data) => {
    refreshTable(data);
});
    