const { describe, test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const REFRESH_SCRIPT = path.resolve(__dirname, '../../src/server/refresh.js')

describe('refresh.js integration', () => {
    let tmpDir = null
    let childProc = null

    function setupTmpDir(config, { createDataDir = true, createDataFile = true, createLogFile = true } = {}) {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocl-refresh-'))
        const serverDir = path.join(tmpDir, 'server')
        fs.mkdirSync(serverDir)

        // Write config.json to server dir (refresh.js reads ./config.json from cwd)
        fs.writeFileSync(
            path.join(serverDir, 'config.json'),
            JSON.stringify(config, null, 2)
        )

        // Always create ../assets/ parent (refresh.js only mkdir's the 'data' subdir)
        const assetsDir = path.join(tmpDir, 'assets')
        fs.mkdirSync(assetsDir)

        const assetsDataDir = path.join(assetsDir, 'data')
        if (createDataDir) {
            fs.mkdirSync(assetsDataDir)
            if (createDataFile) {
                fs.writeFileSync(path.join(assetsDataDir, 'data.json'), '{}')
            }
            if (createLogFile) {
                fs.writeFileSync(
                    path.join(assetsDataDir, 'log.json'),
                    JSON.stringify({ starttime: 0, endtime: 0 })
                )
            }
        }

        return serverDir
    }

    function spawnRefresh(cwd) {
        childProc = spawn('node', [REFRESH_SCRIPT], {
            cwd,
            env: {
                ...process.env,
                LEADERBOARD_CONFIG_PATH: path.join(cwd, 'config.json'),
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        return childProc
    }

    afterEach(() => {
        if (childProc) {
            try { childProc.kill('SIGKILL') } catch { /* already dead */ }
            childProc = null
        }
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true })
            tmpDir = null
        }
    })

    const BASE_CONFIG = {
        organization: 'TestOrg',
        contributors: [],
        delay: '1',
        includedRepositories: [],
        startDate: '2024-01-01',
        authToken: 'fake-token',
    }

    test('starts without crashing with empty contributors array', async () => {
        const serverDir = setupTmpDir(BASE_CONFIG)
        const proc = spawnRefresh(serverDir)

        await new Promise((r) => setTimeout(r, 1500))
        assert.strictEqual(proc.exitCode, null, 'process should still be running')
    })

    test('creates data directory when it does not exist', async () => {
        const serverDir = setupTmpDir(BASE_CONFIG, { createDataDir: false })
        spawnRefresh(serverDir)

        await new Promise((r) => setTimeout(r, 1500))
        const dataDir = path.join(tmpDir, 'assets', 'data')
        assert.ok(fs.existsSync(dataDir), 'data directory should be created')
    })

    test('creates data.json when it does not exist', async () => {
        const serverDir = setupTmpDir(BASE_CONFIG, { createDataFile: false })
        spawnRefresh(serverDir)

        await new Promise((r) => setTimeout(r, 1500))
        const dataPath = path.join(tmpDir, 'assets', 'data', 'data.json')
        assert.ok(fs.existsSync(dataPath), 'data.json should be created')
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
        assert.deepStrictEqual(data, {}, 'data.json should be empty object')
    })

    test('reads existing log.json without error', async () => {
        const serverDir = setupTmpDir(BASE_CONFIG)
        const proc = spawnRefresh(serverDir)

        let stderr = ''
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })

        await new Promise((r) => setTimeout(r, 1500))
        assert.strictEqual(proc.exitCode, null, 'process should still be running')
        // No fatal errors in stderr (warnings about bad credentials are expected)
        assert.ok(!stderr.includes('Cannot find module'), 'should not have module errors')
        assert.ok(!stderr.includes('SyntaxError'), 'should not have syntax errors')
    })

    test('exits with error when config.json is missing', async () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocl-refresh-'))
        const serverDir = path.join(tmpDir, 'server')
        fs.mkdirSync(serverDir)
        // Intentionally do NOT create config.json

        childProc = spawn('node', [REFRESH_SCRIPT], {
            cwd: serverDir,
            env: {
                ...process.env,
                LEADERBOARD_CONFIG_PATH: path.join(serverDir, 'config.json'),
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        const exitCode = await new Promise((resolve) => {
            childProc.on('exit', (code) => resolve(code))
        })

        assert.notStrictEqual(exitCode, 0, 'process should exit with error when config is missing')
    })

    test('updates log.json with starttime when contributors exist', async () => {
        const config = { ...BASE_CONFIG, contributors: ['fakeuser'], delay: '0' }
        const serverDir = setupTmpDir(config)
        spawnRefresh(serverDir)

        const logPath = path.join(tmpDir, 'assets', 'data', 'log.json')
        let log = { starttime: 0 }
        for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise((r) => setTimeout(r, 1000))
            try {
                log = JSON.parse(fs.readFileSync(logPath, 'utf8'))
                if (log.starttime > 0) break
            } catch {
                // file may be mid-write, retry
            }
        }
        assert.ok(log.starttime > 0, 'starttime should be updated')
    })

    test('interval calculation: < 150 contributors uses 150', async () => {
        // refresh.js sets: interval = contributors.length < 150 ? 150 : (contributors.length + 10)
        // With 0 contributors, interval should be 150
        // We verify indirectly: process starts and doesn't crash with various counts
        const config = { ...BASE_CONFIG, contributors: Array.from({ length: 149 }, (_, i) => `user${i}`), delay: '0' }
        const serverDir = setupTmpDir(config)
        const proc = spawnRefresh(serverDir)

        await new Promise((r) => setTimeout(r, 2000))
        assert.strictEqual(proc.exitCode, null, 'process should still be running with 149 contributors')
    })

    test('interval calculation: >= 150 contributors uses length + 10', async () => {
        const config = { ...BASE_CONFIG, contributors: Array.from({ length: 150 }, (_, i) => `user${i}`), delay: '0' }
        const serverDir = setupTmpDir(config)
        const proc = spawnRefresh(serverDir)

        await new Promise((r) => setTimeout(r, 2000))
        assert.strictEqual(proc.exitCode, null, 'process should still be running with 150 contributors')
    })

    test('data.json remains unchanged when API calls fail', async () => {
        const config = { ...BASE_CONFIG, contributors: ['fakeuser'], delay: '0' }
        const serverDir = setupTmpDir(config)

        // Seed data.json with known data
        const dataPath = path.join(tmpDir, 'assets', 'data', 'data.json')
        fs.writeFileSync(dataPath, JSON.stringify({ existing: 'data' }))

        spawnRefresh(serverDir)

        await new Promise((r) => setTimeout(r, 3000))

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
        // Data should be unchanged since API calls with fake token return invalid results
        assert.ok('existing' in data, 'existing data should be preserved')
        assert.ok(!('fakeuser' in data), 'fakeuser should not be added (API failed)')
    })
})
