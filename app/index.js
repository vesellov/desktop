const {app, dialog, Tray, Menu} = require('electron');

const ipc = require('electron').ipcMain
const exec = require('child_process').exec

const request = require('request')
const log = require('electron-log')
const path = require('path')
const https = require('https')
const fs = require('fs')

const setup = require('./setup')
const ui = require('./ui')


let win
let showExitPrompt = true

async function showWindow() {
    if (win) {
        if (!win.isVisible()) {
            win.show()
        }
    } else {
        win = ui.createMainWindow()
        win.on('closed', () => {
            win = null
        })
    }
    //win.webContents.openDevTools()
}

async function showDialogOnExit(e) {
    if (showExitPrompt) {
        e.preventDefault();
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Keep running in the background', 'Stop BitDust'],
            defaultId: 0,
            title: 'Confirm',
            message: 'Do you want to run BitDust in the background or stop it completely?'
        }, async (response) => {
            if (response === 1) {
                try {
                    await setup.stopBitDust();
                    log.warn('stop BitDust DONE')
                } catch (error) {
                    log.error(error)
                }
            }
            showExitPrompt = false
            app.quit()
        })
    }
}


async function installClientCertificate() {
    //https.globalAgent.options.ca = [];
    //https.globalAgent.options.ca.push(fs.readFileSync('/Users/veselin/.bitdust/metadata/apiservercert'));
    //https.globalAgent.options.key = fs.readFileSync('/Users/veselin/.bitdust/metadata/apiclientcertkey');
    //https.globalAgent.options.cert = fs.readFileSync('/Users/veselin/.bitdust/metadata/apiclientcert');
    //log.warn('installClientCertificate DONE')
}


async function init() {
    try {
        const splashScreen = ui.createSplashScreen()
        await setup.runBitDust()
        log.warn('init DONE')
        splashScreen.hide()
        installClientCertificate()
        showWindow()
        splashScreen.close()
    } catch (error) {
        log.error(error)
    }
}


async function shutdown() {
    log.warn('shutdown DONE')
}


app.on('ready', () => {
    if (process.platform === 'win32') {
        const iconPath = path.join(__dirname, '..', 'build_resources', 'bitdust.ico')
        tray = new Tray(iconPath)
        tray.setToolTip('BitDust')
        tray.on('click', showWindow)
    }
    init()
});

ipc.on('restart', setup.runBitDust)
app.on('activate', showWindow)
app.on('before-quit', showDialogOnExit)
app.on('will-quit', shutdown)

app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    //if (process.platform !== 'darwin') {
    //    app.quit()
    //}
    app.quit()
})
