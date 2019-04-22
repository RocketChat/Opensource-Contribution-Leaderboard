import './style/style.css'

const container = document.createElement('div')

container.classList.add('container')
container.innerText = require('./assets/data/data.json').data

document.body.appendChild(container)