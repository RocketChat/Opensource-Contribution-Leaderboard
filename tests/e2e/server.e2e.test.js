const { describe, test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const {
    startServer,
    stopServer,
    getTmpDir,
    TEST_PORT,
    TEST_ADMIN_PASSWORD,
} = require('./setup')
const { request } = require('./helpers')
const path = require('path')

const EXPECTED = require(path.resolve(__dirname, 'fixtures/expected-snapshot.json'))
const EXPECTED_STATS = EXPECTED.stats

describe('Server E2E Tests', () => {
    before(async () => {
        await startServer()
    })

    after(async () => {
        await stopServer()
    })

    describe('GET /data', () => {
        test('returns the complete dataset with all 251 contributors', async () => {
            const res = await request(TEST_PORT, '/data')
            assert.strictEqual(res.status, 200)
            assert.strictEqual(typeof res.body, 'object')
            assert.strictEqual(Object.keys(res.body).length, 251)
        })

        test('sets Cache-Control: no-store header', async () => {
            const res = await request(TEST_PORT, '/data')
            assert.strictEqual(res.headers['cache-control'], 'no-store')
        })

        test('contains known contributor dhairyashiil with correct stats', async () => {
            const res = await request(TEST_PORT, '/data')
            const contributor = res.body['dhairyashiil']
            assert.deepStrictEqual(contributor, EXPECTED.contributors.dhairyashiil)
        })

        test('contains zero-contribution user PavanTaddi9', async () => {
            const res = await request(TEST_PORT, '/data')
            const contributor = res.body['PavanTaddi9']
            assert.deepStrictEqual(contributor, EXPECTED.contributors.PavanTaddi9)
        })

        test('every contributor has the required fields', async () => {
            const res = await request(TEST_PORT, '/data')
            const requiredFields = [
                'home',
                'avatarUrl',
                'openPRsNumber',
                'openPRsLink',
                'mergedPRsNumber',
                'mergedPRsLink',
                'issuesNumber',
                'issuesLink',
            ]
            for (const [username, data] of Object.entries(res.body)) {
                for (const field of requiredFields) {
                    assert.ok(field in data, `${username} missing field: ${field}`)
                }
            }
        })
    })

    describe('GET /config', () => {
        test('returns organization metadata', async () => {
            const res = await request(TEST_PORT, '/config')
            assert.strictEqual(res.status, 200)
            assert.deepStrictEqual(res.body, {
                organization: 'RocketChat',
                organizationHomepage: 'https://rocket.chat/',
                organizationGithubUrl: 'https://github.com/RocketChat',
            })
        })

        test('does not leak authToken or adminPassword', async () => {
            const res = await request(TEST_PORT, '/config')
            assert.ok(!res.raw.includes('authToken'))
            assert.ok(!res.raw.includes('adminPassword'))
            assert.ok(!res.raw.includes('fake-token'))
            assert.ok(!res.raw.includes(TEST_ADMIN_PASSWORD))
        })
    })

    describe('GET /log', () => {
        test('returns log object', async () => {
            const res = await request(TEST_PORT, '/log')
            assert.strictEqual(res.status, 200)
            assert.deepStrictEqual(res.body, { starttime: 0, endtime: 0 })
        })

        test('sets Cache-Control: no-store header', async () => {
            const res = await request(TEST_PORT, '/log')
            assert.strictEqual(res.headers['cache-control'], 'no-store')
        })
    })

    describe('GET /stats', () => {
        test('returns correct aggregate stats computed from real data', async () => {
            const res = await request(TEST_PORT, '/stats')
            assert.strictEqual(res.status, 200)
            assert.deepStrictEqual(res.body, EXPECTED_STATS)
        })

        test('totalContributors matches number of keys in /data', async () => {
            const dataRes = await request(TEST_PORT, '/data')
            const statsRes = await request(TEST_PORT, '/stats')
            assert.strictEqual(
                statsRes.body.totalContributors,
                Object.keys(dataRes.body).length
            )
        })

        test('rejects non-GET requests', async () => {
            const res = await request(TEST_PORT, '/stats', { method: 'POST' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })
    })

    describe('GET /rank', () => {
        test('returns sorted list of all contributors (default = mergedprs)', async () => {
            const res = await request(TEST_PORT, '/rank')
            assert.strictEqual(res.status, 200)
            assert.deepStrictEqual(res.body, { ranks: EXPECTED.ranks.mergedprs })
        })

        test('ranking by mergedprs matches full expected order', async () => {
            const res = await request(TEST_PORT, '/rank?parameter=mergedprs')
            assert.deepStrictEqual(res.body, { ranks: EXPECTED.ranks.mergedprs })
        })

        test('ranking by openprs matches full expected order', async () => {
            const res = await request(TEST_PORT, '/rank?parameter=openprs')
            assert.deepStrictEqual(res.body, { ranks: EXPECTED.ranks.openprs })
        })

        test('ranking by issues matches full expected order', async () => {
            const res = await request(TEST_PORT, '/rank?parameter=issues')
            assert.deepStrictEqual(res.body, { ranks: EXPECTED.ranks.issues })
        })

        test('returns rank for a known contributor by username', async () => {
            const res = await request(TEST_PORT, '/rank?username=dhairyashiil')
            assert.deepStrictEqual(res.body, { username: 'dhairyashiil', rank: 2 })
        })

        test('returns rank for SinghaAnirban005', async () => {
            const res = await request(TEST_PORT, '/rank?username=SinghaAnirban005')
            assert.deepStrictEqual(res.body, { username: 'SinghaAnirban005', rank: 5 })
        })

        test('returns rank for zero-contribution user PavanTaddi9', async () => {
            const res = await request(TEST_PORT, '/rank?username=PavanTaddi9')
            assert.deepStrictEqual(res.body, { username: 'PavanTaddi9', rank: 56 })
        })

        test('username lookup is case-insensitive', async () => {
            const res = await request(TEST_PORT, '/rank?username=DHAIRYASHIIL')
            assert.deepStrictEqual(res.body, { username: 'DHAIRYASHIIL', rank: 2 })
        })

        test('returns rank for contributor by username + parameter=issues', async () => {
            const res = await request(
                TEST_PORT,
                '/rank?username=dhairyashiil&parameter=issues'
            )
            assert.deepStrictEqual(res.body, { username: 'dhairyashiil', rank: 1 })
        })

        test('returns rank for contributor by username + parameter=openprs', async () => {
            const res = await request(
                TEST_PORT,
                '/rank?username=thepiyush-303&parameter=openprs'
            )
            assert.deepStrictEqual(res.body, { username: 'thepiyush-303', rank: 1 })
        })

        test('returns error for non-existent username', async () => {
            const res = await request(
                TEST_PORT,
                '/rank?username=NONEXISTENT_USER_12345'
            )
            assert.deepStrictEqual(res.body, { error: 'Contributor NONEXISTENT_USER_12345 doesn\'t exist' })
        })

        test('rejects non-GET requests', async () => {
            const res = await request(TEST_PORT, '/rank', { method: 'POST' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('unknown parameter falls back to mergedprs default', async () => {
            const res = await request(TEST_PORT, '/rank?parameter=invalid')
            assert.deepStrictEqual(res.body, { ranks: EXPECTED.ranks.mergedprs })
        })

        test('default sort and explicit mergedprs return identical results', async () => {
            const defaultRes = await request(TEST_PORT, '/rank')
            const explicitRes = await request(TEST_PORT, '/rank?parameter=mergedprs')
            assert.deepStrictEqual(defaultRes.body, explicitRes.body)
        })
    })

    describe('GET /contributor', () => {
        test('returns all contributor data when no params given', async () => {
            const res = await request(TEST_PORT, '/contributor')
            assert.strictEqual(res.status, 200)
            assert.strictEqual(Object.keys(res.body).length, 251)
        })

        test('returns specific contributor by username (full object match)', async () => {
            const res = await request(
                TEST_PORT,
                '/contributor?username=dhairyashiil'
            )
            assert.deepStrictEqual(res.body, EXPECTED.contributors.dhairyashiil)
        })

        test('returns zero-contribution user by username (full object match)', async () => {
            const res = await request(
                TEST_PORT,
                '/contributor?username=PavanTaddi9'
            )
            assert.deepStrictEqual(res.body, EXPECTED.contributors.PavanTaddi9)
        })

        test('returns error for non-existent username', async () => {
            const res = await request(
                TEST_PORT,
                '/contributor?username=NONEXISTENT_USER_12345'
            )
            assert.deepStrictEqual(res.body, { error: 'Contributor NONEXISTENT_USER_12345 doesn\'t exist' })
        })

        test('returns contributor by rank (default sorted by mergedprs)', async () => {
            const res = await request(TEST_PORT, '/contributor?rank=1')
            assert.deepStrictEqual(res.body, EXPECTED.contributorByRank1MergedPrs)
        })

        test('returns contributor by rank with parameter=openprs', async () => {
            const res = await request(
                TEST_PORT,
                '/contributor?rank=1&parameter=openprs'
            )
            assert.deepStrictEqual(res.body, EXPECTED.contributorByRank1OpenPrs)
        })

        test('returns contributor by rank with parameter=issues', async () => {
            const res = await request(
                TEST_PORT,
                '/contributor?rank=1&parameter=issues'
            )
            assert.deepStrictEqual(res.body, EXPECTED.contributorByRank1Issues)
        })

        test('username lookup is case-sensitive (per REST-API docs)', async () => {
            const res = await request(
                TEST_PORT,
                '/contributor?username=DHAIRYASHIIL'
            )
            assert.deepStrictEqual(res.body, { error: 'Contributor DHAIRYASHIIL doesn\'t exist' })
        })

        test('rejects non-GET requests', async () => {
            const res = await request(TEST_PORT, '/contributor', { method: 'POST' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('returns undefined for out-of-bounds rank', async () => {
            const res = await request(TEST_PORT, '/contributor?rank=999')
            // Server does obj[contributors[998]] which is undefined
            assert.strictEqual(res.raw, '')
        })

        test('returns undefined for rank=0', async () => {
            const res = await request(TEST_PORT, '/contributor?rank=0')
            // rank-1 = -1, array[-1] = undefined
            assert.strictEqual(res.raw, '')
        })
    })

    describe('POST /login', () => {
        test('GET /login is rejected', async () => {
            const res = await request(TEST_PORT, '/login', { method: 'GET' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('failed login with wrong password returns correct error shape', async () => {
            const res = await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: 'wrong-password' },
            })
            assert.deepStrictEqual(res.body, {
                code: 1,
                delay: 0,
                contributors: {},
                startDate: '',
            })
        })

        test('login with correct password returns contributor list', async () => {
            const res = await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD },
            })
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.code, 0)
            assert.strictEqual(res.body.delay, '10')
            assert.strictEqual(res.body.startDate, '2024-12-01')
            assert.ok(Array.isArray(res.body.contributors))
            assert.strictEqual(res.body.contributors.length, 1)
            assert.strictEqual(res.body.contributors[0].username, 'dhairyashiil')
        })

    })

    describe('POST /setStartDate', () => {
        test('rejects GET requests', async () => {
            const res = await request(TEST_PORT, '/setStartDate', { method: 'GET' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('rejects wrong password', async () => {
            const res = await request(TEST_PORT, '/setStartDate', {
                method: 'POST',
                body: { token: 'wrong', startDate: '2025-01-01' },
            })
            assert.deepStrictEqual(res.body, { message: 'Authentication failed' })
        })

        test('accepts correct password', async () => {
            const res = await request(TEST_PORT, '/setStartDate', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, startDate: '2025-06-01' },
            })
            assert.deepStrictEqual(res.body, { message: 'Success' })
        })

        test('verifies startDate was persisted via /login', async () => {
            const res = await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD },
            })
            assert.strictEqual(res.body.startDate, '2025-06-01')
        })
    })

    describe('POST /setInterval', () => {
        test('rejects GET requests', async () => {
            const res = await request(TEST_PORT, '/setInterval', { method: 'GET' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('rejects wrong password', async () => {
            const res = await request(TEST_PORT, '/setInterval', {
                method: 'POST',
                body: { token: 'wrong', interval: '30' },
            })
            assert.deepStrictEqual(res.body, { message: 'Authentication failed' })
        })

        test('accepts correct password', async () => {
            const res = await request(TEST_PORT, '/setInterval', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, interval: '30' },
            })
            assert.deepStrictEqual(res.body, { message: 'Success' })
        })

        test('verifies interval was persisted via /login', async () => {
            const res = await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD },
            })
            assert.strictEqual(res.body.delay, '30')
        })
    })

    describe('POST /setIncludedRepositories', () => {
        test('rejects GET requests', async () => {
            const res = await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'GET',
            })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('rejects wrong password', async () => {
            const res = await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                body: {
                    token: 'wrong',
                    includedRepositories: ['Rocket.Chat'],
                },
            })
            assert.deepStrictEqual(res.body, { message: 'Authentication failed' })
        })

        test('accepts correct password', async () => {
            const res = await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                body: {
                    token: TEST_ADMIN_PASSWORD,
                    includedRepositories: ['Rocket.Chat', 'fuselage'],
                },
            })
            assert.deepStrictEqual(res.body, { message: 'Success' })
        })

        test('verifies includedRepositories was persisted via /getRepositories', async () => {
            // Set to a known value
            const setRes = await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                body: {
                    token: TEST_ADMIN_PASSWORD,
                    includedRepositories: ['Rocket.Chat', 'fuselage'],
                },
            })
            assert.deepStrictEqual(setRes.body, { message: 'Success' })

            // Read back via /getRepositories (returns includedRepositories from config)
            const getRes = await request(TEST_PORT, '/getRepositories')
            assert.deepStrictEqual(getRes.body.includedRepositories, ['Rocket.Chat', 'fuselage'])

            // Change to a different value and verify again
            const setRes2 = await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                body: {
                    token: TEST_ADMIN_PASSWORD,
                    includedRepositories: ['docs', 'EmbeddedChat'],
                },
            })
            assert.deepStrictEqual(setRes2.body, { message: 'Success' })

            const getRes2 = await request(TEST_PORT, '/getRepositories')
            assert.deepStrictEqual(getRes2.body.includedRepositories, ['docs', 'EmbeddedChat'])

            // Restore to original
            await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                body: {
                    token: TEST_ADMIN_PASSWORD,
                    includedRepositories: ['Rocket.Chat'],
                },
            })
        })
    })

    describe('POST /remove', () => {
        test('rejects GET requests', async () => {
            const res = await request(TEST_PORT, '/remove', { method: 'GET' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('rejects wrong password', async () => {
            const res = await request(TEST_PORT, '/remove', {
                method: 'POST',
                body: { token: 'wrong', username: 'PavanTaddi9' },
            })
            assert.deepStrictEqual(res.body, { message: 'Authentication failed' })
        })

        test('removes contributor with correct password', async () => {
            const res = await request(TEST_PORT, '/remove', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, username: 'PavanTaddi9' },
            })
            assert.deepStrictEqual(res.body, { message: 'Success' })

            // Verify the contributor is gone from /data
            const dataRes = await request(TEST_PORT, '/data')
            assert.strictEqual(dataRes.body['PavanTaddi9'], undefined)
            assert.strictEqual(Object.keys(dataRes.body).length, 250)

            // Stats should reflect one fewer contributor
            const statsRes = await request(TEST_PORT, '/stats')
            assert.strictEqual(statsRes.body.totalContributors, 250)

            // Rank list should also reflect removal
            const rankRes = await request(TEST_PORT, '/rank')
            assert.strictEqual(rankRes.body.ranks.length, 250)
            assert.strictEqual(rankRes.body.ranks.includes('PavanTaddi9'), false)

            // Contributor lookup should return error
            const contribRes = await request(TEST_PORT, '/contributor?username=PavanTaddi9')
            assert.deepStrictEqual(contribRes.body, { error: 'Contributor PavanTaddi9 doesn\'t exist' })
        })

        test('removing non-existent user still returns Success', async () => {
            const beforeData = await request(TEST_PORT, '/data')
            const countBefore = Object.keys(beforeData.body).length

            const res = await request(TEST_PORT, '/remove', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, username: 'TOTALLY_FAKE_USER' },
            })
            assert.deepStrictEqual(res.body, { message: 'Success' })

            // Data should be unchanged since user didn't exist
            const afterData = await request(TEST_PORT, '/data')
            assert.strictEqual(Object.keys(afterData.body).length, countBefore)
        })
    })

    describe('POST /add', () => {
        test('rejects GET requests', async () => {
            const res = await request(TEST_PORT, '/add', { method: 'GET' })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('rejects wrong password', async () => {
            const res = await request(TEST_PORT, '/add', {
                method: 'POST',
                body: { token: 'wrong', username: 'testuser' },
            })
            assert.deepStrictEqual(res.body, { message: 'Authentication failed' })
        })

        test('rejects duplicate contributor that already exists in config', async () => {
            const res = await request(TEST_PORT, '/add', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, username: 'dhairyashiil' },
            })
            assert.deepStrictEqual(res.body, { message: 'dhairyashiil aready exists' })
        })

        test('returns "Not found" for non-existent GitHub user', async () => {
            const res = await request(TEST_PORT, '/add', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, username: 'this-user-definitely-does-not-exist-99999' },
            })
            assert.deepStrictEqual(res.body, { message: 'Not found' })
        })
    })

    describe('GET /getRepositories', () => {
        test('rejects non-GET requests', async () => {
            const res = await request(TEST_PORT, '/getRepositories', {
                method: 'POST',
            })
            assert.strictEqual(res.raw, 'Permission denied\n')
        })

        test('returns repositories and includedRepositories', async () => {
            const res = await request(TEST_PORT, '/getRepositories')
            assert.strictEqual(res.status, 200)
            assert.ok(Array.isArray(res.body.repositories))
            assert.ok(Array.isArray(res.body.includedRepositories))
        })
    })

    describe('Invalid JSON body handling', () => {
        test('returns 400 with error message for malformed JSON body', async () => {
            const res = await request(TEST_PORT, '/login', {
                method: 'POST',
                rawBody: '{not-valid-json',
            })
            assert.strictEqual(res.status, 400)
            assert.deepStrictEqual(res.body, { message: 'Invalid JSON body' })
        })

        test('returns 400 for empty POST body', async () => {
            const res = await request(TEST_PORT, '/setStartDate', {
                method: 'POST',
                rawBody: '',
            })
            assert.strictEqual(res.status, 400)
            assert.deepStrictEqual(res.body, { message: 'Invalid JSON body' })
        })

        test('returns 400 for malformed JSON on /setInterval', async () => {
            const res = await request(TEST_PORT, '/setInterval', {
                method: 'POST',
                rawBody: '{{bad',
            })
            assert.strictEqual(res.status, 400)
            assert.deepStrictEqual(res.body, { message: 'Invalid JSON body' })
        })

        test('returns 400 for malformed JSON on /remove', async () => {
            const res = await request(TEST_PORT, '/remove', {
                method: 'POST',
                rawBody: 'not-json',
            })
            assert.strictEqual(res.status, 400)
            assert.deepStrictEqual(res.body, { message: 'Invalid JSON body' })
        })

        test('returns 400 for malformed JSON on /add', async () => {
            const res = await request(TEST_PORT, '/add', {
                method: 'POST',
                rawBody: '{broken',
            })
            assert.strictEqual(res.status, 400)
            assert.deepStrictEqual(res.body, { message: 'Invalid JSON body' })
        })

        test('returns 400 for malformed JSON on /setIncludedRepositories', async () => {
            const res = await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                rawBody: '',
            })
            assert.strictEqual(res.status, 400)
            assert.deepStrictEqual(res.body, { message: 'Invalid JSON body' })
        })
    })

    describe('Unknown routes', () => {
        test('returns Permission denied for unknown path', async () => {
            const res = await request(TEST_PORT, '/nonexistent')
            assert.strictEqual(res.raw, 'Permission denied\n')
        })
    })

    describe('configBackup.json persistence', () => {
        test('setStartDate writes to configBackup.json', async () => {
            await request(TEST_PORT, '/setStartDate', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, startDate: '2026-01-15' },
            })

            const backupPath = path.join(getTmpDir(), 'configBackup.json')
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
            assert.strictEqual(backup.startDate, '2026-01-15')
        })

        test('setInterval writes to configBackup.json', async () => {
            await request(TEST_PORT, '/setInterval', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, interval: '45' },
            })

            const backupPath = path.join(getTmpDir(), 'configBackup.json')
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
            assert.strictEqual(backup.delay, '45')
        })

        test('setIncludedRepositories writes to configBackup.json', async () => {
            await request(TEST_PORT, '/setIncludedRepositories', {
                method: 'POST',
                body: {
                    token: TEST_ADMIN_PASSWORD,
                    includedRepositories: ['Repo-A', 'Repo-B'],
                },
            })

            const backupPath = path.join(getTmpDir(), 'configBackup.json')
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
            assert.deepStrictEqual(backup.includedRepositories, ['Repo-A', 'Repo-B'])
        })

        test('remove writes to configBackup.json', async () => {
            // First get a known contributor
            const dataRes = await request(TEST_PORT, '/data')
            const userToRemove = Object.keys(dataRes.body)[0]

            await request(TEST_PORT, '/remove', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD, username: userToRemove },
            })

            const backupPath = path.join(getTmpDir(), 'configBackup.json')
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
            assert.strictEqual(backup.contributors.includes(userToRemove), false)
        })

        test('configBackup.json matches config.json after mutations', async () => {
            const tmpDir = getTmpDir()
            const config = JSON.parse(fs.readFileSync(path.join(tmpDir, 'config.json'), 'utf8'))
            const backup = JSON.parse(fs.readFileSync(path.join(tmpDir, 'configBackup.json'), 'utf8'))
            assert.deepStrictEqual(backup, config)
        })
    })

    describe('admindata.json persistence', () => {
        test('login persists contributor list to admindata.json', async () => {
            await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD },
            })

            const admindataPath = path.join(getTmpDir(), 'admindata.json')
            const admindata = JSON.parse(fs.readFileSync(admindataPath, 'utf8'))
            assert.ok(Array.isArray(admindata), 'admindata should be an array')
            // Each entry should have username and avatarUrl
            for (const entry of admindata) {
                assert.ok('username' in entry, 'entry should have username')
                assert.ok('avatarUrl' in entry, 'entry should have avatarUrl')
            }
        })

        test('subsequent login reads cached avatar from admindata.json', async () => {
            // First login populates admindata
            const res1 = await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD },
            })

            // Second login should read from admindata cache
            const res2 = await request(TEST_PORT, '/login', {
                method: 'POST',
                body: { token: TEST_ADMIN_PASSWORD },
            })

            assert.strictEqual(res1.body.code, 0)
            assert.strictEqual(res2.body.code, 0)
            // Both should return the same contributor list
            assert.deepStrictEqual(
                res1.body.contributors.map(c => c.username),
                res2.body.contributors.map(c => c.username)
            )
        })
    })

    describe('Edge-case query parameters', () => {
        test('empty username on /rank returns full rank list (falsy check)', async () => {
            // query.username is "" which is falsy, so it falls through to the ranks list
            const defaultRes = await request(TEST_PORT, '/rank')
            const emptyRes = await request(TEST_PORT, '/rank?username=')
            assert.deepStrictEqual(emptyRes.body, defaultRes.body)
        })

        test('empty username on /contributor returns full dataset (falsy check)', async () => {
            // query.username is "" which is falsy, so it falls through to full data
            const defaultRes = await request(TEST_PORT, '/contributor')
            const emptyRes = await request(TEST_PORT, '/contributor?username=')
            assert.deepStrictEqual(Object.keys(emptyRes.body).length, Object.keys(defaultRes.body).length)
        })

        test('non-numeric rank returns empty response for /contributor', async () => {
            const res = await request(TEST_PORT, '/contributor?rank=abc')
            // parseInt('abc') is NaN, array[NaN-1] is undefined
            assert.strictEqual(res.raw, '')
        })

        test('negative rank returns empty response for /contributor', async () => {
            const res = await request(TEST_PORT, '/contributor?rank=-1')
            // rank-1 = -2, array[-2] is undefined
            assert.strictEqual(res.raw, '')
        })

        test('empty parameter falls back to default for /rank', async () => {
            const defaultRes = await request(TEST_PORT, '/rank')
            const emptyParamRes = await request(TEST_PORT, '/rank?parameter=')
            assert.deepStrictEqual(defaultRes.body, emptyParamRes.body)
        })
    })

    describe('Cross-endpoint data consistency', () => {
        test('/stats totals match manual sum over /data', async () => {
            const dataRes = await request(TEST_PORT, '/data')
            const statsRes = await request(TEST_PORT, '/stats')

            let totalOpen = 0,
                totalMerged = 0,
                totalIssues = 0
            for (const c of Object.values(dataRes.body)) {
                totalOpen += c.openPRsNumber
                totalMerged += c.mergedPRsNumber
                totalIssues += c.issuesNumber
            }

            assert.strictEqual(
                statsRes.body.totalContributors,
                Object.keys(dataRes.body).length
            )
            assert.strictEqual(statsRes.body.totalOpenPRs, totalOpen)
            assert.strictEqual(statsRes.body.totalMergedPRs, totalMerged)
            assert.strictEqual(statsRes.body.totalIssues, totalIssues)
        })

        test('/rank list length matches /data keys', async () => {
            const dataRes = await request(TEST_PORT, '/data')
            const rankRes = await request(TEST_PORT, '/rank')
            assert.strictEqual(
                rankRes.body.ranks.length,
                Object.keys(dataRes.body).length
            )
        })

        test('/contributor?rank=N returns same data as /data[ranked_user]', async () => {
            const rankRes = await request(TEST_PORT, '/rank')
            const topUser = rankRes.body.ranks[0]

            const byRank = await request(TEST_PORT, '/contributor?rank=1')
            const byName = await request(
                TEST_PORT,
                `/contributor?username=${topUser}`
            )

            assert.deepStrictEqual(byRank.body, byName.body)
        })

        test('all ranked users exist in /data', async () => {
            const dataRes = await request(TEST_PORT, '/data')
            const rankRes = await request(TEST_PORT, '/rank')

            for (const username of rankRes.body.ranks) {
                assert.notStrictEqual(
                    dataRes.body[username],
                    undefined,
                    `${username} from /rank not found in /data`
                )
            }
        })
    })
})
