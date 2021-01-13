const jsonfile = require('jsonfile')

const contributors = jsonfile.readFileSync('../../assets/data/data.json')
const contributorsList = []

for (let contributor in contributors) {

    const username = contributor
    const { avatarUrl } = contributors[contributor]

    contributorsList.push( {username, avatarUrl} )
}

jsonfile.writeFileSync('../admindata.json', contributorsList, { spaces: 2 }, err => {
    if (err) {
        console.log(err)
    }
})