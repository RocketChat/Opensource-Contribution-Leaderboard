const { after, before, test } = require('node:test')
const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const net = require('net')

const fixturesDir = path.resolve(__dirname, 'fixtures')
const dataPath = path.resolve(
    __dirname,
    '../contrib/rocketchat/gsoc/2025/gsoc2025final.json'
)
const expectedPath = path.join(fixturesDir, 'gsoc2025final.expected.json')
const configPath = path.join(fixturesDir, 'gsoc2025final.config.json')
const logPath = path.join(fixturesDir, 'gsoc2025final.log.json')
const admindataPath = path.join(fixturesDir, 'gsoc2025final.admindata.json')
const configBackupPath = path.join(fixturesDir, 'gsoc2025final.configBackup.json')

let server
let baseUrl
let expected

function getOpenPort() {
    return new Promise((resolve, reject) => {
        const probe = net.createServer()
        probe.on('error', reject)
        probe.listen(0, () => {
            const { port } = probe.address()
            probe.close((err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(port)
            })
        })
    })
}

function requestJson(requestPath) {
    return new Promise((resolve, reject) => {
        const req = http.get(baseUrl + requestPath, (res) => {
            let body = ''

            res.on('data', (chunk) => {
                body += chunk.toString()
            })

            res.on('end', () => {
                try {
                    resolve(JSON.parse(body))
                } catch (err) {
                    reject(err)
                }
            })
        })

        req.on('error', reject)
    })
}

before(async () => {
    if (fs.existsSync(admindataPath)) {
        fs.unlinkSync(admindataPath)
    }

    if (fs.existsSync(configBackupPath)) {
        fs.unlinkSync(configBackupPath)
    }

    const port = await getOpenPort()

    process.env.NODE_ENV = 'development'
    process.env.LEADERBOARD_SKIP_REFRESH = '1'
    process.env.LEADERBOARD_PORT = String(port)
    process.env.LEADERBOARD_CONFIG_PATH = configPath
    process.env.LEADERBOARD_DATA_PATH = dataPath
    process.env.LEADERBOARD_LOG_PATH = logPath
    process.env.LEADERBOARD_ADMINDATA_PATH = admindataPath
    process.env.LEADERBOARD_CONFIG_BACKUP_PATH = configBackupPath

    expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'))

    const appPath = path.resolve(__dirname, '../src/server/app.js')
    delete require.cache[appPath]
    ;({ server } = require(appPath))

    baseUrl = `http://127.0.0.1:${port}`

    if (!server.listening) {
        await new Promise((resolve) => {
            server.once('listening', resolve)
        })
    }
})

after(async () => {
    if (server && server.listening) {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }

    if (fs.existsSync(admindataPath)) {
        fs.unlinkSync(admindataPath)
    }

    if (fs.existsSync(configBackupPath)) {
        fs.unlinkSync(configBackupPath)
    }

    delete process.env.LEADERBOARD_SKIP_REFRESH
    delete process.env.LEADERBOARD_PORT
    delete process.env.LEADERBOARD_CONFIG_PATH
    delete process.env.LEADERBOARD_DATA_PATH
    delete process.env.LEADERBOARD_LOG_PATH
    delete process.env.LEADERBOARD_ADMINDATA_PATH
    delete process.env.LEADERBOARD_CONFIG_BACKUP_PATH
})

test('stable leaderboard stats and rankings match the golden snapshot', async () => {
    const stats = await requestJson('/stats')
    assert.deepStrictEqual(stats, expected.stats)

    const mergedRanks = await requestJson('/rank')
    const openRanks = await requestJson('/rank?parameter=openprs')
    const issueRanks = await requestJson('/rank?parameter=issues')

    assert.deepStrictEqual(mergedRanks, { ranks: expected.ranks.mergedprs })
    assert.deepStrictEqual(openRanks, { ranks: expected.ranks.openprs })
    assert.deepStrictEqual(issueRanks, { ranks: expected.ranks.issues })
    assert.strictEqual(mergedRanks.ranks.length, stats.totalContributors)
})

test('stable leaderboard rank lookups and top contributor match the golden snapshot', async () => {
    const dhairyashiilRank = await requestJson('/rank?username=dhairyashiil')
    const singhaRank = await requestJson('/rank?username=SinghaAnirban005')
    const pavanRank = await requestJson('/rank?username=PavanTaddi9')
    const topContributor = await requestJson('/contributor?rank=1&parameter=mergedprs')

    assert.deepStrictEqual(dhairyashiilRank, {
        username: 'dhairyashiil',
        rank: expected.rankLookups.dhairyashiil.mergedprs,
    })
    assert.deepStrictEqual(singhaRank, {
        username: 'SinghaAnirban005',
        rank: expected.rankLookups.SinghaAnirban005.mergedprs,
    })
    assert.deepStrictEqual(pavanRank, {
        username: 'PavanTaddi9',
        rank: expected.rankLookups.PavanTaddi9.mergedprs,
    })
    assert.deepStrictEqual(topContributor, expected.topContributorByMergedPrs.contributor)
})
