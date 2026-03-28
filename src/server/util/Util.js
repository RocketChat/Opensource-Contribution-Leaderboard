function post(req, callback) {
    if(req.method === 'POST') {
        let body = ''
        
        req.on('data', chunk => {
            body += chunk.toString()
        })

        req.on('end', () => {
            try {
                callback(JSON.parse(body))
            } catch (ex) {
                return
            }
        })
    }
}

function renderGoodFirstIssues(issues){
    const container = document.getElementById('goodFirstIssues')
    container.innerHTML ='<h2> Good First Issues</h2>'

    issues.forEach(issue => {
        const div = document.createElement('div')
        div.className = 'issue-card'
        div.innerHTML = `
            <h3>${issue.title}</h3>
            <p> ${issue.user.login}</p>
            <a  href="${issue.html_url}" target ="_blank"> View Issue</a>
        `
        container.appendChild(div)
    })
}

module.exports = {
    post,
    renderGoodFirstIssues
}
