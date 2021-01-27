/*global layer*/
import './style/style.css'
import axios from 'axios'
import Noty from 'noty'
import './style/noty.css'

const submit = document.querySelector('.submit')
const passwordInput = document.querySelector('[type=password]')
let password = '', repositories = [], includedRepositories = []

submit.addEventListener('click', () => {
    const passwd = document.querySelector('[type=password]').value
    const loading = document.querySelector('.loading')

    password = passwd // store the auth token

    if (passwd === '') {
        msgError('You input is empty!')
        return
    }

    loading.classList.remove('hide')

    axios.post('/api/login', {
        token: password
    }).then( res => {
        let { code, delay, contributors, startDate, endDate, endDateCheckbox:endDateCheckboxValue } = res.data
        if (code == 1) {
            msgError('The password is incorrect!')
        }
        if (code == 0) {
            mgsSuccess('Welcome, Administrator!')
            const loginPanel = document.querySelector('.login-panel')
            const configPanel = document.querySelector('.config-panel')
            const intervalInput = document.querySelector('.set-interval')
            const table = document.querySelector('.contributors-list')
            const totalTd = document.querySelector('td.total')
            const startDateInput = document.querySelector('.set-start-date')
            const endDateInput = document.querySelector('.set-end-date')
            const endDateCheckbox = document.querySelector('.set-end-date-checkbox')

            loginPanel.classList.add('hide') // hide loading animation
            configPanel.classList.remove('hide')
            intervalInput.setAttribute('placeholder', delay)
            startDateInput.setAttribute('value', startDate)
            endDateInput.setAttribute('value', endDate)
            endDateCheckbox.checked = endDateCheckboxValue

            contributors = sortByAlphabet(contributors, 'username')

            totalTd.innerHTML = 'Total: ' + contributors.length

            contributors.forEach( contributor => {
                const { username, avatarUrl } = contributor
                const usernameLink = 'https://github.com/' + contributor.username
                const tr = document.createElement('tr')

                const avatarTd = document.createElement('td')
                const avatarImg = document.createElement('img')
                avatarImg.src = avatarUrl
                avatarImg.height = 42
                avatarImg.width = 42
                avatarTd.appendChild(avatarImg)

                const usernameTd = document.createElement('td')
                usernameTd.innerHTML = `<a href="${usernameLink}">${username}</a>`

                const removeTd = document.createElement('td')
                removeTd.innerHTML = `<div class="button remove" value="${username}">Remove</div>`

                tr.appendChild(avatarTd)
                tr.appendChild(usernameTd)
                tr.appendChild(removeTd)
                table.appendChild(tr)
            })

            const removeButtons = document.querySelectorAll('.button.remove')
            removeButtons.forEach( removeButton => {
                removeButton.addEventListener('click', e => {
                    removeContributor(e, contributors, totalTd)
                })
            })

            //Get Repositories
            axios.get('/api/getRepositories').then( res => {
                repositories = res.data.repositories
                includedRepositories = res.data.includedRepositories
                if (repositories) {
                    var repositoriesList = document.querySelector('.repositories-list')
                    repositories.forEach((repoName, index) => {
                        const repoRow = document.createElement('tr')

                        const checkboxTd = document.createElement('td')
                        var checkbox = document.createElement('input') 
                        
                        // Assigning the attributes 
                        // to created checkbox 
                        checkbox.type = 'checkbox' 
                        checkbox.name = repoName 
                        checkbox.value = repoName 
                        checkbox.id = 'repo'+index 
                        checkbox.checked = includedRepositories.includes(repoName)? true: false 

                        checkboxTd.appendChild(checkbox)
                        
                        const repositoryTd = document.createElement('td')
                        repositoryTd.innerHTML = repoName
                        repositoryTd.style.textAlign = 'right'

                        repoRow.appendChild(repositoryTd)
                        repoRow.appendChild(checkboxTd)
                        repositoriesList.appendChild(repoRow)
                    })

                } else {
                    msgError('Unexpected error')
                }
            })

            // Set includedRepositories
            document.querySelectorAll('.inclusion-exclusion-save-button.colored-button').forEach((setIncludedRepositoriesButton) => {
                setIncludedRepositoriesButton.addEventListener('click', () => {
                    let includedRepositories = []
                    repositories.forEach((repoName, index) => {
                        var checkbox = document.querySelector('#repo'+index)
                        if(checkbox.checked)
                        {
                            includedRepositories.push(checkbox.name)
                        }
                    })

                    axios.post('/api/setIncludedRepositories', {
                        token: password,
                        includedRepositories
                    }).then( res => {
                        const { message } = res.data

                        if (message === 'Success') {
                            mgsSuccess('Success! Selected Repositories have been updated!')
                        } else {
                            msgError('Unexpected error')
                        }
                    })
                })
            })
            
            // Show Inclusion/Exclusion
            const showIncludeExclude = document.querySelector('.include-exclude-page-button.colored-button')
            showIncludeExclude.addEventListener('click', () => {
                const inclusionExclusionPage = document.querySelector('.inclusion-exclusion')
                const configPanel = document.querySelector('.config-panel')
                configPanel.classList.add('hide')
                inclusionExclusionPage.classList.remove('hide')
            })

            //Hide Inclusion/Exclusion
            const hideIncludeExclude = document.querySelector('.inclusion-exclusion-back-button.colored-button')
            hideIncludeExclude.addEventListener('click', () => {
                const inclusionExclusionPage = document.querySelector('.inclusion-exclusion')
                const configPanel = document.querySelector('.config-panel')
                inclusionExclusionPage.classList.add('hide')
                configPanel.classList.remove('hide')
            })

            // Set startDate value
            const setStartDateButton = document.querySelector('.set-start-date-button.button')
            setStartDateButton.addEventListener('click', () => {
                const startDate = document.querySelector('.set-start-date').value

                if (startDate === '') {
                    msgError('Please select date')
                    return
                }

                axios.post('/api/setStartDate', {
                    token: password,
                    startDate
                }).then( res => {
                    const { message } = res.data

                    if (message === 'Success') {
                        mgsSuccess('Success')
                    } else {
                        msgError('Unexpected error')
                    }
                })
            })

            //set endDate
            const setendDateButton = document.querySelector('.set-end-date-button.button')
            setendDateButton.addEventListener('click', () => {
                const endDate = document.querySelector('.set-end-date').value

                if (endDate === '') {
                    msgError('Please select date')
                    return
                }

                axios.post('/api/setEndDate', {
                    token: password,
                    endDate
                }).then( res => {
                    const { message } = res.data

                    if (message === 'Success') {
                        mgsSuccess('Success')
                    } else {
                        msgError('Unexpected error')
                    }
                })
            })

            const setEndDateCheckbox = document.querySelector('.set-end-date-checkbox')
            setEndDateCheckbox.addEventListener('click', () =>{
                const checkboxValue = setEndDateCheckbox.checked

                if (typeof checkboxValue !== 'boolean') {
                    msgError('Please select date')
                    return
                }

                axios.post('/api/setEndDateCheckbox', {
                    token: password,
                    checkboxValue: checkboxValue
                }).then( res => {
                    const { message } = res.data
                    if (message === 'Success') {
                        mgsSuccess('Success')
                    } else {
                        msgError('Unexpected error')
                    }
                })
            })

            // Set interval value
            const setIntervalButton = document.querySelector('.set-interval-button.button')
            setIntervalButton.addEventListener('click', () => {
                const interval = document.querySelector('.set-interval').value

                if (interval === '') {
                    msgError('your input is empty')
                    return
                }

                if (interval < 10) {
                    msgError('Interval cannot be less than 10 seconds')
                    return
                }

                axios.post('/api/setInterval', {
                    token: password,
                    interval
                }).then( res => {
                    const { message } = res.data

                    if (message === 'Success') {
                        mgsSuccess('Success')
                        intervalInput.value = ''
                        intervalInput.setAttribute('placeholder', interval)
                    } else {
                        msgError('Unexpected error')
                    }
                })
            })

            // Add Github contributor
            const addContributorButton = document.querySelector('.add-contributor-button.button')

            addContributorButton.addEventListener('click', () => {
                const usernameField = document.querySelector('.add-contributor')
                const username = usernameField.value
                if (username === '') {
                    msgError('your input is empty')
                    return
                }

                loading.classList.remove('hide')
                axios.post('/api/add', {
                    token: password,
                    username: username
                }).then( res => {
                    const { message } = res.data

                    if (message === 'Success') {
                        mgsSuccess(`${username} has been added`)

                        contributors.push({username, avatarUrl: res.data.avatarUrl})
                        contributors = sortByAlphabet(contributors, 'username')

                        let insertPos = 0

                        contributors.forEach(  (contributor, index) => {
                            if (contributor.username === username) {
                                insertPos = index                               
                            }
                        })
                        
                        totalTd.innerHTML = 'Total: ' + contributors.length

                        const { avatarUrl } = contributors[insertPos]
                        const usernameLink = 'https://github.com/' + username
                        const tr = document.createElement('tr')
        
                        const avatarTd = document.createElement('td')
                        const avatarImg = document.createElement('img')
                        avatarImg.src = avatarUrl
                        avatarImg.height = 42
                        avatarImg.width = 42
                        avatarTd.appendChild(avatarImg)
        
                        const usernameTd = document.createElement('td')
                        usernameTd.innerHTML = `<a href="${usernameLink}">${username}</a>`
                        
                        const removeTd = document.createElement('td')
                        removeTd.innerHTML = `<div class="button remove" value="${username}">Remove</div>`
                        removeTd.firstChild.addEventListener('click', e => {
                            removeContributor(e, contributors, totalTd)
                        })
        
                        tr.appendChild(avatarTd)
                        tr.appendChild(usernameTd)
                        tr.appendChild(removeTd)

                        $('tr')[insertPos].after(tr)

                        usernameField.value = ''
                    } else {
                        msgError(message)
                    }
                    loading.classList.add('hide')
                })
            })
        }
        loading.classList.add('hide')
    })
})

passwordInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        submit.dispatchEvent(new Event('click'))
    }
})

function msgError(msg) {
    new Noty({
        type: 'error',
        theme: 'mint',
        text: msg,
        timeout: 2500,
        progressBar: true,
        animation: {
            open: 'wbBounceIn',
            close: 'wbBounceOut'
        },
        layout: 'topCenter'
    }).show()
}

function mgsSuccess(msg) {
    new Noty({
        type: 'success',
        theme: 'mint',
        text: msg,
        timeout: 1000,
        progressBar: true,
        animation: {
            open: 'wbBounceIn',
            close: 'wbBounceOut'
        },
        layout: 'topCenter'
    }).show()
}

function removeContributor(e, contributors, totalTd) {
    const username = e.target.getAttribute('value')

    layer.confirm(`${username} will be removed from the dashboard`, {
        title: 'Info',
        btn: ['Yes','Cancel']
    }, function(){
        axios.post('/api/remove', {
            token: password,
            username: username
        }).then( res => {
            const { message } = res.data
            
            if(message === 'Success') {
                mgsSuccess(`${username} has been removed`)
                e.target.parentNode.parentNode.remove()

                contributors.forEach( (contributor, index, object) => {
                    if (contributor.username == username) {
                        object.splice(index, 1)
                    }
                })
                totalTd.innerHTML = 'Total: ' + contributors.length

                layer.closeAll('dialog')
            } else {
                msgError(message)
            }
        })
    })
}

function sortByAlphabet(array, key) {
    array.sort( (a, b) => {
        let x = a[key].toUpperCase()
        let y = b[key].toUpperCase()

        if (x === y) return 0

        if ( x > y ) {
            return 1
        } else {
            return -1
        }
    })
    return array
}