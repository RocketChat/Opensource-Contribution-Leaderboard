const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const net = require('net')
const os = require('os')

const SERVER_DIR = path.resolve(__dirname, '../../src/server')
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')

const TEST_PORT = 63111
const TEST_ADMIN_PASSWORD = 'e2e-test-pwd'

function waitForPort(port, host = '127.0.0.1', timeoutMs = 15000) {
    const start = Date.now()
    return new Promise((resolve, reject) => {
        function tryConnect() {
            const sock = new net.Socket()
            sock.once('connect', () => {
                sock.destroy()
                resolve()
            })
            sock.once('error', () => {
                sock.destroy()
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`))
                } else {
                    setTimeout(tryConnect, 200)
                }
            })
            sock.connect(port, host)
        }
        tryConnect()
    })
}

let serverProcess = null
let tmpDir = null
let activePort = TEST_PORT

async function startServer(port) {
    activePort = port || TEST_PORT

    // Copy fixtures into a temp directory so tests can mutate freely
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocl-e2e-'))
    for (const file of ['config.json', 'data.json', 'log.json', 'admindata.json', 'configBackup.json']) {
        fs.copyFileSync(path.join(FIXTURES_DIR, file), path.join(tmpDir, file))
    }

    const env = {
        ...process.env,
        NODE_ENV: 'development',
        LEADERBOARD_CONFIG_PATH: path.join(tmpDir, 'config.json'),
        LEADERBOARD_DATA_PATH: path.join(tmpDir, 'data.json'),
        LEADERBOARD_LOG_PATH: path.join(tmpDir, 'log.json'),
        LEADERBOARD_ADMINDATA_PATH: path.join(tmpDir, 'admindata.json'),
        LEADERBOARD_CONFIG_BACKUP_PATH: path.join(tmpDir, 'configBackup.json'),
        LEADERBOARD_PORT: String(activePort),
        LEADERBOARD_SKIP_REFRESH: '1',
    }

    serverProcess = spawn('node', ['app.js'], {
        cwd: SERVER_DIR,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
    })

    serverProcess.stderr.on('data', (chunk) => {
        const msg = chunk.toString()
        if (!msg.includes('Bad credentials') && !msg.includes('WARNING')) {
            process.stderr.write(`[server stderr] ${msg}`)
        }
    })

    await waitForPort(activePort)
}

async function stopServer() {
    if (serverProcess) {
        try {
            process.kill(-serverProcess.pid, 'SIGKILL')
        } catch {
            // already dead
        }
        serverProcess = null
    }

    // Clean up temp directory
    if (tmpDir && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
        tmpDir = null
    }
}

function getTmpDir() {
    return tmpDir
}

function getActivePort() {
    return activePort
}

module.exports = {
    startServer,
    stopServer,
    getTmpDir,
    getActivePort,
    TEST_PORT,
    TEST_ADMIN_PASSWORD,
}
