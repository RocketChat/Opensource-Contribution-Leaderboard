import './style/style.css'
import './style/bootstrap.css'
import axios from 'axios'

axios.get('/assets/data/data.json')
    .then( res => {
        const table = document.querySelector('table')
        const data = res.data
        Object.keys(data).forEach( contributor => {
            const tr = document.createElement('tr')
            
            // avatar
            const tdAvatar = document.createElement('td')
            const avatar = document.createElement('img')
            avatar.src = data[contributor].avatarUrl
            avatar.height = '42'
            avatar.width = '42'
            tdAvatar.appendChild(avatar)
            tr.appendChild(tdAvatar)

            // username
            const tdUsername = document.createElement('td')
            const username = document.createElement('a')
            username.href = data[contributor].home
            username.innerText = contributor
            tdUsername.appendChild(username)
            tr.appendChild(tdUsername)

            // empty td tag
            tr.appendChild(document.createElement('td'))

            // Open PRs
            const tdOpenPRs = document.createElement('td')
            const openPRs = document.createElement('a')
            openPRs.href = data[contributor].openPRsLink
            openPRs.innerText = data[contributor].openPRsNumber
            tdOpenPRs.appendChild(openPRs)
            tr.appendChild(tdOpenPRs)

            // Merged PRs
            const tdMergedPRs = document.createElement('td')
            const mergedPRs = document.createElement('a')
            mergedPRs.href = data[contributor].mergedPRsLink
            mergedPRs.innerText = data[contributor].mergedPRsNumber
            tdMergedPRs.appendChild(mergedPRs)
            tr.appendChild(tdMergedPRs)

            // Issues
            const tdIssues = document.createElement('td')
            const issues = document.createElement('a')
            issues.href = data[contributor].issuesLink
            issues.innerText = data[contributor].issuesNumber
            tdIssues.appendChild(issues)
            tr.appendChild(tdIssues)

            table.appendChild(tr)
        })
    })

