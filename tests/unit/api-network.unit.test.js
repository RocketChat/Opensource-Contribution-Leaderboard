const { describe, test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

// Load API module with a dummy config
process.env.LEADERBOARD_CONFIG_PATH = path.resolve(
    __dirname,
    '../e2e/fixtures/config.json'
)
const API = require(path.resolve(__dirname, '../../src/server/util/API'))

// Resolve axios from the same location API.js uses (src/server/node_modules/axios)
const axiosPath = require.resolve('axios', {
    paths: [path.resolve(__dirname, '../../src/server/util')]
})
const axios = require(axiosPath)

// Store original axios.get so we can restore it after each test
const originalGet = axios.get

afterEach(() => {
    axios.get = originalGet
})

// Helper: mock axios.get to return a given response for any URL
function mockAxiosGet(response) {
    axios.get = async () => response
}

// Helper: mock axios.get to reject with a given error
function mockAxiosGetError(error) {
    axios.get = async () => { throw error }
}

// Helper: mock axios.get to return different responses per URL pattern
function mockAxiosGetByUrl(mapping) {
    axios.get = async (url) => {
        for (const [pattern, response] of Object.entries(mapping)) {
            if (url.includes(pattern)) return response
        }
        throw new Error(`Unmocked URL: ${url}`)
    }
}

describe('API.checkRateLimit', () => {
    test('returns avatar_url on success', async () => {
        mockAxiosGet({ data: { avatar_url: 'https://example.com/avatar.png' } })
        const result = await API.checkRateLimit()
        assert.strictEqual(result, 'https://example.com/avatar.png')
    })

    test('returns empty object when API fails', async () => {
        mockAxiosGetError({ code: 'ECONNABORTED' })
        const result = await API.checkRateLimit()
        assert.deepStrictEqual(result, {})
    })
})

describe('API.getContributorAvatar', () => {
    test('returns avatar URL on success', async () => {
        mockAxiosGet({ data: { avatar_url: 'https://avatars.githubusercontent.com/u/123?v=4' } })
        const result = await API.getContributorAvatar('testuser')
        assert.strictEqual(result, 'https://avatars.githubusercontent.com/u/123?v=4')
    })

    test('returns empty string when API fails', async () => {
        mockAxiosGetError({ response: { data: { message: 'Not Found' } } })
        const result = await API.getContributorAvatar('nonexistent')
        assert.strictEqual(result, '')
    })

    test('returns empty string on timeout', async () => {
        mockAxiosGetError({ code: 'ECONNABORTED' })
        const result = await API.getContributorAvatar('testuser')
        assert.strictEqual(result, '')
    })
})

describe('API.getOpenPRsNumber', () => {
    test('returns total_count on success', async () => {
        mockAxiosGet({ data: { total_count: 42 } })
        const result = await API.getOpenPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, 42)
    })

    test('returns 0 for zero open PRs', async () => {
        mockAxiosGet({ data: { total_count: 0 } })
        const result = await API.getOpenPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, 0)
    })

    test('returns -1 when API fails', async () => {
        mockAxiosGetError({ response: { data: { message: 'Bad credentials' } } })
        const result = await API.getOpenPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, -1)
    })
})

describe('API.getMergedPRsNumber', () => {
    test('returns total_count on success', async () => {
        mockAxiosGet({ data: { total_count: 15 } })
        const result = await API.getMergedPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, 15)
    })

    test('returns -1 when API fails', async () => {
        mockAxiosGetError({ code: 'ECONNABORTED' })
        const result = await API.getMergedPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, -1)
    })
})

describe('API.getIssuesNumber', () => {
    test('returns total_count on success', async () => {
        mockAxiosGet({ data: { total_count: 7 } })
        const result = await API.getIssuesNumber('/search/issues?q=test')
        assert.strictEqual(result, 7)
    })

    test('returns -1 when API fails', async () => {
        mockAxiosGetError({ response: { data: { message: 'rate limit exceeded' } } })
        const result = await API.getIssuesNumber('/search/issues?q=test')
        assert.strictEqual(result, -1)
    })
})

describe('API.getContributorInfo', () => {
    test('returns full contributor info on success', async () => {
        mockAxiosGetByUrl({
            '/users/alice': { data: { avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' } },
            'is:Open': { data: { total_count: 3 } },
            'is:Merged': { data: { total_count: 5 } },
            'is:issue': { data: { total_count: 2 } },
        })

        const result = await API.getContributorInfo('TestOrg', 'alice', ['repo1'])

        assert.strictEqual(result.home, 'https://github.com/alice')
        assert.strictEqual(result.avatarUrl, 'https://avatars.githubusercontent.com/u/1?v=4')
        assert.strictEqual(result.openPRsNumber, 3)
        assert.strictEqual(result.mergedPRsNumber, 5)
        assert.strictEqual(result.issuesNumber, 2)
        assert.ok(result.openPRsLink.includes('alice'))
        assert.ok(result.openPRsLink.includes('repo1'))
        assert.ok(result.mergedPRsLink.includes('alice'))
        assert.ok(result.issuesLink.includes('alice'))
        // Verify chore exclusion label is in links
        assert.ok(result.openPRsLink.includes('-label:chore'))
        assert.ok(result.mergedPRsLink.includes('-label:chore'))
        assert.ok(result.issuesLink.includes('-label:chore'))
    })

    test('includes multiple repos in search URLs', async () => {
        mockAxiosGetByUrl({
            '/users/bob': { data: { avatar_url: 'https://example.com/bob.png' } },
            'is:Open': { data: { total_count: 1 } },
            'is:Merged': { data: { total_count: 2 } },
            'is:issue': { data: { total_count: 0 } },
        })

        const result = await API.getContributorInfo('Org', 'bob', ['repo1', 'repo2'])

        assert.ok(result.openPRsLink.includes('repo:Org/repo1'))
        assert.ok(result.openPRsLink.includes('repo:Org/repo2'))
        assert.ok(result.mergedPRsLink.includes('repo:Org/repo1'))
        assert.ok(result.mergedPRsLink.includes('repo:Org/repo2'))
        assert.ok(result.issuesLink.includes('repo:Org/repo1'))
        assert.ok(result.issuesLink.includes('repo:Org/repo2'))
    })

    test('returns -1 counts when API calls fail', async () => {
        axios.get = async (url) => {
            if (url.includes('/users/')) {
                return { data: { avatar_url: '' } }
            }
            throw { response: { data: { message: 'API rate limit exceeded' } } }
        }

        const result = await API.getContributorInfo('Org', 'failuser', ['repo1'])

        assert.strictEqual(result.avatarUrl, '')
        assert.strictEqual(result.openPRsNumber, -1)
        assert.strictEqual(result.mergedPRsNumber, -1)
        assert.strictEqual(result.issuesNumber, -1)
    })

    test('handles empty includedRepositories array', async () => {
        mockAxiosGetByUrl({
            '/users/alice': { data: { avatar_url: 'https://example.com/a.png' } },
            'is:Open': { data: { total_count: 1 } },
            'is:Merged': { data: { total_count: 2 } },
            'is:issue': { data: { total_count: 3 } },
        })

        const result = await API.getContributorInfo('Org', 'alice', [])

        assert.strictEqual(result.openPRsNumber, 1)
        assert.strictEqual(result.mergedPRsNumber, 2)
        assert.strictEqual(result.issuesNumber, 3)
        // With empty repos, URLs should not contain any repo: filter
        assert.ok(!result.openPRsLink.includes('repo:'))
        assert.ok(!result.mergedPRsLink.includes('repo:'))
        assert.ok(!result.issuesLink.includes('repo:'))
        // But should still have chore exclusion
        assert.ok(result.openPRsLink.includes('-label:chore'))
    })

    test('uses startDate from config in URLs', async () => {
        let capturedUrls = []
        axios.get = async (url) => {
            capturedUrls.push(url)
            if (url.includes('/users/')) return { data: { avatar_url: 'https://example.com/a.png' } }
            return { data: { total_count: 0 } }
        }

        await API.getContributorInfo('Org', 'alice', ['repo1'])

        // Config fixture has startDate: '2024-12-01'
        const searchUrls = capturedUrls.filter(u => u.includes('/search/'))
        for (const url of searchUrls) {
            assert.ok(url.includes('2024-12-01'), `URL should contain startDate: ${url}`)
        }
    })
})

describe('API.getRepositories', () => {
    test('returns repos from a single page (< 100 repos)', async () => {
        mockAxiosGet({
            data: [
                { name: 'Rocket.Chat' },
                { name: 'fuselage' },
                { name: 'docs' },
            ],
        })

        const result = await API.getRepositories('RocketChat')
        // getRepositories returns results.push(repositories) so it's nested
        assert.deepStrictEqual(result, [['Rocket.Chat', 'fuselage', 'docs']])
    })

    test('paginates when first page has 100+ repos', async () => {
        const page1 = Array.from({ length: 100 }, (_, i) => ({ name: `repo-${i}` }))
        const page2 = [{ name: 'repo-100' }, { name: 'repo-101' }]
        let callNum = 0

        axios.get = async (_url) => {
            callNum++
            if (callNum === 1) return { data: page1 }
            return { data: page2 }
        }

        const result = await API.getRepositories('TestOrg')
        assert.strictEqual(result.length, 2) // two pages
        assert.strictEqual(result[0].length, 100)
        assert.strictEqual(result[1].length, 2)
        assert.strictEqual(result[1][1], 'repo-101')
    })

    test('returns empty string pages when API fails', async () => {
        mockAxiosGetError({ code: 'ECONNABORTED' })

        const result = await API.getRepositories('FailOrg')
        // fetchRepositories returns '' on failure, length <= 99 stops pagination
        assert.deepStrictEqual(result, [''])
    })

    test('exactly 100 repos triggers another page fetch', async () => {
        const page1 = Array.from({ length: 100 }, (_, i) => ({ name: `repo-${i}` }))
        const page2 = [] // empty page means no more repos
        let callNum = 0

        axios.get = async (_url) => {
            callNum++
            if (callNum === 1) return { data: page1 }
            return { data: page2 }
        }

        const result = await API.getRepositories('TestOrg')
        assert.strictEqual(result.length, 2) // fetched 2 pages
        assert.strictEqual(result[0].length, 100)
        assert.strictEqual(result[1].length, 0) // empty second page
    })

    test('returns empty result for org with no repos', async () => {
        mockAxiosGet({ data: [] })

        const result = await API.getRepositories('EmptyOrg')
        assert.deepStrictEqual(result, [[]])
    })
})

describe('API internal error handling', () => {
    test('handles Bad credentials error without crashing', async () => {
        mockAxiosGetError({ response: { data: { message: 'Bad credentials' } } })
        const result = await API.getContributorAvatar('testuser')
        assert.strictEqual(result, '')
    })

    test('handles ECONNABORTED timeout', async () => {
        mockAxiosGetError({ code: 'ECONNABORTED' })
        const result = await API.getContributorAvatar('testuser')
        assert.strictEqual(result, '')
    })

    test('handles generic error with response message', async () => {
        mockAxiosGetError({ response: { data: { message: 'API rate limit exceeded' } } })
        const result = await API.getOpenPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, -1)
    })

    test('handles error without response object', async () => {
        mockAxiosGetError(new Error('Network error'))
        const result = await API.getMergedPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, -1)
    })

    test('handles error with response but missing message key', async () => {
        mockAxiosGetError({ response: { data: {} } })
        const result = await API.getOpenPRsNumber('/search/issues?q=test')
        assert.strictEqual(result, -1)
    })

    test('handles error with response but null data throws TypeError', async () => {
        // Documents current behavior: null data.message causes crash in get().
        // API.get() assumes err.response.data is an object when err.response exists.
        mockAxiosGetError({ response: { data: null } })
        await assert.rejects(
            () => API.getIssuesNumber('/search/issues?q=test'),
            TypeError
        )
    })
})

describe('API.getContributorInfo - edge cases', () => {
    test('username with hyphens produces correct home URL', async () => {
        mockAxiosGetByUrl({
            '/users/my-cool-user': { data: { avatar_url: 'https://example.com/a.png' } },
            'is:Open': { data: { total_count: 1 } },
            'is:Merged': { data: { total_count: 2 } },
            'is:issue': { data: { total_count: 3 } },
        })

        const result = await API.getContributorInfo('Org', 'my-cool-user', ['repo1'])
        assert.strictEqual(result.home, 'https://github.com/my-cool-user')
        assert.strictEqual(result.openPRsNumber, 1)
        assert.strictEqual(result.mergedPRsNumber, 2)
        assert.strictEqual(result.issuesNumber, 3)
    })

    test('username with underscores produces correct home URL', async () => {
        mockAxiosGetByUrl({
            '/users/my_user_123': { data: { avatar_url: 'https://example.com/a.png' } },
            'is:Open': { data: { total_count: 0 } },
            'is:Merged': { data: { total_count: 0 } },
            'is:issue': { data: { total_count: 0 } },
        })

        const result = await API.getContributorInfo('Org', 'my_user_123', ['repo1'])
        assert.strictEqual(result.home, 'https://github.com/my_user_123')
    })

    test('partial failure: avatar succeeds but all search calls fail', async () => {
        axios.get = async (url) => {
            if (url.includes('/users/')) {
                return { data: { avatar_url: 'https://example.com/ok.png' } }
            }
            throw { response: { data: { message: 'rate limit exceeded' } } }
        }

        const result = await API.getContributorInfo('Org', 'alice', ['repo1'])
        assert.strictEqual(result.avatarUrl, 'https://example.com/ok.png')
        assert.strictEqual(result.openPRsNumber, -1)
        assert.strictEqual(result.mergedPRsNumber, -1)
        assert.strictEqual(result.issuesNumber, -1)
    })

    test('partial failure: avatar and open PRs succeed, merged and issues fail', async () => {
        axios.get = async (url) => {
            if (url.includes('/users/')) {
                return { data: { avatar_url: 'https://example.com/a.png' } }
            }
            if (url.includes('is:Open')) {
                return { data: { total_count: 5 } }
            }
            throw { response: { data: { message: 'secondary rate limit' } } }
        }

        const result = await API.getContributorInfo('Org', 'bob', ['repo1'])
        assert.strictEqual(result.avatarUrl, 'https://example.com/a.png')
        assert.strictEqual(result.openPRsNumber, 5)
        assert.strictEqual(result.mergedPRsNumber, -1)
        assert.strictEqual(result.issuesNumber, -1)
    })

    test('chore exclusion label is included in API search URLs', async () => {
        let capturedUrls = []
        axios.get = async (url) => {
            capturedUrls.push(url)
            if (url.includes('/users/')) return { data: { avatar_url: 'https://example.com/a.png' } }
            return { data: { total_count: 0 } }
        }

        await API.getContributorInfo('Org', 'alice', ['repo1'])

        const searchUrls = capturedUrls.filter(u => u.includes('/search/'))
        assert.strictEqual(searchUrls.length, 3, 'should have 3 search API calls')
        for (const url of searchUrls) {
            assert.ok(url.includes('-label:chore'), `chore exclusion missing in: ${url}`)
        }
    })
})

describe('API.getRepositories - pagination edge cases', () => {
    test('handles three pages of pagination', async () => {
        const page1 = Array.from({ length: 100 }, (_, i) => ({ name: `repo-${i}` }))
        const page2 = Array.from({ length: 100 }, (_, i) => ({ name: `repo-${100 + i}` }))
        const page3 = [{ name: 'repo-200' }, { name: 'repo-201' }]
        let callNum = 0

        axios.get = async () => {
            callNum++
            if (callNum === 1) return { data: page1 }
            if (callNum === 2) return { data: page2 }
            return { data: page3 }
        }

        const result = await API.getRepositories('BigOrg')
        assert.strictEqual(result.length, 3)
        assert.strictEqual(result[0].length, 100)
        assert.strictEqual(result[1].length, 100)
        assert.strictEqual(result[2].length, 2)
    })

    test('single repo returned as single-element array', async () => {
        mockAxiosGet({ data: [{ name: 'only-repo' }] })
        const result = await API.getRepositories('SmallOrg')
        assert.deepStrictEqual(result, [['only-repo']])
    })
})
