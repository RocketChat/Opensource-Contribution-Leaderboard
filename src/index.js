import './style/style.css'
import './style/bootstrap.css'
import axios from 'axios'
import moment, { relativeTimeRounding } from 'moment'
import { relative } from 'path';
import { io } from 'socket.io-client';

let tableData = {}, filterUsername = "", startDate = new Date(0), endDate = new Date();

const filterByUsername = () => {
    filterUsername = document.getElementById('username-filter').value;
    refreshTable();
}

document.getElementById('username-filter').onchange = filterByUsername;

function startOfWeek(date) {
    const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

const filterByDates = (event) => {
    const currBox = event.srcElement;
    if(currBox.checked) {
        const checkboxes = document.getElementsByName('date-filter');
        checkboxes.forEach((checkbox) => {
            if(currBox != checkbox)
                checkbox.checked = false;
        });
        switch(currBox.value) {
            case '1':
                startDate = new Date();
                break;
            case '2':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 1);
                endDate = startDate;
                break;
            case '3':
                startDate = startOfWeek(new Date());
                endDate = new Date();
                break;
            case '4':
                startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                endDate = new Date();
                break;
            case '5':
                startDate = new Date(new Date().getFullYear(), 0, 1);
                endDate = new Date();
                break;
            case '6':
                document.getElementById('custom-date-container').style.display = "block";
                return;
        }
        document.getElementById('start-date').value = null;
        document.getElementById('end-date').value = null;
        document.getElementById('custom-date-container').style.display = "none";
        return refreshTable();
    } 
    startDate = new Date(0);
    endDate = new Date();
    if(currBox.value == '6'){
        document.getElementById('start-date').value = null;
        document.getElementById('end-date').value = null;
        document.getElementById('custom-date-container').style.display = "none";
    }
    refreshTable();
}

const setStartDate = (event) => {
    startDate = new Date(event.srcElement.value);
}

const setEndDate = (event) => {
    endDate = new Date(event.srcElement.value);
}

(function() {
    const checkboxes = document.getElementsByName('date-filter');
    checkboxes.forEach((checkbox) => {
        checkbox.onclick = filterByDates;
    });
    document.getElementById('start-date').onchange = setStartDate;
    document.getElementById('end-date').onchange = setEndDate;
})();

function refreshTable(){
    const table = document.querySelector('table')
    const data = tableData
    const list = Object.keys(data)
    let contributors = []
    list.forEach( username => {
        if((filterUsername == "") || (username.toUpperCase().match(`^${filterUsername.toUpperCase()}`))){
            contributors.push({
                username,
                mergedPRsNumber: data[username].mergedPRsNumber,
                openPRsNumber: data[username].openPRsNumber,
                issuesNumber: data[username].issuesNumber
            })
        }
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
        openPRs.href = data[contributor.username].openPRsLink
        openPRs.innerText = data[contributor.username].openPRsNumber
        tdOpenPRs.appendChild(openPRs)
        tr.appendChild(tdOpenPRs)

        // Merged PRs
        const tdMergedPRs = document.createElement('td')
        const mergedPRs = document.createElement('a')
        mergedPRs.href = data[contributor.username].mergedPRsLink
        mergedPRs.innerText = data[contributor.username].mergedPRsNumber
        tdMergedPRs.appendChild(mergedPRs)
        tr.appendChild(tdMergedPRs)

        // Issues
        const tdIssues = document.createElement('td')
        const issues = document.createElement('a')
        issues.href = data[contributor.username].issuesLink
        issues.innerText = data[contributor.username].issuesNumber
        tdIssues.appendChild(issues)
        tr.appendChild(tdIssues)

        table.appendChild(tr)
    })
}

axios.get('/api/data')
    .then( res => {
        tableData = res.data;
        refreshTable();
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
    tableData = data;
    refreshTable();
});
    