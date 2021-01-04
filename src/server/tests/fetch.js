import API from '../util/API'
import { readFileSync, writeFileSync } from 'jsonfile'

const contributors = readFileSync('../../assets/data/data.json')
const contributorsList = []

for (let contributor in contributors) {

    const username = contributor
    const { avatarUrl } = contributors[contributor]

    contributorsList.push( {username, avatarUrl} )
}

writeFileSync('../admindata.json', contributorsList, { spaces: 2 }, err => {
    if (err) {
        console.log(err)
    }
})