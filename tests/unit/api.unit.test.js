const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

// Load API module with a dummy config to avoid requiring a real config.json
process.env.LEADERBOARD_CONFIG_PATH = path.resolve(
    __dirname,
    '../e2e/fixtures/config.json'
)
const API = require(path.resolve(__dirname, '../../src/server/util/API'))

describe('API.getStats', () => {
    test('returns zeroes for empty data', async () => {
        const stats = await API.getStats({})
        assert.deepStrictEqual(stats, {
            totalContributors: 0,
            totalOpenPRs: 0,
            totalMergedPRs: 0,
            totalIssues: 0,
        })
    })

    test('correctly sums a single contributor', async () => {
        const data = {
            testuser: {
                openPRsNumber: 3,
                mergedPRsNumber: 5,
                issuesNumber: 2,
            },
        }
        const stats = await API.getStats(data)
        assert.deepStrictEqual(stats, {
            totalContributors: 1,
            totalOpenPRs: 3,
            totalMergedPRs: 5,
            totalIssues: 2,
        })
    })

    test('correctly sums multiple contributors', async () => {
        const data = {
            user1: { openPRsNumber: 1, mergedPRsNumber: 2, issuesNumber: 3 },
            user2: { openPRsNumber: 4, mergedPRsNumber: 5, issuesNumber: 6 },
            user3: { openPRsNumber: 0, mergedPRsNumber: 0, issuesNumber: 0 },
        }
        const stats = await API.getStats(data)
        assert.deepStrictEqual(stats, {
            totalContributors: 3,
            totalOpenPRs: 5,
            totalMergedPRs: 7,
            totalIssues: 9,
        })
    })
})

describe('API.getRanks', () => {
    const data = {
        alice: { mergedPRsNumber: 10, openPRsNumber: 5, issuesNumber: 2 },
        bob: { mergedPRsNumber: 10, openPRsNumber: 8, issuesNumber: 1 },
        charlie: { mergedPRsNumber: 3, openPRsNumber: 1, issuesNumber: 20 },
        dave: { mergedPRsNumber: 0, openPRsNumber: 0, issuesNumber: 0 },
    }

    test('returns empty array for empty data', async () => {
        const ranks = await API.getRanks({})
        assert.deepStrictEqual(ranks, [])
    })

    test('single contributor returns single-element array', async () => {
        const ranks = await API.getRanks({ solo: { mergedPRsNumber: 1, openPRsNumber: 0, issuesNumber: 0 } })
        assert.deepStrictEqual(ranks, ['solo'])
    })

    test('sorts by mergedprs by default', async () => {
        const ranks = await API.getRanks(data)
        // bob and alice both have 10 merged, bob has more open (8 > 5) → bob first
        assert.strictEqual(ranks[0], 'bob')
        assert.strictEqual(ranks[1], 'alice')
        assert.strictEqual(ranks[2], 'charlie')
        assert.strictEqual(ranks[3], 'dave')
    })

    test('tiebreaks correctly: same merged, different open PRs', async () => {
        const ranks = await API.getRanks(data, 'mergedprs')
        // bob (merged:10, open:8) beats alice (merged:10, open:5)
        assert.strictEqual(ranks[0], 'bob')
        assert.strictEqual(ranks[1], 'alice')
    })

    test('sorts by openprs when parameter=openprs', async () => {
        const ranks = await API.getRanks(data, 'openprs')
        // bob (open:8), alice (open:5), charlie (open:1), dave (open:0)
        assert.strictEqual(ranks[0], 'bob')
        assert.strictEqual(ranks[1], 'alice')
        assert.strictEqual(ranks[2], 'charlie')
        assert.strictEqual(ranks[3], 'dave')
    })

    test('sorts by issues when parameter=issues', async () => {
        const ranks = await API.getRanks(data, 'issues')
        // charlie (issues:20), alice (issues:2), bob (issues:1), dave (issues:0)
        assert.strictEqual(ranks[0], 'charlie')
        assert.strictEqual(ranks[1], 'alice')
        assert.strictEqual(ranks[2], 'bob')
        assert.strictEqual(ranks[3], 'dave')
    })

    test('unknown parameter defaults to mergedprs', async () => {
        const ranks = await API.getRanks(data, 'unknown')
        const defaultRanks = await API.getRanks(data, 'mergedprs')
        assert.deepStrictEqual(ranks, defaultRanks)
    })

    test('undefined parameter defaults to mergedprs', async () => {
        const ranks = await API.getRanks(data)
        const defaultRanks = await API.getRanks(data, 'mergedprs')
        assert.deepStrictEqual(ranks, defaultRanks)
    })

    test('three-way tiebreak: same pref1 and pref2, different pref3', async () => {
        const tieData = {
            x: { mergedPRsNumber: 5, openPRsNumber: 3, issuesNumber: 10 },
            y: { mergedPRsNumber: 5, openPRsNumber: 3, issuesNumber: 7 },
            z: { mergedPRsNumber: 5, openPRsNumber: 3, issuesNumber: 15 },
        }
        const ranks = await API.getRanks(tieData, 'mergedprs')
        // All same merged (5) and open (3), sorted by issues desc: z(15), x(10), y(7)
        assert.strictEqual(ranks[0], 'z')
        assert.strictEqual(ranks[1], 'x')
        assert.strictEqual(ranks[2], 'y')
    })

    test('complete tie returns all contributors (stable but order unspecified)', async () => {
        const tieData = {
            a: { mergedPRsNumber: 0, openPRsNumber: 0, issuesNumber: 0 },
            b: { mergedPRsNumber: 0, openPRsNumber: 0, issuesNumber: 0 },
            c: { mergedPRsNumber: 0, openPRsNumber: 0, issuesNumber: 0 },
        }
        const ranks = await API.getRanks(tieData)
        assert.strictEqual(ranks.length, 3)
        assert.ok(ranks.includes('a'))
        assert.ok(ranks.includes('b'))
        assert.ok(ranks.includes('c'))
    })

    test('openprs sort: tiebreak uses mergedPRs then issues', async () => {
        const data = {
            x: { openPRsNumber: 5, mergedPRsNumber: 10, issuesNumber: 1 },
            y: { openPRsNumber: 5, mergedPRsNumber: 3, issuesNumber: 20 },
            z: { openPRsNumber: 5, mergedPRsNumber: 10, issuesNumber: 8 },
        }
        const ranks = await API.getRanks(data, 'openprs')
        // All have open=5. Tiebreak by merged: x(10),z(10) > y(3)
        // Then x vs z: same merged=10, tiebreak by issues: z(8) > x(1)
        assert.strictEqual(ranks[0], 'z')
        assert.strictEqual(ranks[1], 'x')
        assert.strictEqual(ranks[2], 'y')
    })

    test('issues sort: tiebreak uses mergedPRs then openPRs', async () => {
        const data = {
            a: { issuesNumber: 7, mergedPRsNumber: 2, openPRsNumber: 10 },
            b: { issuesNumber: 7, mergedPRsNumber: 2, openPRsNumber: 3 },
            c: { issuesNumber: 7, mergedPRsNumber: 5, openPRsNumber: 0 },
        }
        const ranks = await API.getRanks(data, 'issues')
        // All have issues=7. Tiebreak by merged: c(5) > a(2),b(2)
        // a vs b: same merged=2, tiebreak by open: a(10) > b(3)
        assert.strictEqual(ranks[0], 'c')
        assert.strictEqual(ranks[1], 'a')
        assert.strictEqual(ranks[2], 'b')
    })
})

describe('API.getStats - edge cases', () => {
    test('handles contributors with all-zero stats', async () => {
        const data = {
            u1: { openPRsNumber: 0, mergedPRsNumber: 0, issuesNumber: 0 },
            u2: { openPRsNumber: 0, mergedPRsNumber: 0, issuesNumber: 0 },
        }
        const stats = await API.getStats(data)
        assert.deepStrictEqual(stats, {
            totalContributors: 2,
            totalOpenPRs: 0,
            totalMergedPRs: 0,
            totalIssues: 0,
        })
    })

    test('handles large numbers without overflow', async () => {
        const data = {
            heavy: { openPRsNumber: 999999, mergedPRsNumber: 888888, issuesNumber: 777777 },
        }
        const stats = await API.getStats(data)
        assert.strictEqual(stats.totalOpenPRs, 999999)
        assert.strictEqual(stats.totalMergedPRs, 888888)
        assert.strictEqual(stats.totalIssues, 777777)
    })
})
