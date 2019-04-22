const data = require('../../assets/data/data.json')
const contributors = Object.keys(data)

contributors.forEach( contributor => {
    console.log(`"${contributor}",`)
})

console.log(contributors.length)